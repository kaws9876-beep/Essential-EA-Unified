// One-time live verification for the aiStorm createSignal integration.
// Run on the server (e.g. Railway shell) AFTER STORM_EQUITY_WEBHOOK_SECRET is set:
//   node scripts/verify-signal.js
//
// This is a throwaway check — safe to delete once you see a real signal_id.
import { createSignal } from '../services/aistorm/createSignal.js';

const result = await createSignal({
  platform: 'EA Essential',
  query: 'test_connection',
  summary: 'Live integration verification call.',
  intent: 'warm',
  urgency_note: 'Verification only — no follow-up needed.',
  contact: 'Kristina Spencer',
  status: 'new',
  timestamp: new Date().toISOString().slice(0, 10),
});

console.log('--- aiStorm verify result ---');
console.log(result);

if (result.ok) {
  console.log(`\nSUCCESS: integration confirmed. signal_id = ${result.signalId}`);
} else if (result.status === 401) {
  console.log('\n401: secret mismatch. Re-sync STORM_EQUITY_WEBHOOK_SECRET with Monica via a secure channel.');
} else if (result.status === 404) {
  console.log('\n404: wrong function name or app id. Confirm createSignal + AISTORM_APP_ID with Monica.');
} else {
  console.log(`\nFAILED: status ${result.status}. ${result.error}`);
}
