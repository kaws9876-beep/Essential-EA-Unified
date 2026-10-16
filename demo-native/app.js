import { scenario } from './scenario.js';

const initialState = () => ({
  phase: 'host',
  analysisReady: false,
  executionIndex: -1,
  selectedEvidence: null,
  audit: [],
  timers: []
});

let state = initialState();
const root = document.querySelector('#demo-root');
const announcer = document.querySelector('#announcer');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function record(event, detail) {
  state.audit.push({ event, detail, actor: 'Synthetic demo operator', time: `T+${state.audit.length + 1}` });
}

function announce(message) {
  announcer.textContent = '';
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function clearTimers() {
  state.timers.forEach(window.clearTimeout);
  state.timers = [];
}

function later(callback, delay) {
  const id = window.setTimeout(callback, delay);
  state.timers.push(id);
}

function hostSidebar() {
  return `<aside class="host-sidebar" aria-label="${scenario.host} navigation">
    <div class="host-mark"><span>N</span><strong>${scenario.host}</strong></div>
    <nav>
      <button type="button"><span>⌂</span>Home</button>
      <button type="button" class="active"><span>◇</span>Commitments</button>
      <button type="button"><span>◎</span>Customers</button>
      <button type="button"><span>▦</span>Finance</button>
      <button type="button"><span>✓</span>Workflows</button>
    </nav>
    <div class="tenant"><span>NS</span><div><strong>${scenario.organization}</strong><small>Enterprise tenant</small></div></div>
  </aside>`;
}

function taskRows() {
  return scenario.tasks.map(([title, status], index) => `<button class="task-row" type="button" data-action="task" data-index="${index}">
    <span class="task-check">✓</span><span><strong>${title}</strong><small>Workflow activity recorded</small></span><em>${status}</em>
  </button>`).join('');
}

function hostRecord() {
  const stormActive = state.phase !== 'host';
  return `<section class="host-app ${stormActive ? 'storm-active' : ''}" aria-label="Fictional host platform record">
    ${hostSidebar()}
    <div class="host-main">
      <header class="host-topbar">
        <div><small>northstar.example / commitments / 2048</small><strong>${scenario.organization}</strong></div>
        <div class="host-actions"><button type="button" aria-label="Search">⌕</button><button type="button" aria-label="Notifications">◌</button><span>KS</span></div>
      </header>
      <div class="record-wrap">
        <div class="record-breadcrumb">Commitments <span>/</span> ${scenario.record}</div>
        <div class="record-heading">
          <div><p>${scenario.recordType}</p><h1>${scenario.record}</h1><span class="record-subtitle">Northstar enterprise account · material operating commitment</span></div>
          <div class="host-status"><span>HOST STATUS</span><strong>✓ ${scenario.hostState.status}</strong><small>Updated ${scenario.hostState.lastUpdated}</small></div>
        </div>
        <div class="host-metrics" aria-label="Host system summary">
          <button type="button" data-action="metric"><span>Tasks</span><strong>${scenario.hostState.tasks}</strong><small>All activity complete</small></button>
          <button type="button" data-action="metric"><span>SLA</span><strong>${scenario.hostState.sla}</strong><small>Within target</small></button>
          <button type="button" data-action="metric"><span>Owner</span><strong>${scenario.hostState.owner}</strong><small>Assignment confirmed</small></button>
          <button type="button" data-action="metric"><span>Exposure</span><strong>${scenario.exposure}</strong><small>Host estimate</small></button>
        </div>
        <div class="host-columns">
          <section class="host-card activity-card">
            <div class="card-heading"><div><span>WORKFLOW ACTIVITY</span><h2>Everything appears complete.</h2></div><span class="all-complete">5 / 5</span></div>
            <div class="task-list">${taskRows()}</div>
          </section>
          <aside class="host-card record-card">
            <span>RECORD SUMMARY</span>
            <dl><div><dt>Priority</dt><dd>Material</dd></div><div><dt>Decision window</dt><dd>${scenario.deadline}</dd></div><div><dt>Escalation</dt><dd>None</dd></div><div><dt>Verification</dt><dd>Not required</dd></div></dl>
            <div class="host-resolution"><span>✓</span><p><strong>Ready to archive</strong><small>All configured workflow conditions are satisfied.</small></p></div>
          </aside>
        </div>
      </div>
    </div>
    ${state.phase === 'host' ? `<button class="storm-trigger" type="button" data-action="inspect" aria-label="Inspect this resolved record with EA STORM">
      <span class="storm-orbit" aria-hidden="true"></span><span class="storm-wordmark"><small>EA</small> STORM</span><strong>Inspect with Storm</strong><em>→</em>
    </button>` : ''}
  </section>`;
}

function evidenceRows() {
  return scenario.evidence.map((item) => `<button class="evidence-row ${state.selectedEvidence === item.id ? 'selected' : ''}" type="button" data-action="evidence" data-id="${item.id}" aria-pressed="${state.selectedEvidence === item.id}">
    <span class="evidence-state">${item.state}</span><span><small>${item.source}</small><strong>${item.title}</strong></span><em>↗</em>
  </button>`).join('');
}

function evidenceDetail() {
  const item = scenario.evidence.find((entry) => entry.id === state.selectedEvidence);
  if (!item) return '';
  return `<div class="evidence-detail" role="dialog" aria-modal="false" aria-label="Evidence detail">
    <button type="button" data-action="close-evidence" aria-label="Close evidence detail">×</button>
    <span>${item.source} · synthetic evidence</span><h3>${item.title}</h3><p>${item.detail}</p>
  </div>`;
}

function analysisPanel() {
  return `<aside class="storm-panel opening" aria-label="EA STORM embedded governing layer">
    <div class="storm-door door-left" aria-hidden="true"></div><div class="storm-door door-right" aria-hidden="true"></div>
    <header class="storm-panel-head"><div><span>EA STORM</span><small>Native governing layer · synthetic proof</small></div><button type="button" data-action="reset">Reset</button></header>
    <div class="storm-panel-body">
      <div class="storm-kicker"><span class="pulse-dot"></span>CONSEQUENTIAL CONTRADICTION DETECTED</div>
      <h2>Closed isn’t <em>solved.</em></h2>
      <p class="storm-lead">The host says this commitment is resolved. The evidence says the outcome remains open.</p>
      <div class="host-vs-proof"><div><span>HOST WORKFLOW</span><strong>Resolved</strong><small>5 of 5 tasks complete</small></div><div class="versus">≠</div><div><span>OUTCOME EVIDENCE</span><strong>Unresolved</strong><small>${scenario.exposure} still exposed</small></div></div>
      <div class="evidence-stack" aria-label="Correlated evidence">${evidenceRows()}</div>
      ${state.analysisReady ? `<section class="diagnosis" aria-label="Storm diagnosis">
        <div class="diagnosis-head"><span>PROBABLE CONTROL FAILURE</span><small>${scenario.diagnosis.confidence}</small></div>
        <h3>${scenario.diagnosis.headline}</h3><p>${scenario.diagnosis.cause}</p>
        <div class="plan-tracks">
          <button type="button" data-action="plan-detail"><span>01 · ${scenario.plan.current.label}</span><strong>${scenario.plan.current.actions.join(' · ')}</strong><small>Owner · ${scenario.plan.current.owner}</small></button>
          <button type="button" data-action="plan-detail"><span>02 · ${scenario.plan.prevention.label}</span><strong>${scenario.plan.prevention.actions.join(' · ')}</strong><small>Owner · ${scenario.plan.prevention.owner}</small></button>
        </div>
        <div class="authority-line"><span>AUTHORITY REQUIRED</span><strong>${scenario.plan.authority}</strong><small>${scenario.plan.rationale}</small></div>
        <button class="primary-action" type="button" data-action="approve">Approve recovery + prevention plan <span>→</span></button>
        <p class="simulation-note">Human authorization required. Simulation only—nothing will be changed externally.</p>
      </section>` : `<div class="analysis-progress"><span></span><p>Storm is correlating outcome evidence with operating memory…</p></div>`}
    </div>
    ${evidenceDetail()}
  </aside>`;
}

function executionPanel() {
  const completed = Math.max(0, state.executionIndex + 1);
  const percent = Math.round((completed / scenario.execution.length) * 100);
  return `<aside class="storm-panel execution-panel" aria-label="Governed execution and verification">
    <header class="storm-panel-head"><div><span>EA STORM</span><small>Human-authorized simulation</small></div><button type="button" data-action="reset">Reset</button></header>
    <div class="storm-panel-body">
      <div class="storm-kicker approved"><span>✓</span>AUTHORITY VERIFIED · PLAN LOCKED</div>
      <h2>Recover now.<br><em>Correct what happens next.</em></h2>
      <p class="storm-lead">Storm is carrying the approved work through execution, independent proof, and operating memory.</p>
      <div class="execution-progress"><span style="width:${percent}%"></span></div>
      <div class="execution-list">${scenario.execution.map(([action, proof], index) => {
        const status = index < completed ? 'complete' : index === completed ? 'active' : 'waiting';
        return `<div class="execution-step ${status}"><span>${index < completed ? '✓' : String(index + 1).padStart(2, '0')}</span><p><strong>${action}</strong><small>${proof}</small></p><em>${index < completed ? 'Verified' : index === completed ? 'In motion' : 'Waiting'}</em></div>`;
      }).join('')}</div>
      <div class="execution-boundary"><span>SIMULATION BOUNDARY</span><p>No email, CRM, finance, customer, or production record has been changed.</p></div>
    </div>
  </aside>`;
}

function outcomeView() {
  return `<section class="outcome-stage" aria-label="Verified modeled outcome">
    <div class="outcome-brand"><span>EA STORM</span><small>Decision &amp; Execution Intelligence</small></div>
    <div class="outcome-content">
      <p class="outcome-kicker">CLOSED LOOP · MODELED VERIFICATION COMPLETE</p>
      <h1>The first failure was recovered.<br><em>The next one was prevented.</em></h1>
      <p class="outcome-lead">Most systems close the task. Storm closes the problem—and carries the lesson into what happens next.</p>
      <div class="outcome-proof">
        <button type="button" data-action="outcome-detail"><span>RECOVERY</span><strong>${scenario.outcome.recovered}</strong><small>Independent synthetic evidence accepted</small></button>
        <button type="button" data-action="outcome-detail"><span>PREVENTION</span><strong>${scenario.outcome.prevented}</strong><small>${scenario.outcome.testWindow}</small></button>
        <button type="button" data-action="outcome-detail"><span>MEMORY</span><strong>Future false closure is denied</strong><small>Control now requires outcome proof</small></button>
      </div>
      <div class="memory-record"><span>WHAT CHANGED</span><p>${scenario.outcome.memory}</p></div>
      <div class="outcome-actions"><button class="primary-action light" type="button" data-action="reset">Replay the 60-second proof <span>↻</span></button><button type="button" class="text-action" data-action="audit">View simulated audit (${state.audit.length})</button></div>
      <p class="simulation-note light-note">Synthetic, modeled demonstration. No external system changed and no actual financial result is claimed.</p>
    </div>
  </section>`;
}

function render() {
  if (state.phase === 'outcome') {
    root.innerHTML = outcomeView();
    return;
  }
  const panel = state.phase === 'analysis' ? analysisPanel() : state.phase === 'executing' ? executionPanel() : '';
  root.innerHTML = `<div class="native-stage">${hostRecord()}${panel}</div>`;
}

function inspect() {
  if (state.phase !== 'host') return;
  record('Storm inspection requested', 'Human requested a synthetic inspection of the host record.');
  state.phase = 'analysis';
  render();
  announce('Storm found a contradiction. The host says resolved while outcome evidence remains open.');
  later(() => {
    if (state.phase !== 'analysis') return;
    state.analysisReady = true;
    record('Control failure correlated', scenario.diagnosis.cause);
    render();
    document.querySelector('[data-action="approve"]')?.focus({ preventScroll: true });
    announce('Probable control failure identified. Human approval is required for the recovery and prevention plan.');
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 1800);
}

function approve() {
  if (state.phase !== 'analysis' || !state.analysisReady) return;
  record('Governed plan approved', scenario.plan.authority);
  state.phase = 'executing';
  state.executionIndex = -1;
  render();
  announce('Human authorization recorded. Synthetic execution has begun.');
  scenario.execution.forEach((step, index) => later(() => {
    if (state.phase !== 'executing') return;
    state.executionIndex = index;
    record(index < 3 ? 'Recovery evidence verified' : 'Preventive control recorded', step[0]);
    render();
    announce(`${step[0]}. ${step[1]}.`);
  }, (index + 1) * (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 90 : 850)));
  later(() => {
    if (state.phase !== 'executing') return;
    state.phase = 'outcome';
    record('Closed-loop proof completed', scenario.outcome.memory);
    render();
    document.querySelector('[data-action="reset"]')?.focus({ preventScroll: true });
    announce('The current failure was recovered and the next false closure was blocked in the modeled recurrence test.');
  }, scenario.execution.length * (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 90 : 850) + 700);
}

function reset() {
  clearTimers();
  state = initialState();
  render();
  later(() => document.querySelector('[data-action="inspect"]')?.focus({ preventScroll: true }), 0);
  announce('Demonstration reset. The host record again appears resolved.');
}

function showToast(message) {
  let toast = document.querySelector('.demo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'demo-toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1800);
}

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'inspect') inspect();
  if (action === 'approve') approve();
  if (action === 'reset') reset();
  if (action === 'evidence') { state.selectedEvidence = control.dataset.id; render(); document.querySelector('[data-action="close-evidence"]')?.focus(); }
  if (action === 'close-evidence') {
    const returnId = state.selectedEvidence;
    state.selectedEvidence = null;
    render();
    document.querySelector(`[data-id="${returnId}"]`)?.focus();
  }
  if (action === 'task' || action === 'metric') showToast('Host activity is complete. Outcome proof was never required.');
  if (action === 'plan-detail') showToast('Both tracks are governed together: recover the present and correct the future.');
  if (action === 'outcome-detail') showToast('Modeled proof is linked to the decision, authority, action, and recurrence control.');
  if (action === 'audit') showToast(`${state.audit.length} deterministic synthetic audit events retained.`);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.selectedEvidence) {
    state.selectedEvidence = null;
    render();
  }
});

render();
