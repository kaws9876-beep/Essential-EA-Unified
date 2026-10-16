import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'demo-native');
const files = ['index.html', 'styles.css', 'scenario.js', 'app.js', 'README.md'];
const read = (file) => fs.readFileSync(path.join(dir, file), 'utf8');

test('native proof is complete, isolated, and explicitly synthetic', () => {
  files.forEach((file) => assert.ok(fs.existsSync(path.join(dir, file)), `${file} missing`));
  const combined = files.map(read).join('\n');
  for (const marker of ['DEMO MODE — SYNTHETIC DATA', 'no external systems connected', 'Closed isn’t', 'Recover now', 'Prevent recurrence', 'independent', 'recurrence', 'Decision &amp; Execution Intelligence']) {
    assert.match(combined, new RegExp(marker, 'i'), `${marker} missing`);
  }
});

test('native proof begins in the host and uses two primary human decisions', () => {
  const app = read('app.js');
  assert.match(app, /phase: 'host'/);
  assert.match(app, /Inspect with Storm/);
  assert.match(app, /Approve recovery \+ prevention plan/);
  assert.match(app, /state\.phase = 'executing'/);
  assert.match(app, /state\.phase = 'outcome'/);
  assert.match(app, /Replay the 60-second proof/);
});

test('native proof preserves the closed-loop product argument', () => {
  const scenario = read('scenario.js');
  const app = read('app.js');
  for (const marker of ['5 / 5 complete', 'This is still not fixed', 'activity-based closure rule', 'No single owner', 'outcome proof', 'Operating VP approval', 'Next-cycle false closure blocked', 'Future false closure is denied']) {
    assert.match(`${scenario}\n${app}`, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('native proof is industry agnostic and contains no live integration mechanism', () => {
  const combined = files.map(read).join('\n');
  const forbidden = [
    /fetch\s*\(/i, /XMLHttpRequest/i, /WebSocket/i, /sendBeacon/i,
    /https?:\/\//i, /railway\.app/i, /OPENAI_API_KEY/i, /ANTHROPIC_API_KEY/i,
    /DATABASE_URL/i, /real estate/i, /property listing/i, /brokerage/i,
    /Salesforce Lightning/i, /HubSpot iframe/i, /Dynamics tenant/i, /Brivity record/i
  ];
  forbidden.forEach((pattern) => assert.doesNotMatch(combined, pattern));
});

test('native proof supplies keyboard focus, escape behavior, mobile layout, and reduced motion', () => {
  const html = read('index.html');
  const app = read('app.js');
  const css = read('styles.css');
  assert.match(html, /aria-live="polite"/);
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /\.focus\(/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /button:focus-visible/);
});
