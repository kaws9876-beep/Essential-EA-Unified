import { decisionFixture } from './decisionWorkflow.js';

export const SIMULATION_NOTICE = 'Simulation only — no external system was changed.';
const START = Date.parse('2026-09-16T10:00:00.000Z');

const specifications = [
  ['response', 'Prepare coordinated executive response', 'Draft a response package for human review.', 'Commercial Operations Lead', 'rule-value-threshold', [], 'Executive-response preview', 'Response content reviewed', 'A coordinated response is ready for review.'],
  ['meeting', 'Secure executive meeting window', 'Model an available decision meeting window.', 'Account Owner', 'rule-sponsor-relationship', ['response'], 'Calendar-hold confirmation', 'Meeting window and owner confirmed', 'The decision window is held in the simulation.'],
  ['stage', 'Record opportunity-stage correction', 'Model the corrected opportunity state.', 'Commercial Operations Lead', 'rule-ownership-gap', ['meeting'], 'Opportunity-stage change record', 'Stage record matches the reviewed decision', 'The simulated opportunity record reflects the reviewed stage.'],
  ['finance', 'Complete finance-terms review', 'Record an authorized review of commercial terms.', 'Finance Authority', 'rule-payment-terms', ['stage'], 'Finance-review record', 'Finance authority and terms recorded', 'Terms have a simulated review record.'],
  ['owner', 'Assign accountable follow-up owner', 'Assign the next accountable operator.', 'Execution Coordinator', 'rule-execution-readiness', ['finance'], 'Owner acknowledgment', 'Owner and next review acknowledged', 'The simulated follow-up has an accountable owner.']
];

const pathSteps = {
  'path-recommended-governed-intervention': ['response', 'meeting', 'stage', 'finance', 'owner'],
  'path-conservative-containment': ['response', 'finance', 'owner'],
  'path-observe-and-defer': ['owner']
};

function timestamp(state) {
  return new Date(START + state.auditEvents.length * 60_000).toISOString();
}

function event(state, kind, actorRole, previousState, newState, reason, relatedObject) {
  const item = {
    id: `lifecycle-audit-${state.auditEvents.length + 1}`,
    kind, timestamp: timestamp(state), actorRole, previousState, newState,
    reason, relatedObject, provenance: SIMULATION_NOTICE
  };
  state.auditEvents.push(item);
  return item;
}

function deny(state, reason) {
  state.lastError = reason;
  return { ok: false, reason, notice: SIMULATION_NOTICE };
}

function transition(state, action, next, actor, reason) {
  const previous = action.status;
  action.status = next;
  action.auditEvents.push(event(state, 'action', actor, previous, next, reason, action.id));
}

export function createExecutionState() {
  return { phase: 'IDLE', decisionId: null, selectedPathId: null, actions: [], artifacts: [], verifications: [], outcome: null, memory: null, auditEvents: [], lastError: '', selectedActionId: null };
}

export function previewActionPlan(decisionState) {
  const steps = pathSteps[decisionState.selectedPathId];
  if (!steps) return [];
  return specifications.filter(([key]) => steps.includes(key)).map(([key, title, description, ownerRole, authorityRuleId, dependencies, artifactType, criterion, expectedOutcome], index) => ({
    id: `action-${key}`, decisionId: decisionState.decisionObject.id, title, description, ownerRole, authorityRuleId,
    dependencyIds: dependencies.filter((id) => steps.includes(id)).map((id) => `action-${id}`),
    status: 'PLANNED', dueAt: new Date(START + (index + 1) * 3_600_000).toISOString(),
    executionMethod: 'Local deterministic simulation', simulationOnly: true,
    expectedEvidence: artifactType, verificationCriteria: criterion, expectedOutcome,
    startedAt: null, completedAt: null, failureReason: null, auditEvents: []
  }));
}

export function resetExecutionState(previous) {
  event(previous, 'reset', 'Commercial Operations Lead', previous.phase, 'IDLE', 'Presenter reset the synthetic scenario.', previous.decisionId || 'scenario');
  return createExecutionState();
}

export function beginExecution(state, decisionState) {
  if (state.phase !== 'IDLE') return deny(state, 'Execution has already been initiated.');
  if (decisionState.decisionObject.status !== 'EXECUTION_READY' || !decisionState.decisionObject.auditEvents.some((item) => item.event === 'Decision approved')) {
    return deny(state, 'Authorized approval is required before simulated execution.');
  }
  const pathId = decisionState.selectedPathId;
  const plan = previewActionPlan(decisionState);
  if (!plan.length) return deny(state, 'Unknown approved path; no action plan exists.');
  state.decisionId = decisionState.decisionObject.id;
  state.selectedPathId = pathId;
  state.actions = plan;
  state.selectedActionId = state.actions[0]?.id || null;
  state.phase = 'EXECUTING';
  event(state, 'execution', 'Commercial Operations Lead', 'IDLE', 'EXECUTING', 'Human initiated the locked approved path.', state.decisionId);
  state.lastError = '';
  return { ok: true, notice: SIMULATION_NOTICE };
}

