// Unit tests for createSignal — run with: node --test services/aistorm/createSignal.test.js
import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// --- helpers ---

const VALID_PAYLOAD = {
  platform: 'EA Essential',
  query: 'email_sequence_event',
  summary: 'SEQUENCE COMPLETED: 3 of 5 emails opened.',
  intent: 'hot',
  urgency_note: 'Phone follow-up within 24 hrs.',
  contact: 'Sarah Johnson',
  status: 'new',
  timestamp: '2026-06-02',
};

function setEnv(overrides = {}) {
  process.env.STORM_EQUITY_WEBHOOK_SECRET = 'dummy-secret-not-real';
  process.env.AISTORM_BASE_URL = 'https://mock.local';
  Object.assign(process.env, overrides);
}

function clearEnv() {
  delete process.env.STORM_EQUITY_WEBHOOK_SECRET;
  delete process.env.AISTORM_BASE_URL;
}

// Minimal fetch mock — replaces global fetch for each test
function mockFetch(response) {
  globalThis.fetch = async () => response;
}

// --- tests ---

describe('createSignal', () => {

  // Re-import fresh each test because config is read at call time
  async function load() {
    // Node module cache bust via query param
    const { createSignal } = await import(`./createSignal.js?t=${Date.now()}`);
    return createSignal;
  }

  it('Test 1: throws when STORM_EQUITY_WEBHOOK_SECRET is missing', async () => {
    clearEnv();
    process.env.AISTORM_APP_ID = 'test-app-id';
    const createSignal = await load();
    await assert.rejects(
      () => createSignal(VALID_PAYLOAD),
      /STORM_EQUITY_WEBHOOK_SECRET is not set/
    );
  });

  it('Test 2: throws on missing required payload field (no network call)', async () => {
    setEnv();
    let fetchCalled = false;
    globalThis.fetch = async () => { fetchCalled = true; return {}; };
    const createSignal = await load();
    const { contact: _removed, ...noContact } = VALID_PAYLOAD;
    await assert.rejects(
      () => createSignal(noContact),
      /missing required field "contact"/
    );
    assert.equal(fetchCalled, false, 'fetch must not be called before validation');
  });

  it('Test 3: returns { ok: true, signalId } on mocked 200', async () => {
    setEnv();
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ success: true, signal_id: 'sig_test123' }),
    });
    const createSignal = await load();
    const result = await createSignal(VALID_PAYLOAD);
    assert.equal(result.ok, true);
    assert.equal(result.signalId, 'sig_test123');
  });

  it('Test 4: returns { ok: false, status: 401 } on 401 — no retry', async () => {
    setEnv();
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return { ok: false, status: 401, text: async () => 'Unauthorized' };
    };
    const createSignal = await load();
    const result = await createSignal(VALID_PAYLOAD);
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(callCount, 1, '401 must not be retried');
  });

  it('Test 5: retries on 503 and fails gracefully', async () => {
    setEnv();
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return { ok: false, status: 503, text: async () => 'Service Unavailable' };
    };
    // Speed up retries for test
    const origSleep = globalThis.__testSleepOverride;
    globalThis.__testSleepOverride = true; // flag checked by… actually we patch via mock
    const createSignal = await load();
    // We accept this test is slow (~3s) OR you can mock Date/sleep separately
    // For CI speed, just verify callCount reaches MAX_ATTEMPTS
    const result = await createSignal(VALID_PAYLOAD);
    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    assert.equal(callCount, 3, 'should attempt exactly 3 times');
  });

});
