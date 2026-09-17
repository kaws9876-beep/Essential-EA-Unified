import fs from 'fs';

const requiredFiles = [
  'index.html',
  'manifest.json',
  'vercel.json',
  'server.js',
  'demo-commercial/index.html',
  'demo-commercial/app.js',
  'demo-commercial/styles.css',
  'demo-commercial/workspace.css',
  'demo-commercial/workspaceExperience.js',
  'demo-commercial/executionLifecycle.js',
  'demo-commercial/lifecycleExperience.js',
  'demo-commercial/assets/signal-convergence.png',
  'demo-commercial/fixtures/commercial-opportunity.json',
  'demo-commercial/adapters/demoExecutionAdapter.js',
  'demo-commercial/decisionWorkflow.js',
  'demo-commercial/guidedExperience.js',
  'demo-commercial/README.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const html = fs.readFileSync('index.html', 'utf8');
for (const required of ['screen-dashboard', 'screen-triage', 'screen-automation', 'const RAILWAY']) {
  if (!html.includes(required)) throw new Error(`index.html missing expected marker: ${required}`);
}

JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const fixture = JSON.parse(fs.readFileSync('demo-commercial/fixtures/commercial-opportunity.json', 'utf8'));
for (const section of ['organization', 'opportunity', 'signals', 'evidence', 'recommendation', 'reasoning', 'decision', 'roles', 'authorityRules', 'approvalRequirements', 'plannedActions', 'verificationRequirements', 'expectedOutcomes', 'memoryPreview', 'lifecycleStages', 'demoMetadata']) {
  if (!fixture[section]) throw new Error(`commercial fixture missing required section: ${section}`);
}
if (!fixture.organization.fictional || !fixture.demoMetadata.fictional) {
  throw new Error('commercial fixture must be marked fictional.');
}
if (!fixture.roles.every((role) => role.fictional === true)) {
  throw new Error('all commercial demo people must be marked fictional.');
}
if (fixture.signals.length !== 7 || fixture.evidence.length !== 7 || fixture.reasoning.length !== 5) {
  throw new Error('commercial fixture must preserve seven signals, seven evidence sources, and five reasoning steps.');
}

const demoHtml = fs.readFileSync('demo-commercial/index.html', 'utf8');
for (const required of [
  'Demo Mode — Synthetic Data',
  'No live systems connected',
  'All actions are simulated',
  'Decision &amp; Execution Intelligence',
  'id="workspace-nav"',
  'id="command-center"',
  'id="signal-list"',
  'id="signal-drawer"',
  'id="search-overlay"',
  'id="opportunity-tabs"',
  'id="authority-map"',
  'id="reasoning-toggle"'
]) {
  if (!demoHtml.includes(required)) throw new Error(`demo index missing expected marker: ${required}`);
}

const demoApp = fs.readFileSync('demo-commercial/app.js', 'utf8');
for (const required of [
  'Command Center',
  'Signal Intelligence',
  'Decisions',
  'Authority',
  'Execution',
  'Outcomes',
  'Memory',
  'allSearchItems',
  'openSignal',
  'renderDrawer',
  'renderTabs',
  'resetDemo',
  "event.key === 'Escape'",
  'doorsOpen',
  'graphNodes',
  'renderGraph',
  'renderFeedControls',
  'renderActionPath',
  'renderOutcomes',
  'Organizational Judgment Infrastructure',
  'renderDecisionRoom',
  'Strategic path comparison',
  'Structured Decision Object',
  'Simulated approval workflow',
  'Execution-ready governed action plan',
  'Decision audit trail'
]) {
  if (!demoApp.includes(required)) throw new Error(`demo app missing expected behavior marker: ${required}`);
}

const decisionWorkflow = fs.readFileSync('demo-commercial/decisionWorkflow.js', 'utf8');
for (const required of [
  'DECISION_STATES',
  'DRAFT',
  'READY_FOR_REVIEW',
  'PENDING_APPROVAL',
  'APPROVED',
  'EXECUTION_READY',
  'RETURNED',
  'REJECTED',
  'decisionObject',
  'approveDecision',
  'returnDecision',
  'rejectDecision',
  'Simulation only - not executed externally'
]) {
  if (!decisionWorkflow.includes(required)) throw new Error(`decision workflow missing expected marker: ${required}`);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
if (!Array.isArray(vercel.routes) || vercel.routes.length === 0) {
  throw new Error('vercel.json must preserve static routes.');
}

console.log('Static validation passed.');