export function transitionAction(state, actionId, next, actorRole = 'Execution Coordinator', reason = '') {
  const action = state.actions.find((item) => item.id === actionId);
  if (!action || state.phase !== 'EXECUTING') return deny(state, 'Unknown action or execution is not active.');
  const allowed = { PLANNED: ['QUEUED'], QUEUED: ['IN_PROGRESS'], IN_PROGRESS: ['AWAITING_VERIFICATION', 'BLOCKED', 'FAILED'] };
  if (!allowed[action.status]?.includes(next)) return deny(state, `Invalid action transition: ${action.status} to ${next}.`);
  if (next === 'QUEUED' && action.dependencyIds.some((id) => !state.actions.find((item) => item.id === id)?.completedAt)) {
    return deny(state, 'Dependencies must complete before this action can queue.');
  }
  if (next === 'AWAITING_VERIFICATION' && !action.startedAt) return deny(state, 'Action must start before completion.');
  if (next === 'BLOCKED' || next === 'FAILED') {
    if (!reason.trim()) return deny(state, 'A blocked or failed action requires a reason.');
    action.failureReason = reason.trim();
    state.phase = 'BLOCKED';
  }
  if (next === 'IN_PROGRESS') action.startedAt = timestamp(state);
  if (next === 'AWAITING_VERIFICATION') action.completedAt = timestamp(state);
  transition(state, action, next, actorRole, reason || `Simulated action moved to ${next}.`);
  state.lastError = '';
  return { ok: true, action, notice: SIMULATION_NOTICE };
}

export function runNextAction(state) {
  if (state.phase !== 'EXECUTING') return deny(state, 'No executable action is available.');
  const action = state.actions.find((item) => item.status === 'PLANNED');
  if (!action) return deny(state, 'All planned actions have already run.');
  for (const next of ['QUEUED', 'IN_PROGRESS', 'AWAITING_VERIFICATION']) {
    const result = transitionAction(state, action.id, next, action.ownerRole);
    if (!result.ok) return result;
  }
  const artifact = {
    id: `artifact-${action.id}`, actionId: action.id, decisionId: state.decisionId,
    type: action.expectedEvidence, createdAt: timestamp(state), relatedAction: action.title,
    source: 'Local synthetic scenario', provenance: SIMULATION_NOTICE,
    verificationRelevance: action.verificationCriteria, content: `${action.expectedEvidence} for ${action.title}; modeled record only.`
  };
  state.artifacts.push(artifact);
  const verification = {
    id: `verification-${action.id}`, actionId: action.id, decisionId: state.decisionId,
    verifierRole: 'Independent Assurance Reviewer', evidenceArtifactIds: [artifact.id],
    verificationCriteria: action.verificationCriteria, status: 'PENDING', verifiedAt: null,
    confidence: null, exceptionReason: null, notes: SIMULATION_NOTICE, auditEvents: []
  };
  state.verifications.push(verification);
  verification.status = 'EVIDENCE_RECEIVED';
  verification.auditEvents.push(event(state, 'evidence', action.ownerRole, 'PENDING', 'EVIDENCE_RECEIVED', 'Labeled synthetic evidence returned for independent review.', artifact.id));
  state.selectedActionId = action.id;
  if (state.actions.every((item) => item.completedAt)) {
    state.phase = 'AWAITING_VERIFICATION';
    event(state, 'execution', 'Execution Coordinator', 'EXECUTING', 'AWAITING_VERIFICATION', 'All simulated actions completed; verification remains separate.', state.decisionId);
  }
  return { ok: true, action, artifact, notice: SIMULATION_NOTICE };
}

export function demonstrateBlockedAction(state) {
  if (state.phase !== 'EXECUTING') return deny(state, 'Only active execution can demonstrate a block.');
  const action = state.actions.find((item) => item.status === 'PLANNED');
  if (!action) return deny(state, 'No planned action is available to block.');
  for (const next of ['QUEUED', 'IN_PROGRESS']) {
    const result = transitionAction(state, action.id, next, action.ownerRole);
    if (!result.ok) return result;
  }
  return transitionAction(state, action.id, 'BLOCKED', action.ownerRole, 'Required synthetic dependency confirmation is missing; accountable owner must correct it.');
}

