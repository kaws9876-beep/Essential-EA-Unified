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
    'reasoning',
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
  assert.equal(fixture.reasoning.length, 5);
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
  assert.match(html, /1 decision requires executive attention/);
  assert.match(html, /Living opportunity object/);
});

test('demo UI exposes required application shell regions', () => {
  const html = readDemoFile('index.html');
  for (const marker of [
    'id="workspace-nav"',
    'class="operating-bar"',
    'id="command-center"',
    'id="opportunity-object"',
    'id="signal-list"',
    'id="reasoning-toggle"',
    'id="reasoning-steps"',
    'id="authority-map"',
    'id="opportunity-workspace"',
    'id="opportunity-tabs"',
    'id="signal-drawer"',
    'id="search-overlay"',
    'id="notification-panel"',
    'id="operator-panel"',
    'id="sr-status"'
  ]) {
    assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('all primary navigation workspaces are represented', () => {
  const app = readDemoFile('app.js');
  for (const label of [
    'Command Center',
    'Signal Intelligence',
    'Decisions',
    'Authority',
    'Execution',
    'Outcomes',
    'Memory'
  ]) {
    assert.match(app, new RegExp(label));
  }
  assert.match(app, /data-nav/);
  assert.match(app, /activeWorkspace/);
  assert.match(app, /previewWorkspace/);
});

test('signals and reasoning are represented from fixture data', () => {
  const fixture = JSON.parse(readDemoFile('fixtures/commercial-opportunity.json'));
  const app = readDemoFile('app.js');
  for (const signal of fixture.signals) {
    assert.match(app, new RegExp(signal.id));
  }
  for (const step of fixture.reasoning) {
    assert.match(app, new RegExp(step.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(app, /demo\.signals\.map/);
  assert.match(app, /demo\.reasoning\.map/);
});

test('interactive local state covers search, drawer, tabs, authority, reasoning, and reset', () => {
  const app = readDemoFile('app.js');
  for (const stateKey of [
    'activeWorkspace',
    'selectedSignalId',
    'selectedEvidenceId',
    'selectedTab',
    'selectedRoleId',
    'drawerOpen',
    'searchOpen',
    'searchQuery',
    'notificationOpen',
    'operatorOpen',
    'reasoningOpen',
    'navOpen'
  ]) {
    assert.match(app, new RegExp(stateKey));
  }
  for (const functionName of [
    'renderSearch',
    'allSearchItems',
    'openSignal',
    'renderDrawer',
    'renderTabs',
    'selectRole',
    'resetDemo',
    'closeOverlays'
  ]) {
    assert.match(app, new RegExp(`function ${functionName}`));
  }
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /state = \{ \.\.\.initialState \}/);
});

test('visible controls have deterministic handlers', () => {
  const app = readDemoFile('app.js');
  for (const controlId of [
    'opportunity-object',
    'review-decision-path',
    'back-to-command',
    'preview-return',
    'drawer-close',
    'search-trigger',
    'search-close',
    'search-input',
    'notification-trigger',
    'operator-menu',
    'reset-demo',
    'reasoning-toggle',
    'mobile-menu'
  ]) {
    assert.match(app, new RegExp(`\\$\\('${controlId}'\\)\\.addEventListener`));
  }
  for (const delegatedSelector of ['data-nav', 'data-signal', 'data-evidence', 'data-tab', 'data-role', 'data-result']) {
    assert.match(app, new RegExp(delegatedSelector));
  }
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
    /DATABASE_URL/i,
    /https?:\/\//i,
    /Schrader/i,
    /The Schrader Group/i,
    /\bTSG\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(combined, pattern);
  }
});

test('production index.html is unchanged from verified C1 base', () => {
  const result = spawnSync('git', ['diff', '--name-only', '87d8b0ac682644f2e39f93d7b329ceebc5ce573b', '--', 'index.html'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '');
});
