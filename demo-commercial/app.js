import {
  approveDecision,
  createInitialDecisionState,
  decisionFixture,
  rejectDecision,
  returnDecision,
  selectStrategicPath,
  submitForApproval
} from './decisionWorkflow.js';
import { GUIDED_CHAPTERS, advanceChapter, createGuidedState, previousChapter } from './guidedExperience.js';
import { createWorkspaceState, renderWorkspaceExperience } from './workspaceExperience.js';
import { beginExecution, createExecutionState, demonstrateBlockedAction, resetExecutionState, runNextAction, verifyAllAndFinalize } from './executionLifecycle.js';
import { renderGuidedLifecycle } from './lifecycleExperience.js';

const demo = {
  organization: { id: 'org-northstar-commercial-partners', name: 'Northstar Commercial Partners', fictional: true },
  opportunity: {
    id: 'opp-regional-portfolio-expansion',
    name: 'Regional Portfolio Expansion',
    value: '$1.8M',
    urgency: 'Critical',
    status: 'Decision required',
    deadline: 'Decision required within 48 hours',
    ownerId: 'role-account-lead',
    whyNow: 'Critical evidence is fragmented across communications, finance, scheduling, relationship systems, and operations while the sponsor decision window is closing.',
    summary: 'A high-value commercial opportunity is at risk because critical evidence is fragmented across communications, finance, scheduling, CRM, and operations. No single system shows the complete decision context.'
  },
  roles: [
    { id: 'role-account-lead', name: 'Maya Chen', title: 'Account Lead', fictional: true, responsibility: 'Owns coordination' },
    { id: 'role-vp-commercial', name: 'Daniel Brooks', title: 'VP, Commercial', fictional: true, responsibility: 'May approve the commercial concession' },
    { id: 'role-finance-director', name: 'Elena Ruiz', title: 'Finance Director', fictional: true, responsibility: 'Must approve modified payment terms' },
    { id: 'role-operations-lead', name: 'Jordan Ellis', title: 'Operations Lead', fictional: true, responsibility: 'Owns facilities-resolution execution' },
    { id: 'role-executive-sponsor', name: 'Priya Shah', title: 'Executive Sponsor', fictional: true, responsibility: 'Receives the consolidated response' }
  ],
  signals: [
    { id: 'sig-sponsor-email-unanswered', sourceLabel: 'Executive email', sourceType: 'communications', title: 'Executive sponsor email unanswered', detectedAtLabel: 'Sponsor-response threshold crossed', urgency: 'Critical', confidence: 94, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-executive-email'], decisionRefs: ['dec-commercial-response'], whyNow: 'Sponsor engagement is active and response latency now threatens momentum.' },
    { id: 'sig-crm-stage-stalled', sourceLabel: 'CRM', sourceType: 'relationship-system', title: 'Opportunity stage stalled', detectedAtLabel: 'CRM-stage stagnation', urgency: 'High', confidence: 90, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-crm-stage'], decisionRefs: ['dec-commercial-response'], whyNow: 'The commercial stage has not advanced while sponsor signals are intensifying.' },
    { id: 'sig-financial-condition-open', sourceLabel: 'Finance system', sourceType: 'finance', title: 'Financial condition unresolved', detectedAtLabel: 'Unresolved finance condition', urgency: 'Critical', confidence: 88, status: 'active', ownerId: 'role-finance-director', evidenceRefs: ['ev-finance-condition'], decisionRefs: ['dec-payment-terms'], whyNow: 'Modified payment terms cannot proceed without finance approval.' },
    { id: 'sig-decision-deadline', sourceLabel: 'Calendar', sourceType: 'scheduling', title: 'Decision deadline approaching', detectedAtLabel: 'Compressed decision window', urgency: 'Critical', confidence: 96, status: 'active', ownerId: 'role-vp-commercial', evidenceRefs: ['ev-calendar-window'], decisionRefs: ['dec-commercial-response'], whyNow: 'The window for executive review is now compressed.' },
    { id: 'sig-competitor-mentioned', sourceLabel: 'Relationship intelligence', sourceType: 'relationship-intelligence', title: 'Competitor mentioned in correspondence', detectedAtLabel: 'Competitor reference', urgency: 'High', confidence: 82, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-relationship-history'], decisionRefs: ['dec-commercial-response'], whyNow: 'Competitive pressure increases the cost of slow coordination.' },
    { id: 'sig-facilities-owner-missing', sourceLabel: 'Operations', sourceType: 'operations', title: 'Facilities requirement has no owner', detectedAtLabel: 'Ownership gap', urgency: 'High', confidence: 86, status: 'active', ownerId: 'role-operations-lead', evidenceRefs: ['ev-operations-request'], decisionRefs: ['dec-facilities-resolution'], whyNow: 'The unresolved requirement blocks the response from being complete.' },
    { id: 'sig-executive-meeting-unscheduled', sourceLabel: 'Meeting intelligence', sourceType: 'meeting-intelligence', title: 'Executive decision meeting not scheduled', detectedAtLabel: 'Executive meeting unscheduled', urgency: 'Critical', confidence: 91, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-meeting-notes', 'ev-calendar-window'], decisionRefs: ['dec-commercial-response'], whyNow: 'A decision call is required before the sponsor window closes.' }
  ],
  evidence: [
    { id: 'ev-executive-email', sourceLabel: 'Executive email', title: 'Sponsor asks for consolidated response', summary: 'Synthetic sponsor message asks for commercial terms and next-step ownership.', status: 'unresolved' },
    { id: 'ev-crm-stage', sourceLabel: 'CRM', title: 'Opportunity stage unchanged', summary: 'Synthetic opportunity stage has not advanced for 18 days.', status: 'stalled' },
    { id: 'ev-finance-condition', sourceLabel: 'Finance system', title: 'Payment-term condition open', summary: 'Synthetic payment-term condition requires finance review.', status: 'requires approval' },
    { id: 'ev-calendar-window', sourceLabel: 'Calendar', title: 'Compressed decision window', summary: 'Synthetic decision window requires action within 48 hours.', status: 'time sensitive' },
    { id: 'ev-meeting-notes', sourceLabel: 'Meeting intelligence', title: 'Sponsor expects decision call', summary: 'Synthetic notes indicate a consolidated response is expected.', status: 'active' },
    { id: 'ev-operations-request', sourceLabel: 'Operations', title: 'Facilities requirement unowned', summary: 'Synthetic facilities requirement has no confirmed owner.', status: 'unowned' },
    { id: 'ev-relationship-history', sourceLabel: 'Relationship intelligence', title: 'Competitor pressure surfaced', summary: 'Synthetic relationship history shows a competitor mention.', status: 'risk signal' }
  ],
  recommendation: {
    summary: 'Prepare an executive response, confirm commercial terms, assign the unresolved facilities requirement, schedule the executive decision call, and route the concession request to the authorized approvers.',
    confidence: 91
  },
  actions: [
    { id: 'act-draft-executive-response', title: 'Prepare executive response', ownerId: 'role-account-lead', evidenceRefs: ['ev-executive-email', 'ev-relationship-history'], approval: 'Human review required', verification: 'Executive response reviewed', status: 'simulated only' },
    { id: 'act-confirm-commercial-terms', title: 'Confirm commercial terms', ownerId: 'role-vp-commercial', evidenceRefs: ['ev-finance-condition'], approval: 'VP Commercial approval', verification: 'Commercial terms approved', status: 'simulated only' },
    { id: 'act-assign-facilities-owner', title: 'Assign unresolved operational requirement', ownerId: 'role-operations-lead', evidenceRefs: ['ev-operations-request'], approval: 'Ownership confirmation', verification: 'Ownership confirmed', status: 'simulated only' },
    { id: 'act-schedule-decision-call', title: 'Schedule executive decision call', ownerId: 'role-account-lead', evidenceRefs: ['ev-calendar-window', 'ev-meeting-notes'], approval: 'Calendar review', verification: 'Decision call scheduled', status: 'simulated only' },
    { id: 'act-route-approvals', title: 'Route concession and payment-term approvals', ownerId: 'role-finance-director', evidenceRefs: ['ev-finance-condition', 'ev-crm-stage'], approval: 'Finance and commercial approval', verification: 'Approvals recorded', status: 'simulated only' }
  ],
  outcomes: [
    { id: 'out-response-reviewed', title: 'Executive response reviewed', state: 'expected' },
    { id: 'out-terms-approved', title: 'Commercial terms approved', state: 'simulated' },
    { id: 'out-ownership-confirmed', title: 'Ownership confirmed', state: 'expected' },
    { id: 'out-call-scheduled', title: 'Decision call scheduled', state: 'simulated' },
    { id: 'out-sponsor-delivered', title: 'Sponsor response delivered', state: 'expected' },
    { id: 'out-risk-changed', title: 'Risk status changed', state: 'expected' },
    { id: 'out-value-protected', title: 'Modeled value protected', state: 'expected' },
    { id: 'out-unresolved-conditions', title: 'Unresolved conditions', state: 'unresolved' },
    { id: 'out-cycle-time', title: 'Cycle time measured', state: 'expected' },
    { id: 'out-memory-record', title: 'Final memory record', state: 'expected' }
  ],
  memory: {
    title: 'Organizational memory preview',
    summary: 'Storm preserves why this mattered, what evidence supported the judgment, who had authority, what was routed, what was verified, and what the organization should remember next time.'
  },
  nav: [
    ['command', 'Command Center', '◈'],
    ['signals', 'Signal Intelligence', '✦'],
    ['decisions', 'Decisions', '◆'],
    ['authority', 'Authority', '◇'],
    ['execution', 'Execution', '→'],
    ['outcomes', 'Outcomes', '✓'],
    ['memory', 'Memory', '◌']
  ],
  tabs: ['Overview', 'Signals', 'Evidence', 'Recommendation', 'Decision Path', 'Outcomes', 'Memory'],
  reasoning: [
    'The sponsor email delay alone was not enough.',
    'The stalled CRM stage alone was not enough.',
    'The unresolved financial condition alone was not enough.',
    'The approaching deadline alone was not enough.',
    'Together, they create a material executive decision.'
  ]
};

const graphNodes = [
  ...demo.signals.map((signal) => ({ id: signal.id, type: 'Source', label: signal.sourceLabel, detail: signal.title, refs: signal.evidenceRefs })),
  ...demo.evidence.map((item) => ({ id: item.id, type: 'Evidence', label: item.sourceLabel, detail: item.summary, refs: ['dec-commercial-response'] })),
  { id: demo.opportunity.id, type: 'Opportunity', label: demo.opportunity.name, detail: demo.opportunity.summary, refs: ['dec-commercial-response'] },
  { id: 'dec-commercial-response', type: 'Decision Object', label: 'Authorize coordinated executive response', detail: 'Human decision required before simulated execution may proceed.', refs: ['role-vp-commercial', 'approval-commercial-concession'] },
  { id: 'role-account-lead', type: 'Owner', label: 'Maya Chen', detail: 'Owns coordination and response preparation.', refs: ['act-draft-executive-response'] },
  { id: 'role-vp-commercial', type: 'Authority', label: 'Daniel Brooks', detail: 'May approve the commercial concession.', refs: ['act-confirm-commercial-terms'] },
  { id: 'approval-commercial-concession', type: 'Approval', label: 'Commercial concession', detail: 'Required before the concession path is simulated.', refs: ['act-route-approvals'] },
  { id: 'act-draft-executive-response', type: 'Planned action', label: 'Prepare response', detail: 'Simulated only; no external message is sent.', refs: ['out-response-reviewed'] },
  { id: 'out-response-reviewed', type: 'Verification', label: 'Response reviewed', detail: 'Expected verification requirement.', refs: ['out-memory-record'] },
  { id: 'out-memory-record', type: 'Memory', label: 'Judgment preserved', detail: demo.memory.summary, refs: [] }
];

const initialState = {
  activeWorkspace: 'command',
  selectedSignalId: null,
  selectedEvidenceId: 'ev-executive-email',
  selectedTab: 'Overview',
  selectedRoleId: 'role-account-lead',
  selectedGraphNodeId: 'dec-commercial-response',
  selectedActionId: 'act-draft-executive-response',
  selectedOutcomeId: 'out-response-reviewed',
  feedSource: 'all',
  feedUrgency: 'all',
  feedStatus: 'all',
  drawerOpen: false,
  searchOpen: false,
  searchQuery: '',
  notificationOpen: false,
  operatorOpen: false,
  reasoningOpen: false,
  navOpen: false,
  doorsOpen: false
};

let state = { ...initialState };
let decisionState = createInitialDecisionState();
let guidedState = createGuidedState();
let workspaceState = createWorkspaceState();
let lifecycleState = createExecutionState();
let lastWorkspaceTrigger = null;
const $ = (id) => document.getElementById(id);

function role(id) { return demo.roles.find((item) => item.id === id); }
function evidence(id) { return demo.evidence.find((item) => item.id === id); }
function action(id) { return demo.actions.find((item) => item.id === id); }
function outcome(id) { return demo.outcomes.find((item) => item.id === id); }
function graphNode(id) { return graphNodes.find((item) => item.id === id); }
function announce(message) { $('sr-status').textContent = message; }

function renderNav() {
  const exploreNav = [
    ['command', 'Intelligence', '◈'],
    ['decisions', 'Decision Room', '◆'],
    ['outcomes', 'Outcomes & Memory', '✓']
  ];
  $('workspace-nav').innerHTML = exploreNav.map(([id, label, icon]) => `
    <button class="nav-item ${state.activeWorkspace === id ? 'active' : ''}" data-nav="${id}" type="button" aria-current="${state.activeWorkspace === id ? 'page' : 'false'}">
      <span class="nav-icon">${icon}</span><span>${label}</span>
    </button>
  `).join('');
}

function filteredSignals() {
  return demo.signals.filter((signal) => {
    const sourceMatch = state.feedSource === 'all' || signal.sourceType === state.feedSource;
    const urgencyMatch = state.feedUrgency === 'all' || signal.urgency === state.feedUrgency;
    const statusMatch = state.feedStatus === 'all' || signal.status === state.feedStatus;
    return sourceMatch && urgencyMatch && statusMatch;
  });
}

function renderSignals() {
  $('signal-list').innerHTML = filteredSignals().map((signal, index) => `
    <button class="signal-item ${state.selectedSignalId === signal.id ? 'selected' : ''}" type="button" data-signal="${signal.id}">
      <span class="signal-index">${String(index + 1).padStart(2, '0')}</span>
      <span><strong>${signal.title}</strong><small>${signal.sourceLabel} · ${signal.detectedAtLabel}</small></span>
      <em>${signal.confidence}%</em>
    </button>
  `).join('');
}

function renderReasoning() {
  $('reasoning-toggle').setAttribute('aria-expanded', String(state.reasoningOpen));
  $('reasoning-toggle').textContent = state.reasoningOpen ? 'Hide correlation' : 'Reveal correlation';
  $('reasoning-steps').hidden = !state.reasoningOpen;
  $('reasoning-steps').innerHTML = demo.reasoning.map((step, index) => `<li style="--step:${index}">${step}</li>`).join('');
}

function renderRecommendation() {
  $('recommendation-copy').textContent = demo.recommendation.summary;
}

function renderAuthority() {
  $('authority-map').innerHTML = demo.roles.map((item) => `
    <button class="authority-node ${state.selectedRoleId === item.id ? 'active' : ''}" type="button" data-role="${item.id}" aria-pressed="${state.selectedRoleId === item.id}">
      <span>${item.title}</span>
      <strong>${item.name}</strong>
      <small>${item.responsibility}</small>
    </button>
  `).join('');
}

function drawerRows(signal) {
  const owner = role(signal.ownerId);
  return [
    ['Source', signal.sourceLabel],
    ['Detected condition', signal.detectedAtLabel],
    ['Confidence', `${signal.confidence}%`],
    ['Why it matters', signal.whyNow],
    ['Linked evidence', signal.evidenceRefs.map((id) => evidence(id)?.title).filter(Boolean).join(', ')],
    ['Owner', `${owner.name}, ${owner.title}`],
    ['Linked decision', signal.decisionRefs.join(', ')],
    ['Provenance', 'Synthetic fixture · no live systems connected']
  ];
}

function renderDrawer() {
  const drawer = $('signal-drawer');
  const signal = demo.signals.find((item) => item.id === state.selectedSignalId) || demo.signals[0];
  drawer.classList.toggle('open', state.drawerOpen);
  drawer.setAttribute('aria-hidden', String(!state.drawerOpen));
  $('drawer-title').textContent = signal.title;
  $('drawer-facts').innerHTML = drawerRows(signal).map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
}

function renderGraph() {
  const selected = graphNode(state.selectedGraphNodeId) || graphNodes[0];
  const activeRefs = new Set([selected.id, ...selected.refs]);
  return `
    <section class="intelligence-graph" aria-label="Interconnected intelligence graph">
      <div class="graph-nodes">
        ${graphNodes.map((node) => `
          <button class="graph-node ${activeRefs.has(node.id) ? 'active-path' : ''} ${selected.id === node.id ? 'selected' : ''}" type="button" data-graph-node="${node.id}">
            <span>${node.type}</span><strong>${node.label}</strong>
          </button>
        `).join('')}
      </div>
      <article class="graph-detail">
        <p class="eyebrow">Trace Selected Object</p>
        <h3>${selected.label}</h3>
        <p>${selected.detail}</p>
        <small>Trace: source to evidence to decision to owner / authority to action to verification to memory</small>
      </article>
    </section>`;
}

function renderFeedControls() {
  const sources = ['all', ...new Set(demo.signals.map((signal) => signal.sourceType))];
  const urgencies = ['all', ...new Set(demo.signals.map((signal) => signal.urgency))];
  const statuses = ['all', ...new Set(demo.signals.map((signal) => signal.status))];
  const select = (name, value, options) => `
    <label>${name}
      <select data-feed-filter="${name.toLowerCase()}">
        ${options.map((option) => `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`).join('')}
      </select>
    </label>`;
  return `<div class="feed-controls">${select('Source', state.feedSource, sources)}${select('Urgency', state.feedUrgency, urgencies)}${select('Status', state.feedStatus, statuses)}</div>`;
}

function renderActionPath() {
  const selected = action(state.selectedActionId) || demo.actions[0];
  const owner = role(selected.ownerId);
  return `
    <section class="action-path" aria-label="Strategic action path">
      <div class="action-list">
        ${demo.actions.map((item, index) => `
          <button class="${state.selectedActionId === item.id ? 'active' : ''}" type="button" data-action="${item.id}">
            <span>${String(index + 1).padStart(2, '0')}</span><strong>${item.title}</strong>
          </button>
        `).join('')}
      </div>
      <article class="action-detail">
        <p class="eyebrow">Simulated Action Detail</p>
        <h3>${selected.title}</h3>
        <dl>
          <div><dt>Owner</dt><dd>${owner.name}, ${owner.title}</dd></div>
          <div><dt>Authority</dt><dd>${selected.approval}</dd></div>
          <div><dt>Evidence</dt><dd>${selected.evidenceRefs.map((id) => evidence(id)?.title).filter(Boolean).join(', ')}</dd></div>
          <div><dt>Expected verification</dt><dd>${selected.verification}</dd></div>
          <div><dt>Status</dt><dd>${selected.status}; no external system contacted</dd></div>
        </dl>
      </article>
    </section>`;
}

function renderOutcomes() {
  const selected = outcome(state.selectedOutcomeId) || demo.outcomes[0];
  return `
    <section class="outcome-preview" aria-label="Outcome and memory preview">
      <div class="outcome-grid">
        ${demo.outcomes.map((item) => `
          <button class="${state.selectedOutcomeId === item.id ? 'active' : ''}" type="button" data-outcome="${item.id}">
            <span>${item.state}</span><strong>${item.title}</strong>
          </button>
        `).join('')}
      </div>
      <article class="memory-card">
        <p class="eyebrow">${selected.state}</p>
        <h3>${selected.title}</h3>
        <p>Preview only. This state describes how Storm would verify the outcome after approved execution; it does not claim execution occurred.</p>
        <h3>${demo.memory.title}</h3>
        <p>${demo.memory.summary}</p>
      </article>
    </section>`;
}

function selectedPath() {
  return decisionFixture.paths.find((item) => item.id === decisionState.selectedPathId) || decisionFixture.paths[0];
}

function selectedAuthorityNode() {
  return decisionFixture.authorityNodes.find((item) => item.id === decisionState.selectedAuthorityNodeId) || decisionFixture.authorityNodes[0];
}

function selectedAuthorityRule() {
  return decisionFixture.authorityRules.find((item) => item.id === decisionState.selectedAuthorityRuleId) || decisionFixture.authorityRules[0];
}

function selectedAuditEvent() {
  return decisionState.decisionObject.auditEvents.find((item) => item.id === decisionState.selectedAuditEventId) || decisionState.decisionObject.auditEvents.at(-1);
}

function renderStrategicPaths() {
  const path = selectedPath();
  return `
    <section class="decision-section strategic-paths" aria-label="Strategic path comparison">
      <div class="section-heading">
        <p class="eyebrow">Strategic Paths</p>
        <h3>Human selection controls the path forward.</h3>
      </div>
      <div class="path-grid">
        ${decisionFixture.paths.map((item) => `
          <button class="path-card ${decisionState.selectedPathId === item.id ? 'active' : ''}" type="button" data-path="${item.id}" ${decisionState.decisionObject.status === 'EXECUTION_READY' ? 'aria-disabled="true"' : ''}>
            <span>${item.recommendation ? 'Storm recommended' : 'Alternate path'}</span>
            <strong>${item.label}</strong>
            <small>${item.keyTradeoff}</small>
          </button>
        `).join('')}
      </div>
      <article class="decision-detail">
        <p class="eyebrow">Selected Path</p>
        <h3>${path.label}</h3>
        <dl>
          <div><dt>Expected value protected</dt><dd>${path.expectedValueProtected}</dd></div>
          <div><dt>Risk level</dt><dd>${path.riskLevel}</dd></div>
          <div><dt>Time to action</dt><dd>${path.timeToAction}</dd></div>
          <div><dt>Required owner</dt><dd>${path.requiredOwner}</dd></div>
          <div><dt>Approval burden</dt><dd>${path.approvalBurden}</dd></div>
          <div><dt>Verification</dt><dd>${path.verificationRequirement}</dd></div>
        </dl>
      </article>
    </section>`;
}

function renderDecisionObject() {
  const object = decisionState.decisionObject;
  return `
    <section class="decision-section decision-object" aria-label="Structured Decision Object">
      <div class="section-heading">
        <p class="eyebrow">Decision Object</p>
        <h3>${object.title}</h3>
      </div>
      <dl class="object-schema">
        ${[
          ['Status', object.status],
          ['Decision type', object.decisionType],
          ['Value at risk', object.valueAtRisk],
          ['Deadline', object.decisionDeadline],
          ['Owner', object.owner],
          ['Authority required', object.authorityRequired],
          ['Version', String(object.version)]
        ].map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join('')}
      </dl>
      <p>${object.summary}</p>
      <p><strong>Rationale:</strong> ${object.rationale}</p>
    </section>`;
}

function renderAuthorityGraph() {
  const node = selectedAuthorityNode();
  const rule = selectedAuthorityRule();
  return `
    <section class="decision-section authority-graph" aria-label="Authority Graph">
      <div class="section-heading">
        <p class="eyebrow">Authority Graph</p>
        <h3>Ownership, authority, approval, consultation, and informed parties.</h3>
      </div>
      <div class="authority-room-grid">
        <div class="authority-nodes">
          ${decisionFixture.authorityNodes.map((item) => `
            <button class="authority-room-node ${decisionState.selectedAuthorityNodeId === item.id ? 'active' : ''}" type="button" data-authority-node="${item.id}">
              <span>${item.kind}</span>
              <strong>${item.label}</strong>
              <small>${item.person}</small>
            </button>
          `).join('')}
        </div>
        <article class="decision-detail">
          <p class="eyebrow">${node.kind}</p>
          <h3>${node.label}</h3>
          <p>${node.responsibility}</p>
          <p><strong>Delay consequence:</strong> ${node.consequence}</p>
          <div class="rule-list">
            ${decisionFixture.authorityRules.map((item) => `
              <button class="${decisionState.selectedAuthorityRuleId === item.id ? 'active' : ''}" type="button" data-authority-rule="${item.id}">
                ${item.label}
              </button>
            `).join('')}
          </div>
          <p><strong>${rule.label}:</strong> ${rule.trigger}</p>
          <p><strong>If delayed:</strong> ${rule.delayedConsequence}</p>
        </article>
      </div>
    </section>`;
}

function renderApprovalWorkflow() {
  const status = decisionState.decisionObject.status;
  return `
    <section class="decision-section approval-workflow" aria-label="Simulated approval workflow">
      <div class="section-heading">
        <p class="eyebrow">Approval Workflow</p>
        <h3>Simulated authority review. No external action occurs.</h3>
      </div>
      <div class="state-rail">
        ${['DRAFT', 'READY_FOR_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'EXECUTION_READY'].map((item) => `<span class="${status === item ? 'active' : ''}">${item}</span>`).join('')}
      </div>
      <div class="approval-controls">
        <label>Active role
          <select id="role-switcher" data-role-switch>
            ${decisionFixture.authorityNodes.map((item) => `<option value="${item.id}" ${decisionState.activeRoleId === item.id ? 'selected' : ''}>${item.label}</option>`).join('')}
          </select>
        </label>
        <button class="primary-action" type="button" data-approval-action="submit">Submit for approval</button>
        <button class="secondary-action" type="button" data-approval-action="approve">Approve</button>
        <label>Return reason
          <input id="return-reason" value="${decisionState.returnReason}" placeholder="Required if returned">
        </label>
        <button class="secondary-action" type="button" data-approval-action="return">Return</button>
        <label>Reject reason
          <input id="reject-reason" value="${decisionState.rejectReason}" placeholder="Required if rejected">
        </label>
        <button class="secondary-action" type="button" data-approval-action="reject">Reject</button>
      </div>
      ${decisionState.lastError ? `<p class="workflow-error" role="alert">${decisionState.lastError}</p>` : ''}
      ${decisionState.returnReason ? `<p class="workflow-note">Returned reason: ${decisionState.returnReason}</p>` : ''}
      ${decisionState.rejectReason ? `<p class="workflow-note">Rejected reason: ${decisionState.rejectReason}</p>` : ''}
    </section>`;
}

function renderGovernedActionPlan() {
  const plan = decisionFixture.actionPlan.find((item) => item.id === decisionState.selectedPlanId) || decisionFixture.actionPlan[0];
  return `
    <section class="decision-section action-plan" aria-label="Execution-ready governed action plan">
      <div class="section-heading">
        <p class="eyebrow">Governed Action Plan</p>
        <h3>${decisionState.decisionObject.status === 'EXECUTION_READY' ? 'Execution-ready, simulation only.' : 'Preview locked until approval.'}</h3>
      </div>
      <div class="plan-grid">
        ${decisionFixture.actionPlan.map((item) => `
          <button class="${decisionState.selectedPlanId === item.id ? 'active' : ''}" type="button" data-plan="${item.id}">
            <span>${item.readinessState}</span>
            <strong>${item.action}</strong>
          </button>
        `).join('')}
      </div>
      <article class="decision-detail">
        <h3>${plan.action}</h3>
        <dl>
          <div><dt>Assigned owner</dt><dd>${plan.assignedOwner}</dd></div>
          <div><dt>Authority</dt><dd>${plan.authority}</dd></div>
          <div><dt>Dependency</dt><dd>${plan.dependency}</dd></div>
          <div><dt>Due time</dt><dd>${plan.dueTime}</dd></div>
          <div><dt>Verification</dt><dd>${plan.verificationRequirement}</dd></div>
          <div><dt>Expected outcome</dt><dd>${plan.expectedOutcome}</dd></div>
          <div><dt>Readiness</dt><dd>${plan.readinessState}</dd></div>
        </dl>
      </article>
    </section>`;
}

function renderAuditTrail() {
  const selected = selectedAuditEvent();
  return `
    <section class="decision-section audit-trail" aria-label="Decision audit trail">
      <div class="section-heading">
        <p class="eyebrow">Decision History</p>
        <h3>How organizational judgment moved.</h3>
      </div>
      <div class="audit-grid">
        <div class="audit-list">
          ${decisionState.decisionObject.auditEvents.length ? decisionState.decisionObject.auditEvents.map((item) => `
            <button class="${decisionState.selectedAuditEventId === item.id ? 'active' : ''}" type="button" data-audit-event="${item.id}">
              <span>${item.timestamp}</span>
              <strong>${item.event}</strong>
            </button>
          `).join('') : '<p>No audit events yet. Select a path or submit for approval.</p>'}
        </div>
        <article class="decision-detail">
          ${selected ? `
            <p class="eyebrow">${selected.actorRole}</p>
            <h3>${selected.event}</h3>
            <dl>
              <div><dt>Previous state</dt><dd>${selected.previousState}</dd></div>
              <div><dt>New state</dt><dd>${selected.newState}</dd></div>
              <div><dt>Rationale</dt><dd>${selected.rationale}</dd></div>
              <div><dt>Evidence used</dt><dd>${selected.evidenceUsed.join(', ')}</dd></div>
              <div><dt>Authority rule</dt><dd>${selected.authorityRuleApplied}</dd></div>
            </dl>` : '<p>Select or create an audit event to inspect the decision history.</p>'}
        </article>
      </div>
    </section>`;
}

function renderDecisionRoom() {
  return `
    <div class="decision-room">
      ${renderStrategicPaths()}
      ${renderDecisionObject()}
      ${renderAuthorityGraph()}
      ${renderApprovalWorkflow()}
      ${renderGovernedActionPlan()}
      ${renderAuditTrail()}
    </div>`;
}

function renderTabs() {
  $('opportunity-tabs').innerHTML = demo.tabs.map((tab) => `
    <button class="tab ${state.selectedTab === tab ? 'active' : ''}" role="tab" type="button" data-tab="${tab}" aria-selected="${state.selectedTab === tab}">
      ${tab}
    </button>
  `).join('');

  const selectedEvidence = evidence(state.selectedEvidenceId);
  const panelContent = {
    Overview: `${renderGraph()}<p>${demo.opportunity.summary}</p>`,
    Signals: `${renderFeedControls()}<div class="mini-list">${filteredSignals().map((item) => `<button type="button" data-signal="${item.id}">${item.title}<span>${item.confidence}% · ${item.urgency}</span></button>`).join('')}</div>`,
    Evidence: `
      <div class="evidence-layout">
        <div class="mini-list">${demo.evidence.map((item) => `<button class="${state.selectedEvidenceId === item.id ? 'active' : ''}" type="button" data-evidence="${item.id}">${item.sourceLabel}<span>${item.status}</span></button>`).join('')}</div>
        <article><h3>${selectedEvidence.title}</h3><p>${selectedEvidence.summary}</p><small>Synthetic evidence · no external system queried.</small>${renderGraph()}</article>
      </div>`,
    Recommendation: `<p>${demo.recommendation.summary}</p><div class="governed-meta"><span>Confidence ${demo.recommendation.confidence}%</span><span>Human decision required</span><span>All action simulated</span></div>${renderActionPath()}`,
    'Decision Path': `<div class="door-stage ${state.doorsOpen ? 'open' : ''}" aria-label="Opening Doors analytical layer"><span></span><span></span><strong>Fragmented signals become governed judgment</strong></div>${renderDecisionRoom()}`,
    Outcomes: renderOutcomes(),
    Memory: `<article class="memory-card"><p class="eyebrow">Organizational Judgment Infrastructure</p><h3>${demo.memory.title}</h3><p>${demo.memory.summary}</p>${renderOutcomes()}</article>`
  };
  $('tab-panel').innerHTML = panelContent[state.selectedTab];
}

function allSearchItems() {
  return [
    { type: 'Opportunity', title: demo.opportunity.name, action: () => openOpportunity('Overview') },
    ...demo.signals.map((item) => ({ type: 'Signal', title: item.title, action: () => openSignal(item.id) })),
    ...demo.evidence.map((item) => ({ type: 'Evidence', title: item.title, action: () => openOpportunity('Evidence', item.id) })),
    ...demo.roles.map((item) => ({ type: 'Person', title: `${item.name} · ${item.title}`, action: () => selectRole(item.id) })),
    { type: 'Decision', title: 'Authorize coordinated executive response', action: () => openOpportunity('Decision Path') },
    ...demo.actions.map((item) => ({ type: 'Action', title: item.title, action: () => { state.selectedActionId = item.id; openOpportunity('Recommendation'); } })),
    ...demo.outcomes.map((item) => ({ type: 'Outcome', title: item.title, action: () => { state.selectedOutcomeId = item.id; openOpportunity('Outcomes'); } }))
  ];
}

function renderSearch() {
  $('search-trigger').setAttribute('aria-expanded', String(state.searchOpen));
  $('search-overlay').classList.toggle('open', state.searchOpen);
  $('search-overlay').setAttribute('aria-hidden', String(!state.searchOpen));
  const query = state.searchQuery.trim().toLowerCase();
  const results = allSearchItems().filter((item) => !query || item.title.toLowerCase().includes(query) || item.type.toLowerCase().includes(query)).slice(0, 8);
  $('search-results').innerHTML = results.map((item, index) => `
    <button type="button" data-result="${index}">
      <span>${item.type}</span><strong>${item.title}</strong>
    </button>
  `).join('');
  window.__searchResults = results;
}

function renderPopovers() {
  $('notification-trigger').setAttribute('aria-expanded', String(state.notificationOpen));
  $('notification-panel').classList.toggle('open', state.notificationOpen);
  $('notification-panel').setAttribute('aria-hidden', String(!state.notificationOpen));
  $('operator-menu').setAttribute('aria-expanded', String(state.operatorOpen));
  $('operator-panel').classList.toggle('open', state.operatorOpen);
  $('operator-panel').setAttribute('aria-hidden', String(!state.operatorOpen));
}

function previewWorkspace(id) {
  const labels = {
    signals: ['Signal Intelligence', 'Inspect deterministic feed filters, source provenance, and evidence links.', 'Signals'],
    decisions: ['Decisions', 'Trace source signals into the governed Decision Object.', 'Decision Path'],
    authority: ['Authority', 'Inspect ownership, approval rights, and who may move work forward.', 'Decision Path'],
    execution: ['Execution', 'Preview the simulated strategic action path after human review.', 'Recommendation'],
    outcomes: ['Outcomes', 'Preview verification requirements and unresolved conditions.', 'Outcomes'],
    memory: ['Memory', 'Preview what the organization remembers after the outcome is known.', 'Memory']
  };
  const [title, copy, tab] = labels[id] || labels.signals;
  $('preview-title').textContent = title;
  $('preview-copy').textContent = copy;
  $('preview-workspace').hidden = false;
  $('command-center').hidden = true;
  $('opportunity-workspace').hidden = true;
  $('preview-return').dataset.previewTab = tab;
}

function renderWorkspace() {
  const inOpportunity = state.activeWorkspace === 'opportunity';
  $('command-center').hidden = state.activeWorkspace !== 'command';
  $('opportunity-workspace').hidden = !inOpportunity;
  $('preview-workspace').hidden = state.activeWorkspace === 'command' || inOpportunity;
  if (inOpportunity) renderTabs();
  if (!['command', 'opportunity'].includes(state.activeWorkspace)) previewWorkspace(state.activeWorkspace);
}

const guidedSignals = [
  ['Executive communication', 'Sponsor response is overdue', '94%', 'Critical', 'Momentum is slipping while the sponsor waits.'],
  ['CRM', 'Opportunity has stalled', '90%', 'High', 'The stage has not advanced as the decision window narrows.'],
  ['Finance', 'Payment condition remains open', '88%', 'Critical', 'Terms require a human finance review.'],
  ['Calendar', 'Decision window closes in 48 hours', '96%', 'Critical', 'Executive review must happen now.'],
  ['Operations', 'A requirement has no owner', '86%', 'High', 'The response cannot be complete without ownership.'],
  ['Relationship intelligence', 'A competitor has surfaced', '82%', 'High', 'Delay raises the cost of fragmented coordination.']
];

function guidedPrimary(label, action) {
  return `<button class="guided-primary" type="button" data-guided-action="${action}">${label}<span aria-hidden="true">→</span></button>`;
}

function renderGuidedChapter() {
  const chapter = guidedState.chapter;
  const path = selectedPath();
  if (chapter === 0) return `<div class="guided-opening">
    <p class="guided-kicker">A consequential signal has surfaced</p>
    <h1>$1.8M <em>at risk.</em></h1>
    <p class="guided-lead">Six disconnected signals have converged.<br>A decision is required within 48 hours.</p>
    ${guidedPrimary('Reveal why', 'next')}
    <button class="guided-text-link" type="button" data-guided-action="explore">Skip to workspace</button>
    <p class="guided-brand-line">What matters cannot be dropped.</p>
  </div>`;
  if (chapter === 1) return `<div class="guided-signal-scene">
    <div class="guided-intro"><p class="guided-kicker">Six sources. One consequence.</p><h1>The warning was already <em>inside the business.</em></h1><p>Crystal Ball connected six partial truths before the opportunity disappeared.</p></div>
    <div class="guided-orbit" aria-hidden="true"><span class="guided-orbit-ring"></span><strong>$1.8M</strong><small>Opportunity at risk</small></div>
    <div class="guided-signal-list" aria-label="Ranked consequential signals">${guidedSignals.map(([source, title, confidence, urgency, consequence], index) => `<button type="button" class="guided-signal-row ${guidedState.selectedSignalIndex === index ? 'selected' : ''}" data-guided-signal="${index}" style="--signal-index:${index}" aria-pressed="${guidedState.selectedSignalIndex === index}"><span class="guided-signal-source">${source}</span><strong>${title}</strong><span class="guided-signal-meta">${confidence} · ${urgency}</span><p>${consequence}</p></button>`).join('')}${guidedState.selectedSignalIndex !== null ? `<div class="guided-signal-detail"><span>Evidence / ${guidedSignals[guidedState.selectedSignalIndex][0]}</span><strong>${guidedSignals[guidedState.selectedSignalIndex][1]}</strong><p>${guidedSignals[guidedState.selectedSignalIndex][4]}</p><small>Synthetic source · ${guidedSignals[guidedState.selectedSignalIndex][2]} confidence</small></div>` : ''}</div>
    ${guidedPrimary('See what Storm found', 'next')}
  </div>`;
  if (chapter === 2) return `<div class="guided-judgment">
    <p class="guided-kicker">Judgment from the full context</p><h1>This is not another alert.<br><em>It is a decision.</em></h1>
    <div class="guided-judgment-layout"><div><div class="guided-causal"><p><span>01 / What changed</span>The sponsor response slowed as the opportunity stalled.</p><p><span>02 / Why now</span>Finance and ownership remain open with 48 hours to decide.</p><p><span>03 / What is at risk</span>$1.8M in modeled opportunity value.</p><p><span>04 / If no decision is made</span>The sponsor window may close without a coordinated response.</p></div><div class="guided-recommendation"><span>Recommended path</span><strong>Coordinate an executive response with named ownership and required approvals.</strong><small>Human decision required</small></div></div><aside class="guided-intelligence-trace" aria-label="Intelligence trace"><span>Intelligence trace</span><h2>Six signals.<br>One decision.</h2><dl><div><dt>Evidence</dt><dd>Executive communication, finance condition, deadline</dd></div><div><dt>Confidence</dt><dd>91% synthetic</dd></div><div><dt>Owner</dt><dd>Commercial Operations Lead</dd></div><div><dt>Deadline</dt><dd>48 hours</dd></div></dl><small>Signal → evidence → recommendation → decision</small></aside></div>
    ${guidedPrimary('Enter the Decision Room', 'doors')}
  </div>`;
  if (chapter === 3) return `<div class="guided-decision">
    <p class="guided-kicker">Decision and authority</p><h1>A path forward, <em>under human control.</em></h1>
    <div class="guided-paths" role="group" aria-label="Strategic paths">${decisionFixture.paths.map((item) => { const selected = guidedState.pathConfirmed && decisionState.selectedPathId === item.id; return `<button type="button" class="guided-path ${selected ? 'selected' : ''}" data-guided-path="${item.id}" aria-pressed="${selected}"><span>${item.recommendation ? 'Storm recommendation' : 'Alternative'}${selected ? ' · Selected' : ''}</span><strong>${item.label}</strong><small>${item.keyTradeoff}</small><i aria-hidden="true">${selected ? '✓' : '→'}</i></button>`; }).join('')}</div>
    <div class="guided-path-facts"><div><span>Expected value protected</span><strong>${path.expectedValueProtected}</strong></div><div><span>Risk</span><strong>${path.riskLevel}</strong></div><div><span>Time to action</span><strong>${path.timeToAction}</strong></div><div><span>Required owner</span><strong>${path.requiredOwner}</strong></div><div><span>Approval</span><strong>${path.approvalBurden}</strong></div><div><span>Tradeoff</span><strong>${path.keyTradeoff}</strong></div></div>
    <div class="guided-authority"><p><span>Decision owner</span><strong>${path.requiredOwner}</strong></p><p><span>Authority holder</span><strong>${path.approvalBurden}</strong></p><p><span>Approval rule</span><strong>$1.8M value threshold; Finance review required for payment terms.</strong></p><p class="guided-why">Approval is required because the value and unresolved finance condition exceed the operator's authority.</p></div>
    ${decisionState.lastError ? `<p class="guided-error" role="alert">${decisionState.lastError}</p>` : ''}
    <button class="guided-primary guided-path-continue" type="button" data-guided-action="submit" ${guidedState.pathConfirmed ? '' : 'disabled'}>${guidedState.pathConfirmed ? 'Continue with this path' : 'Select a path'}<span aria-hidden="true">→</span></button>
  </div>`;
  const status = decisionState.decisionObject.status;
  const ready = status === 'EXECUTION_READY';
  if (ready) return renderGuidedLifecycle(lifecycleState, decisionState, guidedState.planOpen);
  return `<div class="guided-governed">
    <p class="guided-kicker">Governed decision · simulated authority</p>
    <h1>${ready ? 'Judgment protected.<br><em>Action ready.</em>' : 'Authority must <em>be verified.</em>'}</h1>
    <p class="guided-lead">${ready ? 'Owner assigned. Authority verified. Approval recorded. Strategic path locked. Audit event created. Governed plan execution-ready.' : 'The path is pending approval. Only the designated Executive Sponsor can authorize it.'}</p>
    <div class="guided-approval-state"><span>Selected path</span><strong>${path.label}</strong><span>Status · ${status.replaceAll('_', ' ')}</span></div>
    <label class="guided-role-label">Simulated active role<select data-guided-role>${decisionFixture.authorityNodes.map((item) => `<option value="${item.id}" ${decisionState.activeRoleId === item.id ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label>${decisionState.lastError ? `<p class="guided-error" role="alert">${decisionState.lastError}</p>` : ''}${guidedPrimary('Approve decision', 'approve')}<p class="guided-simulation">Try approving as the operator to see the authority safeguard.</p>
  </div>`;
}

function renderGuided() {
  const guided = guidedState.mode === 'guided';
  document.body.classList.toggle('guided-active', guided);
  const root = $('guided-experience');
  root.hidden = !guided;
  if (!guided) return;
  root.dataset.chapter = String(guidedState.chapter + 1);
  root.classList.toggle('decision-light', guidedState.chapter >= 3);
  root.innerHTML = `<div class="guided-frame ${guidedState.doorsTransitioning ? 'doors-transitioning' : ''}">
    <header class="guided-header"><div class="guided-brand"><strong>ESSENTIAL EA</strong><span>AI STORM OS</span></div><div class="guided-progress"><span>Chapter ${guidedState.chapter + 1} of ${GUIDED_CHAPTERS.length}</span><div class="guided-progress-track"><i style="width:${(guidedState.chapter + 1) * 20}%"></i></div></div><button type="button" class="guided-exit" data-guided-action="explore">Exit guided mode</button></header>
    <main class="guided-main" id="guided-main" tabindex="-1">${renderGuidedChapter()}</main>
    <footer class="guided-footer"><button type="button" data-guided-action="back" ${guidedState.chapter === 0 ? 'hidden' : ''}>← Back</button><span>Synthetic scenario · No external systems connected</span></footer>
    ${guidedState.doorsTransitioning ? '<div class="guided-doors" aria-hidden="true"><span></span><span></span></div>' : ''}
  </div>`;
}

function renderOperational() {
  const active = guidedState.mode === 'explore';
  document.body.classList.toggle('workspace-active', active);
  const root = $('operational-workspace');
  root.hidden = !active;
  if (active) root.innerHTML = renderWorkspaceExperience(demo, workspaceState, decisionState, lifecycleState);
}

function render() {
  renderGuided();
  renderOperational();
  renderNav();
  renderSignals();
  renderReasoning();
  renderRecommendation();
  renderAuthority();
  renderDrawer();
  renderSearch();
  renderPopovers();
  renderWorkspace();
  $('nav-rail').classList.toggle('open', state.navOpen);
  $('mobile-menu').setAttribute('aria-expanded', String(state.navOpen));
  document.body.classList.toggle('doors-open', state.doorsOpen);
}

function openSignal(id) {
  state.selectedSignalId = id;
  const signal = demo.signals.find((item) => item.id === id);
  state.selectedGraphNodeId = signal?.id || state.selectedGraphNodeId;
  state.drawerOpen = true;
  state.searchOpen = false;
  state.navOpen = false;
  render();
  $('drawer-close').focus();
  announce('Signal intelligence drawer opened.');
}

function openOpportunity(tab = 'Overview', evidenceId = state.selectedEvidenceId) {
  state.activeWorkspace = 'opportunity';
  state.selectedTab = tab;
  state.selectedEvidenceId = evidenceId;
  state.doorsOpen = tab === 'Decision Path';
  state.searchOpen = false;
  state.drawerOpen = false;
  state.navOpen = false;
  render();
  $('opportunity-workspace-title').setAttribute('tabindex', '-1');
  $('opportunity-workspace-title').focus();
  announce(`${tab} workspace opened.`);
}

function selectRole(id) {
  state.selectedRoleId = id;
  state.selectedGraphNodeId = id;
  state.activeWorkspace = 'command';
  state.searchOpen = false;
  render();
  announce(`${role(id).name} selected in authority preview.`);
}

function closeOverlays() {
  state.drawerOpen = false;
  state.searchOpen = false;
  state.notificationOpen = false;
  state.operatorOpen = false;
  state.navOpen = false;
  render();
}

function resetDemo() {
  lifecycleState = resetExecutionState(lifecycleState);
  state = { ...initialState };
  decisionState = createInitialDecisionState();
  guidedState = createGuidedState();
  workspaceState = createWorkspaceState();
  render();
  $('guided-main').focus({ preventScroll: true });
  announce('Demo reset to deterministic initial state.');
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#operational-workspace')) {
    const workArea = event.target.closest('[data-work-area]');
    const workSignal = event.target.closest('[data-work-signal]');
    const workEvidence = event.target.closest('[data-work-evidence]');
    const workPath = event.target.closest('[data-work-path]');
    const workAuthority = event.target.closest('[data-work-authority]');
    const workAudit = event.target.closest('[data-work-audit]');
    const workRail = event.target.closest('[data-work-rail]');
    const workAction = event.target.closest('[data-work-action]');
    const workLifecycle = event.target.closest('[data-work-lifecycle]');
    const lifeAction = event.target.closest('[data-life-action]');
    if (workArea) {
      workspaceState.area = workArea.dataset.workArea;
      workspaceState.navOpen = false;
      workspaceState.railTab = workspaceState.area === 'Decisions' ? 'Authority' : workspaceState.area === 'Memory' ? 'Audit' : 'Evidence';
      renderOperational();
      document.querySelector(`[data-work-area="${workspaceState.area}"]`)?.focus();
    } else if (workSignal) {
      workspaceState.selectedSignalId = workSignal.dataset.workSignal;
      workspaceState.selectedEvidenceId = demo.signals.find((item) => item.id === workspaceState.selectedSignalId)?.evidenceRefs[0];
      workspaceState.railTab = 'Evidence';
      workspaceState.railOpen = true;
      lastWorkspaceTrigger = `[data-work-signal="${workspaceState.selectedSignalId}"]`;
      renderOperational();
      (window.innerWidth <= 900 ? document.querySelector('[data-work-action="close-rail"]') : document.querySelector(lastWorkspaceTrigger))?.focus();
    } else if (workEvidence) {
      workspaceState.selectedEvidenceId = workEvidence.dataset.workEvidence;
      renderOperational();
      document.querySelector(`[data-work-evidence="${workspaceState.selectedEvidenceId}"]`)?.focus();
    } else if (workPath) {
      selectStrategicPath(decisionState, workPath.dataset.workPath);
      workspaceState.railTab = 'Authority';
      renderOperational();
      document.querySelector(`[data-work-path="${workPath.dataset.workPath}"]`)?.focus();
    } else if (workAuthority) {
      workspaceState.selectedAuthorityId = workAuthority.dataset.workAuthority;
      renderOperational();
      document.querySelector(`[data-work-authority="${workspaceState.selectedAuthorityId}"]`)?.focus();
    } else if (workAudit) {
      workspaceState.selectedAuditEventId = workAudit.dataset.workAudit;
      renderOperational();
      document.querySelector(`[data-work-audit="${workspaceState.selectedAuditEventId}"]`)?.focus();
    } else if (workRail) {
      workspaceState.railTab = workRail.dataset.workRail;
      renderOperational();
      document.querySelector(`[data-work-rail="${workspaceState.railTab}"]`)?.focus();
    } else if (lifeAction) {
      lifecycleState.selectedActionId = lifeAction.dataset.lifeAction;
      workspaceState.railTab = 'Evidence';
      workspaceState.railOpen = true;
      lastWorkspaceTrigger = `[data-life-action="${lifeAction.dataset.lifeAction}"]`;
      renderOperational();
      (window.innerWidth <= 900 ? document.querySelector('[data-work-action="close-rail"]') : document.querySelector(lastWorkspaceTrigger))?.focus();
    } else if (workLifecycle) {
      const operation = workLifecycle.dataset.workLifecycle;
      if (operation === 'begin') beginExecution(lifecycleState, decisionState);
      if (operation === 'run') runNextAction(lifecycleState);
      if (operation === 'verify') verifyAllAndFinalize(lifecycleState, decisionState);
      if (operation === 'block') demonstrateBlockedAction(lifecycleState);
      if (operation === 'reuse') workspaceState.memoryReuseOpen = !workspaceState.memoryReuseOpen;
      renderOperational();
      document.querySelector(`[data-work-lifecycle="${operation}"]`)?.focus();
      announce(lifecycleState.lastError || `${lifecycleState.phase.replaceAll('_', ' ')}. ${lifecycleState.actions.filter((item) => item.status === 'VERIFIED').length} actions verified.`);
    } else if (workAction) {
      const actionName = workAction.dataset.workAction;
      if (actionName === 'reset') { resetDemo(); return; }
      if (actionName === 'review') { workspaceState.area = 'Decisions'; workspaceState.railTab = 'Authority'; }
      if (actionName === 'trace') { workspaceState.railTab = 'Trace'; workspaceState.railOpen = true; lastWorkspaceTrigger = '[data-work-action="trace"]'; }
      if (actionName === 'menu') workspaceState.navOpen = !workspaceState.navOpen;
      if (actionName === 'close-rail') workspaceState.railOpen = false;
      if (actionName === 'submit') submitForApproval(decisionState);
      if (actionName === 'approve') approveDecision(decisionState);
      if (actionName === 'return') returnDecision(decisionState, document.querySelector('#work-review-reason')?.value || '');
      if (actionName === 'reject') rejectDecision(decisionState, document.querySelector('#work-review-reason')?.value || '');
      if (actionName === 'plan') workspaceState.planOpen = !workspaceState.planOpen;
      renderOperational();
      if (actionName === 'close-rail') document.querySelector(lastWorkspaceTrigger || '[data-work-action="trace"]')?.focus();
      else if (actionName === 'review') $('work-main').focus({ preventScroll: true });
      else if (actionName === 'submit' || actionName === 'approve' || actionName === 'return' || actionName === 'reject') document.querySelector('.work-decision-controls .work-primary, .work-error')?.focus();
      else document.querySelector(`[data-work-action="${actionName}"]`)?.focus();
    }
    return;
  }

  const guidedPath = event.target.closest('[data-guided-path]');
  if (guidedPath) {
    selectStrategicPath(decisionState, guidedPath.dataset.guidedPath);
    guidedState.pathConfirmed = true;
    renderGuided();
    document.querySelector(`[data-guided-path="${guidedPath.dataset.guidedPath}"]`)?.focus();
    return;
  }

  const guidedLifecycle = event.target.closest('[data-guided-lifecycle]');
  if (guidedLifecycle) {
    const operation = guidedLifecycle.dataset.guidedLifecycle;
    if (operation === 'reset') { resetDemo(); return; }
    if (operation === 'explore') {
      guidedState.mode = 'explore';
      workspaceState.area = 'Memory';
      workspaceState.railTab = 'Audit';
      render();
      $('work-main').focus({ preventScroll: true });
      return;
    }
    if (operation === 'plan') guidedState.planOpen = !guidedState.planOpen;
    if (operation === 'begin') beginExecution(lifecycleState, decisionState);
    if (operation === 'run') runNextAction(lifecycleState);
    if (operation === 'verify') verifyAllAndFinalize(lifecycleState, decisionState);
    if (operation === 'block') demonstrateBlockedAction(lifecycleState);
    renderGuided();
    document.querySelector(`[data-guided-lifecycle="${operation}"]`)?.focus();
    announce(lifecycleState.lastError || `${lifecycleState.phase.replaceAll('_', ' ')}. ${lifecycleState.actions.filter((item) => item.completedAt).length} actions modeled.`);
    return;
  }

  const guidedSignal = event.target.closest('[data-guided-signal]');
  if (guidedSignal) {
    guidedState.selectedSignalIndex = Number(guidedSignal.dataset.guidedSignal);
    renderGuided();
    document.querySelector(`[data-guided-signal="${guidedState.selectedSignalIndex}"]`)?.focus();
    return;
  }

  const guidedAction = event.target.closest('[data-guided-action]');
  if (guidedAction) {
    const actionName = guidedAction.dataset.guidedAction;
    if (actionName === 'explore') {
      guidedState.mode = 'explore';
      workspaceState.area = 'Command';
      render();
      $('work-main').focus({ preventScroll: true });
      return;
    }
    if (actionName === 'back') previousChapter(guidedState);
    if (actionName === 'next') advanceChapter(guidedState);
    if (actionName === 'doors') {
      guidedState.doorsTransitioning = true;
      advanceChapter(guidedState);
      renderGuided();
      window.scrollTo(0, 0);
      window.setTimeout(() => {
        guidedState.doorsTransitioning = false;
        renderGuided();
        $('guided-main').focus({ preventScroll: true });
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 760);
      return;
    }
    if (actionName === 'submit') {
      const result = submitForApproval(decisionState);
      if (result.ok) advanceChapter(guidedState);
    }
    if (actionName === 'approve') approveDecision(decisionState);
    if (actionName === 'plan') guidedState.planOpen = true;
    renderGuided();
    if (actionName === 'plan') document.querySelector('.guided-plan')?.focus();
    else { window.scrollTo(0, 0); $('guided-main').focus({ preventScroll: true }); }
    announce(decisionState.lastError || `${GUIDED_CHAPTERS[guidedState.chapter]} chapter.`);
    return;
  }

  const nav = event.target.closest('[data-nav]');
  if (nav) {
    const id = nav.dataset.nav;
    if (id === 'decisions') { openOpportunity('Decision Path'); return; }
    if (id === 'outcomes') { openOpportunity('Outcomes'); return; }
    state.activeWorkspace = 'command';
    state.drawerOpen = false;
    state.navOpen = false;
    render();
    announce(`${nav.textContent.trim()} selected.`);
  }

  const signal = event.target.closest('[data-signal]');
  if (signal) openSignal(signal.dataset.signal);

  const evidenceButton = event.target.closest('[data-evidence]');
  if (evidenceButton) {
    state.selectedEvidenceId = evidenceButton.dataset.evidence;
    state.selectedGraphNodeId = evidenceButton.dataset.evidence;
    renderTabs();
  }

  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.selectedTab = tab.dataset.tab;
    state.doorsOpen = state.selectedTab === 'Decision Path';
    render();
  }

  const roleButton = event.target.closest('[data-role]');
  if (roleButton) selectRole(roleButton.dataset.role);

  const graphButton = event.target.closest('[data-graph-node]');
  if (graphButton) {
    state.selectedGraphNodeId = graphButton.dataset.graphNode;
    renderTabs();
    announce(`${graphNode(state.selectedGraphNodeId)?.label} selected in intelligence graph.`);
  }

  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    state.selectedActionId = actionButton.dataset.action;
    renderTabs();
  }

  const outcomeButton = event.target.closest('[data-outcome]');
  if (outcomeButton) {
    state.selectedOutcomeId = outcomeButton.dataset.outcome;
    renderTabs();
  }

  const pathButton = event.target.closest('[data-path]');
  if (pathButton) {
    selectStrategicPath(decisionState, pathButton.dataset.path);
    renderTabs();
    announce(decisionState.lastError || 'Strategic path selected.');
  }

  const authorityNode = event.target.closest('[data-authority-node]');
  if (authorityNode) {
    decisionState.selectedAuthorityNodeId = authorityNode.dataset.authorityNode;
    const node = decisionFixture.authorityNodes.find((item) => item.id === decisionState.selectedAuthorityNodeId);
    decisionState.selectedAuthorityRuleId = node?.ruleIds[0] || decisionState.selectedAuthorityRuleId;
    renderTabs();
  }

  const authorityRule = event.target.closest('[data-authority-rule]');
  if (authorityRule) {
    decisionState.selectedAuthorityRuleId = authorityRule.dataset.authorityRule;
    renderTabs();
  }

  const planButton = event.target.closest('[data-plan]');
  if (planButton) {
    decisionState.selectedPlanId = planButton.dataset.plan;
    renderTabs();
  }

  const auditButton = event.target.closest('[data-audit-event]');
  if (auditButton) {
    decisionState.selectedAuditEventId = auditButton.dataset.auditEvent;
    renderTabs();
  }

  const approvalButton = event.target.closest('[data-approval-action]');
  if (approvalButton) {
    const actionName = approvalButton.dataset.approvalAction;
    if (actionName === 'submit') submitForApproval(decisionState);
    if (actionName === 'approve') approveDecision(decisionState);
    if (actionName === 'return') returnDecision(decisionState, document.querySelector('#return-reason')?.value || '');
    if (actionName === 'reject') rejectDecision(decisionState, document.querySelector('#reject-reason')?.value || '');
    renderTabs();
    announce(decisionState.lastError || `Decision ${decisionState.decisionObject.status.toLowerCase().replaceAll('_', ' ')}.`);
  }

  const resultButton = event.target.closest('[data-result]');
  if (resultButton && window.__searchResults) {
    window.__searchResults[Number(resultButton.dataset.result)]?.action();
  }
});

document.addEventListener('change', (event) => {
  const workRole = event.target.closest('[data-work-role]');
  if (workRole) {
    decisionState.activeRoleId = workRole.value;
    decisionState.lastError = '';
    renderOperational();
    document.querySelector('[data-work-role]')?.focus();
    return;
  }
  const guidedRole = event.target.closest('[data-guided-role]');
  if (guidedRole) {
    decisionState.activeRoleId = guidedRole.value;
    decisionState.lastError = '';
    renderGuided();
    document.querySelector('[data-guided-role]')?.focus();
    return;
  }
  const filter = event.target.closest('[data-feed-filter]');
  if (filter) {
    if (filter.dataset.feedFilter === 'source') state.feedSource = filter.value;
    if (filter.dataset.feedFilter === 'urgency') state.feedUrgency = filter.value;
    if (filter.dataset.feedFilter === 'status') state.feedStatus = filter.value;
    renderSignals();
    renderTabs();
  }

  const roleSwitcher = event.target.closest('[data-role-switch]');
  if (roleSwitcher) {
    decisionState.activeRoleId = roleSwitcher.value;
    renderTabs();
  }
});

$('opportunity-object').addEventListener('click', () => openOpportunity('Overview'));
$('review-decision-path').addEventListener('click', () => openOpportunity('Decision Path'));
$('back-to-command').addEventListener('click', () => { state.activeWorkspace = 'command'; state.doorsOpen = false; render(); });
$('preview-return').addEventListener('click', () => openOpportunity($('preview-return').dataset.previewTab || 'Overview'));
$('drawer-close').addEventListener('click', closeOverlays);
$('search-trigger').addEventListener('click', () => { state.searchOpen = true; render(); $('search-input').focus(); });
$('search-close').addEventListener('click', closeOverlays);
$('search-input').addEventListener('input', (event) => { state.searchQuery = event.target.value; renderSearch(); });
$('notification-trigger').addEventListener('click', () => { state.notificationOpen = !state.notificationOpen; state.operatorOpen = false; renderPopovers(); });
$('operator-menu').addEventListener('click', () => { state.operatorOpen = !state.operatorOpen; state.notificationOpen = false; renderPopovers(); });
$('reset-demo').addEventListener('click', resetDemo);
$('reasoning-toggle').addEventListener('click', () => { state.reasoningOpen = !state.reasoningOpen; renderReasoning(); announce(state.reasoningOpen ? 'Storm reasoning expanded.' : 'Storm reasoning collapsed.'); });
$('mobile-menu').addEventListener('click', () => { state.navOpen = !state.navOpen; render(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (guidedState.mode === 'explore' && (workspaceState.railOpen || workspaceState.navOpen)) {
      workspaceState.railOpen = false;
      workspaceState.navOpen = false;
      renderOperational();
      document.querySelector(lastWorkspaceTrigger || '[data-work-action="trace"]')?.focus();
    } else closeOverlays();
  }
});

render();
