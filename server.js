#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Load persistent data from database
let tasks = db.getAllTasks();
let weeklyPlans = db.getWeeklyPlans();
let taskIdCounter = tasks.length > 0 ? Math.max(...tasks.map(t => t.id || 0)) + 1 : 1;

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-dark: #F5F0E8;
      --bg-darker: #EDE8DF;
      --bg-darkest: #E4DDD3;
      --accent: #C8A882;
      --text-light: #1A1714;
      --text-muted: #7A6F65;
      --border: #D8D0C5;
      --surface-black: #1A1714;
      --cream: #F5F0E8;
      --pink-gold: #C8A882;
    }
    
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--cream);
      color: var(--text-light);
      line-height: 1.6;
    }
    
    h1, h2, h3 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 600;
    }
    
    .container {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    
    .sidebar {
      width: 280px;
      background: var(--surface-black);
      border-right: 1px solid rgba(200, 168, 130, 0.2);
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      position: relative;
      flex-shrink: 0;
    }
    
    .hamburger {
      display: none;
      background: none;
      border: none;
      color: var(--cream);
      font-size: 24px;
      cursor: pointer;
      position: absolute;
      top: 16px;
      right: 16px;
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(245, 240, 232, 0.06);
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1px solid rgba(200, 168, 130, 0.25);
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--pink-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--surface-black);
      font-size: 18px;
    }
    
    .user-info {
      flex: 1;
    }
    
    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--cream);
    }
    
    .user-role {
      font-size: 12px;
      color: rgba(245, 240, 232, 0.55);
    }
    
    .sidebar-header {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 32px;
      color: var(--pink-gold);
      letter-spacing: 0.05em;
      font-family: 'Cormorant Garamond', Georgia, serif;
    }
    
    .nav-section {
      margin-bottom: 32px;
    }
    
    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: rgba(245, 240, 232, 0.35);
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    
    .nav-item {
      padding: 12px 16px;
      margin-bottom: 4px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      border: 1px solid transparent;
      color: rgba(245, 240, 232, 0.75);
    }
    
    .nav-item:hover {
      background: rgba(245, 240, 232, 0.07);
      border-color: rgba(200, 168, 130, 0.3);
      color: var(--cream);
    }
    
    .nav-item.active {
      background: var(--pink-gold);
      color: var(--surface-black);
      font-weight: 600;
      border-color: transparent;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .top-bar {
      background: var(--surface-black);
      border-bottom: 1px solid rgba(200, 168, 130, 0.2);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    
    #mobileHamburger {
      display: none !important;
    }
    
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: var(--cream);
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
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
      box-shadow: 0 1px 4px rgba(26, 23, 20, 0.05);
    }
    
    .kpi-card:hover {
      border-color: var(--pink-gold);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(200, 168, 130, 0.15);
    }
    
    .kpi-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 1px;
      font-weight: 500;
    }
    
    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--surface-black);
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
      background: #FFFFFF;
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
      border-color: var(--pink-gold);
      box-shadow: 0 0 0 3px rgba(200, 168, 130, 0.15);
    }
    
    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    .btn {
      padding: 12px 24px;
      background: var(--surface-black);
      color: var(--cream);
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      letter-spacing: 0.02em;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      background: #2C2926;
      box-shadow: 0 8px 20px rgba(26, 23, 20, 0.18);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .result-box {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-top: 16px;
      box-shadow: 0 1px 4px rgba(26, 23, 20, 0.06);
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
      background: rgba(200, 168, 130, 0.12);
      border: 1px solid var(--pink-gold);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #8B6B3D;
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
      border-top-color: var(--surface-black);
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
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--surface-black);
      letter-spacing: 0.02em;
    }
    
    .task-item {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(26, 23, 20, 0.04);
    }
    
    .task-item:hover {
      border-color: var(--pink-gold);
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(200, 168, 130, 0.12);
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
      #mobileHamburger {
        display: block !important;
        background: none;
        border: none;
        color: var(--cream);
        font-size: 24px;
        cursor: pointer;
      }
      
      .hamburger {
        display: none;
      }
      
      .container {
        position: relative;
      }
      
      .sidebar {
        position: fixed;
        left: -280px;
        top: 0;
        height: 100vh;
        z-index: 1000;
        transition: left 0.3s ease;
        width: 280px;
        border-right: 1px solid rgba(200, 168, 130, 0.2);
      }
      
      .sidebar.open {
        left: 0;
      }
      
      .sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
      
      .sidebar-overlay.open {
        display: block;
      }
      
      .main-content {
        flex: 1;
        width: 100%;
        overflow-y: auto;
        z-index: 1;
        position: relative;
      }
      
      .container {
        flex-direction: row;
        height: 100vh;
      }
      
      .sidebar {
        position: fixed;
        left: -280px;
        top: 0;
        width: 280px;
        height: 100vh;
        background: var(--surface-black);
        border-right: 1px solid rgba(200, 168, 130, 0.2);
        z-index: 1000;
        transition: left 0.3s ease;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
      }
      
      .sidebar.open {
        left: 0;
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
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
  <div class="container">
    <div class="sidebar" id="sidebar">
      <button class="hamburger" onclick="toggleSidebar()">✕</button>
      <div class="sidebar-header">Essential EA</div>
      
      <div class="user-profile">
        <div class="user-avatar">JD</div>
        <div class="user-info">
          <div class="user-name">Jane Doe</div>
          <div class="user-role">Executive</div>
        </div>
      </div>
      
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
        <div class="nav-item" onclick="switchScreen('operations')">👥 Team</div>
        <div class="nav-item" onclick="switchScreen('operations')">📈 Pipeline</div>
        <div class="nav-item" onclick="switchScreen('operations')">📊 Analytics</div>
        <div class="nav-item" onclick="switchScreen('operations')">🎯 Goals</div>
      </div>
      
      <div class="nav-section">
        <div class="nav-section-title">Settings</div>
        <div class="nav-item" onclick="switchScreen('settings')">⚙️ Preferences</div>
        <div class="nav-item" onclick="switchScreen('settings')">🔒 Security</div>
        <div class="nav-item" onclick="switchScreen('settings')">🔌 Integrations</div>
        <div class="nav-item" onclick="switchScreen('settings')">👤 Account</div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="top-bar">
        <button class="hamburger" id="mobileHamburger" onclick="toggleSidebar()" style="position: static; display: none; margin-right: 16px;">☰</button>
        <div>
          <h1 style="font-size: 20px; font-weight: 700; color: var(--cream);">The Essential EA</h1>
          <div style="font-size: 14px; color: rgba(245, 240, 232, 0.5);">AI-Powered Executive Assistant</div>
        </div>
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
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">AI Insight</h3>
            <p style="color: var(--text-muted); margin-bottom: 16px;">Analyze your tasks to get AI-powered insights and recommendations.</p>
            <button class="btn" onclick="switchScreen('triage')">Go to Crystal Ball Triage →</button>
          </div>
        </div>
        
        <!-- Priority Week Screen -->
        <div id="priority" class="screen">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Priority Week Planner</h2>
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
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
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
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
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
            <p style="color: var(--text-muted);">Inbox integration coming soon. This will display AI-routed messages with smart categorization.</p>
            <div style="margin-top: 16px; padding: 16px; background: var(--bg-darker); border-radius: 8px; border-left: 3px solid var(--pink-gold);">
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
        
        <!-- Operations Screen -->
        <div id="operations" class="screen">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">🏢 Operations</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">👥</div>
              <div style="font-size: 14px; font-weight: 600;">Team Management</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Manage team members and roles</div>
            </div>
            
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">📈</div>
              <div style="font-size: 14px; font-weight: 600;">Pipeline</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Track deals and opportunities</div>
            </div>
            
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">📊</div>
              <div style="font-size: 14px; font-weight: 600;">Analytics</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">View performance metrics</div>
            </div>
            
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">🎯</div>
              <div style="font-size: 14px; font-weight: 600;">Goals</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Set and track quarterly goals</div>
            </div>
          </div>
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Coming Soon</h3>
            <p style="color: var(--text-muted); font-size: 14px;">These operational tools are being integrated with your CRM and business systems. Full functionality coming in the next release.</p>
          </div>
        </div>
        
        <!-- Settings Screen -->
        <div id="settings" class="screen">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">⚙️ Settings</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">⚙️</div>
              <div style="font-size: 14px; font-weight: 600;">Preferences</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Customize your experience</div>
            </div>
            
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">🔒</div>
              <div style="font-size: 14px; font-weight: 600;">Security</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Manage passwords and 2FA</div>
            </div>
            
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">🔌</div>
              <div style="font-size: 14px; font-weight: 600;">Integrations</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Connect external tools</div>
            </div>
            
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(26,23,20,0.04);" onmouseover="this.style.borderColor='var(--pink-gold)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size: 28px; margin-bottom: 12px;">👤</div>
              <div style="font-size: 14px; font-weight: 600;">Account</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Manage your profile</div>
            </div>
          </div>
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Account Information</h3>
            <div style="display: grid; gap: 12px; font-size: 14px;">
              <div><strong>Email:</strong> <span style="color: var(--text-muted);">jane.doe@example.com</span></div>
              <div><strong>Role:</strong> <span style="color: var(--text-muted);">Executive</span></div>
              <div><strong>Plan:</strong> <span style="color: var(--pink-gold); font-weight: 600;">Professional</span></div>
              <div><strong>Member Since:</strong> <span style="color: var(--text-muted);">January 2024</span></div>
            </div>
          </div>
          
          <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(26,23,20,0.05);">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">💬 Send Feedback</h3>
            <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 14px;">Help us improve The Essential EA. Share your thoughts, suggestions, or report issues.</p>
            
            <div class="form-group">
              <label class="form-label">Your Name (Optional)</label>
              <input type="text" id="feedbackName" class="form-input" placeholder="e.g., Jane Doe">
            </div>
            
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="feedbackEmail" class="form-input" placeholder="your.email@example.com">
            </div>
            
            <div class="form-group">
              <label class="form-label">How would you rate your experience?</label>
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button style="flex: 1; padding: 10px; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 8px; color: var(--text-light); cursor: pointer; transition: all 0.2s;" onclick="setRating(1, this)">😞 1</button>
                <button style="flex: 1; padding: 10px; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 8px; color: var(--text-light); cursor: pointer; transition: all 0.2s;" onclick="setRating(2, this)">😐 2</button>
                <button style="flex: 1; padding: 10px; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 8px; color: var(--text-light); cursor: pointer; transition: all 0.2s;" onclick="setRating(3, this)">🙂 3</button>
                <button style="flex: 1; padding: 10px; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 8px; color: var(--text-light); cursor: pointer; transition: all 0.2s;" onclick="setRating(4, this)">😊 4</button>
                <button style="flex: 1; padding: 10px; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 8px; color: var(--text-light); cursor: pointer; transition: all 0.2s;" onclick="setRating(5, this)">🤩 5</button>
              </div>
              <input type="hidden" id="feedbackRating" value="5">
            </div>
            
            <div class="form-group">
              <label class="form-label">Your Feedback *</label>
              <textarea id="feedbackMessage" class="form-textarea" placeholder="Tell us what you think... What's working well? What could be improved?" style="min-height: 120px;"></textarea>
            </div>
            
            <button class="btn" onclick="submitFeedback()" style="width: 100%;">Send Feedback ✉️</button>
            <div id="feedbackStatus" style="margin-top: 12px; display: none; padding: 12px; border-radius: 8px; text-align: center;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    }
    
    function switchScreen(screenName) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(screenName).classList.add('active');
      
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      event.target.closest('.nav-item').classList.add('active');
      
      // Close sidebar on mobile after switching screen
      if (window.innerWidth <= 768) {
        toggleSidebar();
      }
      
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
          resultDiv.innerHTML = '<div class="result-box" style="color: #c62828;">Error: ' + data.error + '</div>';
        }
      } catch (error) {
        resultDiv.innerHTML = '<div class="result-box" style="color: #c62828;">Error: ' + error.message + '</div>';
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
          resultDiv.innerHTML = '<div class="result-box" style="color: #c62828;">Error: ' + data.error + '</div>';
        }
      } catch (error) {
        resultDiv.innerHTML = '<div class="result-box" style="color: #c62828;">Error: ' + error.message + '</div>';
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
    
    let currentRating = 5;
    
    function setRating(rating, button) {
      currentRating = rating;
      document.getElementById('feedbackRating').value = rating;
      
      // Update button styles
      const buttons = button.parentElement.querySelectorAll('button');
      buttons.forEach((btn, idx) => {
        if (idx < rating) {
          btn.style.background = 'var(--surface-black)';
          btn.style.color = 'var(--cream)';
          btn.style.borderColor = 'var(--surface-black)';
        } else {
          btn.style.background = 'var(--bg-darker)';
          btn.style.color = 'var(--text-light)';
          btn.style.borderColor = 'var(--border)';
        }
      });
    }
    
    async function submitFeedback() {
      const name = document.getElementById('feedbackName').value.trim();
      const email = document.getElementById('feedbackEmail').value.trim();
      const rating = document.getElementById('feedbackRating').value;
      const message = document.getElementById('feedbackMessage').value.trim();
      
      if (!email || !message) {
        alert('Please fill in email and feedback message');
        return;
      }
      
      const statusDiv = document.getElementById('feedbackStatus');
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Sending feedback...</p></div>';
      
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, rating: parseInt(rating), message })
        });
        
        const data = await response.json();
        
        if (data.success) {
          statusDiv.innerHTML = '<div style="background: #e8f5e9; border: 1px solid #a5d6a7; color: #2e7d32; padding: 12px; border-radius: 8px;">✅ Thank you for your feedback! We appreciate your input.</div>';
          document.getElementById('feedbackName').value = '';
          document.getElementById('feedbackEmail').value = '';
          document.getElementById('feedbackMessage').value = '';
          document.getElementById('feedbackRating').value = '5';
          currentRating = 5;
          
          // Reset rating buttons
          const buttons = document.querySelectorAll('[onclick*="setRating"]');
          buttons.forEach((btn, idx) => {
            if (idx < 5) {
              btn.style.background = 'var(--surface-black)';
              btn.style.color = 'var(--cream)';
              btn.style.borderColor = 'var(--surface-black)';
            } else {
              btn.style.background = 'var(--bg-darker)';
              btn.style.color = 'var(--text-light)';
              btn.style.borderColor = 'var(--border)';
            }
          });
          
          setTimeout(() => {
            statusDiv.style.display = 'none';
          }, 5000);
        } else {
          statusDiv.innerHTML = '<div style="background: #fdecea; border: 1px solid #f5c6cb; color: #c62828; padding: 12px; border-radius: 8px;">❌ Error: ' + (data.error || 'Failed to submit feedback') + '</div>';
        }
      } catch (error) {
        statusDiv.innerHTML = '<div style="background: #fdecea; border: 1px solid #f5c6cb; color: #c62828; padding: 12px; border-radius: 8px;">❌ Error: ' + error.message + '</div>';
      }
    }
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
    db.addTask(task);

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

    const weeklyPlan = {
      id: Date.now(),
      goals,
      revenue,
      timeblocks,
      plan,
      createdAt: new Date().toISOString()
    };

    weeklyPlans.push(weeklyPlan);
    db.addWeeklyPlan(weeklyPlan);

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

// Submit feedback
app.post('/api/feedback', (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message required', success: false });
    }

    const feedback = {
      id: Date.now(),
      name: name || 'Anonymous',
      email,
      rating: rating || 5,
      message,
      createdAt: new Date().toISOString()
    };

    db.addFeedback(feedback);

    res.json({
      success: true,
      feedback,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to submit feedback',
      success: false
    });
  }
});

// Get all feedback (admin endpoint)
app.get('/api/feedback', (req, res) => {
  try {
    const feedback = db.getFeedback();
    res.json({
      success: true,
      feedback,
      count: feedback.length
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