export function verifyAction(state, actionId, verifierRole = 'Independent Assurance Reviewer', evidenceIds = null) {
  const action = state.actions.find((item) => item.id === actionId);
  const verification = state.verifications.find((item) => item.actionId === actionId);
  if (!action || !verification || action.status !== 'AWAITING_VERIFICATION' || verification.status !== 'EVIDENCE_RECEIVED') {
    return deny(state, 'Verification requires completed execution and returned evidence.');
  }
  if (verifierRole === action.ownerRole) return deny(state, 'An action cannot verify itself.');
  const refs = evidenceIds || verification.evidenceArtifactIds;
  const evidence = refs.map((id) => state.artifacts.find((item) => item.id === id && item.actionId === action.id));
  if (!refs.length || evidence.some((item) => !item)) return deny(state, 'Verification denied: required evidence is missing.');
  if (!verification.verificationCriteria || evidence.some((item) => item.verificationRelevance !== verification.verificationCriteria)) {
    verification.status = 'FAILED';
    verification.exceptionReason = 'Evidence does not satisfy the explicit verification criterion.';
    action.status = 'VERIFICATION_FAILED';
    verification.auditEvents.push(event(state, 'verification', verifierRole, 'EVIDENCE_RECEIVED', 'FAILED', verification.exceptionReason, verification.id));
    action.auditEvents.push(event(state, 'action', verifierRole, 'AWAITING_VERIFICATION', 'VERIFICATION_FAILED', verification.exceptionReason, action.id));
    state.phase = 'BLOCKED';
    return deny(state, verification.exceptionReason);
  }
  verification.status = 'VERIFIED';
  verification.verifiedAt = timestamp(state);
  verification.confidence = 0.94;
  verification.auditEvents.push(event(state, 'verification', verifierRole, 'EVIDENCE_RECEIVED', 'VERIFIED', 'Independent criteria matched labeled synthetic evidence.', verification.id));
  transition(state, action, 'VERIFIED', verifierRole, 'Independent verification completed.');
  state.lastError = '';
  return { ok: true, verification, notice: SIMULATION_NOTICE };
}

export function finalizeOutcome(state, decisionState) {
  if (state.phase !== 'AWAITING_VERIFICATION' || !state.actions.length || state.actions.some((item) => item.status !== 'VERIFIED')) {
    return deny(state, 'Outcome requires every governed action to be independently verified.');
  }
  const path = decisionFixture.paths.find((item) => item.id === state.selectedPathId);
  const calculatedAt = timestamp(state);
  state.outcome = {
    id: 'outcome-commercial-response', decisionId: state.decisionId, status: 'VERIFIED_MODELED',
    baselineRisk: 'Critical', targetRisk: path.riskLevel, observedRisk: 'Controlled (synthetic model)',
    valueAtRisk: '$1.8M', modeledValueProtected: path.recommendation ? '$1.8M modeled value protected' : path.expectedValueProtected,
    cycleTime: `${Math.round((Date.parse(calculatedAt) - START) / 60_000)} simulated minutes`,
    actionsPlanned: state.actions.length, actionsVerified: state.actions.length, verificationCoverage: '100%',
    confidence: 0.94, customerOrBusinessEffect: 'Modeled risk reduction; not booked or recognized revenue.',
    calculatedAt, assumptions: [...decisionState.decisionObject.assumptions, SIMULATION_NOTICE], auditEvents: []
  };
  state.outcome.auditEvents.push(event(state, 'outcome', 'Independent Assurance Reviewer', 'AWAITING_VERIFICATION', 'VERIFIED_MODELED', 'Calculated only from verified synthetic action evidence.', state.outcome.id));
  state.memory = {
    id: 'memory-commercial-response', decisionId: state.decisionId, version: 1, timestamp: timestamp(state),
    originalSignal: 'Six disconnected signals converged before the 48-hour sponsor window.',
    evidenceUsed: [...decisionState.decisionObject.evidenceIds],
    whyItMattered: decisionState.decisionObject.rationale,
    recommendation: 'Coordinate an executive response with governed ownership.',
    humanSelectedPath: path.label, decisionOwner: path.requiredOwner, authorityHolder: path.approvalBurden,
    approval: 'Authorized human approval recorded', actionsTaken: state.actions.map((item) => item.id),
    verificationEvidence: state.artifacts.map((item) => item.id), outcomeId: state.outcome.id,
    exceptions: [], whatWorked: 'Explicit ownership, authority, evidence, and independent verification remained linked.',
    whatShouldChangeNextTime: 'Recheck sponsor timing and finance terms against new evidence.',
    reuseTags: ['converging-signals', 'decision-window', 'governed-response'],
    auditLinkage: [...decisionState.decisionObject.auditEvents.map((item) => item.id), ...state.auditEvents.map((item) => item.id)],
    provenance: SIMULATION_NOTICE
  };
  state.memory.auditLinkage.push(event(state, 'memory', 'Organizational Memory', 'NOT_CREATED', 'RETAINED', 'Verified modeled outcome retained for future judgment.', state.memory.id).id);
  state.phase = 'VERIFIED';
  state.lastError = '';
  return { ok: true, outcome: state.outcome, memory: state.memory, notice: SIMULATION_NOTICE };
}

export function verifyAllAndFinalize(state, decisionState) {
  if (state.phase !== 'AWAITING_VERIFICATION') return deny(state, 'Verification cannot begin before all actions return evidence.');
  for (const action of state.actions) {
    const result = verifyAction(state, action.id);
    if (!result.ok) return result;
  }
  return finalizeOutcome(state, decisionState);
}

export function runLifecycleOperation(state, name, ...args) {
  const operations = { beginExecution, runNextAction, demonstrateBlockedAction, verifyAction, finalizeOutcome, verifyAllAndFinalize };
  if (!Object.hasOwn(operations, name)) return deny(state, `Unknown lifecycle operation: ${name}.`);
  return operations[name](state, ...args);
}
