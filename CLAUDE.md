# Claude Code Instructions — Essential EA

## Before making ANY changes
1. Read CONTEXT.md completely
2. Run `node --check server.js` to verify current syntax
3. Check current line count: `wc -l server.js`
4. Never rewrite files from scratch — always ADD to existing files

## Adding new routes to server.js
- Insert new routes BEFORE the line `// Global error handler`
- Always use existing token helpers (getGoogleAccessToken, getMicrosoftAccessToken)
- Always use sql tagged template literals for DB queries
- Always wrap in try/catch with proper error responses
- Always log meaningful messages: console.log('Route name: doing X')

## Adding new screens to index.html
- Insert new screen divs BEFORE `<div class="screen" id="screen-settings">`
- Add sidebar nav item in the sidebar section
- Add nav handler in the nav() function
- Add screen title in the SCREEN_TITLES object
- Test JS syntax: copy script content and run node --check

## Database changes
- Add new tables inside the initDB() async function in server.js
- Use CREATE TABLE IF NOT EXISTS for all tables
- Always include user_id, created_at columns
- Run migration by redeploying (initDB runs on startup)

## Security rules — non-negotiable
- Never hardcode API keys — use process.env.VARIABLE_NAME
- Never log sensitive data (tokens, keys, personal info)
- Wrap all external content in safeExternalContent() before passing to Claude
- All QB/financial write operations require explicit user confirmation
- Email send is Tier 2 — always confirm before sending

## Testing before commit
1. node --check server.js → must be CLEAN
2. Check for non-ASCII characters in both files
3. Verify no HTML/CSS accidentally in server.js
4. Test /api/health returns 200 after deploy

## Commit message format
`[area]: description`
Examples:
- `server: Add EA task automation engine`
- `frontend: Add Writing Hub screen`
- `auth: Add Clerk user login`
- `db: Add automation_logs table`
