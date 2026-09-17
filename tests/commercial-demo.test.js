import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  runDemoOperation,
  simulateCreateOperationsTask,
  simulateDraftExecutiveResponse,
  simulateScheduleDecisionCall,
  simulateUpdateOpportunityStage
} from '../demo-commercial/adapters/demoExecutionAdapter.js';
import {
  approveDecision,
  createInitialDecisionState,
  decisionFixture,
  rejectDecision,
  returnDecision,
  selectStrategicPath,
  submitForApproval
} from '../demo-commercial/decisionWorkflow.js';
import { GUIDED_CHAPTERS, advanceChapter, createGuidedState, previousChapter } from '../demo-commercial/guidedExperience.js';
import { WORKSPACE_DESTINATIONS, createWorkspaceState, renderWorkspaceExperience } from '../demo-commercial/workspaceExperience.js';
import {
  SIMULATION_NOTICE, beginExecution, createExecutionState, demonstrateBlockedAction,
  finalizeOutcome, previewActionPlan, resetExecutionState, runLifecycleOperation,
  runNextAction, transitionAction, verifyAction, verifyAllAndFinalize
} from '../demo-commercial/executionLifecycle.js';
import { renderGuidedLifecycle, renderMemoryRecord, renderWorkspaceLifecycle } from '../demo-commercial/lifecycleExperience.js';

const root = process.cwd();
const demoDir = path.join(root, 'demo-commercial');
const requiredFiles = [
  'index.html',
  'app.js',
  'styles.css',
  'workspace.css',
  'assets/signal-convergence.png',
  'fixtures/commercial-opportunity.json',
  'adapters/demoExecutionAdapter.js',
  'decisionWorkflow.js',
  'guidedExperience.js',
  'workspaceExperience.js',
  'executionLifecycle.js',
  'lifecycleExperience.js',
  'README.md'
];

test('guided experience defaults to five deterministic chapters with bounded navigation', () => {
  const state = createGuidedState();
  assert.equal(state.mode, 'guided');
  assert.equal(state.chapter, 0);
  assert.deepEqual(GUIDED_CHAPTERS, ['The stakes', 'Signal convergence', 'Judgment', 'Decision and authority', 'Governed decision']);
  previousChapter(state);
  assert.equal(state.chapter, 0);
  for (let index = 0; index < 8; index += 1) advanceChapter(state);
  assert.equal(state.chapter, 4);
  previousChapter(state);
  assert.equal(state.chapter, 3);
  assert.deepEqual(createGuidedState(), { mode: 'guided', chapter: 0, approvalStep: 'review', planOpen: false, pathConfirmed: false, selectedSignalIndex: null, doorsTransitioning: false });
});

test('operational workspace has four destinations and contextual evidence', () => {
  assert.deepEqual(WORKSPACE_DESTINATIONS, ['Command', 'Signals', 'Decisions', 'Memory']);
  const workspace = createWorkspaceState();
  const decision = createInitialDecisionState();
  const scenario = {
    opportunity: { value: '$1.8M' }, recommendation: { confidence: 91 },
    signals: [{ id: 'sig-sponsor-email-unanswered', sourceLabel: 'Executive communication', title: 'Sponsor response overdue', whyNow: 'Sponsor window closing.', confidence: 94, urgency: 'Critical', evidenceRefs: ['ev-executive-email'] }],
    evidence: [{ id: 'ev-executive-email', sourceLabel: 'Executive communication', title: 'Sponsor asks for response', summary: 'Synthetic message.' }]
  };
  const command = renderWorkspaceExperience(scenario, workspace, decision);
  assert.match(command, /Review decision/);
  assert.match(command, /Sponsor asks for response/);
  workspace.area = 'Signals';
  const signals = renderWorkspaceExperience(scenario, workspace, decision);
  assert.match(signals, /data-work-signal="sig-sponsor-email-unanswered"/);
  workspace.railTab = 'Authority';
  const authority = renderWorkspaceExperience(scenario, workspace, decision);
  assert.match(authority, /Value threshold authority/);
  workspace.area = 'Decisions';
  const decisions = renderWorkspaceExperience(scenario, workspace, decision);
  assert.match(decisions, /Submit for approval/);
  assert.doesNotMatch(command, /real estate|brokerage|property listing/i);
});

