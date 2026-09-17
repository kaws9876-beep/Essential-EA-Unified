export const DECISION_STATES = {
  DRAFT: 'DRAFT',
  READY_FOR_REVIEW: 'READY_FOR_REVIEW',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  EXECUTION_READY: 'EXECUTION_READY'
};

export const decisionFixture = {
  tenantId: 'tenant-northstar-commercial-partners',
  decisionObject: {
    id: 'dec-commercial-response',
    tenantId: 'tenant-northstar-commercial-partners',
    title: 'Authorize coordinated executive response',
    summary: 'Decide whether to authorize a governed intervention for the Regional Portfolio Expansion opportunity before the sponsor decision window closes.',
    status: DECISION_STATES.DRAFT,
    opportunityId: 'opp-regional-portfolio-expansion',
    signalIds: [
      'sig-sponsor-email-unanswered',
      'sig-crm-stage-stalled',
      'sig-financial-condition-open',
      'sig-decision-deadline',
      'sig-competitor-mentioned',
      'sig-facilities-owner-missing',
      'sig-executive-meeting-unscheduled'
    ],
    evidenceIds: [
      'ev-executive-email',
      'ev-crm-stage',
      'ev-finance-condition',
      'ev-calendar-window',
      'ev-meeting-notes',
      'ev-operations-request',
      'ev-relationship-history'
    ],
    recommendationId: 'rec-executive-commercial-response',
    selectedPathId: 'path-recommended-governed-intervention',
    decisionType: 'Governed commercial response',
    decisionRequired: 'Human authorization required before simulated execution planning.',
    decisionDeadline: 'Decision required within 48 hours',
    urgency: 'Critical',
    valueAtRisk: '$1.8M',
    owner: 'Commercial Operations Lead',
    ownerRole: 'role-commercial-operations-lead',
    authorityRequired: 'Executive Sponsor approval with Finance Authority review.',
    authorityRuleIds: ['rule-value-threshold', 'rule-payment-terms', 'rule-sensitive-relationship'],
    approvalRequirementIds: ['approval-executive-sponsor', 'approval-finance-authority'],
    rationale: 'Multiple independent weak signals become consequential together: delayed sponsor response, CRM stagnation, unresolved finance condition, compressed decision window, competitor reference, missing operations owner, and unscheduled decision meeting.',
    alternativesConsidered: [
      'Recommended governed intervention',
      'Conservative containment path',
      'Observe and defer path'
    ],
    constraints: [
      'No external action may occur in the demo.',
      'Finance condition requires review before concession routing.',
      'Human authority must remain in control.'
    ],
    assumptions: [
      'Synthetic signals accurately represent the demo scenario.',
      'The sponsor decision window remains open.',
      'Required approvers are available in the simulated workflow.'
    ],
    expectedOutcome: 'Execution-ready action plan with ownership, authority, dependencies, verification requirements, and simulated-only readiness state.',
    verificationRequirements: [
      'Executive response reviewed',
      'Commercial terms approved',
      'Ownership confirmed',
      'Decision call scheduled',
      'Approvals recorded'
    ],
    createdAt: '2026-09-16T09:00:00.000Z',
    updatedAt: '2026-09-16T09:00:00.000Z',
    version: 1,
    auditEvents: []
  },
  paths: [
    {
      id: 'path-recommended-governed-intervention',
      label: 'Recommended governed intervention',
      recommendation: true,
      expectedValueProtected: '$1.8M modeled value at risk',
      riskLevel: 'Lower residual risk',
      timeToAction: 'Same business day',
      requiredOwner: 'Commercial Operations Lead',
      approvalBurden: 'Executive Sponsor plus Finance Authority',
      keyTradeoff: 'Higher coordination effort now to protect sponsor confidence and reduce ambiguity.',
      supportingEvidenceIds: ['ev-executive-email', 'ev-finance-condition', 'ev-calendar-window', 'ev-operations-request'],
      verificationRequirement: 'Approvals recorded and executive response reviewed.'
    },
    {
      id: 'path-conservative-containment',
      label: 'Conservative containment path',
      recommendation: false,
      expectedValueProtected: 'Partial protection of relationship value',
      riskLevel: 'Medium residual risk',
      timeToAction: 'Within 24 hours',
      requiredOwner: 'Account Owner',
      approvalBurden: 'Finance Authority only',
      keyTradeoff: 'Reduces approval load but may leave the sponsor without a complete coordinated response.',
      supportingEvidenceIds: ['ev-executive-email', 'ev-finance-condition', 'ev-relationship-history'],
      verificationRequirement: 'Finance condition reviewed and sponsor update drafted.'
    },
    {
      id: 'path-observe-and-defer',
      label: 'Observe and defer path',
      recommendation: false,
      expectedValueProtected: 'Uncertain value protection',
      riskLevel: 'High residual risk',
      timeToAction: 'No immediate action',
      requiredOwner: 'Execution Coordinator',
      approvalBurden: 'No approval until escalation',
      keyTradeoff: 'Avoids near-term coordination but risks value erosion while ownership remains unresolved.',
      supportingEvidenceIds: ['ev-crm-stage', 'ev-meeting-notes'],
      verificationRequirement: 'Decision window and sponsor response monitored.'
    }
  ],
  authorityNodes: [
    {
      id: 'role-commercial-operations-lead',
      kind: 'Owner',
      label: 'Commercial Operations Lead',
      person: 'Maya Chen',
      responsibility: 'Owns the work and prepares the decision package.',
      ruleIds: ['rule-ownership-gap'],
      consequence: 'If ownership is unclear, the decision cannot proceed.'
    },
    {
      id: 'role-executive-sponsor',
      kind: 'Authority',
      label: 'Executive Sponsor',
      person: 'Daniel Brooks',
      responsibility: 'Can approve the governed commercial response.',
      ruleIds: ['rule-value-threshold'],
      consequence: 'If delayed, the sponsor window remains exposed.'
    },
    {
      id: 'role-finance-authority',
      kind: 'Approver',
      label: 'Finance Authority',
      person: 'Elena Ruiz',
      responsibility: 'Must review payment-term and concession assumptions.',
      ruleIds: ['rule-payment-terms'],
      consequence: 'If delayed, concession routing remains blocked.'
    },
    {
      id: 'role-legal-compliance-reviewer',
      kind: 'Consulted',
      label: 'Legal/Compliance Reviewer',
      person: 'Noah Patel',
      responsibility: 'Consulted when relationship or policy sensitivity is present.',
      ruleIds: ['rule-sensitive-relationship'],
      consequence: 'If skipped, the path may be returned for review.'
    },
    {
      id: 'role-account-owner',
      kind: 'Informed',
      label: 'Account Owner',
      person: 'Priya Shah',
      responsibility: 'Informed of the selected path and sponsor-facing action.',
      ruleIds: ['rule-sponsor-relationship'],
      consequence: 'If uninformed, sponsor context may fragment.'
    },
    {
      id: 'role-execution-coordinator',
      kind: 'Execution-ready owner',
      label: 'Execution Coordinator',
      person: 'Jordan Ellis',
      responsibility: 'Receives the approved plan for later simulated execution.',
      ruleIds: ['rule-execution-readiness'],
      consequence: 'If not assigned, approved judgment will not move forward.'
    }
  ],
  authorityRules: [
    {
      id: 'rule-value-threshold',
      label: 'Value threshold authority',
      trigger: '$1.8M value at risk requires Executive Sponsor authorization.',
      delayedConsequence: 'Delay may reduce sponsor confidence and increase competitive risk.'
    },
    {
      id: 'rule-payment-terms',
      label: 'Payment-term review',
      trigger: 'Unresolved finance condition requires Finance Authority approval.',
      delayedConsequence: 'Commercial terms cannot be represented as approved.'
    },
    {
      id: 'rule-sensitive-relationship',
      label: 'Relationship sensitivity',
      trigger: 'Relationship history and competitor reference require consultation before outreach.',
      delayedConsequence: 'Decision may be returned for missing context.'
    },
    {
      id: 'rule-ownership-gap',
      label: 'Ownership clarity',
      trigger: 'Unowned operational requirement blocks the complete response.',
      delayedConsequence: 'Work remains fragmented across departments.'
    },
    {
      id: 'rule-sponsor-relationship',
      label: 'Sponsor relationship context',
      trigger: 'Sponsor-facing response requires Account Owner awareness.',
      delayedConsequence: 'Sponsor narrative may become inconsistent.'
    },
    {
      id: 'rule-execution-readiness',
      label: 'Execution readiness',
      trigger: 'Approved decision must produce a plan before any later execution sprint.',
      delayedConsequence: 'Decision remains approved but not actionable.'
    }
  ],
  approvalRequirements: [
    {
      id: 'approval-executive-sponsor',
      label: 'Executive Sponsor approval',
      requiredRoleId: 'role-executive-sponsor',
      why: 'Required because the value threshold and sponsor decision window are consequential.'
    },
    {
      id: 'approval-finance-authority',
      label: 'Finance Authority review',
      requiredRoleId: 'role-finance-authority',
      why: 'Required because the commercial path includes payment-term and concession assumptions.'
    }
  ],
  actionPlan: [
    {
      id: 'plan-executive-response',
      action: 'Prepare executive response',
      assignedOwner: 'Commercial Operations Lead',
      authority: 'Executive Sponsor',
      dependency: 'Selected path approved',
      dueTime: 'Within 4 simulated hours',
      verificationRequirement: 'Executive response reviewed',
      expectedOutcome: 'Sponsor receives a coordinated response package.',
      readinessState: 'Simulation only - not executed externally'
    },
    {
      id: 'plan-commercial-terms',
      action: 'Confirm commercial terms',
      assignedOwner: 'Finance Authority',
      authority: 'Finance Authority',
      dependency: 'Payment-term review complete',
      dueTime: 'Within 8 simulated hours',
      verificationRequirement: 'Commercial terms approved',
      expectedOutcome: 'Terms are ready for sponsor-facing discussion.',
      readinessState: 'Simulation only - not executed externally'
    },
    {
      id: 'plan-operational-owner',
      action: 'Assign unresolved operational requirement',
      assignedOwner: 'Execution Coordinator',
      authority: 'Commercial Operations Lead',
      dependency: 'Ownership gap accepted',
      dueTime: 'Within 6 simulated hours',
      verificationRequirement: 'Ownership confirmed',
      expectedOutcome: 'Operational blocker has a named owner.',
      readinessState: 'Simulation only - not executed externally'
    },
    {
      id: 'plan-decision-call',
      action: 'Schedule executive decision call',
      assignedOwner: 'Account Owner',
      authority: 'Executive Sponsor',
      dependency: 'Decision package approved',
      dueTime: 'Within 12 simulated hours',
      verificationRequirement: 'Decision call scheduled',
      expectedOutcome: 'Sponsor decision window is actively managed.',
      readinessState: 'Simulation only - not executed externally'
    }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createInitialDecisionState() {
  return {
    decisionObject: clone(decisionFixture.decisionObject),
    selectedPathId: decisionFixture.decisionObject.selectedPathId,
    activeRoleId: 'role-commercial-operations-lead',
    selectedAuthorityNodeId: 'role-commercial-operations-lead',
    selectedAuthorityRuleId: 'rule-value-threshold',
    selectedAuditEventId: null,
    selectedPlanId: 'plan-executive-response',
    lastError: '',
    returnReason: '',
    rejectReason: ''
  };
}

export function addAuditEvent(state, event) {
  const auditEvent = {
    id: `audit-${state.decisionObject.auditEvents.length + 1}`,
    timestamp: `2026-09-16T09:${String(state.decisionObject.auditEvents.length).padStart(2, '0')}:00.000Z`,
    evidenceUsed: ['ev-executive-email', 'ev-finance-condition', 'ev-calendar-window'],
    authorityRuleApplied: 'rule-value-threshold',
    ...event
  };
  state.decisionObject.auditEvents.push(auditEvent);
  state.selectedAuditEventId = auditEvent.id;
  state.decisionObject.updatedAt = auditEvent.timestamp;
  state.decisionObject.version += 1;
  return auditEvent;
}

export function selectStrategicPath(state, pathId) {
  if (state.decisionObject.status === DECISION_STATES.APPROVED || state.decisionObject.status === DECISION_STATES.EXECUTION_READY) {
    state.lastError = 'Selected path is locked after approval.';
    return { ok: false, reason: state.lastError };
  }
  const path = decisionFixture.paths.find((item) => item.id === pathId);
  if (!path) {
    state.lastError = 'Unknown strategic path.';
    return { ok: false, reason: state.lastError };
  }
  const previousPathId = state.selectedPathId;
  state.selectedPathId = pathId;
  state.decisionObject.selectedPathId = pathId;
  if (state.decisionObject.status === DECISION_STATES.DRAFT) {
    state.decisionObject.status = DECISION_STATES.READY_FOR_REVIEW;
  }
  addAuditEvent(state, {
    event: 'Strategic path selected',
    actorRole: state.activeRoleId,
    previousState: state.decisionObject.status,
    newState: state.decisionObject.status,
    rationale: `Path changed from ${previousPathId} to ${pathId}.`
  });
  state.lastError = '';
  return { ok: true };
}

export function submitForApproval(state) {
  const allowed = [DECISION_STATES.DRAFT, DECISION_STATES.READY_FOR_REVIEW, DECISION_STATES.RETURNED];
  if (!allowed.includes(state.decisionObject.status)) {
    state.lastError = `Cannot submit from ${state.decisionObject.status}.`;
    return { ok: false, reason: state.lastError };
  }
  const previousState = state.decisionObject.status;
  state.decisionObject.status = DECISION_STATES.PENDING_APPROVAL;
  addAuditEvent(state, {
    event: 'Submitted for approval',
    actorRole: state.activeRoleId,
    previousState,
    newState: state.decisionObject.status,
    rationale: 'Operator submitted the selected strategic path for simulated authority review.'
  });
  state.lastError = '';
  return { ok: true };
}

export function approveDecision(state) {
  if (state.decisionObject.status !== DECISION_STATES.PENDING_APPROVAL) {
    state.lastError = 'Decision must be pending approval before it can be approved.';
    return { ok: false, reason: state.lastError };
  }
  if (state.activeRoleId !== 'role-executive-sponsor') {
    state.lastError = 'Only the Executive Sponsor can approve this decision.';
    return { ok: false, reason: state.lastError };
  }
  const previousState = state.decisionObject.status;
  state.decisionObject.status = DECISION_STATES.APPROVED;
  addAuditEvent(state, {
    event: 'Decision approved',
    actorRole: state.activeRoleId,
    previousState,
    newState: state.decisionObject.status,
    rationale: 'Authorized approver approved the selected strategic path.'
  });
  const approvedState = state.decisionObject.status;
  state.decisionObject.status = DECISION_STATES.EXECUTION_READY;
  addAuditEvent(state, {
    event: 'Execution-ready plan generated',
    actorRole: 'system-simulated-governance',
    previousState: approvedState,
    newState: state.decisionObject.status,
    rationale: 'Approved judgment converted into a simulated execution-ready action plan.'
  });
  state.lastError = '';
  return { ok: true };
}

export function returnDecision(state, reason) {
  if (state.decisionObject.status !== DECISION_STATES.PENDING_APPROVAL) {
    state.lastError = 'Only pending decisions can be returned.';
    return { ok: false, reason: state.lastError };
  }
  if (!reason || !reason.trim()) {
    state.lastError = 'Returned decisions require a reason.';
    return { ok: false, reason: state.lastError };
  }
  const previousState = state.decisionObject.status;
  state.decisionObject.status = DECISION_STATES.RETURNED;
  state.returnReason = reason.trim();
  addAuditEvent(state, {
    event: 'Decision returned',
    actorRole: state.activeRoleId,
    previousState,
    newState: state.decisionObject.status,
    rationale: state.returnReason
  });
  state.lastError = '';
  return { ok: true };
}

export function rejectDecision(state, reason) {
  if (state.decisionObject.status !== DECISION_STATES.PENDING_APPROVAL) {
    state.lastError = 'Only pending decisions can be rejected.';
    return { ok: false, reason: state.lastError };
  }
  if (!reason || !reason.trim()) {
    state.lastError = 'Rejected decisions require a reason.';
    return { ok: false, reason: state.lastError };
  }
  const previousState = state.decisionObject.status;
  state.decisionObject.status = DECISION_STATES.REJECTED;
  state.rejectReason = reason.trim();
  addAuditEvent(state, {
    event: 'Decision rejected',
    actorRole: state.activeRoleId,
    previousState,
    newState: state.decisionObject.status,
    rationale: state.rejectReason
  });
  state.lastError = '';
  return { ok: true };
}
