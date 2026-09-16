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
const $ = (id) => document.getElementById(id);

function role(id) { return demo.roles.find((item) => item.id === id); }
function evidence(id) { return demo.evidence.find((item) => item.id === id); }
function action(id) { return demo.actions.find((item) => item.id === id); }
function outcome(id) { return demo.outcomes.find((item) => item.id === id); }
function graphNode(id) { return graphNodes.find((item) => item.id === id); }
function announce(message) { $('sr-status').textContent = message; }

function renderNav() {
  $('workspace-nav').innerHTML = demo.nav.map(([id, label, icon]) => `
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
    'Decision Path': `<div class="door-stage ${state.doorsOpen ? 'open' : ''}" aria-label="Opening Doors analytical layer"><span></span><span></span><strong>Fragmented signals become governed judgment</strong></div>${renderGraph()}${renderActionPath()}`,
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

function render() {
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
  state = { ...initialState };
  render();
  $('opportunity-object').focus();
  announce('Demo reset to deterministic initial state.');
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    const id = nav.dataset.nav;
    state.activeWorkspace = id === 'command' ? 'command' : id;
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

  const resultButton = event.target.closest('[data-result]');
  if (resultButton && window.__searchResults) {
    window.__searchResults[Number(resultButton.dataset.result)]?.action();
  }
});

document.addEventListener('change', (event) => {
  const filter = event.target.closest('[data-feed-filter]');
  if (!filter) return;
  if (filter.dataset.feedFilter === 'source') state.feedSource = filter.value;
  if (filter.dataset.feedFilter === 'urgency') state.feedUrgency = filter.value;
  if (filter.dataset.feedFilter === 'status') state.feedStatus = filter.value;
  renderSignals();
  renderTabs();
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
  if (event.key === 'Escape') closeOverlays();
});

render();
