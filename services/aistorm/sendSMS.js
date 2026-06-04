import { randomUUID } from 'crypto';

const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

function getConfig() {
  const secret = process.env.STORM_EQUITY_WEBHOOK_SECRET;
  if (!secret) throw new Error('aistorm: STORM_EQUITY_WEBHOOK_SECRET is not set');
  const baseUrl = process.env.AISTORM_BASE_URL || 'https://aistorm-intelligence-development.base44.app';
  return { secret, baseUrl };
}

async function postWithTimeout(url, body, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/**
 * Send an SMS via aiStorm / Twilio. Goes live once Twilio creds are loaded on aiStorm's side.
 * Server normalizes `to` to E.164 (+1...) format.
 * @param {string} to      - phone number, any format
 * @param {string} message - SMS body
 * @returns {{ ok: true, sid, status } | { ok: false, status, error }}
 */
export async function sendSMS(to, message) {
  if (!to) throw new Error('aistorm: to is required');
  if (!message) throw new Error('aistorm: message is required');

  const { secret, baseUrl } = getConfig();
  const url = `${baseUrl}/functions/sendSMS`;
  const headers = {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret,
    'x-idempotency-key': randomUUID(),
  };

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postWithTimeout(url, { to, message }, headers);
      if (res.ok) {
        const data = await res.json();
        console.log(`aistorm: sendSMS success — sid: ${data.sid}, status: ${data.status}`);
        return { ok: true, sid: data.sid, status: data.status };
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await res.text().catch(() => '');
        console.error(`aistorm: sendSMS failed — status: ${res.status}, error: ${text}`);
        return { ok: false, status: res.status, error: text };
      }
      const text = await res.text().catch(() => '');
      console.error(`aistorm: sendSMS attempt ${attempt} — status: ${res.status}, error: ${text}`);
      lastError = { status: res.status, error: text };
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'request timed out' : err.message;
      console.error(`aistorm: sendSMS attempt ${attempt} network error — ${msg}`);
      lastError = { status: null, error: msg };
    }
    if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 500);
  }
  return { ok: false, status: lastError.status, error: lastError.error };
}
