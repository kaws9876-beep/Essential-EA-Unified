import fs from 'fs';

const requiredFiles = [
  'index.html',
  'manifest.json',
  'vercel.json',
  'server.js',
  'demo-commercial/index.html',
  'demo-commercial/app.js',
  'demo-commercial/styles.css',
  'demo-commercial/fixtures/commercial-opportunity.json',
  'demo-commercial/adapters/demoExecutionAdapter.js',
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
for (const section of ['organization', 'opportunity', 'signals', 'evidence', 'recommendation', 'decision', 'roles', 'authorityRules', 'approvalRequirements', 'plannedActions', 'verificationRequirements', 'expectedOutcomes', 'memoryPreview', 'lifecycleStages', 'demoMetadata']) {
  if (!fixture[section]) throw new Error(`commercial fixture missing required section: ${section}`);
}
if (!fixture.organization.fictional || !fixture.demoMetadata.fictional) {
  throw new Error('commercial fixture must be marked fictional.');
}
if (!fixture.roles.every((role) => role.fictional === true)) {
  throw new Error('all commercial demo people must be marked fictional.');
}

const demoHtml = fs.readFileSync('demo-commercial/index.html', 'utf8');
for (const required of ['Demo Mode — Synthetic Data', 'No live systems connected', 'All actions are simulated', 'Decision &amp; Execution Intelligence']) {
  if (!demoHtml.includes(required)) throw new Error(`demo index missing expected marker: ${required}`);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
if (!Array.isArray(vercel.routes) || vercel.routes.length === 0) {
  throw new Error('vercel.json must preserve static routes.');
}

console.log('Static validation passed.');
