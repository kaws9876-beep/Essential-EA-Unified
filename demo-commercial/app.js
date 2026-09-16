const initialState = {
  selectedStageId: 'stage-signal',
  overviewOpen: false
};

let state = { ...initialState };
let fixture = null;

function readFixture() {
  const fixtureNode = document.getElementById('demo-fixture');
  if (!fixtureNode || !fixtureNode.textContent.trim()) {
    throw new Error('Demo fixture missing. Demo mode fails closed.');
  }
  const parsed = JSON.parse(fixtureNode.textContent);
  if (!parsed.demoMetadata?.fictional || !parsed.organization?.fictional) {
    throw new Error('Demo fixture must be fictional. Demo mode fails closed.');
  }
  return parsed;
}

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const node = byId(id);
  if (node) node.textContent = value;
}

function renderOpportunity() {
  setText('opportunity-org', fixture.organization.name);
  setText('opportunity-title', fixture.opportunity.name);
  setText('opportunity-value', fixture.opportunity.financialValue.label);
  setText('opportunity-urgency', fixture.opportunity.urgency);
  setText('opportunity-state', fixture.opportunity.currentState);
  setText('opportunity-deadline', fixture.opportunity.deadlineLabel);
}

function renderMetrics() {
  setText('metric-signals', String(fixture.signals.length));
  setText('metric-evidence', String(fixture.evidence.length));
  setText('metric-approvals', String(fixture.approvalRequirements.length));
  setText('metric-actions', String(fixture.plannedActions.length));
  setText('metric-value', fixture.opportunity.financialValue.label);
}

function renderLifecycle() {
  const rail = byId('lifecycle-rail');
  rail.innerHTML = '';
  for (const stage of fixture.lifecycleStages) {
    const item = document.createElement('li');
    item.className = stage.id === state.selectedStageId ? 'active' : 'locked';
    item.innerHTML = `<span>${stage.label}</span><small>${stage.status === 'active' ? 'Active now' : 'Future stage'}</small>`;
    rail.appendChild(item);
  }
}

function renderOverview() {
  setText('executive-summary', fixture.opportunity.executiveSummary);
  setText('recommendation-summary', fixture.recommendation.summary);

  const authorityList = byId('authority-list');
  authorityList.innerHTML = '';
  for (const rule of fixture.authorityRules) {
    const role = fixture.roles.find((item) => item.id === rule.roleId);
    const item = document.createElement('li');
    item.textContent = `${role?.name || 'Fictional role'} - ${rule.rule}`;
    authorityList.appendChild(item);
  }

  const actionList = byId('planned-actions');
  actionList.innerHTML = '';
  for (const action of fixture.plannedActions) {
    const owner = fixture.roles.find((item) => item.id === action.ownerId);
    const item = document.createElement('li');
    item.textContent = `${action.title} - simulated future action, owner: ${owner?.name || 'fictional owner'}`;
    actionList.appendChild(item);
  }

  byId('opportunity-overview').hidden = !state.overviewOpen;
}

function render() {
  renderOpportunity();
  renderMetrics();
  renderLifecycle();
  renderOverview();
}

function openOverview() {
  state = { ...state, overviewOpen: true };
  render();
  byId('opportunity-overview').focus();
}

function resetDemo() {
  state = { ...initialState };
  render();
  byId('review-opportunity').focus();
}

function init() {
  fixture = readFixture();
  byId('review-opportunity').addEventListener('click', openOverview);
  byId('reset-demo').addEventListener('click', resetDemo);
  render();
}

init();
