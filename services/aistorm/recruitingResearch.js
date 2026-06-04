import { randomUUID } from 'crypto';

const TIMEOUT_MS = 30_000;
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
 * Search for top-producing agents in a market, extract with Claude, create RecruitingProspect records.
 * Side effect: creates RecruitingProspect records in aiStorm. Always send real market + state values.
 * @param {string} market - e.g. "San Antonio"
 * @param {string} state  - e.g. "TX"
 * @returns {{ ok: true, agents: array, count: number } | { ok: false, status, error }}
 */
export async function recruitingResearch(market, state) {
  if (!market) throw new Error('aistorm: market is required');
  if (!state) throw new Error('aistorm: state is required');

  const { secret, baseUrl } = getConfig();
  const url = `${baseUrl}/functions/recruitingResearch`;
  const headers = {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret,
    'x-idempotency-key': randomUUID(),
  };

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postWithTimeout(url, { market, state }, headers);
      if (res.ok) {
        const data = await res.json();
        console.log(`aistorm: recruitingResearch success — market: ${market}, ${state}, count: ${data.count}`);
        return { ok: true, agents: data.agents, count: data.count };
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await res.text().catch(() => '');
        console.error(`aistorm: recruitingResearch failed — status: ${res.status}, error: ${text}`);
        return { ok: false, status: res.status, error: text };
      }
      const text = await res.text().catch(() => '');
      console.error(`aistorm: recruitingResearch attempt ${attempt} — status: ${res.status}, error: ${text}`);
      lastError = { status: res.status, error: text };
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'request timed out' : err.message;
      console.error(`aistorm: recruitingResearch attempt ${attempt} network error — ${msg}`);
      lastError = { status: null, error: msg };
    }
    if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 500);
  }
  return { ok: false, status: lastError.status, error: lastError.error };
}
