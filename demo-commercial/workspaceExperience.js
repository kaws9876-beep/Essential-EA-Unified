import { decisionFixture } from './decisionWorkflow.js';
import { createExecutionState } from './executionLifecycle.js';
import { renderLifecycleRail, renderMemoryRecord, renderWorkspaceLifecycle } from './lifecycleExperience.js';

export const WORKSPACE_DESTINATIONS = Object.freeze(['Command', 'Signals', 'Decisions', 'Memory']);

export function createWorkspaceState() {
  return {
    area: 'Command',
    selectedSignalId: 'sig-sponsor-email-unanswered',
    selectedEvidenceId: 'ev-executive-email',
    selectedAuthorityId: 'role-executive-sponsor',
    selectedAuditEventId: null,
    railTab: 'Evidence',
    railOpen: false,
    navOpen: false,
    planOpen: false,
    memoryReuseOpen: false
  };
}

function statusLabel(status) {
  return status.replaceAll('_', ' ');
}

function metricStrip(demo, decisionState, lifecycle) {
  const lifecycleActive = lifecycle.phase !== 'IDLE';
  return `<div class="work-metrics" aria-label="Executive decision measures">
    <div><span>Value at risk</span><strong>${demo.opportunity.value}</strong></div>
    <div><span>Decision deadline</span><strong>48 hours</strong></div>
    <div><span>Signal confidence</span><strong>${demo.recommendation.confidence}%</strong></div>
    <div><span>${lifecycleActive ? 'Lifecycle state' : 'Decision state'}</span><strong>${statusLabel(lifecycleActive ? lifecycle.phase : decisionState.decisionObject.status)}</strong></div>
  </div>`;
}

function commandView(demo, decisionState) {
  const selected = decisionFixture.paths.find((path) => path.id === decisionState.selectedPathId);
  return `<section class="work-command" aria-label="Living opportunity and decision object">
    <div class="work-section-label"><span>01 / Command</span><span>One decision requires attention</span></div>
    <h1>One consequential decision.<br><em>One accountable path.</em></h1>
    <p class="work-promise">Essential EA finds the important work buried across your business, puts it in the right hands, and proves it got done.</p>
    <article class="work-living-object">
      <div class="work-object-top"><span>Living opportunity · Northstar Commercial Partners</span><span class="work-state">${statusLabel(decisionState.decisionObject.status)}</span></div>
      <div class="work-object-heading"><div><p class="work-kicker">Regional Portfolio Expansion</p><h2>${demo.opportunity.value} at risk</h2></div><p>Six disconnected signals have converged. The sponsor decision window closes in 48 hours.</p></div>
      <div class="work-object-facts"><div><span>Why now</span><strong>Commercial momentum, finance terms, and ownership have diverged.</strong></div><div><span>Recommended path</span><strong>${selected.label}</strong></div><div><span>Owner</span><strong>Commercial Operations Lead</strong></div><div><span>Authority</span><strong>Executive Sponsor + Finance review</strong></div></div>
      <div class="work-object-footer"><span>Protect the judgment. Move the work. Prove the outcome.</span><button class="work-primary" type="button" data-work-action="review">Review decision <span aria-hidden="true">→</span></button></div>
    </article>
    <div class="work-trace-line"><span>Signal</span><i></i><span>Evidence</span><i></i><span>Recommendation</span><i></i><span>Decision</span><i></i><span>Authority</span><i></i><span>Governed plan</span></div>
  </section>`;
}

