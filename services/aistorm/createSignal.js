// aiStorm createSignal client — Phase 1 integration (server-to-server via webhook secret)
import { randomUUID } from 'crypto';

const REQUIRED_FIELDS = ['platform', 'query', 'summary', 'intent', 'contact', 'status', 'timestamp'];
const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;

function getConfig() {
  const secret = process.env.STORM_EQUITY_WEBHOOK_SECRET;
  if (!secret) throw new Error('aistorm: STORM_EQUITY_WEBHOOK_SECRET is not set');
  const baseUrl = process.env.AISTORM_BASE_URL || 'https://aistorm-intelligence-development.base44.app';
  console.log('aistorm: config loaded — secret loaded: true');
  return { secret, baseUrl };
}

function validatePayload(payload) {
  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]) {
      throw new Error(`aistorm: missing required field "${field}"`);
    }
  }
}

async function postWithTimeout(url, body, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Send an operational signal to aiStorm.
 * @param {object} payload — must include all REQUIRED_FIELDS
 * @returns {{ ok: true, signalId: string } | { ok: false, status: number|null, error: string }}
 */
export async function createSignal(payload) {
  validatePayload(payload);

  const { secret, baseUrl } = getConfig();
  const url = `${baseUrl}/functions/createSignal`;
  const idempotencyKey = randomUUID();

  const headers = {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret,
    'x-idempotency-key': idempotencyKey,
  };

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postWithTimeout(url, payload, headers);

      if (res.ok) {
        const data = await res.json();
        console.log(`aistorm: createSignal success — signal_id: ${data.signal_id}`);
        return { ok: true, signalId: data.signal_id };
      }

      // 4xx — config/auth error; do not retry
      if (res.status >= 400 && res.status < 500) {
        const text = await res.text().catch(() => '');
        console.error(`aistorm: createSignal failed — status: ${res.status}, error: ${text}`);
        return { ok: false, status: res.status, error: text };
      }

      // 5xx — transient; fall through to retry
      const text = await res.text().catch(() => '');
      console.error(`aistorm: createSignal attempt ${attempt} failed — status: ${res.status}, error: ${text}`);
      lastError = { status: res.status, error: text };

    } catch (err) {
      const msg = err.name === 'AbortError' ? 'request timed out' : err.message;
      console.error(`aistorm: createSignal attempt ${attempt} network error — ${msg}`);
      lastError = { status: null, error: msg };
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(2 ** attempt * 500); // 1s, 2s
    }
  }

  return { ok: false, status: lastError.status, error: lastError.error };
}
