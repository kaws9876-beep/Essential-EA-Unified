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
 * Log a recruiting activity and run stage-transition logic for a prospect.
 * @param {string} prospectId - required
 * @param {object} extraFields - optional additional RecruitingActivity fields
 */
export async function autoTransitionProspectStage(prospectId, extraFields = {}) {
  if (!prospectId) throw new Error('aistorm: prospectId is required');

  const { secret, baseUrl } = getConfig();
  const url = `${baseUrl}/functions/autoTransitionProspectStage`;
  const headers = {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret,
    'x-idempotency-key': randomUUID(),
  };
  const body = { data: { prospect_id: prospectId, ...extraFields } };

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postWithTimeout(url, body, headers);
      if (res.ok) {
        const data = await res.json();
        console.log(`aistorm: autoTransitionProspectStage success — prospect: ${prospectId}`);
        return { ok: true, data };
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await res.text().catch(() => '');
        console.error(`aistorm: autoTransitionProspectStage failed — status: ${res.status}, error: ${text}`);
        return { ok: false, status: res.status, error: text };
      }
      const text = await res.text().catch(() => '');
      console.error(`aistorm: autoTransitionProspectStage attempt ${attempt} — status: ${res.status}, error: ${text}`);
      lastError = { status: res.status, error: text };
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'request timed out' : err.message;
      console.error(`aistorm: autoTransitionProspectStage attempt ${attempt} network error — ${msg}`);
      lastError = { status: null, error: msg };
    }
    if (attempt < MAX_ATTEMPTS) await sleep(2 ** attempt * 500);
  }
  return { ok: false, status: lastError.status, error: lastError.error };
}
