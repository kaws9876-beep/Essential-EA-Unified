import { decisionFixture } from './decisionWorkflow.js';
import { previewActionPlan, SIMULATION_NOTICE } from './executionLifecycle.js';

const label = (value) => value.replaceAll('_', ' ');

function actionRows(actions, interactive = false) {
  return `<div class="life-actions" aria-label="Governed actions">${actions.map((action, index) => {
    const contents = `<span>0${index + 1} / ${label(action.status)}</span><strong>${action.title}</strong><small>${action.ownerRole} · ${action.authorityRuleId.replaceAll('rule-', '').replaceAll('-', ' ')}</small><small>After: ${action.dependencyIds.length ? action.dependencyIds.map((id) => actions.find((item) => item.id === id)?.title || id).join(', ') : 'Approved decision'} · Evidence: ${action.expectedEvidence}</small>`;
    return interactive ? `<button type="button" data-life-action="${action.id}" class="life-action">${contents}<i aria-hidden="true">↗</i></button>` : `<div class="life-action">${contents}</div>`;
  }).join('')}</div>`;
}

function primary(text, action) {
  return `<button class="guided-primary" type="button" data-guided-lifecycle="${action}">${text}<span aria-hidden="true">→</span></button>`;
}

export function renderGuidedLifecycle(lifecycle, decisionState, planOpen) {
  const plan = lifecycle.phase === 'IDLE' ? previewActionPlan(decisionState) : lifecycle.actions;
  const done = lifecycle.actions.filter((item) => item.completedAt).length;
  if (lifecycle.phase === 'IDLE') return `<div class="guided-governed life-guided">
    <p class="guided-kicker">Approved · governed plan</p><h1>Judgment protected.<br><em>Action ready.</em></h1>
    <p class="guided-lead">Owner assigned. Authority verified. Approval recorded. The human-selected path is locked.</p>
    <div class="guided-approval-state"><span>Selected path</span><strong>${decisionFixture.paths.find((item) => item.id === decisionState.selectedPathId)?.label}</strong><span>${plan.length} governed actions planned</span></div>
    ${planOpen ? actionRows(plan) : ''}
    ${primary('Begin simulated execution', 'begin')}
    <button class="guided-text-link" type="button" data-guided-lifecycle="plan">${planOpen ? 'Hide governed plan' : 'Inspect governed plan'}</button>
    <p class="guided-simulation">${SIMULATION_NOTICE}</p></div>`;

  if (lifecycle.phase === 'BLOCKED') {
    const blocked = lifecycle.actions.find((item) => ['BLOCKED', 'FAILED', 'VERIFICATION_FAILED'].includes(item.status));
    return `<div class="guided-governed life-guided"><p class="guided-kicker">Exception · simulated safeguard</p><h1>Work stopped.<br><em>Verification refused.</em></h1>
      <p class="guided-lead">${blocked?.title || 'Evidence review'} cannot be represented as complete. ${blocked?.ownerRole || 'The accountable owner'} must correct the missing dependency or evidence.</p>
      <p class="guided-error" role="alert">${blocked?.failureReason || lifecycle.lastError}</p>${primary('Restart scenario', 'reset')}
      ${actionRows(lifecycle.actions)}<p class="guided-simulation">${SIMULATION_NOTICE}</p></div>`;
  }

  if (lifecycle.phase === 'EXECUTING') return `<div class="guided-governed life-guided"><p class="guided-kicker">Governed execution · ${done} of ${plan.length} actions modeled</p>
    <h1>Judgment moves.<br><em>Ownership stays clear.</em></h1>
    <p class="guided-lead">Each action follows the approved path. Evidence returns before independent verification.</p>
    ${primary('Run next simulated action', 'run')}${actionRows(plan)}
    ${done === 0 ? '<button class="guided-text-link" type="button" data-guided-lifecycle="block">Demonstrate a blocked dependency</button>' : ''}
    <p class="guided-simulation">${SIMULATION_NOTICE}</p></div>`;

  if (lifecycle.phase === 'AWAITING_VERIFICATION') return `<div class="guided-governed life-guided"><p class="guided-kicker">Evidence returned · verification pending</p>
    <h1>The work is modeled.<br><em>Now prove it.</em></h1>
    <p class="guided-lead">${lifecycle.artifacts.length} synthetic artifacts are present. An independent assurance role checks each against explicit criteria.</p>
    ${primary('Verify returned evidence', 'verify')}${actionRows(plan)}
    <p class="guided-simulation">${SIMULATION_NOTICE}</p></div>`;

  return `<div class="guided-governed life-guided"><p class="guided-kicker">Verified modeled outcome · organizational memory</p>
    <h1>Action completed.<br><em>Outcome verified.</em></h1>
    <p class="guided-lead">Judgment protected. Work completed. Outcome verified. Lesson retained.</p>
    <div class="life-outcome"><div><span>What changed</span><strong>Risk modeled from Critical to Controlled</strong></div><div><span>What was protected</span><strong>${lifecycle.outcome.modeledValueProtected}</strong></div><div><span>Verification coverage</span><strong>${lifecycle.outcome.actionsVerified}/${lifecycle.outcome.actionsPlanned} actions</strong></div><div><span>Time to resolution</span><strong>${lifecycle.outcome.cycleTime}</strong></div><div><span>Remaining risk</span><strong>Controlled · modeled only</strong></div><div><span>Next owner</span><strong>${lifecycle.memory.decisionOwner}</strong></div></div>
    <p class="life-promise">Protect the judgment. Move the work. Prove the outcome.</p>
    ${primary('Explore the record', 'explore')}<p class="guided-simulation">Modeled value protected is not booked revenue. ${SIMULATION_NOTICE}</p></div>`;
}