test('workspace styling keeps the guided opening dark and operational surface cream', () => {
  const css = readDemoFile('workspace.css');
  assert.match(css, /--work-cream:#f5f1ea/);
  assert.match(css, /--work-midnight:#091625/);
  assert.match(css, /guided-experience\[data-chapter="1"\]/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /background:\s*#c9a24a/i);
});

test('guided presentation exposes one primary action per chapter and keeps exploration optional', () => {
  const app = readDemoFile('app.js');
  const html = readDemoFile('index.html');
  assert.match(html, /id="guided-experience"/);
  for (const action of ['Reveal why', 'See what Storm found', 'Enter the Decision Room', 'Select a path', 'Continue with this path', 'Approve decision']) {
    assert.ok(app.includes(action), `${action} is missing`);
  }
  const lifecycleView = readDemoFile('lifecycleExperience.js');
  for (const action of ['Begin simulated execution', 'Run next simulated action', 'Verify returned evidence', 'Explore the record']) {
    assert.ok(lifecycleView.includes(action), `${action} is missing`);
  }
  assert.match(app, /guidedState\.mode = 'explore'/);
  assert.match(app, /guidedState\.doorsTransitioning = true/);
  assert.match(app, /approveDecision\(decisionState\)/);
  assert.match(lifecycleView, /SIMULATION_NOTICE/);
});

function approvedDecision(pathId = 'path-recommended-governed-intervention') {
  const decision = createInitialDecisionState();
  selectStrategicPath(decision, pathId);
  submitForApproval(decision);
  decision.activeRoleId = 'role-executive-sponsor';
  assert.equal(approveDecision(decision).ok, true);
  return decision;
}

test('execution is denied until authorized approval and path-specific plan is locked', () => {
  const lifecycle = createExecutionState();
  const decision = createInitialDecisionState();
  assert.equal(beginExecution(lifecycle, decision).ok, false);
  assert.equal(lifecycle.actions.length, 0);
  const approved = approvedDecision();
  assert.equal(previewActionPlan(approved).length, 5);
  assert.equal(beginExecution(lifecycle, approved).ok, true);
  assert.equal(lifecycle.actions.length, 5);
  assert.equal(lifecycle.actions[0].status, 'PLANNED');
  assert.ok(lifecycle.actions.every((item) => item.decisionId === approved.decisionObject.id && item.simulationOnly && item.expectedEvidence && item.verificationCriteria && item.authorityRuleId && item.dueAt));
  assert.equal(selectStrategicPath(approved, 'path-observe-and-defer').ok, false);
  assert.equal(beginExecution(createExecutionState(), approvedDecision('path-conservative-containment')).ok, true);
  assert.equal(previewActionPlan(approvedDecision('path-observe-and-defer')).length, 1);
});

test('dependencies, valid transitions, and unknown operations fail closed', () => {
  const lifecycle = createExecutionState();
  beginExecution(lifecycle, approvedDecision());
  assert.equal(transitionAction(lifecycle, 'action-meeting', 'QUEUED').ok, false);
  assert.equal(transitionAction(lifecycle, 'action-response', 'VERIFIED').ok, false);
  assert.equal(runLifecycleOperation(lifecycle, 'fetchLiveSystem').ok, false);
  assert.equal(runNextAction(lifecycle).ok, true);
  assert.equal(lifecycle.actions[0].status, 'AWAITING_VERIFICATION');
  assert.equal(runNextAction(lifecycle).ok, true);
  assert.equal(lifecycle.actions[1].status, 'AWAITING_VERIFICATION');
  assert.ok(lifecycle.auditEvents.some((item) => item.previousState === 'PLANNED' && item.newState === 'QUEUED'));
  assert.ok(lifecycle.auditEvents.some((item) => item.newState === 'IN_PROGRESS'));
  assert.ok(lifecycle.auditEvents.some((item) => item.newState === 'AWAITING_VERIFICATION'));
  assert.equal(runNextAction(lifecycle).notice, SIMULATION_NOTICE);
});

test('blocked and failed actions cannot become successful or produce outcomes', () => {
  const blocked = createExecutionState();
  beginExecution(blocked, approvedDecision());
  assert.equal(demonstrateBlockedAction(blocked).ok, true);
  assert.equal(blocked.actions[0].status, 'BLOCKED');
  assert.equal(blocked.phase, 'BLOCKED');
  assert.equal(verifyAction(blocked, blocked.actions[0].id).ok, false);
  assert.equal(finalizeOutcome(blocked, approvedDecision()).ok, false);
  const failed = createExecutionState();
  beginExecution(failed, approvedDecision());
  transitionAction(failed, failed.actions[0].id, 'QUEUED');
  transitionAction(failed, failed.actions[0].id, 'IN_PROGRESS');
  assert.equal(transitionAction(failed, failed.actions[0].id, 'FAILED', 'Execution Coordinator', 'Synthetic failure.').ok, true);
  assert.equal(failed.actions[0].status, 'FAILED');
  assert.equal(runNextAction(failed).ok, false);
});

test('evidence and a separate verifier are required; failed criteria halt the lifecycle', () => {
  const decision = approvedDecision();
  const lifecycle = createExecutionState();
  beginExecution(lifecycle, decision);
  assert.equal(verifyAction(lifecycle, 'action-response').ok, false);
  const result = runNextAction(lifecycle);
  assert.equal(result.artifact.provenance, SIMULATION_NOTICE);
  assert.equal(result.artifact.verificationRelevance, lifecycle.actions[0].verificationCriteria);
  assert.equal(verifyAction(lifecycle, 'action-response', lifecycle.actions[0].ownerRole).ok, false);
  assert.equal(verifyAction(lifecycle, 'action-response', 'Independent Assurance Reviewer', ['missing']).ok, false);
  assert.equal(verifyAction(lifecycle, 'action-response').ok, true);
  assert.equal(lifecycle.verifications[0].status, 'VERIFIED');
  const mismatch = createExecutionState();
  beginExecution(mismatch, decision);
  runNextAction(mismatch);
  mismatch.artifacts[0].verificationRelevance = 'Different criterion';
  assert.equal(verifyAction(mismatch, 'action-response').ok, false);
  assert.equal(mismatch.verifications[0].status, 'FAILED');
  assert.equal(mismatch.actions[0].status, 'VERIFICATION_FAILED');
  assert.equal(mismatch.outcome, null);
});

test('outcome and memory require complete independent verification', () => {
  const decision = approvedDecision();
  const lifecycle = createExecutionState();
  beginExecution(lifecycle, decision);
  assert.equal(finalizeOutcome(lifecycle, decision).ok, false);
  while (lifecycle.phase === 'EXECUTING') runNextAction(lifecycle);
  assert.equal(lifecycle.artifacts.length, 5);
  assert.equal(lifecycle.phase, 'AWAITING_VERIFICATION');
  assert.equal(finalizeOutcome(lifecycle, decision).ok, false);
  assert.equal(lifecycle.memory, null);
  assert.equal(verifyAllAndFinalize(lifecycle, decision).ok, true);
  assert.equal(lifecycle.phase, 'VERIFIED');
  assert.equal(lifecycle.outcome.actionsVerified, 5);
  assert.equal(lifecycle.outcome.verificationCoverage, '100%');
  assert.match(lifecycle.outcome.customerOrBusinessEffect, /not booked or recognized revenue/);
  assert.equal(lifecycle.memory.outcomeId, lifecycle.outcome.id);
  assert.equal(lifecycle.memory.verificationEvidence.length, 5);
  assert.ok(lifecycle.memory.auditLinkage.length > 5);
  assert.ok(lifecycle.auditEvents.every((item) => item.timestamp && item.actorRole && item.previousState && item.newState && item.reason && item.relatedObject && item.provenance === SIMULATION_NOTICE));
});

test('guided and workspace lifecycle show one safe next action and retained judgment', () => {
  const decision = approvedDecision();
  const lifecycle = createExecutionState();
  assert.match(renderGuidedLifecycle(lifecycle, decision, false), /Begin simulated execution/);
  assert.match(renderWorkspaceLifecycle(lifecycle, decision, createWorkspaceState()), /Begin simulated execution/);
  beginExecution(lifecycle, decision);
  assert.match(renderGuidedLifecycle(lifecycle, decision, false), /Run next simulated action/);
  while (lifecycle.phase === 'EXECUTING') runNextAction(lifecycle);
  assert.match(renderGuidedLifecycle(lifecycle, decision, false), /Verify returned evidence/);
  verifyAllAndFinalize(lifecycle, decision);
  assert.match(renderGuidedLifecycle(lifecycle, decision, false), /Judgment protected\. Work completed\. Outcome verified\. Lesson retained\./);
  assert.match(renderMemoryRecord(lifecycle, createWorkspaceState()), /Use this judgment next time/);
  const reuse = createWorkspaceState(); reuse.memoryReuseOpen = true;
  assert.match(renderMemoryRecord(lifecycle, reuse), /No prior approval carries forward/);
});

test('reset records the action then restores deterministic initial state', () => {
  const lifecycle = createExecutionState();
  beginExecution(lifecycle, approvedDecision());
  runNextAction(lifecycle);
  const fresh = resetExecutionState(lifecycle);
  assert.equal(lifecycle.auditEvents.at(-1).kind, 'reset');
  assert.deepEqual(fresh, createExecutionState());
});

test('all six guided signals settle visibly, including reduced-motion mode', () => {
  const app = readDemoFile('app.js');
  const styles = `${readDemoFile('styles.css')}\n${readDemoFile('workspace.css')}`;
  const signals = app.match(/const guidedSignals = \[([\s\S]*?)\n\];/)?.[1];
  assert.ok(signals, 'guided signals must be defined');
  for (const source of ['Executive communication', 'CRM', 'Finance', 'Calendar', 'Operations', 'Relationship intelligence']) {
    assert.ok(signals.includes(`['${source}'`), `${source} must be present`);
  }
  assert.equal((signals.match(/^  \['/gm) || []).length, 6);
  assert.match(styles, /@keyframes signal-enter\s*\{[^}]*opacity:\s*0[^}]*\}[^}]*opacity:\s*1/s);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*?\.guided-signal-row\s*\{[^}]*animation:none !important; opacity:1 !important; transform:none !important;/);
  assert.match(readDemoFile('workspace.css'), /\.guided-signal-row::before/);
});

test('guided paths require deliberate full-row selection and expose semantic state', () => {
  const app = readDemoFile('app.js');
  assert.match(app, /<button type="button" class="guided-path[^`]*data-guided-path="\$\{item\.id\}" aria-pressed="\$\{selected\}"/);
  assert.match(app, /guidedState\.pathConfirmed && decisionState\.selectedPathId === item\.id/);
  assert.match(app, /guidedState\.pathConfirmed = true;/);
  assert.match(app, /data-guided-action="submit" \$\{guidedState\.pathConfirmed \? '' : 'disabled'\}/);
  assert.match(app, /Continue with this path/);
  assert.match(app, /Storm recommendation/);
  assert.match(app, /Authority holder<\/span><strong>\$\{path\.approvalBurden\}<\/strong>/);
});

test('execution-ready state and critical workspace values are not ellipsized', () => {
  const workspace = createWorkspaceState();
  const decision = createInitialDecisionState();
  decision.decisionObject.status = 'EXECUTION_READY';
  const html = renderWorkspaceExperience({ opportunity: { value: '$1.8M' }, recommendation: { confidence: 91 }, signals: [{ id: 'sig-sponsor-email-unanswered', title: 'Sponsor response overdue', whyNow: 'Decision window closing.', sourceLabel: 'Executive communication', confidence: 94, urgency: 'Critical', evidenceRefs: [] }], evidence: [] }, workspace, decision);
  assert.match(html, /Decision state<\/span><strong>EXECUTION READY<\/strong>/);
  const css = readDemoFile('workspace.css');
  assert.match(css, /\.work-metrics strong \{ font-size:17px; overflow-wrap:normal; \}/);
  assert.match(css, /\.work-signal-main strong,\.work-signal-main em \{ white-space:normal; overflow:visible; text-overflow:clip;/);
  assert.match(css, /\.work-evidence-detail p \{ color:var\(--work-muted\); \}/);
});

function readDemoFile(file) {
  return fs.readFileSync(path.join(demoDir, file), 'utf8');
}

test('required demo files exist', () => {
  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(path.join(demoDir, file)), true, `${file} should exist`);
  }
});

test('fixture JSON parses with stable required sections and fictional labels', () => {
  const fixture = JSON.parse(readDemoFile('fixtures/commercial-opportunity.json'));
  for (const section of [
    'organization',
    'opportunity',
    'signals',
    'evidence',
    'recommendation',
    'reasoning',
    'decision',
    'roles',
    'authorityRules',
    'approvalRequirements',
    'plannedActions',
    'verificationRequirements',
    'expectedOutcomes',
    'memoryPreview',
    'lifecycleStages',
    'demoMetadata'
  ]) {
    assert.ok(fixture[section], `fixture missing ${section}`);
  }

  assert.equal(fixture.organization.fictional, true);
  assert.equal(fixture.demoMetadata.fictional, true);
  assert.ok(fixture.roles.every((role) => role.fictional === true));
  assert.equal(fixture.signals.length, 7);
  assert.equal(fixture.evidence.length, 7);
  assert.equal(fixture.reasoning.length, 5);
  assert.equal(fixture.approvalRequirements.length, 2);
  assert.equal(fixture.plannedActions.length, 4);
  assert.equal(fixture.lifecycleStages.length, 10);
});

test('demo UI includes required safety and positioning text', () => {
  const html = readDemoFile('index.html');
  assert.match(html, /Demo Mode — Synthetic Data/);
  assert.match(html, /No live systems connected/);
  assert.match(html, /All actions are simulated/);
  assert.match(html, /Essential EA \+ AI Storm OS/);
  assert.match(html, /Decision &amp; Execution Intelligence/);
  assert.match(html, /1 decision requires executive attention/);
  assert.match(html, /Living opportunity object/);
});

test('demo UI exposes required application shell regions', () => {
  const html = readDemoFile('index.html');
  for (const marker of [
    'id="workspace-nav"',
    'class="operating-bar"',
    'id="command-center"',
    'id="opportunity-object"',
    'id="signal-list"',
    'id="reasoning-toggle"',
    'id="reasoning-steps"',
    'id="authority-map"',
    'id="opportunity-workspace"',
    'id="opportunity-tabs"',
    'id="signal-drawer"',
    'id="search-overlay"',
    'id="notification-panel"',
    'id="operator-panel"',
    'id="sr-status"'
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('all primary navigation workspaces are represented', () => {
  const app = readDemoFile('app.js');
  for (const label of [
    'Command Center',
    'Signal Intelligence',
    'Decisions',
    'Authority',
    'Execution',
    'Outcomes',
    'Memory'
  ]) {
    assert.match(app, new RegExp(label));
  }
  assert.match(app, /data-nav/);
  assert.match(app, /activeWorkspace/);
  assert.match(app, /previewWorkspace/);
});

test('signals and reasoning are represented from fixture data', () => {
  const fixture = JSON.parse(readDemoFile('fixtures/commercial-opportunity.json'));
  const app = readDemoFile('app.js');
  for (const signal of fixture.signals) {
    assert.match(app, new RegExp(signal.id));
  }
  for (const step of fixture.reasoning) {
    assert.match(app, new RegExp(step.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(app, /demo\.signals\.map/);
  assert.match(app, /demo\.reasoning\.map/);
});

test('interactive local state covers search, drawer, tabs, authority, reasoning, and reset', () => {
  const app = readDemoFile('app.js');
  for (const stateKey of [
    'activeWorkspace',
    'selectedSignalId',
    'selectedEvidenceId',
    'selectedTab',
    'selectedRoleId',
    'selectedGraphNodeId',
    'selectedActionId',
    'selectedOutcomeId',
    'feedSource',
    'feedUrgency',
    'feedStatus',
    'drawerOpen',
    'searchOpen',
    'searchQuery',
    'notificationOpen',
    'operatorOpen',
    'reasoningOpen',
    'navOpen',
    'doorsOpen'
  ]) {
    assert.match(app, new RegExp(stateKey));
  }
  for (const functionName of [
    'renderSearch',
    'allSearchItems',
    'openSignal',
    'renderDrawer',
    'renderTabs',
    'renderGraph',
    'renderFeedControls',
    'renderActionPath',
    'renderOutcomes',
    'selectRole',
    'resetDemo',
    'closeOverlays'
  ]) {
    assert.match(app, new RegExp(`function ${functionName}`));
  }
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /state = \{ \.\.\.initialState \}/);
});

test('C2 Decision Object schema and fixture relationships are stable', () => {
  const object = decisionFixture.decisionObject;
  for (const key of [
    'id',
    'tenantId',
    'title',
    'summary',
    'status',
    'opportunityId',
    'signalIds',
    'evidenceIds',
    'recommendationId',
    'selectedPathId',
    'decisionType',
    'decisionRequired',
    'decisionDeadline',
    'urgency',
    'valueAtRisk',
    'owner',
    'ownerRole',
    'authorityRequired',
    'authorityRuleIds',
    'approvalRequirementIds',
    'rationale',
    'alternativesConsidered',
    'constraints',
    'assumptions',
    'expectedOutcome',
    'verificationRequirements',
    'createdAt',
    'updatedAt',
    'version',
    'auditEvents'
  ]) {
    assert.ok(Object.hasOwn(object, key), `Decision Object missing ${key}`);
  }

  assert.equal(object.opportunityId, 'opp-regional-portfolio-expansion');
  assert.equal(object.signalIds.length, 7);
  assert.equal(object.evidenceIds.length, 7);
  assert.equal(decisionFixture.paths.length, 3);
  assert.equal(decisionFixture.authorityNodes.length, 6);
  assert.equal(decisionFixture.approvalRequirements.length, 2);
  assert.ok(decisionFixture.actionPlan.every((item) => item.readinessState === 'Simulation only - not executed externally'));
});

test('C2 strategic path selection and approval state machine are deterministic', () => {
  const state = createInitialDecisionState();
  assert.equal(state.decisionObject.status, 'DRAFT');

  assert.equal(selectStrategicPath(state, 'path-conservative-containment').ok, true);
  assert.equal(state.selectedPathId, 'path-conservative-containment');
  assert.equal(state.decisionObject.status, 'READY_FOR_REVIEW');
  assert.equal(state.decisionObject.auditEvents.length, 1);

  assert.equal(submitForApproval(state).ok, true);
  assert.equal(state.decisionObject.status, 'PENDING_APPROVAL');

  const unauthorized = approveDecision(state);
  assert.equal(unauthorized.ok, false);
  assert.match(unauthorized.reason, /Executive Sponsor/);

  state.activeRoleId = 'role-executive-sponsor';
  assert.equal(approveDecision(state).ok, true);
  assert.equal(state.decisionObject.status, 'EXECUTION_READY');
  assert.equal(selectStrategicPath(state, 'path-observe-and-defer').ok, false);
  assert.equal(state.selectedPathId, 'path-conservative-containment');
  assert.ok(state.decisionObject.auditEvents.some((event) => event.event === 'Execution-ready plan generated'));
});

test('C2 return and reject transitions require rationale and create audit events', () => {
  const returned = createInitialDecisionState();
  selectStrategicPath(returned, 'path-recommended-governed-intervention');
  submitForApproval(returned);
  assert.equal(returnDecision(returned, '').ok, false);
  assert.equal(returnDecision(returned, 'Need finance context before approval.').ok, true);
  assert.equal(returned.decisionObject.status, 'RETURNED');
  assert.equal(returned.returnReason, 'Need finance context before approval.');

  const rejected = createInitialDecisionState();
  selectStrategicPath(rejected, 'path-observe-and-defer');
  submitForApproval(rejected);
  assert.equal(rejectDecision(rejected, '').ok, false);
  assert.equal(rejectDecision(rejected, 'Deferral leaves too much unresolved risk.').ok, true);
  assert.equal(rejected.decisionObject.status, 'REJECTED');
  assert.ok(rejected.decisionObject.auditEvents.some((event) => event.event === 'Decision rejected'));
});

test('C2 UI exposes Decision Room, Authority Graph, approval controls, action plan, and audit trail', () => {
  const app = readDemoFile('app.js');
  const css = readDemoFile('styles.css');
  for (const marker of [
    'renderDecisionRoom',
    'Strategic path comparison',
    'Structured Decision Object',
    'Authority Graph',
    'Simulated approval workflow',
    'Execution-ready governed action plan',
    'Decision audit trail',
    'data-approval-action',
    'data-role-switch',
    'data-authority-node',
    'data-authority-rule',
    'data-audit-event'
  ]) {
    assert.match(`${app}\n${css}`, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('visible controls have deterministic handlers', () => {
  const app = readDemoFile('app.js');
  for (const controlId of [
    'opportunity-object',
    'review-decision-path',
    'back-to-command',
    'preview-return',
    'drawer-close',
    'search-trigger',
    'search-close',
    'search-input',
    'notification-trigger',
    'operator-menu',
    'reset-demo',
    'reasoning-toggle',
    'mobile-menu'
  ]) {
    assert.match(app, new RegExp(`\\$\\('${controlId}'\\)\\.addEventListener`));
  }
  for (const delegatedSelector of ['data-nav', 'data-signal', 'data-evidence', 'data-tab', 'data-role', 'data-result']) {
    assert.match(app, new RegExp(delegatedSelector));
  }
  for (const delegatedSelector of ['data-graph-node', 'data-action', 'data-outcome', 'data-feed-filter']) {
    assert.match(app, new RegExp(delegatedSelector));
  }
});

test('C1.2 hardening preserves industry-agnostic positioning', () => {
  const combined = requiredFiles.filter((file) => !file.endsWith('.png')).map(readDemoFile).join('\n');
  for (const required of [
    'Northstar Commercial Partners',
    'Regional Portfolio Expansion',
    '$1.8M',
    'Organizational Judgment Infrastructure',
    'Decision &amp; Execution Intelligence'
  ]) {
    assert.match(combined, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const forbidden of [
    /real[- ]estate/i,
    /property listing/i,
    /brokerage/i,
    /\bagents?\b/i,
    /homeowners?/i,
    /seller campaign/i
  ]) {
    assert.doesNotMatch(combined, forbidden);
  }
});

test('opening doors, graph, feed, action, outcome, and memory experiences are represented', () => {
  const app = readDemoFile('app.js');
  const css = readDemoFile('styles.css');
  for (const marker of [
    'door-stage',
    'Opening Doors analytical layer',
    'graphNodes',
    'Interconnected intelligence graph',
    'active-path',
    'feedSource',
    'feedUrgency',
    'feedStatus',
    'Strategic action path',
    'Simulated Action Detail',
    'Outcome and memory preview',
    'Organizational memory preview'
  ]) {
    assert.match(`${app}\n${css}`, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.door-stage\.open/);
});

test('adapter methods are simulated and deny external persistence', () => {
  for (const operation of [
    simulateDraftExecutiveResponse,
    simulateScheduleDecisionCall,
    simulateUpdateOpportunityStage,
    simulateCreateOperationsTask
  ]) {
    const result = operation({ opportunityId: 'opp-regional-portfolio-expansion' });
    assert.equal(result.status, 'simulated');
    assert.equal(result.persistedExternally, false);
    assert.match(result.message, /Simulated|simulated/);
  }
});

test('unknown demo operations fail closed', () => {
  assert.throws(
    () => runDemoOperation('sendLiveMessage'),
    /Demo execution denied/
  );
});

test('demo code contains no external network calls, production URLs, or integration imports', () => {
  const combined = requiredFiles.filter((file) => !file.endsWith('.png')).map(readDemoFile).join('\n');
  const forbiddenPatterns = [
    /essential-ea-app-production/i,
    /railway\.app/i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /WebSocket/i,
    /sendBeacon/i,
    /form\s+action=["']https?:/i,
    /services\/aistorm/i,
    /STORM_EQUITY_WEBHOOK_SECRET/i,
    /OPENAI_API_KEY/i,
    /ANTHROPIC_API_KEY/i,
    /DATABASE_URL/i,
    /https?:\/\//i,
    /Schrader/i,
    /The Schrader Group/i,
    /\bTSG\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(combined, pattern);
  }
});

test('production index.html is unchanged from verified C1 base', () => {
  const result = spawnSync('git', ['diff', '--name-only', '87d8b0ac682644f2e39f93d7b329ceebc5ce573b', '--', 'index.html'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '');
});