function signalsView(demo, workspace) {
  const ranked = demo.signals.filter((signal) => signal.id !== 'sig-executive-meeting-unscheduled');
  return `<section class="work-signals" aria-label="Ranked signal intelligence">
    <div class="work-section-label"><span>02 / Signals</span><span>Six correlated sources</span></div>
    <h1>The warning was already<br><em>inside the business.</em></h1>
    <p class="work-intro">Select a signal to inspect its evidence and consequence.</p>
    <div class="work-signal-head"><span>Source / signal</span><span>Confidence</span><span>Urgency</span></div>
    <div class="work-signal-rows">${ranked.map((signal, index) => `<button class="work-signal-row ${workspace.selectedSignalId === signal.id ? 'selected' : ''}" type="button" data-work-signal="${signal.id}" aria-pressed="${workspace.selectedSignalId === signal.id}"><span class="work-signal-number">0${index + 1}</span><span class="work-signal-main"><small>${signal.sourceLabel}</small><strong>${signal.title}</strong><em>${signal.whyNow}</em></span><span class="work-signal-confidence">${signal.confidence}%</span><span class="work-signal-urgency">${signal.urgency}</span><span class="work-signal-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>
  </section>`;
}

function decisionsView(decisionState, workspace, lifecycle) {
  const object = decisionState.decisionObject;
  const path = decisionFixture.paths.find((item) => item.id === decisionState.selectedPathId);
  const ready = object.status === 'EXECUTION_READY';
  return `<section class="work-decisions" aria-label="Decision register">
    <div class="work-section-label"><span>03 / Decisions</span><span>${object.id} · v${object.version}</span></div>
    <h1>The decision is human.<br><em>The context is connected.</em></h1>
    <div class="work-decision-register"><span>Decision</span><strong>${object.title}</strong><span>Consequence</span><strong>${object.valueAtRisk} at risk</strong><span>Owner</span><strong>${object.owner}</strong><span>Authority</span><strong>Executive Sponsor</strong><span>Deadline</span><strong>48 hours</strong><span>State</span><strong>${statusLabel(object.status)}</strong></div>
    <div class="work-section-label work-path-label"><span>Strategic paths</span><span>Human selection controls the path</span></div>
    <div class="work-path-list" role="group" aria-label="Compare strategic paths">${decisionFixture.paths.map((item) => `<button type="button" class="work-path-row ${decisionState.selectedPathId === item.id ? 'selected' : ''}" data-work-path="${item.id}" aria-pressed="${decisionState.selectedPathId === item.id}" ${ready ? 'disabled' : ''}><span>${item.recommendation ? 'Recommended' : 'Alternative'}</span><strong>${item.label}</strong><small>${item.expectedValueProtected} · ${item.timeToAction}</small></button>`).join('')}</div>
    <div class="work-selected-path"><span>Selected path / ${path.riskLevel}</span><strong>${path.keyTradeoff}</strong><p>Approval: ${path.approvalBurden}. Verification required: ${path.verificationRequirement}</p></div>
    <div class="work-decision-controls">
      ${ready ? '<span class="work-safe-state">Path locked · Audit recorded · Simulation only</span>' : object.status === 'PENDING_APPROVAL' ? `<label>Simulated authority role<select data-work-role>${decisionFixture.authorityNodes.map((node) => `<option value="${node.id}" ${decisionState.activeRoleId === node.id ? 'selected' : ''}>${node.label}</option>`).join('')}</select></label><button class="work-primary" type="button" data-work-action="approve">Approve decision →</button><div class="work-secondary-actions"><input id="work-review-reason" aria-label="Return or rejection reason" placeholder="Reason required to return or reject"><button type="button" data-work-action="return">Return</button><button type="button" data-work-action="reject">Reject</button></div>` : `<span class="work-safe-state">Human approval required before any later execution</span><button class="work-primary" type="button" data-work-action="submit">Submit for approval →</button>`}
    </div>
    ${decisionState.lastError ? `<p class="work-error" role="alert">${decisionState.lastError}</p>` : ''}
    ${renderWorkspaceLifecycle(lifecycle, decisionState, workspace)}
  </section>`;
}

function memoryView(decisionState, lifecycle, workspace) {
  if (lifecycle.memory) return renderMemoryRecord(lifecycle, workspace);
  const events = decisionState.decisionObject.auditEvents;
  return `<section class="work-memory" aria-label="Organizational memory preview">
    <div class="work-section-label"><span>04 / Memory</span><span>Preview · simulated decision only</span></div>
    <h1>Keep the judgment.<br><em>Learn from the decision.</em></h1>
    <p class="work-intro">AI Storm preserves why the work mattered, who had authority, what happened, and what the organization learned.</p>
    <div class="work-memory-entries"><div><span>What happened</span><strong>${events.length ? 'A strategic path was selected and sent through simulated governance.' : 'A consequential signal was surfaced for human review.'}</strong></div><div><span>Why the decision was made</span><strong>Six sources converged before a 48-hour sponsor window closed.</strong></div><div><span>Evidence trusted</span><strong>Executive communication, finance condition, and calendar window.</strong></div><div><span>What worked</span><strong>${events.length ? 'Authority and selected-path changes were recorded.' : 'Pending simulated review.'}</strong></div><div><span>What should change next time</span><strong>Preview only. Requires verified outcome evidence in a later stage.</strong></div></div>
    <p class="work-memory-caveat">No external action or outcome verification has occurred in this demo.</p>
  </section>`;
}

function evidenceRail(demo, workspace) {
  const signal = demo.signals.find((item) => item.id === workspace.selectedSignalId) || demo.signals[0];
  const linked = signal.evidenceRefs.map((id) => demo.evidence.find((item) => item.id === id)).filter(Boolean);
  const selected = demo.evidence.find((item) => item.id === workspace.selectedEvidenceId && signal.evidenceRefs.includes(item.id)) || linked[0];
  return `<div class="work-rail-content"><p class="work-rail-label">Selected signal</p><h3>${signal.title}</h3><p>${signal.whyNow}</p><dl><div><dt>Source</dt><dd>${signal.sourceLabel}</dd></div><div><dt>Confidence</dt><dd>${signal.confidence}% · synthetic</dd></div><div><dt>Urgency</dt><dd>${signal.urgency}</dd></div></dl><p class="work-rail-label">Supporting evidence</p>${linked.map((item) => `<button class="work-evidence-link ${selected?.id === item.id ? 'selected' : ''}" type="button" data-work-evidence="${item.id}">${item.title}<span>↗</span></button>`).join('')}<div class="work-evidence-detail"><span>${selected?.sourceLabel || 'Evidence'}</span><strong>${selected?.title || 'No evidence selected'}</strong><p>${selected?.summary || ''}</p><small>Fictional provenance · No live source queried</small></div></div>`;
}

function authorityRail(workspace) {
  const node = decisionFixture.authorityNodes.find((item) => item.id === workspace.selectedAuthorityId) || decisionFixture.authorityNodes[1];
  const rule = decisionFixture.authorityRules.find((item) => item.id === node.ruleIds[0]);
  return `<div class="work-rail-content"><p class="work-rail-label">Ownership and authority</p><h3>${node.label}</h3><p>${node.responsibility}</p><div class="work-authority-people">${decisionFixture.authorityNodes.slice(0, 3).map((item) => `<button class="${workspace.selectedAuthorityId === item.id ? 'selected' : ''}" type="button" data-work-authority="${item.id}"><span>${item.kind}</span><strong>${item.label}</strong></button>`).join('')}</div><div class="work-evidence-detail"><span>Policy rule</span><strong>${rule?.label || 'Authority review'}</strong><p>${rule?.trigger || ''}</p><small>${rule?.delayedConsequence || ''}</small></div></div>`;
}

function auditRail(workspace, decisionState, lifecycle) {
  const events = [...decisionState.decisionObject.auditEvents, ...lifecycle.auditEvents];
  const selected = events.find((item) => item.id === workspace.selectedAuditEventId) || events.at(-1);
  return `<div class="work-rail-content"><p class="work-rail-label">Decision history</p><h3>${events.length} recorded events</h3><p>Every simulated transition retains its reason, actor, object, and provenance.</p><div class="work-audit-events">${events.length ? events.map((item) => `<button class="${selected?.id === item.id ? 'selected' : ''}" type="button" data-work-audit="${item.id}"><span>${item.timestamp.slice(11, 16)} UTC</span><strong>${item.event || item.kind}</strong></button>`).join('') : '<p>No decision event recorded yet.</p>'}</div>${selected ? `<div class="work-evidence-detail"><span>${selected.previousState} → ${selected.newState}</span><strong>${selected.event || selected.kind}</strong><p>${selected.rationale || selected.reason}</p><small>Actor: ${selected.actorRole} · Object: ${selected.relatedObject || decisionState.decisionObject.id} · ${selected.provenance || 'Synthetic decision history'}</small></div>` : ''}</div>`;
}

function traceRail() {
  return `<div class="work-rail-content"><p class="work-rail-label">Focused intelligence trace</p><h3>From signal to governed plan.</h3><ol class="work-trace-list"><li>Signal <small>Six partial business facts</small></li><li>Evidence <small>Seven synthetic source records</small></li><li>Recommendation <small>Coordinated executive response</small></li><li>Decision <small>Human path selection</small></li><li>Owner <small>Commercial Operations Lead</small></li><li>Authority <small>Executive Sponsor + Finance review</small></li><li>Approval <small>Simulated, role guarded</small></li><li>Governed plan <small>Execution-ready only</small></li></ol></div>`;
}

export function renderWorkspaceExperience(demo, workspace, decisionState, lifecycle = createExecutionState()) {
  const rail = workspace.railTab === 'Evidence' ? workspace.area === 'Decisions' && lifecycle.selectedActionId && lifecycle.phase !== 'IDLE' ? renderLifecycleRail(lifecycle, lifecycle.selectedActionId) : evidenceRail(demo, workspace) : workspace.railTab === 'Authority' ? authorityRail(workspace) : workspace.railTab === 'Audit' ? auditRail(workspace, decisionState, lifecycle) : traceRail();
  const view = workspace.area === 'Signals' ? signalsView(demo, workspace) : workspace.area === 'Decisions' ? decisionsView(decisionState, workspace, lifecycle) : workspace.area === 'Memory' ? memoryView(decisionState, lifecycle, workspace) : commandView(demo, decisionState);
  return `<div class="work-shell">
    <aside class="work-sidebar ${workspace.navOpen ? 'open' : ''}" aria-label="Intelligence workspace navigation"><div class="work-brand"><strong>ESSENTIAL EA</strong><span>AI STORM OS</span></div><div class="work-sidebar-label">Workspace</div><nav>${WORKSPACE_DESTINATIONS.map((area, index) => `<button type="button" data-work-area="${area}" class="${workspace.area === area ? 'active' : ''}" aria-current="${workspace.area === area ? 'page' : 'false'}"><span>0${index + 1}</span>${area}</button>`).join('')}</nav><div class="work-sidebar-foot"><span>Northstar Commercial Partners</span><small>Synthetic demonstration</small></div></aside>
    <div class="work-center"><header class="work-topbar"><button class="work-mobile-menu" type="button" data-work-action="menu" aria-label="Open workspace navigation">☰</button><div><span>Commercial intelligence</span><strong>${workspace.area}</strong></div><div class="work-top-actions"><button type="button" data-work-action="trace">Inspect trace ↗</button><button type="button" data-work-action="reset">Reset</button></div></header>${metricStrip(demo, decisionState, lifecycle)}<main class="work-main" id="work-main" tabindex="-1">${view}</main></div>
    <aside class="work-rail ${workspace.railOpen ? 'open' : ''}" aria-label="Contextual intelligence panel"><div class="work-rail-top"><span>Context / ${workspace.area}</span><button type="button" data-work-action="close-rail" aria-label="Close contextual intelligence">×</button></div><div class="work-rail-tabs" role="tablist" aria-label="Context views">${['Evidence', 'Authority', 'Audit', 'Trace'].map((tab) => `<button type="button" role="tab" data-work-rail="${tab}" aria-selected="${workspace.railTab === tab}" class="${workspace.railTab === tab ? 'active' : ''}">${tab}</button>`).join('')}</div>${rail}</aside>
    ${workspace.railOpen ? '<button class="work-rail-scrim" type="button" data-work-action="close-rail" aria-label="Close contextual panel"></button>' : ''}
  </div>`;
}
