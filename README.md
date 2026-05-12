# The Essential EA — Unified Full-Stack Application 

A beautifully designed, AI-powered executive assistant app for brokers and high-performing professionals. Built with Express + React in a single, unified deployment.

## Features

- **🎨 Dark Warm-Toned Design** — Espresso backgrounds (#1A1916, #242119, #2E2B27) with rose-gold accents (#C89A8A)
- **📊 Dashboard** — KPI cards, task statistics, and AI insights
- **📅 Priority Week Planner** — AI-generated 5-day calendar based on goals, revenue targets, and time blocks
- **🔮 Crystal Ball Triage** — AI task classification (Crystal Ball vs Bouncy Ball) with urgency levels
- **📧 Communication Hub** — Placeholder for email integration and AI routing
- **📱 Fully Responsive** — Mobile, tablet, and desktop optimized

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript + HTML/CSS (embedded in server)
- **AI:** OpenAI GPT-3.5-turbo
- **Deployment:** Vercel

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure environment variables in Vercel:**
   - Go to Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your API key
   - Add `PORT` = `3000`
   - Add `NODE_ENV` = `production`

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-app.vercel.app`

## API Endpoints

### POST `/api/classify`
Classify a task as Crystal Ball (only you can do) or Bouncy Ball (delegate).

**Request:**
```json
{
  "taskDescription": "Review counter offer from seller"
}
```

**Response:**
```json
{
  "success": true,
  "classification": {
    "classification": "crystal",
    "emoji": "🔮",
    "urgency": "urgent",
    "reason": "Requires broker judgment and negotiation skills",
    "recommendedAction": "Review immediately and respond within 2 hours",
    "confidence": 0.95
  }
}
```

### POST `/api/generate-week`
Generate a 5-day priority week plan using AI.

**Request:**
```json
{
  "goals": "Close 2 deals, generate $50k in commissions",
  "revenue": "$50,000",
  "timeblocks": "Monday 9-10am: Team standup, Wednesday 2-3pm: Client calls"
}
```

**Response:**
```json
{
  "success": true,
  "plan": "MONDAY:\n🔮 Crystal Ball: Review 3 pending offers...\n🎾 Bouncy Ball: Schedule follow-ups..."
}
```

### GET `/api/history?limit=50`
Get task classification history.

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": 1,
      "description": "Review counter offer",
      "classification": "crystal",
      "emoji": "🔮",
      "urgency": "urgent",
      "reason": "...",
      "recommendedAction": "...",
      "confidence": 0.95,
      "createdAt": "2026-04-10T01:30:00.000Z"
    }
  ],
  "count": 1
}
```

### GET `/api/stats`
Get statistics on task classifications.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTasks": 10,
    "crystal": 6,
    "bouncy": 4,
    "avgAccuracy": "92.5%"
  }
}
```

## Design System

### Colors
- **Dark Backgrounds:** #1A1916, #242119, #2E2B27
- **Accent (Rose-Gold):** #C89A8A
- **Text Light:** #F5F5F5
- **Text Muted:** #A0A0A0
- **Border:** #3A3733

### Typography
- **Serif (Headers):** Cormorant Garamond
- **Sans-Serif (Body):** DM Sans

### Components
- KPI Cards with hover effects
- Task classification results with emoji and metadata
- Responsive two-column layout for Crystal Ball / Bouncy Ball separation
- Mobile-first responsive design

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for task classification | `sk-proj-...` |
| `PORT` | Server port (default: 3000) | `3000` |
| `NODE_ENV` | Environment mode | `production` |

## File Structure

```
essential-ea-unified/
├── server.js           # Express server + embedded React frontend
├── package.json        # Dependencies
├── .env                # Environment variables (local)
├── .env.example        # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Future Enhancements

- [ ] Email integration (Gmail/Outlook OAuth)
- [ ] Real database (PostgreSQL/MongoDB) instead of in-memory storage
- [ ] User authentication and multi-user support
- [ ] Persistent data storage
- [ ] Advanced inbox filtering and AI routing
- [ ] Calendar integration
- [ ] Slack/Teams integration
- [ ] Mobile app (React Native)

## Support

For issues or questions, reach out to the development team or check the GitHub issues page.

## License

MIT
