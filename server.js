#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
let tasks = [];
let messages = [];
let weeklyPlans = [];
let taskIdCounter = 1;
let messageIdCounter = 1;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('\n🚀 Starting Essential EA Unified App...');
console.log('📍 PORT:', PORT);
console.log('📍 OpenAI Key:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// ==================== FRONTEND ====================
// Serve the React frontend as static files
const frontendHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Essential EA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-dark: #1A1916;
      --bg-darker: #242119;
      --bg-darkest: #2E2B27;
      --accent: #C89A8A;
      --text-light: #F5F5F5;
      --text-muted: #A0A0A0;
      --border: #3A3733;
    }
    
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg-dark);
      color: var(--text-light);
      line-height: 1.6;
    }
    
    .container {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    
    .sidebar {
      width: 280px;
      background: var(--bg-darker);
      border-right: 1px solid var(--border);
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    
    .sidebar-header {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 32px;
      color: var(--accent);
    }
    
    .nav-section {
      margin-bottom: 32px;
    }
    
    .nav-section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    
    .nav-item {
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      border: 1px solid transparent;
    }
    
    .nav-item:hover {
      background: var(--bg-darkest);
      border-color: var(--accent);
    }
    
    .nav-item.active {
      background: var(--accent);
      color: var(--bg-dark);
      font-weight: 600;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .top-bar {
      background: var(--bg-darker);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    
    .screen { display: none; }
    .screen.active { display: block; }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .kpi-card {
      background: var(--bg-darker);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }
    
    .kpi-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    
    .kpi-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--accent);
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-light);
    }
    
    .form-input,
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      background: var(--bg-darker);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-light);
      font-family: inherit;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(200, 154, 138, 0.1);
    }
    
    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    .btn {
      padding: 12px 24px;
      background: var(--accent);
      color: var(--bg-dark);
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(200, 154, 138, 0.2);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .result-box {
      background: var(--bg-darker);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-top: 16px;
    }
    
    .result-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .result-emoji {
      font-size: 24px;
    }
    
    .result-title {
      font-size: 18px;
      font-weight: 700;
    }
    
    .result-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 13px;
      color: var(--text-muted);
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(200, 154, 138, 0.1);
      border: 1px solid var(--accent);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
    }
    
    .loading {
      text-align: center;
      padding: 32px;
      color: var(--text-muted);
    }
    
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    
    .column-header {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--accent);
    }
    
    .task-item {
      background: var(--bg-darker);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .task-item:hover {
      border-color: var(--accent);
      transform: translateX(4px);
    }
    
    .task-emoji {
      font-size: 20px;
      margin-right: 8px;
    }
    
    .task-text {
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .task-urgency {
      font-size: 12px;
      color: var(--text-muted);
    }
    
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }
      
      .sidebar {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid var(--border);
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
      }
      
      .nav-section {
        margin-bottom: 0;
      }
      
      .nav-section-title {
        display: none;
      }
      
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      
      .two-column {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="sidebar-header">Essential EA</div>
      
      <div class="nav-section">
        <div class="nav-section-title">Overview</div>
        <div class="nav-item active" onclick="switchScreen('dashboard')">📊 Dashboard</div>
        <div class="nav-item" onclick="switchScreen('inbox')">📧 Inbox</div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Your EA</div>
        <div class="nav-item" onclick="switchScreen('priority')">📅 Priority Week</div>
        <div class="nav-item" onclick="switchScreen('triage')">🔮 Crystal Ball Triage</div>
        <div class="nav-item">✉️ Communication Hub</div>
        <div class="nav-item">📞 Call Log</div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Operations</div>
        <div class="nav-item">👥 Team</div>
        <div class="nav-item">📈 Pipeline</div>
        <div class="nav-item">📊 Analytics</div>
        <div class="nav-item">🎯 Goals</div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Settings</div>
        <div class="nav-item">⚙️ Preferences</div>
        <div class="nav-item">🔒 Security</div>
        <div class="nav-item">🔌 Integrations</div>
        <div class="nav-item">👤 Account</div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="top-bar">
        <h1 style="font-size: 20px; font-weight: 700;">The Essential EA</h1>
        <div style="font-size: 14px; color: var(--text-muted);">AI-Powered Executive Assistant</div>
      </div>
      
      <div class="content-area">
        <!-- Dashboard Screen -->
        <div id="dashboard" class="screen active">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Dashboard</h2>
          
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Tasks</div>
              <div class="kpi-value" id="kpi-total">0</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">🔮 Crystal Ball</div>
              <div class="kpi-value" id="kpi-crystal">0</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">🎾 Bouncy Ball</div>
              <div class="kpi-value" id="kpi-bouncy">0</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Avg Confidence</div>
              <div class="kpi-value" id="kpi-confidence">0%</div>
            </div>
          </div>
          
          <div style="background: var(--bg-darker); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">AI Insight</h3>
            <p style="color: var(--text-muted); margin-bottom: 16px;">Analyze your tasks to get AI-powered insights and recommendations.</p>
            <button class="btn" onclick="switchScreen('triage')">Go to Crystal Ball Triage →</button>
          </div>
        </div>
        
        <!-- Priority Week Screen -->
        <div id="priority" class="screen">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Priority Week Planner</h2>
          
          <div style="background: var(--bg-darker); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div class="form-group">
              <label class="form-label">Weekly Goals</label>
              <textarea id="goals" class="form-textarea" placeholder="What are your top 3 goals for this week?"></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Revenue Target</label>
              <input type="text" id="revenue" class="form-input" placeholder="e.g., $50,000">
            </div>
            
            <div class="form-group">
              <label class="form-label">Non-Negotiable Time Blocks</label>
              <textarea id="timeblocks" class="form-textarea" placeholder="e.g., Monday 9-10am: Team standup, Wednesday 2-3pm: Client calls"></textarea>
            </div>
            
            <button class="btn" onclick="generateWeeklyPlan()">Generate 5-Day Plan with AI ✨</button>
          </div>
          
          <div id="weeklyPlanResult" style="display: none;">
            <div class="result-box">
              <div id="weeklyPlanContent"></div>
            </div>
          </div>
        </div>
        
        <!-- Crystal Ball Triage Screen -->
        <div id="triage" class="screen">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">🔮 Crystal Ball Triage</h2>
          
          <div style="background: var(--bg-darker); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div class="form-group">
              <label class="form-label">Paste a Task or Decision</label>
              <textarea id="taskInput" class="form-textarea" placeholder="e.g., Review counter offer from seller on Oak Street property"></textarea>
            </div>
            
            <button class="btn" onclick="classifyTask()">Classify Task 🚀</button>
          </div>
          
          <div id="classificationResult" style="display: none;">
            <div class="result-box">
              <div id="classificationContent"></div>
            </div>
          </div>
          
          <div style="margin-top: 24px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Recent Classifications</h3>
            <div class="two-column">
              <div>
                <div class="column-header">🔮 Crystal Ball (Your Tasks)</div>
                <div id="crystalList"></div>
              </div>
              <div>
                <div class="column-header">🎾 Bouncy Ball (Delegate)</div>
                <div id="bouncyList"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Inbox Screen -->
        <div id="inbox" class="screen">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">📧 Communication Hub</h2>
          
          <div style="background: var(--bg-darker); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
            <p style="color: var(--text-muted);">Inbox integration coming soon. This will display AI-routed messages with smart categorization.</p>
            <div style="margin-top: 16px; padding: 16px; background: var(--bg-darkest); border-radius: 8px; border-left: 3px solid var(--accent);">
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">💡 Feature Preview</div>
              <ul style="font-size: 13px; color: var(--text-muted); margin-left: 20px;">
                <li>Split-pane inbox with message list and detail view</li>
                <li>AI routing banner: "This needs your immediate attention"</li>
                <li>Filters: All, Needs You, EA Owned, Deferred</li>
                <li>Pre-drafted responses powered by AI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function switchScreen(screenName) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(screenName).classList.add('active');
      
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      event.target.closest('.nav-item').classList.add('active');
      
      if (screenName === 'dashboard') {
        loadStats();
      } else if (screenName === 'triage') {
        loadTaskHistory();
      }
    }
    
    async function classifyTask() {
      const taskInput = document.getElementById('taskInput').value.trim();
      if (!taskInput) {
        alert('Please enter a task to classify');
        return;
      }
      
      const resultDiv = document.getElementById('classificationResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Analyzing task...</p></div>';
      
      try {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskDescription: taskInput })
        });
        
        const data = await response.json();
        
        if (data.success) {
          const classification = data.classification;
          resultDiv.innerHTML = \`
            <div class="result-box">
              <div class="result-header">
                <div class="result-emoji">\${classification.emoji}</div>
                <div class="result-title">\${classification.classification === 'crystal' ? '🔮 Crystal Ball' : '🎾 Bouncy Ball'}</div>
              </div>
              <div class="result-meta">
                <span><strong>Urgency:</strong> \${classification.urgency}</span>
                <span><strong>Confidence:</strong> \${(classification.confidence * 100).toFixed(0)}%</span>
              </div>
              <p style="margin-bottom: 12px;"><strong>Why:</strong> \${classification.reason}</p>
              <p><strong>Recommended Action:</strong> \${classification.recommendedAction}</p>
            </div>
          \`;
          
          document.getElementById('taskInput').value = '';
          loadTaskHistory();
        } else {
          resultDiv.innerHTML = '<div class="result-box" style="color: #ff6b6b;">Error: ' + data.error + '</div>';
        }
      } catch (error) {
        resultDiv.innerHTML = '<div class="result-box" style="color: #ff6b6b;">Error: ' + error.message + '</div>';
      }
    }
    
    async function generateWeeklyPlan() {
      const goals = document.getElementById('goals').value.trim();
      const revenue = document.getElementById('revenue').value.trim();
      const timeblocks = document.getElementById('timeblocks').value.trim();
      
      if (!goals || !revenue || !timeblocks) {
        alert('Please fill in all fields');
        return;
      }
      
      const resultDiv = document.getElementById('weeklyPlanResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div class="result-box"><div class="loading"><div class="spinner"></div><p>Generating your 5-day plan...</p></div></div>';
      
      try {
        const response = await fetch('/api/generate-week', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goals, revenue, timeblocks })
        });
        
        const data = await response.json();
        
        if (data.success) {
          resultDiv.innerHTML = '<div class="result-box"><pre style="white-space: pre-wrap; color: var(--text-light);">' + data.plan + '</pre></div>';
        } else {
          resultDiv.innerHTML = '<div class="result-box" style="color: #ff6b6b;">Error: ' + data.error + '</div>';
        }
      } catch (error) {
        resultDiv.innerHTML = '<div class="result-box" style="color: #ff6b6b;">Error: ' + error.message + '</div>';
      }
    }
    
    async function loadStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (data.success) {
          const stats = data.stats;
          document.getElementById('kpi-total').textContent = stats.totalTasks;
          document.getElementById('kpi-crystal').textContent = stats.crystal;
          document.getElementById('kpi-bouncy').textContent = stats.bouncy;
          document.getElementById('kpi-confidence').textContent = stats.avgAccuracy + '%';
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }
    
    async function loadTaskHistory() {
      try {
        const response = await fetch('/api/history?limit=10');
        const data = await response.json();
        
        if (data.success) {
          const tasks = data.tasks || [];
          
          const crystalTasks = tasks.filter(t => t.classification === 'crystal');
          const bouncyTasks = tasks.filter(t => t.classification === 'bouncy');
          
          document.getElementById('crystalList').innerHTML = crystalTasks.map(t => \`
            <div class="task-item">
              <div class="task-text">\${t.description}</div>
              <div class="task-urgency">Urgency: \${t.urgency}</div>
            </div>
          \`).join('');
          
          document.getElementById('bouncyList').innerHTML = bouncyTasks.map(t => \`
            <div class="task-item">
              <div class="task-text">\${t.description}</div>
              <div class="task-urgency">Urgency: \${t.urgency}</div>
            </div>
          \`).join('');
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
    
    // Load stats on page load
    loadStats();
  </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(frontendHTML);
});

// ==================== BACKEND API ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Classify task
app.post('/api/classify', async (req, res) => {
  try {
    const { taskDescription } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({ error: 'Task description required', success: false });
    }

    const prompt = `You are a task classification AI for executives and brokers.
Classify this task as either "crystal" (only the executive/broker can do this) or "bouncy" (can be delegated to an EA or team member).

CONTEXT:
- Crystal Ball tasks: Decisions, negotiations, client relationships, legal/compliance, strategy, approvals
- Bouncy Ball tasks: Admin, scheduling, data entry, communication, follow-ups, coordination

Task: "${taskDescription}"

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "classification": "crystal" or "bouncy",
  "emoji": "🔮" or "🎾",
  "urgency": "urgent", "today", "defer", or "ea_owned",
  "reason": "Why this classification (1-2 sentences)",
  "recommendedAction": "What to do with this task (1 sentence)",
  "confidence": 0.95
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a task classification AI. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown if present
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const result = JSON.parse(content);

    // Save task
    const task = {
      id: taskIdCounter++,
      description: taskDescription,
      ...result,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);

    res.json({
      success: true,
      task,
      classification: result
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to classify',
      success: false
    });
  }
});