export function renderWorkspaceLifecycle(lifecycle, decisionState, workspace) {
  if (decisionState.decisionObject.status !== 'EXECUTION_READY') return '';
  const plan = lifecycle.phase === 'IDLE' ? previewActionPlan(decisionState) : lifecycle.actions;
  const next = lifecycle.actions.find((item) => item.status === 'PLANNED');
  const action = lifecycle.phase === 'IDLE' ? 'begin' : lifecycle.phase === 'EXECUTING' ? 'run' : lifecycle.phase === 'AWAITING_VERIFICATION' ? 'verify' : null;
  const button = action ? `<button class="work-primary" type="button" data-work-lifecycle="${action}">${action === 'begin' ? 'Begin simulated execution' : action === 'run' ? 'Run next simulated action' : 'Verify returned evidence'} →</button>` : '';
  return `<section class="life-workspace" aria-label="Governed lifecycle"><div class="work-section-label"><span>Governed lifecycle / ${label(lifecycle.phase)}</span><span>${lifecycle.actions.filter((item) => item.status === 'VERIFIED').length}/${plan.length} verified</span></div>
    ${lifecycle.outcome ? `<h2>Action completed. Outcome verified.</h2><p>${lifecycle.outcome.actionsVerified}/${lifecycle.outcome.actionsPlanned} actions independently verified. ${lifecycle.outcome.modeledValueProtected}; not booked revenue.</p>` : `<h2>${lifecycle.phase === 'IDLE' ? 'Approved judgment, ready to move.' : lifecycle.phase === 'BLOCKED' ? 'Work stopped at the safeguard.' : lifecycle.phase === 'AWAITING_VERIFICATION' ? 'Execution and verification remain distinct.' : 'Work moves through accountable owners.'}</h2>`}
    ${actionRows(plan, lifecycle.phase !== 'IDLE')}
    <div class="life-work-controls">${button}${lifecycle.phase === 'EXECUTING' && !lifecycle.actions.some((item) => item.completedAt) ? '<button type="button" data-work-lifecycle="block">Demonstrate blocked dependency</button>' : ''}</div>
    ${lifecycle.phase === 'BLOCKED' ? '<p role="alert">Accountable owner must correct the dependency or missing evidence. Reset to replay the successful path.</p>' : ''}
    ${lifecycle.lastError ? `<p role="alert">${lifecycle.lastError}</p>` : ''}<p class="work-memory-caveat">${SIMULATION_NOTICE}</p></section>`;
}

export function renderLifecycleRail(lifecycle, actionId) {
  const action = lifecycle.actions.find((item) => item.id === actionId) || lifecycle.actions[0];
  if (!action) return '';
  const artifact = lifecycle.artifacts.find((item) => item.actionId === action.id);
  const verification = lifecycle.verifications.find((item) => item.actionId === action.id);
  return `<div class="work-rail-content"><p class="work-rail-label">Action / ${label(action.status)}</p><h3>${action.title}</h3><p>${action.description}</p>
    <dl><div><dt>Owner</dt><dd>${action.ownerRole}</dd></div><div><dt>Authority</dt><dd>${action.authorityRuleId}</dd></div><div><dt>Dependency</dt><dd>${action.dependencyIds.length ? action.dependencyIds.join(', ') : 'Approved decision'}</dd></div><div><dt>Verification</dt><dd>${verification ? label(verification.status) : 'Not started'}</dd></div></dl>
    <div class="work-evidence-detail"><span>Synthetic evidence</span><strong>${artifact?.type || action.expectedEvidence}</strong><p>${artifact ? `${artifact.content} Created ${artifact.createdAt}. Source: ${artifact.source}.` : 'Expected; no evidence returned yet.'}</p><small>Criterion: ${action.verificationCriteria}</small></div>
    <p class="work-memory-caveat">${SIMULATION_NOTICE}</p></div>`;
}

export function renderMemoryRecord(lifecycle, workspace) {
  const record = lifecycle.memory;
  if (!record) return '';
  return `<section class="work-memory" aria-label="Organizational memory record"><div class="work-section-label"><span>04 / Memory · v${record.version}</span><span>Retained ${record.timestamp.slice(0, 10)}</span></div>
    <h1>Keep the judgment.<br><em>Learn from the decision.</em></h1><p class="work-intro">A verified synthetic outcome retains the reason, authority, evidence, and lesson, not merely an activity log.</p>
    <div class="work-memory-entries"><div><span>Original signal</span><strong>${record.originalSignal}</strong></div><div><span>Decision rationale</span><strong>${record.whyItMattered}</strong></div><div><span>Evidence trusted</span><strong>${record.evidenceUsed.length} source records · ${record.verificationEvidence.length} verification artifacts</strong></div><div><span>Human judgment</span><strong>${record.humanSelectedPath} · ${record.decisionOwner}</strong></div><div><span>Authority applied</span><strong>${record.authorityHolder}; ${record.approval}</strong></div><div><span>Verified outcome</span><strong>${lifecycle.outcome.actionsVerified}/${lifecycle.outcome.actionsPlanned} actions · ${lifecycle.outcome.observedRisk} · modeled value only</strong></div><div><span>Lesson retained</span><strong>${record.whatWorked}</strong></div><div><span>Next time</span><strong>${record.whatShouldChangeNextTime}</strong></div></div>
    <button class="work-primary life-reuse" type="button" data-work-lifecycle="reuse">Use this judgment next time →</button>
    ${workspace.memoryReuseOpen ? `<div class="life-reuse-detail" role="status"><strong>Future similar signal · preview only</strong><p>Recall ${record.reuseTags.join(', ')}. Re-evaluate current evidence, authority, and timing before recommending a new path. No prior approval carries forward.</p></div>` : ''}
    <p class="work-memory-caveat">${SIMULATION_NOTICE}</p></section>`;
}
