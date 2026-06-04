import { randomUUID } from 'crypto';

const TIMEOUT_MS = 10_000;
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
 * Search the web for an agent's LinkedIn + Facebook URLs.
 * If prospectId is supplied, found URLs are saved to that prospect record.
 * @param {string} agentName - camelCase, required
 * @param {object} options - { market, state, prospectId } all optional
 * @returns {{ ok: true, linkedInUrl, facebookUrl } | { ok: false, status, error }}
 */
export async function findLinkedIn(agentName, { market, state, prospectId } = {}) {
  if (!agentName) throw new Error('aistorm: agentName is required');

  const { secret, baseUrl } = getConfig();
  const url = `${baseUrl}/functions/findLinkedIn`;
  const headers = {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret,
    'x-idempotency-key': randomUUID(),
  };
  const body = { agentName, ...(market && { market }), ...(state && { state }), ...(prospectId && { prospectId }) };

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postWithTimeout(url, body, headers);
      if (res.ok) {
        const data = await res.json();
        console.log(`aistorm: findLinkedIn success — agent: ${agentName}, linkedIn: ${data.linkedInUrl}`);
        return { ok: true, linkedInUrl: data.linkedInUrl, facebookUrl: data.facebookUrl };
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await res.text().catch(() => '');
        console.error(`aistorm: findLinkedIn failed — status: ${res.status}, error: ${text}`);
        return { ok: false, status: res.status, error: text };
      }
      const text = await res.text().catch(() => '');
      console.error(`aistorm: findLinkedIn attempt ${attempt} — status: ${res.status}, error: ${text}`);
      lastError = { status: res.status, error: text };
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'request timed out' : err.message;
      console.error(`aistorm: findLinkedIn attempt ${attempt} network error — ${msg}`);
      lastError = { status: null, error: msg };
    }
    if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 500);
  }
  return { ok: false, status: lastError.status, error: lastError.error };
}
