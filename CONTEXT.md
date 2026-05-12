# Essential EA — Developer Context File
## Read this before making any changes

### Stack
- Frontend: index.html (single file PWA) → deployed on Vercel
- Backend: server.js (Node/Express) → deployed on Railway
- Database: PostgreSQL via `postgres` npm package (sql tagged template literals)
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Voice: ElevenLabs Creator plan, voice ID in ELEVENLABS_API_KEY env var
- RAG: Pinecone, index = essential-ea-book
- Auth: Not yet implemented (coming next)

### Live URLs
- Frontend: https://essential-ea-unified.vercel.app
- Backend: https://essential-ea-app-production.up.railway.app
- Health check: https://essential-ea-app-production.up.railway.app/api/health

### Critical deployment rules
1. NEVER rewrite server.js from scratch — add to it only
2. NEVER rewrite index.html from scratch — add to it only
3. Always run `node --check server.js` before committing
4. Railway deploys from GitHub main branch automatically
5. Vercel deploys from GitHub main branch automatically
6. Test /api/health after every Railway deploy

### Existing token helpers — DO NOT rewrite these
- getGoogleAccessToken() — returns valid Google OAuth token, handles refresh
- getMicrosoftAccessToken() — returns valid Microsoft OAuth token, handles refresh
- Both are in server.js, use these for ALL Google/Microsoft API calls

### Database tables already in place
- google_tokens (user_id, access_token, refresh_token, expiry_date)
- microsoft_tokens (user_id, access_token, refresh_token, expiry_date)
- quickbooks_tokens (user_id, access_token, refresh_token, realm_id, expiry_date)
- tasks (id, title, description, status, priority, source, due_date, created_at)
- daily_briefs (id, content, created_at)
- user_profiles (id, user_id, name, role, goals, peak_hours)
- weekly_plans (id, goals, revenue, timeblocks, plan, created_at)
- feedback (id, type, message, created_at)

### Connector interface standard
Every new integration MUST implement these 6 methods:
connect(), disconnect(), sync(), execute(action, payload), undo(undoToken), healthCheck()
No connector ships without all 6 working.

### Risk tier model
- Tier 1 (auto-execute): classify, draft, log, read data, add to task list
- Tier 2 (one-tap approve): send email, create invoice, book event, add contact
- Tier 3 (explicit confirm): delete, mark paid, mass email, share externally
- Tier 4 (never automate): strategic decisions, contracts, hiring, legal

### Environment variables (all in Railway)
ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, OPENAI_API_KEY (Whisper),
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI,
QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_ENVIRONMENT,
GHL_API_KEY, PINECONE_API_KEY, STRIPE_SECRET_KEY, DATABASE_URL

### What is working right now
- Crystal Ball Triage (classify + voice readback + EA execution)
- EA Daily Brief (full voice, 9 sections)
- Priority Week Generator
- Gmail + Outlook read, compose, reply, archive, delete
- Meeting transcription (Whisper) + analysis
- EA Task List (add, execute, delete, status)
- QuickBooks read + create invoice
- Google Calendar view + create events
- CRM Go High Level contacts
- ElevenLabs voice (desktop + iOS)
- PWA mobile app

### What needs to be built next (in order)
1. GitHub Actions auto-deploy (.github/workflows/deploy.yml)
2. Clerk user authentication + profile creation
3. Stripe subscription gating
4. EA task automation engine (background jobs)
5. Writing Hub screen
6. Document reader fix
7. In-app help agent
8. Admin dashboard
9. Social scheduling (Buffer API)
10. Zapier webhooks
11. Plaid bank data

### Known issues
- Railway sometimes caches old builds — verify /api/health after every deploy
- Contact autocomplete requires Google People API scope in OAuth
- QB mark-paid route exists as /api/quickbooks/mark-paid-v2
- Voice input (Web Speech API) requires microphone permission in browser settings