// Generate weekly plan
app.post('/api/generate-week', async (req, res) => {
  try {
    const { goals, revenue, timeblocks } = req.body;
    
    if (!goals || !revenue || !timeblocks) {
      return res.status(400).json({ error: 'Missing required fields', success: false });
    }

    const prompt = `You are an executive assistant AI helping a broker plan their week.

Create a detailed 5-day priority week plan based on:
- Goals: ${goals}
- Revenue Target: ${revenue}
- Non-Negotiable Time Blocks: ${timeblocks}

Format the plan as a structured 5-day calendar with:
1. Daily priorities (Crystal Ball tasks only the broker can do)
2. Delegated tasks (Bouncy Ball tasks for the EA)
3. Time blocks and focus areas
4. Revenue-generating activities
5. Key metrics to track

Make it actionable, specific, and motivating.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert executive assistant. Create detailed, actionable weekly plans.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const plan = response.choices[0].message.content.trim();

    weeklyPlans.push({
      id: Date.now(),
      goals,
      revenue,
      timeblocks,
      plan,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to generate plan',
      success: false
    });
  }
});

// Get task history
app.get('/api/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = tasks.slice(-limit).reverse();
    
    res.json({
      success: true,
      tasks: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const crystalCount = tasks.filter(t => t.classification === 'crystal').length;
    const bouncyCount = tasks.filter(t => t.classification === 'bouncy').length;
    const avgConfidence = tasks.length > 0
      ? (tasks.reduce((sum, t) => sum + (t.confidence || 0), 0) / tasks.length).toFixed(2)
      : 0;

    res.json({
      success: true,
      stats: {
        totalTasks: tasks.length,
        crystal: crystalCount,
        bouncy: bouncyCount,
        avgAccuracy: (parseFloat(avgConfidence) * 100).toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Essential EA is running!`);
  console.log(`📍 Frontend: http://localhost:${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api/classify\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
