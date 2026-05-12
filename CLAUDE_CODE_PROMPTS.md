# Claude Code Prompts — Essential EA
## Copy and paste these exactly

---

## PROMPT 1: GitHub Actions Auto-Deploy (do this first)
"Read CONTEXT.md and CLAUDE.md. Then create
.github/workflows/deploy.yml that:
1. Triggers on every push to main branch
2. Runs node --check server.js and fails if syntax error
3. Installs Railway CLI and deploys using RAILWAY_TOKEN secret
4. Waits 60 seconds then hits /api/health
5. Fails the workflow if health check does not return 200
Do not touch server.js or index.html."

---

## PROMPT 2: EA Task Automation Engine
"Read CONTEXT.md and CLAUDE.md. Then add to server.js:
1. A new DB table: automation_logs
   (id, task_id, action_taken, result, approval_required, 
    created_at, user_id)
2. A background job using setInterval every 5 minutes that:
   - Fetches tasks WHERE status = pending AND source = ea-execution
   - Calls Claude to determine best action for each task
   - Tier 1 actions (draft, classify, log) execute automatically
   - Tier 2 actions (send, create, modify) set status = awaiting-approval
   - Logs every action to automation_logs table
3. New routes:
   POST /api/automation/approve/:logId  - approve a pending action
   POST /api/automation/reject/:logId   - reject a pending action
   GET  /api/automation/logs            - return recent automation logs
Use existing getGoogleAccessToken() and getMicrosoftAccessToken().
Insert new routes before // Global error handler comment.
Run node --check server.js when done."

---

## PROMPT 3: Clerk User Authentication
"Read CONTEXT.md and CLAUDE.md. Then:
1. Install @clerk/clerk-sdk-node package
2. Add Clerk middleware to server.js protecting all /api routes
   except /api/health, /auth/*, and /api/stripe/webhook
3. Add CLERK_SECRET_KEY to the list of required env vars at startup
4. Update all DB queries to use req.auth.userId instead of
   hardcoded 'default' for user_id
5. Add GET /api/me route returning current user profile
6. In index.html add a login screen that loads Clerk's
   hosted sign-in URL for unauthenticated users
Do not change any existing route logic — only add auth middleware
and update user_id references.
Run node --check server.js when done."

---

## PROMPT 4: Self-Healing Support Agent
"Read CONTEXT.md and CLAUDE.md. Then add to server.js:
1. POST /api/support/diagnose route that:
   - Accepts {issue, connectorName, errorMessage}
   - Checks connector health for the named connector
   - Queries Claude with the error message and connector status
   - Returns plain-English explanation and step-by-step fix
   - Uses safeExternalContent() wrapper for any user-provided content
2. POST /api/support/chat route for ongoing support conversation:
   - Maintains conversation history in DB (new support_chats table)
   - Has system prompt explaining all Essential EA features,
     common errors, and their solutions
   - Can query connector health and user profile for context
   - Knows when to escalate: billing, data deletion, security issues
3. In index.html add a Help button (? icon) in the sidebar
   that opens a support chat panel
Run node --check server.js when done."

---

## PROMPT 5: Writing Hub
"Read CONTEXT.md and CLAUDE.md. Then:
1. Add to server.js POST /api/write/:type route where type is:
   social-post, listing-description, proposal, newsletter,
   follow-up, thank-you, bio
   Each type has a specialized Claude prompt tuned for that format.
   All accept {context, tone, length, audience} in request body.
2. In index.html add a new screen before screen-settings:
   - ID: screen-writing
   - Sidebar label: Writing Hub
   - Content type selector (tabs or dropdown)
   - Context input textarea
   - Tone selector (Professional/Warm/Direct/Enthusiastic)
   - Generate button
   - Output area with Copy and Send via Email buttons
Run node --check server.js when done."

---

## PROMPT 6: Admin Dashboard
"Read CONTEXT.md and CLAUDE.md. Then:
1. Add to server.js GET /api/admin/stats route returning:
   - Total users, active today, active this week
   - Most used features (from automation_logs)
   - Connector health across all users
   - Failed automations in last 24 hours
   - Revenue (from Stripe if connected)
2. In index.html add screen-admin before screen-settings:
   - Only visible if user has admin role
   - Shows user table, feature usage charts, connector health grid
   - Failed automation log with retry buttons
Run node --check server.js when done."

---

## ORDER TO RUN THESE PROMPTS
1. Prompt 1 (GitHub Actions) — fixes deployment, do immediately
2. Prompt 2 (Task Engine) — core automation
3. Prompt 3 (Clerk Auth) — required before charging users
4. Prompt 5 (Writing Hub) — high user value, fast to build
5. Prompt 4 (Help Agent) — reduces support burden
6. Prompt 6 (Admin Dashboard) — you need this to run the business
