import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  runDemoOperation,
  simulateCreateOperationsTask,
  simulateDraftExecutiveResponse,
  simulateScheduleDecisionCall,
  simulateUpdateOpportunityStage
} from '../demo-commercial/adapters/demoExecutionAdapter.js';

const root = process.cwd();
const demoDir = path.join(root, 'demo-commercial');
const requiredFiles = [
  'index.html',
  'app.js',
  'styles.css',
  'fixtures/commercial-opportunity.json',
  'adapters/demoExecutionAdapter.js',
  'README.md'
];

function readDemoFile(file) {
  return fs.readFileSync(path.join(demoDir, file), 'utf8');
}

test('required demo files exist', () => {
  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(path.join(demoDir, file)), true, `${file} should exist`);
  }
});

test('fixture JSON parses with stable required sections and fictional labels', () => {
  const fixture = JSON.parse(readDemoFile('fixtures/commercial-opportunity.json'));
  for (const section of [
    'organization',
    'opportunity',
    'signals',
    'evidence',
    'recommendation',
    'decision',
    'roles',
    'authorityRules',
    'approvalRequirements',
    'plannedActions',
    'verificationRequirements',
    'expectedOutcomes',
    'memoryPreview',
    'lifecycleStages',
    'demoMetadata'
  ]) {
    assert.ok(fixture[section], `fixture missing ${section}`);
  }

  assert.equal(fixture.organization.fictional, true);
  assert.equal(fixture.demoMetadata.fictional, true);
  assert.ok(fixture.roles.every((role) => role.fictional === true));
  assert.equal(fixture.signals.length, 7);
  assert.equal(fixture.evidence.length, 7);
  assert.equal(fixture.approvalRequirements.length, 2);
  assert.equal(fixture.plannedActions.length, 4);
  assert.equal(fixture.lifecycleStages.length, 10);
});

test('demo UI includes required safety and positioning text', () => {
  const html = readDemoFile('index.html');
  assert.match(html, /Demo Mode — Synthetic Data/);
  assert.match(html, /No live systems connected/);
  assert.match(html, /All actions are simulated/);
  assert.match(html, /Essential EA \+ AI Storm OS/);
  assert.match(html, /Decision &amp; Execution Intelligence/);
  assert.match(html, /What deserves attention now\?/);
});

test('adapter methods are simulated and deny external persistence', () => {
  for (const operation of [
    simulateDraftExecutiveResponse,
    simulateScheduleDecisionCall,
    simulateUpdateOpportunityStage,
    simulateCreateOperationsTask
  ]) {
    const result = operation({ opportunityId: 'opp-regional-portfolio-expansion' });
    assert.equal(result.status, 'simulated');
    assert.equal(result.persistedExternally, false);
    assert.match(result.message, /Simulated|simulated/);
  }
});

test('unknown demo operations fail closed', () => {
  assert.throws(
    () => runDemoOperation('sendLiveMessage'),
    /Demo execution denied/
  );
});

test('demo code contains no external network calls, production URLs, or integration imports', () => {
  const combined = requiredFiles.map(readDemoFile).join('\n');
  const forbiddenPatterns = [
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
    /DATABASE_URL/i
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(combined, pattern);
  }
});

test('production index.html is unchanged from C0', () => {
  const result = spawnSync('git', ['diff', '--name-only', '9f959034facdf1228d731108bfc84185ec512a4a', '--', 'index.html'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '');
});
