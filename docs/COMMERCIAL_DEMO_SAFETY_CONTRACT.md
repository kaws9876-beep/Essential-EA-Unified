# Commercial Demo Safety Contract

## Non-Negotiable Rules

- Commercial demo work uses synthetic data only.
- Commercial demo work uses no production customer data.
- Commercial demo work performs no production database mutations.
- Commercial demo work performs no live email, calendar, accounting, CRM, SMS, payment, or webhook writes.
- Demo fixtures must contain no secrets, tokens, private keys, credentials, or environment variable values.
- Demo reset behavior must be deterministic and repeatable from the same fixture state.
- Every demo surface must show explicit visual labeling: Demo Mode - Synthetic Data.
- Simulated actions must be clearly labeled as simulated before, during, and after execution.
- Demo execution adapters must deny live writes by default.
- Production integrations must remain unreachable from demo mode.
- Demo mode must fail closed when configuration is missing, ambiguous, or unsafe.
- Future demo data must be isolated from records using user_id = 'default'.
- The product must make no claim that simulated execution was performed in an external system.

## Recommended Implementation Pattern

Use a small isolated demo directory/application inside the existing repository for C1.

This is safer than a hash or query-driven mode inside the current PWA because the current single-file application is already wired to production Railway endpoints and live integrations. Keeping demo code in an isolated directory gives the Commercial demo deterministic fixtures, explicit routing, and separate execution adapters without disturbing the current static Vercel app or Express production routes.

Recommended C1 file scope:

- `demo-commercial/index.html`
- `demo-commercial/app.js`
- `demo-commercial/styles.css`
- `demo-commercial/fixtures/commercial-opportunity.json`
- `demo-commercial/adapters/demoExecutionAdapter.js`
- `demo-commercial/README.md`

The demo execution adapter should expose the same conceptual lifecycle as production, but every mutating method must return simulated results from local fixtures unless an explicit future safety review approves otherwise.
