import fs from 'fs';

const requiredFiles = ['index.html', 'manifest.json', 'vercel.json', 'server.js'];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const html = fs.readFileSync('index.html', 'utf8');
for (const required of ['screen-dashboard', 'screen-triage', 'screen-automation', 'const RAILWAY']) {
  if (!html.includes(required)) throw new Error(`index.html missing expected marker: ${required}`);
}

JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
if (!Array.isArray(vercel.routes) || vercel.routes.length === 0) {
  throw new Error('vercel.json must preserve static routes.');
}

console.log('Static validation passed.');
