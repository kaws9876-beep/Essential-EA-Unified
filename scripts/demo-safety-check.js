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

const changedPublicFiles = ['docs/COMMERCIAL_DEMO_SAFETY_CONTRACT.md', 'lib/health.js', 'tests/health.test.js'];
const secretPattern = /(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN PRIVATE KEY-----)/;
for (const file of changedPublicFiles) {
  if (fs.existsSync(file) && secretPattern.test(fs.readFileSync(file, 'utf8'))) {
    throw new Error(`Potential secret pattern found in ${file}`);
  }
}

console.log('Demo safety contract validation passed.');
