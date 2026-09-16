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
    { id: 'sig-sponsor-email-unanswered', sourceLabel: 'Executive email', sourceType: 'communications', title: 'Executive sponsor email unanswered', detectedAtLabel: 'Unanswered for 31 hours', urgency: 'Critical', confidence: 94, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-executive-email'], decisionRefs: ['dec-commercial-response'], whyNow: 'Sponsor engagement is active and response latency now threatens momentum.' },
    { id: 'sig-crm-stage-stalled', sourceLabel: 'CRM', sourceType: 'relationship-system', title: 'Opportunity stage stalled', detectedAtLabel: 'Stage unchanged for 18 days', urgency: 'High', confidence: 90, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-crm-stage'], decisionRefs: ['dec-commercial-response'], whyNow: 'The commercial stage has not advanced while sponsor signals are intensifying.' },
    { id: 'sig-financial-condition-open', sourceLabel: 'Finance system', sourceType: 'finance', title: 'Financial condition unresolved', detectedAtLabel: 'Condition still unresolved', urgency: 'Critical', confidence: 88, status: 'active', ownerId: 'role-finance-director', evidenceRefs: ['ev-finance-condition'], decisionRefs: ['dec-payment-terms'], whyNow: 'Modified payment terms cannot proceed without finance approval.' },
    { id: 'sig-decision-deadline', sourceLabel: 'Calendar', sourceType: 'scheduling', title: 'Decision deadline approaching', detectedAtLabel: 'Decision required within 48 hours', urgency: 'Critical', confidence: 96, status: 'active', ownerId: 'role-vp-commercial', evidenceRefs: ['ev-calendar-window'], decisionRefs: ['dec-commercial-response'], whyNow: 'The window for executive review is now compressed.' },
    { id: 'sig-competitor-mentioned', sourceLabel: 'Relationship intelligence', sourceType: 'relationship-intelligence', title: 'Competitor mentioned in correspondence', detectedAtLabel: 'Recent correspondence flagged', urgency: 'High', confidence: 82, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-relationship-history'], decisionRefs: ['dec-commercial-response'], whyNow: 'Competitive pressure increases the cost of slow coordination.' },
    { id: 'sig-facilities-owner-missing', sourceLabel: 'Operations', sourceType: 'operations', title: 'Facilities requirement has no owner', detectedAtLabel: 'Ownership gap detected', urgency: 'High', confidence: 86, status: 'active', ownerId: 'role-operations-lead', evidenceRefs: ['ev-operations-request'], decisionRefs: ['dec-facilities-resolution'], whyNow: 'The unresolved requirement blocks the response from being complete.' },
    { id: 'sig-executive-meeting-unscheduled', sourceLabel: 'Meeting intelligence', sourceType: 'meeting-intelligence', title: 'Executive decision meeting not scheduled', detectedAtLabel: 'No meeting confirmed', urgency: 'Critical', confidence: 91, status: 'active', ownerId: 'role-account-lead', evidenceRefs: ['ev-meeting-notes', 'ev-calendar-window'], decisionRefs: ['dec-commercial-response'], whyNow: 'A decision call is required before the sponsor window closes.' }
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
    { id: 'act-draft-executive-response', title: 'Draft executive response', ownerId: 'role-account-lead' },
    { id: 'act-confirm-commercial-terms', title: 'Confirm commercial terms', ownerId: 'role-vp-commercial' },
    { id: 'act-assign-facilities-owner', title: 'Assign facilities requirement', ownerId: 'role-operations-lead' },
    { id: 'act-schedule-decision-call', title: 'Schedule executive decision call', ownerId: 'role-account-lead' }
  ],
  nav: [
    ['command', 'Command Center', '◈'],
    ['signals', 'Signal Intelligence', '✦'],
    ['decisions', 'Decisions', '◆'],
    ['authority', 'Authority', '◇'],
    ['execution', 'Execution', '→'],
    ['outcomes', 'Outcomes', '✓'],
    ['memory', 'Memory', '◌']
  ],
  tabs: ['Overview', 'Signals', 'Evidence', 'Recommendation', 'Decision Path'],
  reasoning: [
    'The sponsor email delay alone was not enough.',
    'The stalled CRM stage alone was not enough.',
    'The unresolved financial condition alone was not enough.',
    'The approaching deadline alone was not enough.',
    'Together, they create a material executive decision.'
  ]
};

const initialState = {
  activeWorkspace: 'command',
  selectedSignalId: null,
  selectedEvidenceId: 'ev-executive-email',
  selectedTab: 'Overview',
  selectedRoleId: 'role-account-lead',
  drawerOpen: false,
  searchOpen: false,
  searchQuery: '',
  notificationOpen: false,
  operatorOpen: false,
  reasoningOpen: false,
  navOpen: false
};

let state = { ...initialState };
const $ = (id) => document.getElementById(id);

function role(id) {
  return demo.roles.find((item) => item.id === id);
}

function evidence(id) {
  return demo.evidence.find((item) => item.id === id);
}

function announce(message) {
  $('sr-status').textContent = message;
}

function setButtonState(button, active) {
  button.setAttribute('aria-pressed', String(active));
  button.classList.toggle('active', active);
}

function renderNav() {
  $('workspace-nav').innerHTML = demo.nav.map(([id, label, icon]) => `
    <button class="nav-item ${state.activeWorkspace === id ? 'active' : ''}" data-nav="${id}" type="button" aria-current="${state.activeWorkspace === id ? 'page' : 'false'}">
      <span class="nav-icon">${icon}</span><span>${label}</span>
    </button>
  `).join('');
}

function renderSignals() {
  $('signal-list').innerHTML = demo.signals.map((signal, index) => `
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

function renderTabs() {
  $('opportunity-tabs').innerHTML = demo.tabs.map((tab) => `
    <button class="tab ${state.selectedTab === tab ? 'active' : ''}" role="tab" type="button" data-tab="${tab}" aria-selected="${state.selectedTab === tab}">
      ${tab}
    </button>
  `).join('');

  const selectedEvidence = evidence(state.selectedEvidenceId);
  const panelContent = {
    Overview: `
      <div class="constellation">
        <span>Executive email</span><span>CRM</span><span>Finance</span><span>Calendar</span><strong>Decision Object</strong><span>Operations</span><span>Relationship history</span>
      </div>
      <p>${demo.opportunity.summary}</p>`,
    Signals: `<div class="mini-list">${demo.signals.map((item) => `<button type="button" data-signal="${item.id}">${item.title}<span>${item.confidence}%</span></button>`).join('')}</div>`,
    Evidence: `
      <div class="evidence-layout">
        <div class="mini-list">${demo.evidence.map((item) => `<button class="${state.selectedEvidenceId === item.id ? 'active' : ''}" type="button" data-evidence="${item.id}">${item.sourceLabel}<span>${item.status}</span></button>`).join('')}</div>
        <article><h3>${selectedEvidence.title}</h3><p>${selectedEvidence.summary}</p><small>Synthetic evidence · no external system queried.</small></article>
      </div>`,
    Recommendation: `<p>${demo.recommendation.summary}</p><div class="governed-meta"><span>Confidence ${demo.recommendation.confidence}%</span><span>Human decision required</span><span>All action simulated</span></div>`,
    'Decision Path': `<div class="decision-path"><span>Maya coordinates</span><span>Daniel approves concession</span><span>Elena approves payment terms</span><span>Jordan executes facilities resolution</span><strong>Priya receives consolidated response</strong></div>`
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
    ...demo.actions.map((item) => ({ type: 'Action', title: item.title, action: () => openOpportunity('Recommendation') }))
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
    signals: ['Signal Intelligence', 'Governs how fragmented source activity becomes attention-worthy intelligence.'],
    decisions: ['Decisions', 'Governs what requires executive judgment and what supporting evidence travels with it.'],
    authority: ['Authority', 'Governs ownership, approval rights, and who may move work forward.'],
    execution: ['Execution', 'Governs future simulated execution after a human reviews the decision path.'],
    outcomes: ['Outcomes', 'Governs verification and whether the action worked.'],
    memory: ['Memory', 'Governs what the organization should remember about the judgment.']
  };
  const [title, copy] = labels[id] || labels.signals;
  $('preview-title').textContent = title;
  $('preview-copy').textContent = copy;
  $('preview-workspace').hidden = false;
  $('command-center').hidden = true;
  $('opportunity-workspace').hidden = true;
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
}

function openSignal(id) {
  state.selectedSignalId = id;
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
  state.searchOpen = false;
  state.drawerOpen = false;
  state.navOpen = false;
  render();
  $('opportunity-workspace-title').focus?.();
  announce(`${tab} workspace opened.`);
}

function selectRole(id) {
  state.selectedRoleId = id;
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
    renderTabs();
  }

  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.selectedTab = tab.dataset.tab;
    renderTabs();
  }

  const roleButton = event.target.closest('[data-role]');
  if (roleButton) selectRole(roleButton.dataset.role);

  const resultButton = event.target.closest('[data-result]');
  if (resultButton && window.__searchResults) {
    window.__searchResults[Number(resultButton.dataset.result)]?.action();
  }
});

$('opportunity-object').addEventListener('click', () => openOpportunity('Overview'));
$('review-decision-path').addEventListener('click', () => openOpportunity('Decision Path'));
$('back-to-command').addEventListener('click', () => { state.activeWorkspace = 'command'; render(); });
$('preview-return').addEventListener('click', () => { state.activeWorkspace = 'command'; render(); });
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
