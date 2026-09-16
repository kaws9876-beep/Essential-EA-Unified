import fs from 'fs';

const contractPath = 'docs/COMMERCIAL_DEMO_SAFETY_CONTRACT.md';
if (!fs.existsSync(contractPath)) {
  throw new Error(`Missing ${contractPath}`);
}

const contract = fs.readFileSync(contractPath, 'utf8');
const requiredPhrases = [
  'synthetic data only',
  'no production customer data',
  'no production database mutations',
  'no live email, calendar, accounting, CRM, SMS, payment, or webhook writes',
  'Demo Mode - Synthetic Data',
  'fail closed',
  "user_id = 'default'",
  'no claim that simulated execution was performed in an external system'
];

for (const phrase of requiredPhrases) {
  if (!contract.includes(phrase)) throw new Error(`Safety contract missing phrase: ${phrase}`);
}

const demoFiles = [
  'demo-commercial/index.html',
  'demo-commercial/app.js',
  'demo-commercial/styles.css',
  'demo-commercial/fixtures/commercial-opportunity.json',
  'demo-commercial/adapters/demoExecutionAdapter.js',
  'demo-commercial/README.md',
  'tests/commercial-demo.test.js'
];

for (const file of demoFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing commercial demo file: ${file}`);
}

const demoCombined = demoFiles
  .filter((file) => !file.startsWith('tests/'))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');

const forbiddenDemoPatterns = [
  /essential-ea-app-production/i,
  /railway\.app/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /sendBeacon/i,
  /form\s+action=["']https?:/i,
  /services\/aistorm/i,
  /STORM_EQUITY_WEBHOOK_SECRET/i,
  /OPENAI_API_KEY/i,
  /ANTHROPIC_API_KEY/i,
  /DATABASE_URL/i,
  /https?:\/\//i
];

for (const pattern of forbiddenDemoPatterns) {
  if (pattern.test(demoCombined)) throw new Error(`Commercial demo contains forbidden pattern: ${pattern}`);
}

const fixture = JSON.parse(fs.readFileSync('demo-commercial/fixtures/commercial-opportunity.json', 'utf8'));
if (!fixture.organization.fictional || !fixture.demoMetadata.fictional || !fixture.roles.every((role) => role.fictional === true)) {
  throw new Error('Commercial demo fixture must label organization and people as fictional.');
}

const changedPublicFiles = ['docs/COMMERCIAL_DEMO_SAFETY_CONTRACT.md', 'lib/health.js', 'tests/health.test.js', ...demoFiles];
const secretPattern = /(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN PRIVATE KEY-----)/;
for (const file of changedPublicFiles) {
  if (fs.existsSync(file) && secretPattern.test(fs.readFileSync(file, 'utf8'))) {
    throw new Error(`Potential secret pattern found in ${file}`);
  }
}

console.log('Demo safety contract validation passed.');
