#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getBookContext(query) {
  if(!pineconeIndex) { console.log('RAG: no pinecone index'); return ''; }
  try {
    const embRes = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1024
    });
    const queryVec = embRes.data[0].embedding;
    const results = await pineconeIndex.query({
      vector: queryVec,
      topK: 3,
      includeMetadata: true
    });
    console.log('RAG results:', results.matches ? results.matches.length : 0, 'matches');
    if(results.matches && results.matches.length > 0) {
      console.log('RAG top score:', results.matches[0].score);
      console.log('RAG top text:', results.matches[0].metadata.text.substring(0, 100));
    }
    if(!results.matches || results.matches.length === 0) return '';
    const context = results.matches
      .filter(m => m.score > 0.2)
      .map(m => m.metadata.text)
      .join('\n\n');
    console.log('RAG context length:', context.length);
    return context ? '\n\nRelevant context from The Essential EA by Kristina Spencer:\n' + context : '';
  } catch(e) {
    console.log('RAG query failed:', e.message);
    return '';
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
let pineconeIndex = null;

const RAILWAY = 'https://essential-ea-app-production.up.railway.app';
const VERCEL = 'https://essential-ea-unified.vercel.app';

function safeParseAI(text) {
  if(!text) return null;
  let t = text.trim();
  // Strip markdown code blocks
  if(t.includes('`')) {
    t = t.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  // Find JSON object
  const match = t.match(/\{[\s\S]*\}/);
  if(match) t = match[0];
  // Try direct parse
  try { return JSON.parse(t); } catch(e1) {
    // Try fixing common AI JSON issues
    try {
      // Fix unescaped newlines in strings
      let fixed = t.replace(/([^\\])\n/g, '$1 ')
                   .replace(/([^\\])\r/g, '$1 ')
                   .replace(/\t/g, ' ')
                   // Fix trailing commas
                   .replace(/,\s*([}\]])/g, '$1')
                   // Fix unescaped quotes in values (basic)
                   .replace(/: "([^"]*)"([^,}\]\n])/g, ': "$1\"$2');
      return JSON.parse(fixed);
    } catch(e2) {
      // Last resort: extract key fields manually
      console.error('JSON parse failed:', e1.message, 'text:', t.substring(0,100));
      return null;
    }
  }
}

const METHODOLOGY_CONTEXT = 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours.';
if(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  pineconeIndex = pc.index(process.env.PINECONE_INDEX).namespace('');
  console.log('Pinecone RAG: Connected to', process.env.PINECONE_INDEX);
} else {
  console.log('Pinecone RAG: Not configured - running without book context');
}
const openai_key = process.env.OPENAI_API_KEY; // kept for Whisper transcription only


async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, description TEXT NOT NULL, classification VARCHAR(20), urgency VARCHAR(20), reason TEXT, recommended_action TEXT, confidence FLOAT, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS weekly_plans (id SERIAL PRIMARY KEY, goals TEXT, revenue TEXT, timeblocks TEXT, plan TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS daily_briefs (id SERIAL PRIMARY KEY, name TEXT, role TEXT, brief TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS feedback (id SERIAL PRIMARY KEY, name TEXT, email TEXT, rating INTEGER, message TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) DEFAULT 'default' UNIQUE,
      name VARCHAR(255),
      role VARCHAR(255),
      industry VARCHAR(255),
      company VARCHAR(255),
      revenue_target VARCHAR(255),
      team_size VARCHAR(50),
      timezone VARCHAR(100) DEFAULT 'America/Chicago',
      working_hours VARCHAR(100) DEFAULT '8am-6pm',
      peak_hours VARCHAR(100) DEFAULT '9am-12pm',
      priorities TEXT,
      protected_blocks TEXT,
      ai_tone VARCHAR(50) DEFAULT 'professional',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS google_tokens (id SERIAL PRIMARY KEY, user_id VARCHAR(255) DEFAULT 'default' UNIQUE, access_token TEXT, refresh_token TEXT, expiry_date BIGINT, email VARCHAR(255), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS microsoft_tokens (id SERIAL PRIMARY KEY, user_id VARCHAR(255) DEFAULT 'default' UNIQUE, access_token TEXT, refresh_token TEXT, expiry_date BIGINT, email VARCHAR(255), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    try { await sql`ALTER TABLE google_tokens ADD CONSTRAINT google_tokens_user_id_unique UNIQUE (user_id)`; } catch(e) {}
    try { await sql`ALTER TABLE microsoft_tokens ADD CONSTRAINT microsoft_tokens_user_id_unique UNIQUE (user_id)`; } catch(e) {}
    console.log('Database tables ready');
  } catch (err) {
    console.error('Database init error:', err.message);
  }
}

console.log('\nStarting Essential EA...');
console.log('PORT:', PORT);
console.log('Anthropic Key:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing');
console.log('OpenAI Key (Whisper):', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('ElevenLabs Key:', process.env.ELEVENLABS_API_KEY ? 'Set' : 'Missing');
console.log('Database:', process.env.DATABASE_URL ? 'Connected' : 'Missing');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>The Essential EA</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;-webkit-text-size-adjust:100%}
body{font-family:'DM Sans',-apple-system,sans-serif;background:#FAF8F4;color:#1A1A18;overflow:hidden;-webkit-font-smoothing:antialiased}
:root{--blk:#1A1A18;--blk2:#222220;--blk3:#2C2C2A;--cream:#FAF8F4;--warm:#FFFEF9;--tan:#E8E2D8;--tan2:#D8D0C4;--mid:#8A8880;--gold:#C49A8A;--gold2:#A67868;--gl:#E8C4B8;--grn:#4A7A50;--amb:#A87830;--red:#8A3A30;--sw:240px;--th:54px}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes barGrow{from{width:0}}
@keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.shell{display:flex;height:100vh;width:100vw;overflow:hidden}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;pointer-events:none}
.overlay.open{display:block;pointer-events:all}
.sidebar{width:var(--sw);min-width:var(--sw);background:var(--blk);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;z-index:300;transition:transform .3s ease}
.sb-top{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
.sb-logo{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;color:#FAF8F4}
.sb-logo em{font-style:italic;font-weight:600;color:var(--gold)}
.sb-tag{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-top:4px}
.sb-user{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
.sb-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--blk);flex-shrink:0}
.sb-un{font-size:12.5px;font-weight:500;color:#FAF8F4}
.sb-role{font-size:10px;color:rgba(255,255,255,.3);margin-top:1px}
.sb-nav{flex:1;overflow-y:auto;padding:12px 0}
.sb-nav::-webkit-scrollbar{width:0}
.sb-sec{font-size:8.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.2);padding:10px 20px 4px}
.sb-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.45);border-left:2px solid transparent;transition:all .15s}
.sb-item:hover{color:#FAF8F4;background:rgba(255,255,255,.04)}
.sb-item.active{color:#FAF8F4;background:rgba(255,255,255,.06);border-left-color:var(--gold);font-weight:500}
.sb-icon{width:18px;text-align:center;font-size:14px;flex-shrink:0}
.sb-badge{margin-left:auto;background:var(--gold);color:var(--blk);font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px}
.sb-status{padding:12px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:8px;flex-shrink:0}
.sdot{width:6px;height:6px;border-radius:50%;background:#5A9A60;animation:pulse 2.5s ease-in-out infinite;flex-shrink:0}
.slbl{font-size:11px;color:rgba(255,255,255,.3)}
.slbl strong{color:var(--gold);font-weight:500}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{height:var(--th);background:var(--blk);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;padding:0 20px;gap:12px;flex-shrink:0}
.tb-menu{display:none;background:none;border:none;color:rgba(255,255,255,.6);font-size:20px;cursor:pointer;padding:4px;flex-shrink:0}
.tb-tw{flex:1;min-width:0}
.tb-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;color:#FAF8F4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tb-title em{font-style:italic;color:var(--gold)}
.tb-date{font-size:11px;color:rgba(255,255,255,.3)}
.tb-acts{display:flex;align-items:center;gap:8px;flex-shrink:0}
.tbtn{font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;border-radius:3px;border:none;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.tbtn-g{background:transparent;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.5)}
.tbtn-g:hover{border-color:var(--gold);color:var(--gold)}
.tbtn-p{background:#FAF8F4;color:#1A1A18}
.tbtn-p:hover{background:#E8E2D8}
.content{flex:1;overflow-y:auto;overflow-x:hidden;padding:24px;background:var(--cream);-webkit-overflow-scrolling:touch}
.content::-webkit-scrollbar{width:4px}
.content::-webkit-scrollbar-thumb{background:var(--tan2);border-radius:2px}
.screen{display:none;animation:fadeUp .3s ease}
.screen.active{display:block}
.pg-h{font-family:'Cormorant Garamond',serif;font-size:clamp(1.4rem,4vw,2rem);font-weight:300;color:var(--blk);margin-bottom:3px}
.pg-h em{font-style:italic;font-weight:600;color:var(--gold2)}
.pg-s{font-size:13px;color:var(--mid);margin-bottom:24px}
.pg-h2{font-family:'Cormorant Garamond',serif;font-size:clamp(1.3rem,3.5vw,1.8rem);font-weight:300;color:var(--blk);margin-bottom:4px}
.pg-s2{font-size:12px;color:var(--mid);margin-bottom:22px}
.panel{background:var(--warm);border:1px solid var(--tan);border-radius:10px;overflow:hidden}
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 12px;border-bottom:1px solid var(--tan)}
.pt{font-size:11px;font-weight:600;color:var(--blk);letter-spacing:.07em;text-transform:uppercase}
.pl{font-size:10px;color:var(--gold2);background:transparent;border:none;cursor:pointer;font-weight:600;letter-spacing:.05em;text-transform:uppercase;font-family:'DM Sans',sans-serif}
.pb{padding:14px 18px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.kpi{background:var(--warm);border:1px solid var(--tan);border-top:2px solid var(--tan);border-radius:10px;padding:16px 18px;transition:all .2s}
.kpi:hover{border-top-color:var(--gold);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.06)}
.kv{font-family:'Cormorant Garamond',serif;font-size:clamp(1.6rem,4vw,2.1rem);font-weight:300;line-height:1;color:var(--blk);margin-bottom:5px}
.kl{font-size:10px;color:var(--mid);letter-spacing:.07em;text-transform:uppercase}
.kd{font-size:11px;margin-top:6px}
.up{color:var(--grn)}
.dg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.col{display:flex;flex-direction:column;gap:14px}
.cw{grid-column:span 2;display:flex;flex-direction:column;gap:14px}
.pi{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--tan)}
.pi:last-child{border-bottom:none}
.pg2,.pb3{width:26px;height:26px;border-radius:50%;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:12px}
.pg2{background:rgba(196,154,138,.12);border:1px solid rgba(196,154,138,.25)}
.pb3{background:rgba(138,58,48,.08);border:1px solid rgba(138,58,48,.18)}
.pib{flex:1;min-width:0}
.pit{font-size:13px;font-weight:500;color:var(--blk);margin-bottom:2px;line-height:1.35}
.pin{font-size:10.5px;color:var(--mid);line-height:1.4}
.ptm{font-size:10px;color:var(--mid);white-space:nowrap;flex-shrink:0;margin-top:3px}
.ai-box{background:var(--blk);border-radius:10px;padding:16px 18px}
.ai-lbl{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.ai-txt{font-size:12.5px;color:rgba(245,240,232,.55);line-height:1.75}
.ai-txt strong{color:var(--gl);font-weight:500}
.ai-acts{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.abtn{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:8px 14px;border-radius:3px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.abtn-p{background:#FAF8F4;color:#1A1A18}
.abtn-g{background:transparent;color:rgba(245,240,232,.4);border:1px solid rgba(255,255,255,.12)}
.tl-item{display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--tan)}
.tl-item:last-child{border-bottom:none}
.tl-time{font-size:10px;color:var(--mid);width:36px;flex-shrink:0;padding-top:2px}
.tl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px}
.dot-gold{background:var(--gold)}.dot-grn{background:var(--grn)}.dot-amb{background:var(--amb)}.dot-dim{background:var(--tan2)}
.tl-n{font-size:12.5px;color:var(--blk);font-weight:500;margin-bottom:2px}
.tl-s{font-size:10px;color:var(--mid)}
.ring-wrap{display:flex;align-items:center;gap:14px;padding:4px 0;margin-bottom:14px}
.ring{position:relative;width:62px;height:62px;flex-shrink:0}
.ring svg{transform:rotate(-90deg)}
.ring-val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:300;color:var(--blk)}
.ring-lbl{font-size:12.5px;color:var(--blk);font-weight:500;margin-bottom:3px}
.ring-sub{font-size:10px;color:var(--mid);line-height:1.5}
.m-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--tan);font-size:12px}
.m-row:last-child{border-bottom:none}
.m-name{color:var(--mid)}.m-val{font-weight:600;color:var(--blk)}
.bar-wrap{width:60px;height:2px;background:var(--tan);border-radius:2px;overflow:hidden}
.bar{height:100%;background:var(--gold);border-radius:2px;animation:barGrow .8s ease .3s both}
.pw-layout{display:grid;grid-template-columns:300px 1fr;gap:18px;align-items:start}
.setup-card{background:var(--warm);border:1px solid var(--tan);border-radius:10px;overflow:hidden}
.setup-head{padding:14px 18px;border-bottom:1px solid var(--tan);font-size:11px;font-weight:600;color:var(--blk);letter-spacing:.07em;text-transform:uppercase}
.setup-body{padding:18px}
.fl{font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--gold2);margin-bottom:6px}
.fi,.fa{width:100%;background:var(--cream);border:1px solid var(--tan);border-radius:4px;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--blk);outline:none;transition:border-color .15s;margin-bottom:14px}
.fa{resize:vertical;min-height:80px}
.fi:focus,.fa:focus{border-color:var(--gold)}
.fi::placeholder,.fa::placeholder{color:var(--mid)}
.gen-btn{width:100%;background:var(--blk);color:#FAF8F4;border:none;border-radius:4px;padding:13px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .15s}
.gen-btn:hover{background:var(--blk3)}
.gen-btn:disabled{opacity:.5;cursor:not-allowed}
.week-card{background:var(--warm);border:1px solid var(--tan);border-radius:10px;overflow:hidden}
.week-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--tan)}
.week-title{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:300;color:var(--blk)}
.week-title em{font-style:italic;color:var(--gold2)}
.week-meta{font-size:10px;color:var(--mid)}
.day-grid{display:grid;grid-template-columns:repeat(5,1fr);border-bottom:1px solid var(--tan)}
.day-col{border-right:1px solid var(--tan)}
.day-col:last-child{border-right:none}
.day-hd{padding:9px 10px;border-bottom:1px solid var(--tan);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mid)}
.day-hd.today{color:var(--gold2)}
.day-tasks{padding:8px}
.d-task{border-radius:3px;padding:6px 8px;margin-bottom:5px;border-left:2px solid var(--tan);background:var(--cream)}
.d-task.crystal{border-left-color:var(--gold)}
.d-task.bouncy{border-left-color:rgba(138,58,48,.4)}
.d-task.block{border-left-color:var(--grn);background:rgba(74,122,80,.05)}
.dt-name{font-size:10.5px;color:var(--blk);font-weight:500;line-height:1.3;margin-bottom:2px}
.dt-time{font-size:9px;color:var(--mid)}
.dt-tag{display:inline-block;font-size:7.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:1px 5px;border-radius:2px;margin-top:3px}
.tag-c{background:rgba(196,154,138,.12);color:var(--gold2)}
.tag-b{background:rgba(138,58,48,.08);color:#A86050}
.tag-p{background:rgba(74,122,80,.1);color:var(--grn)}
.pw-note{padding:12px 18px;border-top:1px solid var(--tan);font-size:12px;color:var(--mid);line-height:1.7}
.pw-note strong{color:var(--gold2);font-weight:500}
.triage-row{display:flex;gap:10px;margin-bottom:14px}
.triage-in{flex:1;background:var(--warm);border:1px solid var(--tan);border-radius:4px;padding:12px 14px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--blk);outline:none;transition:border-color .15s}
.triage-in:focus{border-color:var(--gold)}
.triage-in::placeholder{color:var(--mid)}
.triage-btn{background:var(--blk);color:#FAF8F4;border:none;border-radius:4px;padding:12px 18px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0}
.triage-btn:disabled{opacity:.5;cursor:not-allowed}
.t-result-box{background:var(--blk);border-radius:10px;padding:16px 18px;margin-bottom:18px;animation:popIn .25s ease}
.tr-hd{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.tr-em{font-size:24px;flex-shrink:0}
.tr-ti{font-size:17px;font-weight:600;color:#FAF8F4}
.tr-meta{display:flex;gap:14px;margin-bottom:10px;font-size:12px}
.tr-meta span{color:rgba(245,240,232,.45)}
.tr-meta strong{color:var(--gold)}
.tr-body{font-size:12.5px;color:rgba(245,240,232,.55);line-height:1.7;margin-bottom:8px}
.tr-act{display:inline-block;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:2px;background:rgba(196,154,138,.15);color:var(--gold)}
.t-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tc-head{padding:13px 16px 11px;border-radius:10px 10px 0 0;border:1px solid var(--tan);border-bottom:none;display:flex;align-items:center;gap:10px}
.tc-head.ch{background:rgba(196,154,138,.05)}
.tc-head.bh{background:rgba(138,58,48,.04)}
.tc-icon{font-size:17px}
.tc-title{font-size:12.5px;font-weight:600;color:var(--blk)}
.tc-sub{font-size:9.5px;color:var(--mid);margin-top:1px}
.tc-count{margin-left:auto;font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:9px}
.cc{background:rgba(196,154,138,.12);color:var(--gold2)}
.bc{background:rgba(138,58,48,.1);color:#A86050}
.tc-list{border:1px solid var(--tan);border-top:none;border-radius:0 0 10px 10px;background:var(--warm);min-height:80px}
.t-item{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-bottom:1px solid var(--tan);cursor:pointer;transition:background .15s}
.t-item:last-child{border-bottom:none}
.t-item:hover{background:var(--cream)}
.ti-icon{font-size:14px;flex-shrink:0;margin-top:2px}
.ti-body{flex:1;min-width:0}
.ti-task{font-size:12.5px;font-weight:500;color:var(--blk);margin-bottom:2px;line-height:1.35}
.ti-reason{font-size:10px;color:var(--mid);line-height:1.45}
.ti-badge{flex-shrink:0;font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:2px;margin-top:2px;white-space:nowrap}
.badge-u{background:rgba(196,154,138,.12);color:var(--gold2)}
.badge-f{background:rgba(168,120,48,.1);color:var(--amb)}
.badge-e{background:var(--cream);color:var(--mid);border:1px solid var(--tan)}
.empty{padding:24px 14px;text-align:center;font-size:12px;color:var(--mid);font-style:italic}
.inbox-wrap{display:grid;grid-template-columns:280px 1fr;height:calc(100vh - var(--th) - 48px);border:1px solid var(--tan);border-radius:10px;overflow:hidden}
.inbox-list{background:var(--warm);border-right:1px solid var(--tan);overflow-y:auto;display:flex;flex-direction:column}
.inbox-head{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--tan);position:sticky;top:0;background:var(--warm);z-index:1;flex-shrink:0}
.inbox-head-title{font-size:11px;font-weight:600;color:var(--blk);letter-spacing:.07em;text-transform:uppercase}
.inbox-count{background:var(--blk);color:#FAF8F4;font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:9px}
.filter-row{display:flex;padding:8px 10px;border-bottom:1px solid var(--tan);gap:3px;flex-shrink:0;flex-wrap:wrap}
.fpill{font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:4px 8px;border:none;background:transparent;cursor:pointer;color:var(--mid);border-radius:3px;transition:all .15s;font-family:'DM Sans',sans-serif}
.fpill.active{background:var(--blk);color:#FAF8F4}
.msg{padding:12px 14px;border-bottom:1px solid var(--tan);cursor:pointer;transition:background .15s;border-left:2px solid transparent}
.msg:hover{background:var(--cream)}
.msg.active{background:rgba(196,154,138,.06);border-left-color:var(--gold)}
.msg.unread .msg-sub{color:var(--blk);font-weight:600}
.msg.flagged{border-left-color:var(--amb)}
.msg-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px}
.msg-from{font-size:12.5px;font-weight:500;color:var(--blk)}
.msg-when{font-size:10px;color:var(--mid);flex-shrink:0}
.msg-sub{font-size:11px;color:#6A6860;margin-bottom:3px}
.msg-prev{font-size:10px;color:var(--mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msg-tags{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}
.mtag{font-size:7.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 5px;border-radius:2px}
.mt-you{background:rgba(196,154,138,.12);color:var(--gold2)}
.mt-ea{background:rgba(74,122,80,.1);color:var(--grn)}
.mt-none{background:var(--cream);color:var(--mid);border:1px solid var(--tan)}
.mt-urgent{background:rgba(138,58,48,.1);color:#A86050}
.udot{width:5px;height:5px;border-radius:50%;background:var(--gold);display:inline-block;margin-right:5px;vertical-align:middle}
.msg-detail{background:var(--cream);display:flex;flex-direction:column;overflow:hidden}
.detail-head{padding:14px 20px;border-bottom:1px solid var(--tan);display:flex;align-items:flex-start;justify-content:space-between;background:var(--warm);flex-shrink:0}
.detail-subject{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:300;color:var(--blk);margin-bottom:4px}
.detail-meta{font-size:11px;color:var(--mid);line-height:1.6}
.detail-meta strong{color:#6A6860}
.detail-acts{display:flex;gap:6px;flex-shrink:0;margin-left:12px}
.d-btn{font-size:9.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;padding:6px 12px;border-radius:3px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap}
.d-ghost{background:transparent;border:1px solid var(--tan);color:var(--mid)}
.d-primary{background:#2C2C2A;color:#FAF8F4;border:1px solid rgba(255,255,255,.15)}
.ai-routing{margin:14px 20px 0;background:var(--blk);border-radius:6px;padding:12px 16px;display:flex;align-items:flex-start;gap:10px;flex-shrink:0}
.ar-icon{font-size:15px;flex-shrink:0;margin-top:1px}
.ar-text{font-size:12px;color:rgba(245,240,232,.5);line-height:1.65}
.ar-text strong{color:var(--gl);font-weight:500}
.ar-pills{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.ar-pill{font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif}
.arp-h{background:rgba(196,154,138,.12);color:var(--gold);border:1px solid rgba(196,154,138,.2)}
.arp-f{background:rgba(168,120,48,.1);color:#C8963A;border:1px solid rgba(168,120,48,.2)}
.detail-body{flex:1;overflow-y:auto;padding:16px 20px;font-size:13px;color:#6A6860;line-height:1.85}
.detail-reply{border-top:1px solid var(--tan);padding:12px 20px;display:flex;gap:8px;align-items:flex-end;background:var(--warm);flex-shrink:0}
.reply-input{flex:1;background:var(--cream);border:1px solid var(--tan);border-radius:4px;padding:9px 12px;resize:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--blk);outline:none;min-height:40px}
.reply-input:focus{border-color:var(--gold)}
.reply-input::placeholder{color:var(--mid)}
.reply-send{background:#2C2C2A;color:#FAF8F4;border:none;border-radius:4px;padding:9px 16px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
.ops-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:18px}
.ops-card{background:var(--warm);border:1px solid var(--tan);border-radius:10px;padding:20px;cursor:pointer;transition:all .2s}
.ops-card:hover{border-color:var(--gold);transform:translateY(-2px)}
.ops-icon{font-size:28px;margin-bottom:10px}
.ops-title{font-size:13.5px;font-weight:600;color:var(--blk);margin-bottom:4px}
.ops-desc{font-size:11.5px;color:var(--mid)}
.cs{background:var(--warm);border:1px solid var(--tan);border-radius:10px;padding:20px}
.cs-title{font-size:13.5px;font-weight:600;color:var(--blk);margin-bottom:8px}
.cs-body{font-size:13px;color:var(--mid);line-height:1.6}
.s-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px}
.s-card{background:var(--warm);border:1px solid var(--tan);border-radius:10px;padding:18px;cursor:pointer;transition:all .2s}
.s-card:hover{border-color:var(--gold);transform:translateY(-2px)}
.s-icon{font-size:26px;margin-bottom:10px}
.s-title{font-size:13.5px;font-weight:600;color:var(--blk);margin-bottom:4px}
.s-desc{font-size:11.5px;color:var(--mid)}
.r-row{display:flex;gap:6px;margin-top:8px}
.r-btn{flex:1;padding:9px 4px;background:var(--cream);border:1px solid var(--tan);border-radius:4px;color:var(--mid);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;text-align:center}
.r-btn.sel{background:var(--blk);color:#FAF8F4;border-color:var(--blk)}
.spin-wrap{display:flex;align-items:center;gap:10px;padding:20px;color:var(--mid);font-size:13px}
.spinner{width:18px;height:18px;border:2px solid var(--tan);border-top-color:var(--blk);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
.fg{margin-bottom:16px}
.fl2{display:block;font-size:13px;font-weight:600;color:var(--blk);margin-bottom:6px}
.fi2,.fa2{width:100%;padding:11px 14px;background:var(--warm);border:1px solid var(--tan);border-radius:4px;color:var(--blk);font-family:'DM Sans',sans-serif;font-size:13.5px;outline:none;transition:border-color .15s}
.fi2:focus,.fa2:focus{border-color:var(--gold)}
.fa2{resize:vertical;min-height:90px}
.sub-btn{width:100%;padding:12px 24px;background:#2C2C2A;color:#FAF8F4;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13.5px;font-family:'DM Sans',sans-serif}
.alert{padding:12px 14px;border-radius:4px;font-size:13px;margin-top:10px}
.alert-ok{background:#e8f5e9;border:1px solid #a5d6a7;color:#2e7d32}
.alert-err{background:#fdecea;border:1px solid #f5c6cb;color:#c62828}
.brief-box{background:var(--blk);border-radius:10px;padding:20px;margin-top:16px;animation:popIn .25s ease}
.brief-box pre{white-space:pre-wrap;font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(245,240,232,.7);line-height:1.85}
.history-item{background:var(--warm);border:1px solid var(--tan);border-radius:8px;padding:14px;margin-bottom:10px}
.history-date{font-size:10px;color:var(--mid);margin-bottom:6px}
.history-text{font-size:13px;color:var(--blk);line-height:1.6}
.audit-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
.audit-score-card{background:var(--warm);border:1px solid var(--tan);border-radius:10px;padding:20px;transition:all .2s}
.audit-score-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.06)}
.audit-score-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.audit-score-title{font-size:12px;font-weight:600;color:var(--blk);letter-spacing:.04em}
.audit-score-val{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;line-height:1}
.audit-score-val.excellent{color:var(--grn)}
.audit-score-val.good{color:var(--gold2)}
.audit-score-val.needs-work{color:var(--amb)}
.audit-score-val.critical{color:var(--red)}
.audit-bar-wrap{height:6px;background:var(--tan);border-radius:3px;overflow:hidden;margin-bottom:10px}
.audit-bar{height:100%;border-radius:3px;animation:barGrow .8s ease .3s both;transition:width .5s ease}
.audit-bar.excellent{background:var(--grn)}
.audit-bar.good{background:var(--gold)}
.audit-bar.needs-work{background:var(--amb)}
.audit-bar.critical{background:var(--red)}
.audit-insight{font-size:11.5px;color:var(--mid);line-height:1.6;margin-bottom:8px}
.audit-action{font-size:10.5px;font-weight:600;color:var(--gold2);letter-spacing:.04em}
.health-ring-wrap{display:flex;align-items:center;gap:24px;background:var(--blk);border-radius:10px;padding:24px;margin-bottom:22px}
.health-ring{position:relative;width:100px;height:100px;flex-shrink:0}
.health-ring svg{transform:rotate(-90deg)}
.health-ring-val{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.health-ring-num{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;color:#FAF8F4;line-height:1}
.health-ring-lbl{font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:rgba(245,240,232,.4);margin-top:2px}
.health-info{flex:1}
.health-title{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:300;color:#FAF8F4;margin-bottom:6px}
.health-sub{font-size:12.5px;color:rgba(245,240,232,.5);line-height:1.7;margin-bottom:12px}
.health-sub strong{color:var(--gl);font-weight:500}
.audit-gen-btn{background:#FAF8F4;color:#1A1A18;border:none;border-radius:4px;padding:10px 20px;font-family:"DM Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .15s}
.audit-gen-btn:hover{background:#E8E2D8}
.audit-gen-btn:disabled{opacity:.5;cursor:not-allowed}
.audit-ai-box{background:var(--blk);border-radius:10px;padding:20px;margin-bottom:22px}
.audit-ai-title{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
.audit-ai-text{font-size:13px;color:rgba(245,240,232,.6);line-height:1.85}
.audit-ai-text strong{color:var(--gl);font-weight:500}
.audit-cta{background:linear-gradient(135deg,#222220,#1A1A18);border:1px solid rgba(196,154,138,.3);border-radius:10px;padding:24px;margin-top:22px;text-align:center}
.audit-cta-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:300;color:#FAF8F4;margin-bottom:8px}
.audit-cta-sub{font-size:12.5px;color:rgba(245,240,232,.45);margin-bottom:16px;line-height:1.6}
.audit-cta-btn{background:#FAF8F4;color:#1A1A18;border:none;border-radius:4px;padding:12px 28px;font-family:"DM Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
@media(max-width:768px){.audit-grid{grid-template-columns:1fr}.health-ring-wrap{flex-direction:column;text-align:center}}
.ea-actions{margin-top:14px;border-top:1px solid rgba(255,255,255,.1);padding-top:14px}
.ea-actions-title{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.ea-action-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.ea-action-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:10px 12px;cursor:pointer;font-family:"DM Sans",sans-serif;transition:all .2s;text-align:left}
.ea-action-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25)}
.ea-action-icon{font-size:16px;margin-bottom:4px}
.ea-action-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FAF8F4;display:block}
.ea-action-desc{font-size:9.5px;color:rgba(245,240,232,.4);margin-top:2px}
.ea-result{margin-top:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:14px;display:none}
.ea-result.show{display:block}
.ea-result-label{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
.ea-result-content{font-size:12.5px;color:rgba(245,240,232,.7);line-height:1.75;white-space:pre-wrap}
.ea-result-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.ea-copy-btn{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;border-radius:3px;border:1px solid #E8E2D8;cursor:pointer;font-family:"DM Sans",sans-serif;background:#FAF8F4;color:#1A1A18}
.ea-clear-btn{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;border-radius:3px;border:1px solid rgba(255,255,255,.15);cursor:pointer;font-family:"DM Sans",sans-serif;background:transparent;color:rgba(245,240,232,.5)}
.doc-upload-area{border:2px dashed rgba(196,154,138,.3);border-radius:8px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:16px;background:var(--warm)}
.doc-upload-area:hover{border-color:var(--gold);background:rgba(196,154,138,.05)}
.doc-upload-area.drag-over{border-color:var(--gold);background:rgba(196,154,138,.08)}
.doc-upload-icon{font-size:28px;margin-bottom:8px}
.doc-upload-title{font-size:13px;font-weight:600;color:var(--blk);margin-bottom:4px}
.doc-upload-sub{font-size:11px;color:var(--mid)}
.doc-result{background:var(--blk);border-radius:10px;padding:20px;margin-top:16px;display:none}
.doc-result.show{display:block}
.doc-result pre{white-space:pre-wrap;font-family:"DM Sans",sans-serif;font-size:12.5px;color:rgba(245,240,232,.7);line-height:1.85}
.ea-task-list{background:var(--warm);border:1px solid var(--tan);border-radius:10px;overflow:hidden;margin-top:16px}
.ea-task-item{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--tan)}
.ea-task-item:last-child{border-bottom:none}
.ea-task-check{width:18px;height:18px;border-radius:3px;border:2px solid var(--tan);flex-shrink:0;margin-top:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px}
.ea-task-check.done{background:var(--grn);border-color:var(--grn);color:#fff}
.ea-task-body{flex:1}
.ea-task-title{font-size:13px;font-weight:500;color:var(--blk);margin-bottom:3px}
.ea-task-instruction{font-size:11px;color:var(--mid);line-height:1.5}
.ea-task-tag{font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:2px;background:rgba(138,58,48,.08);color:#A86050;margin-top:4px;display:inline-block}
.play-btn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid rgba(255,255,255,.2);border-radius:3px;padding:5px 10px;cursor:pointer;font-family:"DM Sans",sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(245,240,232,.5);transition:all .15s;margin-top:8px}
.play-btn:hover{border-color:var(--gold);color:var(--gold)}
.play-btn.playing{border-color:var(--gold);color:var(--gold);background:rgba(196,154,138,.1)}
.play-btn svg{width:10px;height:10px;fill:currentColor}
.play-btn-light{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--tan);border-radius:3px;padding:5px 10px;cursor:pointer;font-family:"DM Sans",sans-serif;font-size:9.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mid);transition:all .15s;margin-top:8px}
.play-btn-light:hover{border-color:var(--gold);color:var(--gold2)}
.play-btn-light.playing{border-color:var(--gold);color:var(--gold2);background:rgba(196,154,138,.05)}
@media(max-width:1024px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.dg{grid-template-columns:1fr 1fr}.cw{grid-column:span 2}.pw-layout{grid-template-columns:1fr}.s-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:768px){
  .sidebar{position:fixed;left:0;top:0;bottom:0;transform:translateX(-100%);z-index:300}
  .sidebar.open{transform:translateX(0)}
  .tb-menu{display:block}
  .tb-acts .tbtn-g{display:none}
  .content{padding:16px}
  .kpi-grid{grid-template-columns:1fr 1fr;gap:10px}
  .dg{grid-template-columns:1fr}
  .cw{grid-column:span 1}
  .pw-layout{grid-template-columns:1fr}
  .day-grid{grid-template-columns:repeat(5,minmax(130px,1fr));overflow-x:auto}
  .t-cols{grid-template-columns:1fr}
  .triage-row{flex-direction:column}
  .triage-btn{width:100%}
  .inbox-wrap{grid-template-columns:1fr;height:calc(100vh - var(--th) - 80px)}
  .msg-detail{display:none}
  .inbox-wrap.detail-open .inbox-list{display:none}
  .inbox-wrap.detail-open .msg-detail{display:flex}
  .detail-head{flex-direction:column;gap:10px}
  .detail-acts{margin-left:0}
  .ops-grid{grid-template-columns:1fr}
  .s-grid{grid-template-columns:1fr}
  .tb-date{display:none}
}
</style>
</head>
<body>
<div class="overlay" id="overlay" onclick="closeSB()"></div>
<div class="shell">
<aside class="sidebar" id="sidebar">
  <div class="sb-top">
    <div class="sb-logo">The <em>Essential</em> EA</div>
    <div class="sb-tag">Operational Intelligence</div>
  </div>
  <div class="sb-user">
    <div class="sb-av">KS</div>
    <div><div class="sb-un">Kristina Spencer</div><div class="sb-role">Broker - Team Lead</div></div>
  </div>
  <nav class="sb-nav">
    <div class="sb-sec">Overview</div>
    <div class="sb-item active" onclick="nav('dashboard',this)"><span class="sb-icon">&#9645;</span>Dashboard</div>
    <div class="sb-sec">Your EA</div>
    <div class="sb-item" onclick="nav('brief',this)"><span class="sb-icon">&#9728;</span>EA Daily Brief</div>
    <div class="sb-item" onclick="nav('priorityweek',this)"><span class="sb-icon">&#128197;</span>Priority Week</div>
    <div class="sb-item" onclick="nav('triage',this)"><span class="sb-icon">&#128302;</span>Crystal Ball Triage<span class="sb-badge" id="tc">0</span></div>
    <div class="sb-item" onclick="nav('inbox',this)"><span class="sb-icon">&#9993;</span>Communication<span class="sb-badge">4</span></div>
    <div class="sb-item" onclick="nav('history',this)"><span class="sb-icon">&#128336;</span>History</div>
    <div class="sb-item" onclick="nav('docreader',this)"><span class="sb-icon">&#128196;</span>Document Reader</div>
    <div class="sb-item" onclick="nav('eatasklist',this)"><span class="sb-icon">&#9989;</span>EA Task List<span class="sb-badge" id="tl-badge">0</span></div>
    <div class="sb-item" onclick="nav('audit',this)"><span class="sb-icon">&#128202;</span>Operational Audit</div>
    <div class="sb-sec">Operations</div>
    <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#128101;</span>Team and Pipeline</div>
    <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#128176;</span>Financial Tracking</div>
    <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#128227;</span>Marketing Content</div>
    <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#127873;</span>Gifting and Database</div>
    <div class="sb-sec">Settings</div>
    <div class="sb-item" onclick="nav('settings',this)"><span class="sb-icon">&#9881;</span>Preferences</div>
    <div class="sb-item" onclick="nav('settings',this)"><span class="sb-icon">&#9711;</span>Account</div>
  </nav>
  <div class="sb-status"><div class="sdot"></div><span class="slbl">EA AI - <strong>Active</strong></span></div>
</aside>
<main class="main">
  <div class="topbar">
    <button class="tb-menu" onclick="openSB()">&#9776;</button>
    <div class="tb-tw"><div class="tb-title" id="tbt">Good morning, <em>Kristina.</em></div></div>
    <div class="tb-date" id="tbd"></div>
    <div class="tb-acts">
      <button class="tbtn tbtn-g">Weekly Report</button>
      <button class="tbtn tbtn-p" onclick="nav('triage',null)">+ Add Task</button>
    </div>
  </div>
  <div class="content" id="content">

    <div class="screen active" id="screen-dashboard">
      <div class="pg-h">Good morning, <em>Kristina.</em></div>
      <div class="pg-s">Your EA is ready. What needs your attention today?</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kv" id="k1">0</div><div class="kl">Total Tasks Analyzed</div><div class="kd up">All time</div></div>
        <div class="kpi"><div class="kv" id="k2">0</div><div class="kl">Crystal Ball</div><div class="kd" style="color:var(--mid)">Only you can do these</div></div>
        <div class="kpi"><div class="kv" id="k3">0</div><div class="kl">Bouncy Ball</div><div class="kd" style="color:var(--mid)">Delegate these</div></div>
        <div class="kpi"><div class="kv" id="k4">0%</div><div class="kl">Avg AI Confidence</div><div class="kd up">Accuracy</div></div>
      </div>
      <div class="dg">
        <div class="cw">
          <div class="panel">
            <div class="ph"><span class="pt">Today Priority Actions</span><button class="pl" onclick="nav('triage',document.querySelectorAll('.sb-item')[3])">Classify tasks</button></div>
            <div class="pb">
              <div class="pi"><div class="pg2">&#128302;</div><div class="pib"><div class="pit">Call Marcus Chen - listing follow-up</div><div class="pin">Crystal ball - Relationship at risk if not actioned today</div></div><div class="ptm">9:30 AM</div></div>
              <div class="pi"><div class="pg2">&#128302;</div><div class="pib"><div class="pit">Review Q1 commission report with CFO</div><div class="pin">Crystal ball - Financial stewardship cadence</div></div><div class="ptm">2:00 PM</div></div>
              <div class="pi"><div class="pb3">&#127934;</div><div class="pib"><div class="pit">Schedule team standup for next week</div><div class="pin">Bouncy ball - Delegated to EA</div></div><div class="ptm">EA owned</div></div>
              <div class="pi"><div class="pb3">&#127934;</div><div class="pib"><div class="pit">Order closing gift for the Rodriguez family</div><div class="pin">Bouncy ball - Gift preferences logged</div></div><div class="ptm">EA owned</div></div>
              <div class="pi"><div class="pg2">&#128302;</div><div class="pib"><div class="pit">Approve listing photos - 2847 Elmwood</div><div class="pin">Crystal ball - Your eye and your standard</div></div><div class="ptm">4:00 PM</div></div>
            </div>
          </div>
          <div class="ai-box">
            <div class="ai-lbl">EA AI Insight - This week</div>
            <div class="ai-txt">Your calendar shows <strong>6.5 hours of meeting time before 10am on Tuesday and Wednesday.</strong> Your EA recommends shifting team admin meetings to Thursday afternoon to protect your prime Crystal Ball hours.</div>
            <div class="ai-acts">
              <button class="abtn abtn-p" onclick="this.textContent='Approved';this.disabled=true">Approve change</button>
              <button class="abtn abtn-g" onclick="nav('brief',document.querySelectorAll('.sb-item')[1])">Get Daily Brief</button>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="panel">
            <div class="ph"><span class="pt">Today Schedule</span></div>
            <div class="pb" style="padding-top:10px">
              <div class="tl-item"><div class="tl-time">8:00</div><div class="tl-dot dot-grn"></div><div><div class="tl-n">EA Daily Brief</div><div class="tl-s">AI-generated and reviewed</div></div></div>
              <div class="tl-item"><div class="tl-time">9:30</div><div class="tl-dot dot-gold"></div><div><div class="tl-n">Marcus Chen call</div><div class="tl-s">Crystal ball - 30 min</div></div></div>
              <div class="tl-item"><div class="tl-time">11:00</div><div class="tl-dot dot-amb"></div><div><div class="tl-n">Listing photos review</div><div class="tl-s">2847 Elmwood - 45 min</div></div></div>
              <div class="tl-item"><div class="tl-time">12:30</div><div class="tl-dot dot-dim"></div><div><div class="tl-n">Lunch - protected</div><div class="tl-s">Boundary block - EA enforced</div></div></div>
              <div class="tl-item"><div class="tl-time">2:00</div><div class="tl-dot dot-gold"></div><div><div class="tl-n">CFO - Q1 review</div><div class="tl-s">Crystal ball - 60 min</div></div></div>
              <div class="tl-item"><div class="tl-time">5:30</div><div class="tl-dot dot-dim"></div><div><div class="tl-n">Hard stop</div><div class="tl-s">CEO Protection Protocol enforced</div></div></div>
            </div>
          </div>
          <div class="panel">
            <div class="ph"><span class="pt">Weekly Scorecard</span></div>
            <div class="pb">
              <div class="ring-wrap">
                <div class="ring">
                  <svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="25" fill="none" stroke="#E8E2D8" stroke-width="4.5"/><circle cx="31" cy="31" r="25" fill="none" stroke="#C49A8A" stroke-width="4.5" stroke-dasharray="157" stroke-dashoffset="20" stroke-linecap="round"/></svg>
                  <div class="ring-val">87</div>
                </div>
                <div><div class="ring-lbl">Operational Health</div><div class="ring-sub">Up 4 pts vs last week.<br>Crystal ball protection 94%.</div></div>
              </div>
              <div class="m-row"><span class="m-name">Crystal balls protected</span><span class="m-val" id="sc1">-</span><div class="bar-wrap"><div class="bar" id="sb1" style="width:0%"></div></div></div>
              <div class="m-row"><span class="m-name">Bouncy balls delegated</span><span class="m-val" id="sc2">-</span><div class="bar-wrap"><div class="bar" id="sb2" style="width:0%"></div></div></div>
              <div class="m-row"><span class="m-name">Total tasks classified</span><span class="m-val" id="sc3">-</span><div class="bar-wrap"><div class="bar" id="sb3" style="width:0%"></div></div></div>
              <div class="m-row"><span class="m-name">Avg confidence score</span><span class="m-val" id="sc4">-</span><div class="bar-wrap"><div class="bar" id="sb4" style="width:0%"></div></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen" id="screen-brief">
      <div class="pg-h2">EA Daily Brief</div>
      <div class="pg-s2">Your AI-generated morning brief. What your EA has handled and what needs your attention today.</div>
      <div class="setup-card" style="max-width:500px;margin-bottom:18px">
        <div class="setup-head">Generate Your Daily Brief</div>
        <div class="setup-body">
          <div class="fl">Your name</div>
          <input class="fi" id="brief-name" type="text" placeholder="e.g. Kristina">
          <div class="fl">Your role</div>
          <input class="fi" id="brief-role" type="text" placeholder="e.g. Real estate broker, financial advisor, coach...">
          <div class="fl">Top priorities this week</div>
          <textarea class="fa" id="brief-priorities" placeholder="e.g. Close the Elmwood listing, connect with 3 new buyer leads..."></textarea>
          <div class="fl">Your non-negotiable time blocks</div>
          <input class="fi" id="brief-blocks" type="text" placeholder="e.g. No meetings before 9am, hard stop at 5:30pm">
          <button class="gen-btn" id="brief-btn" onclick="generateBrief()">Generate My EA Daily Brief</button>
        </div>
      </div>
      <div id="brief-result" style="display:none"></div>
    </div>

    <div class="screen" id="screen-priorityweek">
      <div class="pg-h2">Priority Week Generator</div>
      <div class="pg-s2">Your AI-powered week built from your goals, time blocks, and the Essential EA methodology.</div>
      <div class="pw-layout">
        <div class="setup-card">
          <div class="setup-head">Generate Your Priority Week</div>
          <div class="setup-body">
            <div class="fl">Top goals this week</div>
            <textarea class="fa" id="goals" placeholder="e.g. Close the Elmwood listing, meet 3 buyer leads, Q1 review..."></textarea>
            <div class="fl">Revenue target</div>
            <input class="fi" id="revenue" type="text" placeholder="e.g. 45,000 GCI">
            <div class="fl">Non-negotiable time blocks</div>
            <textarea class="fa" id="timeblocks" style="min-height:70px" placeholder="e.g. No meetings before 9am, lunch 12:30-1:30, hard stop 5:30pm..."></textarea>
            <button class="gen-btn" id="gen-btn" onclick="generateWeek()">Generate My Priority Week</button>
          </div>
        </div>
        <div>
          <div class="week-card" id="week-preview">
            <div class="week-head">
              <div><div class="week-title">Sample Week - <em>Click Generate for Your Plan</em></div><div class="week-meta">Priority Week Framework - The Essential EA</div></div>
            </div>
            <div class="day-grid">
              <div class="day-col"><div class="day-hd today">Mon</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">Listing call</div><div class="dt-time">9:30 AM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task bouncy"><div class="dt-name">Team standup</div><div class="dt-time">11:00 AM</div><div class="dt-tag tag-b">EA Owned</div></div></div></div>
              <div class="day-col"><div class="day-hd">Tue</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">Buyer consult</div><div class="dt-time">10:00 AM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task bouncy"><div class="dt-name">Marketing</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div></div></div>
              <div class="day-col"><div class="day-hd">Wed</div><div class="day-tasks"><div class="d-task block"><div class="dt-name">Deep work</div><div class="dt-time">9-11 AM</div><div class="dt-tag tag-p">Protected</div></div><div class="d-task crystal"><div class="dt-name">Buyer consult</div><div class="dt-time">2:00 PM</div><div class="dt-tag tag-c">Crystal</div></div></div></div>
              <div class="day-col"><div class="day-hd">Thu</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">CFO review</div><div class="dt-time">2:00 PM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task bouncy"><div class="dt-name">Closing gifts</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div></div></div>
              <div class="day-col"><div class="day-hd">Fri</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">Photo approval</div><div class="dt-time">10:00 AM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task block"><div class="dt-name">Fri PM protected</div><div class="dt-time">1:00 PM+</div><div class="dt-tag tag-p">Protected</div></div></div></div>
            </div>
            <div class="pw-note"><strong>EA Note:</strong> Generate your plan above to see your personalized week.</div>
          </div>
          <div id="week-result" style="display:none"></div>
        </div>
      </div>
    </div>

    <div class="screen" id="screen-triage">
      <div class="pg-h2">Crystal Ball Triage</div>
      <div class="pg-s2">Type any task. Your EA AI classifies it instantly using the Crystal Ball and Bouncy Ball Framework from The Essential EA.</div>
      <div class="triage-row">
        <input class="triage-in" id="task-in" placeholder="e.g. Reply to vendor quote or Review counter offer from buyer..." onkeydown="if(event.key==='Enter')doClassify()">
        <button class="triage-btn" id="t-btn" onclick="doClassify()">Classify Task</button>
      </div>
      <div id="t-result" style="display:none"></div>
      <div class="t-cols">
        <div>
          <div class="tc-head ch"><div class="tc-icon">&#128302;</div><div><div class="tc-title">Crystal Ball Tasks</div><div class="tc-sub">Only you can do these - protect fiercely</div></div><div class="tc-count cc" id="c-badge">0</div></div>
          <div class="tc-list" id="c-list"><div class="empty">Classify tasks above to see them here.</div></div>
        </div>
        <div>
          <div class="tc-head bh"><div class="tc-icon">&#127934;</div><div><div class="tc-title">Bouncy Ball Tasks</div><div class="tc-sub">Delegate these - they bounce back</div></div><div class="tc-count bc" id="b-badge">0</div></div>
          <div class="tc-list" id="b-list"><div class="empty">Tasks your EA can own will appear here.</div></div>
        </div>
      </div>
    </div>

    <div class="screen" id="screen-history">
      <div class="pg-h2">Task History</div>
      <div class="pg-s2">Every task you have classified - saved permanently to your database.</div>
      <div id="history-list"><div class="spin-wrap"><div class="spinner"></div> Loading your history...</div></div>
    </div>

    <div class="screen" id="screen-inbox" style="padding:0">
      <div class="inbox-wrap" id="inbox-wrap">
        <div class="inbox-list">
          <div class="inbox-head"><span class="inbox-head-title">Communication Hub</span><span class="inbox-count">4 need you</span></div>
          <div class="filter-row">
            <button class="fpill active" onclick="filterMsgs('all',this)">All</button>
            <button class="fpill" onclick="filterMsgs('you',this)">Needs You</button>
            <button class="fpill" onclick="filterMsgs('ea',this)">EA Owned</button>
            <button class="fpill" onclick="filterMsgs('defer',this)">Deferred</button>
          </div>
          <div id="msg-list">
            <div class="msg unread active" data-tag="you" onclick="openMsg(0,this)"><div class="msg-header"><span class="msg-from"><span class="udot"></span>Marcus Chen</span><span class="msg-when">9:14 AM</span></div><div class="msg-sub">Counter offer - 2847 Elmwood Dr</div><div class="msg-prev">Reviewed the sellers position - think we can move...</div><div class="msg-tags"><span class="mtag mt-you">Needs You</span><span class="mtag mt-urgent">Urgent</span></div></div>
            <div class="msg unread" data-tag="ea" onclick="openMsg(1,this)"><div class="msg-header"><span class="msg-from"><span class="udot"></span>Sarah Kim - Lender</span><span class="msg-when">8:52 AM</span></div><div class="msg-sub">Referral partner meeting request</div><div class="msg-prev">Would love 20 minutes to explore a referral partnership...</div><div class="msg-tags"><span class="mtag mt-ea">EA Triaging</span></div></div>
            <div class="msg" data-tag="ea" onclick="openMsg(2,this)"><div class="msg-header"><span class="msg-from">Rodriguez Closing</span><span class="msg-when">Tue</span></div><div class="msg-sub">Closing confirmed - gift needed by Friday</div><div class="msg-prev">Title confirmed Thursday 2pm. Per your gift protocol...</div><div class="msg-tags"><span class="mtag mt-ea">EA Owned</span></div></div>
            <div class="msg unread" data-tag="you" onclick="openMsg(3,this)"><div class="msg-header"><span class="msg-from"><span class="udot"></span>Team Standup Bot</span><span class="msg-when">Mon</span></div><div class="msg-sub">Weekly scorecard - Action required</div><div class="msg-prev">2 team members missed their weekly task completion...</div><div class="msg-tags"><span class="mtag mt-you">Needs You</span></div></div>
            <div class="msg flagged" data-tag="defer" onclick="openMsg(4,this)"><div class="msg-header"><span class="msg-from">Office Supplies Vendor</span><span class="msg-when">Mon</span></div><div class="msg-sub">Quote renewal - Q2 supplies</div><div class="msg-prev">Updated pricing for Q2 as discussed...</div><div class="msg-tags"><span class="mtag mt-ea">EA Replied</span><span class="mtag mt-none">No Action</span></div></div>
          </div>
        </div>
        <div class="msg-detail" id="msg-detail">
          <div class="detail-head">
            <div style="flex:1;min-width:0"><div class="detail-subject" id="d-sub">Counter offer - 2847 Elmwood Dr</div><div class="detail-meta" id="d-meta">From <strong>Marcus Chen</strong> - Today 9:14 AM</div></div>
            <div class="detail-acts">
              <button class="d-btn d-ghost" id="back-btn" onclick="closeDetail()" style="display:none">Back</button>
              <button class="d-btn d-ghost">Forward to EA</button>
              <button class="d-btn d-primary">Reply</button>
            </div>
          </div>
          <div class="ai-routing"><div class="ar-icon">&#128302;</div><div><div class="ar-text" id="d-route"><strong>Crystal Ball - Needs You.</strong> Counter offer on active listing requires your direct judgment.</div><div class="ar-pills"><div class="ar-pill arp-h">Handle personally</div><div class="ar-pill arp-f">Schedule callback</div></div></div></div>
          <div class="detail-body" id="d-body"><p>Select a message from the list to read it here.</p></div>
          <div class="detail-reply"><textarea class="reply-input" id="reply-in" rows="2" placeholder="Type your reply..."></textarea><button class="reply-send" onclick="sendReply()">Send</button></div>
        </div>
      </div>
    </div>

    <div class="screen" id="screen-audit">
      <div class="pg-h2">Operational Efficiency Audit</div>
      <div class="pg-s2">Your AI-powered business health report. Built on the Essential EA methodology and your real usage data.</div>
      <div id="audit-content">
        <div class="spin-wrap"><div class="spinner"></div> Loading your audit data...</div>
      </div>
    </div>

        <div class="screen" id="screen-docreader">
      <div class="pg-h2">Document Reader</div>
      <div class="pg-s2">Upload any document. Your EA AI reads it, summarizes it, and classifies every action item as Crystal Ball or Bouncy Ball.</div>
      <div class="doc-upload-area" id="drop-zone" onclick="document.getElementById('doc-file-input').click()" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleDocDrop(event)">
        <input type="file" id="doc-file-input" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg" style="display:none" onchange="handleDocFile(this.files[0])">
        <div class="doc-upload-icon">&#128196;</div>
        <div class="doc-upload-title">Drop your document here or click to upload</div>
        <div class="doc-upload-sub">PDF, Word, Excel, TXT, CSV, Images supported - Any industry</div>
      </div>
      <div id="doc-result" class="doc-result">
        <div class="ai-lbl">EA Document Analysis</div>
        <pre id="doc-result-content"></pre>
        <button class="ea-copy-btn" style="margin-top:12px" onclick="navigator.clipboard.writeText(document.getElementById('doc-result-content').textContent).then(()=>this.textContent='Copied!').catch(()=>{})">Copy Analysis</button>
      </div>
    </div>

    <div class="screen" id="screen-eatasklist">
      <div class="pg-h2">EA Task List</div>
      <div class="pg-s2">Every Bouncy Ball task your EA is handling. These never touch your calendar.</div>
      <div id="ea-task-list-content">
        <div class="empty" style="padding:40px;text-align:center;color:var(--mid)">No tasks in your EA list yet. Classify a Bouncy Ball task and click Add to EA Task List.</div>
      </div>
    </div>

        <div class="screen" id="screen-operations">
      <div class="pg-h2">Operations</div>
      <div class="pg-s2">Your business infrastructure - coming online as the platform builds.</div>
      <div class="ops-grid">
        <div class="ops-card"><div class="ops-icon">&#128101;</div><div class="ops-title">Team and Pipeline</div><div class="ops-desc">Manage team members, roles, and deal pipeline.</div></div>
        <div class="ops-card"><div class="ops-icon">&#128176;</div><div class="ops-title">Financial Tracking</div><div class="ops-desc">GCI goals, commission tracking, stewardship cadence.</div></div>
        <div class="ops-card"><div class="ops-icon">&#128227;</div><div class="ops-title">Marketing Content</div><div class="ops-desc">AI-generated content from your brand guide.</div></div>
        <div class="ops-card"><div class="ops-icon">&#127873;</div><div class="ops-title">Gifting and Database</div><div class="ops-desc">Sphere touchpoints, closing gifts, relationship cadence.</div></div>
      </div>
      <div class="cs"><div class="cs-title">Full Operations Suite - Coming in Phase 3</div><div class="cs-body">Crystal Ball Triage, Priority Week, and EA Daily Brief are live now with full PostgreSQL persistence.</div></div>
    </div>

    <div class="screen" id="screen-settings">
      <div class="pg-h2">Settings</div>
      <div class="pg-s2">Manage your account, preferences, and integrations.</div>
      <div class="s-grid">
        <div class="s-card"><div class="s-icon">&#9881;</div><div class="s-title">Preferences</div><div class="s-desc">Customize notifications and EA behavior.</div></div>
        <div class="s-card"><div class="s-icon">&#128274;</div><div class="s-title">Security</div><div class="s-desc">Manage passwords and 2FA.</div></div>
        <div class="s-card"><div class="s-icon">&#128268;</div><div class="s-title">Integrations</div><div class="s-desc">Connect your CRM and business tools.</div></div>
        <div class="s-card"><div class="s-icon">&#128100;</div><div class="s-title">Account</div><div class="s-desc">Update your profile and billing.</div></div>
      </div>
      <div class="panel" style="margin-bottom:16px">
        <div class="ph"><span class="pt">Account Information</span></div>
        <div class="pb" style="display:grid;gap:12px;font-size:13.5px">
          <div><strong>Email:</strong> <span style="color:#8A8880">kristina@operationalconsultinggroup.com</span></div>
          <div><strong>Plan:</strong> <span style="color:#A67868;font-weight:600">Blueprint - 147 per month</span></div>
          <div><strong>Member Since:</strong> <span style="color:#8A8880">April 2026 - Founding Member</span></div>
          <div><strong>Database:</strong> <span style="color:var(--grn);font-weight:600">PostgreSQL Connected</span></div>
        </div>
      </div>
      <div class="panel">
        <div class="ph"><span class="pt">Send Feedback</span></div>
        <div class="pb">
          <div class="fg"><label class="fl2">Your Name (Optional)</label><input type="text" id="fb-name" class="fi2" placeholder="e.g. Kristina Spencer"></div>
          <div class="fg"><label class="fl2">Email Address</label><input type="email" id="fb-email" class="fi2" placeholder="your@email.com"></div>
          <div class="fg"><label class="fl2">Rate your experience</label><div class="r-row"><button class="r-btn" onclick="setR(1,this)">1</button><button class="r-btn" onclick="setR(2,this)">2</button><button class="r-btn" onclick="setR(3,this)">3</button><button class="r-btn" onclick="setR(4,this)">4</button><button class="r-btn sel" onclick="setR(5,this)">5</button></div><input type="hidden" id="fb-rating" value="5"></div>
          <div class="fg"><label class="fl2">Your Feedback</label><textarea id="fb-msg" class="fa2" placeholder="What is working well? What could be improved?"></textarea></div>
          <button class="sub-btn" onclick="submitFB()">Send Feedback</button>
          <div id="fb-status" style="display:none"></div>
        </div>
      </div>
    </div>

  </div>
</main>
</div>
<script>
const $ = id => document.getElementById(id);
const today = new Date();
const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
$('tbd').textContent = days[today.getDay()] + ', ' + months[today.getMonth()] + ' ' + today.getDate() + ', ' + today.getFullYear();
function openSB(){ $('sidebar').classList.add('open'); $('overlay').classList.add('open'); }
function closeSB(){ $('sidebar').classList.remove('open'); $('overlay').classList.remove('open'); }
const titles = { dashboard:'Good morning, <em>Kristina.</em>', brief:'EA Daily Brief', priorityweek:'Priority Week Generator', triage:'Crystal Ball Triage', inbox:'Communication Hub', history:'Task History', audit:'Operational Efficiency Audit', docreader:'Document Reader', eatasklist:'EA Task List', operations:'Operations', settings:'Settings' };
function nav(name, el) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  const sc = $('screen-' + name);
  if(sc) sc.classList.add('active');
  if(el) el.classList.add('active');
  $('tbt').innerHTML = titles[name] || name;
  closeSB();
  $('content').scrollTop = 0;
  if(name === 'dashboard' || name === 'triage') loadStats();
  if(name === 'history') loadFullHistory();
  if(name === 'audit') loadAudit();
  if(name === 'eatasklist') renderEATaskList();
}
async function loadAudit() {
  const el = document.getElementById('audit-content');
  el.innerHTML = '<div class="spin-wrap"><div class="spinner"></div> Generating your Operational Efficiency Audit...</div>';
  try {
    const r = await fetch('https://essential-ea-app-production.up.railway.app/api/audit');
    const d = await r.json();
    if(d.success) {
      const a = d.audit;
      const scoreClass = s => s >= 80 ? 'excellent' : s >= 65 ? 'good' : s >= 45 ? 'needs-work' : 'critical';
      const scoreLabel = s => s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 45 ? 'Needs Work' : 'Critical';
      const circum = 2 * Math.PI * 40;
      const offset = circum - (a.overall / 100) * circum;
      const ringColor = a.overall >= 80 ? '#4A7A50' : a.overall >= 65 ? '#C49A8A' : a.overall >= 45 ? '#A87830' : '#8A3A30';
      const dims = a.dimensions.map(dim => {
        const sc = scoreClass(dim.score);
        return '<div class="audit-score-card">' +
          '<div class="audit-score-top">' +
          '<div class="audit-score-title">' + dim.name + '</div>' +
          '<div class="audit-score-val ' + sc + '">' + dim.score + '</div>' +
          '</div>' +
          '<div class="audit-bar-wrap"><div class="audit-bar ' + sc + '" style="width:' + dim.score + '%"></div></div>' +
          '<div class="audit-insight">' + dim.insight + '</div>' +
          '<div class="audit-action">Action: ' + dim.action + '</div>' +
          '</div>';
      }).join('');
      el.innerHTML =
        '<div class="health-ring-wrap">' +
          '<div class="health-ring">' +
            '<svg width="100" height="100" viewBox="0 0 100 100">' +
              '<circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/>' +
              '<circle cx="50" cy="50" r="40" fill="none" stroke="' + ringColor + '" stroke-width="8" stroke-dasharray="' + circum + '" stroke-dashoffset="' + offset + '" stroke-linecap="round"/>' +
            '</svg>' +
            '<div class="health-ring-val">' +
              '<div class="health-ring-num">' + a.overall + '</div>' +
              '<div class="health-ring-lbl">Score</div>' +
            '</div>' +
          '</div>' +
          '<div class="health-info">' +
            '<div class="health-title">Operational Health Score: ' + scoreLabel(a.overall) + '</div>' +
            '<div class="health-sub">' + a.summary + '</div>' +
            '<button class="audit-gen-btn" id="audit-detail-btn" onclick="generateAuditInsights()">Generate AI Deep Dive</button>' +
          '</div>' +
        '</div>' +
        '<div class="audit-grid">' + dims + '</div>' +
        '<div id="audit-ai-section"></div>' +
        '<div class="audit-cta">' +
          '<div class="audit-cta-title">Ready to go deeper?</div>' +
          '<div class="audit-cta-sub">Your Operational Audit score reveals where your business is leaking time and revenue. A Blueprint Partnership engagement builds the systems to fix it permanently.</div>' +
          '<button class=\"audit-cta-btn\" onclick=\"bookConsult()\">Book a Consultation</button>' +
        '</div>';
    } else {
      el.innerHTML = '<div class="alert alert-err">Error loading audit: ' + (d.error||'Unknown error') + '</div>';
    }
  } catch(e) {
    el.innerHTML = '<div class="alert alert-err">Error: ' + e.message + '</div>';
  }
}

async function generateAuditInsights() {
  const btn = document.getElementById('audit-detail-btn');
  const section = document.getElementById('audit-ai-section');
  if(!btn || !section) return;
  btn.disabled = true; btn.textContent = 'Generating deep dive...';
  section.innerHTML = '<div class="spin-wrap"><div class="spinner"></div> Your EA AI is analyzing your operational patterns...</div>';
  try {
    const r = await fetch('/api/audit-insights', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
    const d = await r.json();
    if(d.success) {
      section.innerHTML = '<div class="audit-ai-box"><div class="audit-ai-title">EA AI Deep Dive Analysis</div><div class="audit-ai-text">' + d.insights.replace(/\n/g, '<br>') + '</div></div>';
    } else {
      section.innerHTML = '<div class="alert alert-err">Error: ' + (d.error||'Failed') + '</div>';
    }
  } catch(e) {
    section.innerHTML = '<div class="alert alert-err">Error: ' + e.message + '</div>';
  } finally {
    if(btn) { btn.disabled = false; btn.textContent = 'Generate AI Deep Dive'; }
  }
}

const eaTaskListData = [];

async function eaDraftEmail(taskId, task, action) {
  taskId = taskId || 'ea_'+Date.now();
  task = task || window._eaTask || '';
  action = action || window._eaAction || '';
  showEAResult(taskId, 'Drafting email...');
  var _lbl=document.getElementById('ea-result-label');if(_lbl)_lbl.textContent='Drafted Email - Ready to Send';
  try {
    const r = await fetch('https://essential-ea-app-production.up.railway.app/api/ea-draft', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type: 'email', task, action })
    });
    const d = await r.json();
    if(d.success) showEAResult(taskId, d.output, true);
    else showEAResult(taskId, 'Error: ' + (d.error||'Failed'), false);
  } catch(e) { showEAResult(taskId, 'Error: ' + e.message, false); }
}

async function eaGenerateDoc(taskId, task, action) {
  taskId = taskId || 'ea_'+Date.now();
  task = task || window._eaTask || '';
  action = action || window._eaAction || '';
  showEAResult(taskId, 'Generating document...');
  var _lbl=document.getElementById('ea-result-label');if(_lbl)_lbl.textContent='Generated Document';
  try {
    const r = await fetch('https://essential-ea-app-production.up.railway.app/api/ea-draft', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type: 'document', task, action })
    });
    const d = await r.json();
    if(d.success) showEAResult(taskId, d.output, true);
    else showEAResult(taskId, 'Error: ' + (d.error||'Failed'), false);
  } catch(e) { showEAResult(taskId, 'Error: ' + e.message, false); }
}

async function eaSuggestSchedule(taskId, task) {
  taskId = taskId || 'ea_'+Date.now();
  task = task || window._eaTask || '';
  showEAResult(taskId, 'Finding the best time block...');
  var _lbl=document.getElementById('ea-result-label');if(_lbl)_lbl.textContent='Suggested Schedule';
  try {
    const r = await fetch('https://essential-ea-app-production.up.railway.app/api/ea-draft', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ type: 'schedule', task, action: '' })
    });
    const d = await r.json();
    if(d.success) showEAResult(taskId, d.output, true);
    else showEAResult(taskId, 'Error: ' + (d.error||'Failed'), false);
  } catch(e) { showEAResult(taskId, 'Error: ' + e.message, false); }
}

function eaAddToTaskList(taskId, task, action) {
  eaTaskListData.push({ id: taskId, task, action, done: false, addedAt: new Date().toLocaleString() });
  document.getElementById('tl-badge').textContent = eaTaskListData.length;
  showEAResult(taskId, 'Added to EA Task List. Your EA will handle: ' + action, true);
  var _lbl=document.getElementById('ea-result-label');if(_lbl)_lbl.textContent='Added to EA Task List';
}

function showEAResult(taskId, text, show) {
  const el = document.getElementById('ea-result-box');
  const cnt = document.getElementById('ea-result-content');
  if(el) el.style.display = 'block';
  if(cnt) cnt.textContent = text || '';
}

function clearEAResult(taskId) {
  const el = document.getElementById('ea-result-' + taskId);
  if(el) el.classList.remove('show');
}

function copyEAResult(taskId) {
  const cnt = document.getElementById('ea-result-content');
  if(cnt) navigator.clipboard.writeText(cnt.textContent).catch(function(){});
}

function handleDocDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if(file) handleDocFile(file);
}

async function handleDocFile(file) {
  if(!file) return;
  const result = document.getElementById('doc-result');
  const content = document.getElementById('doc-result-content');
  result.classList.add('show');
  content.textContent = 'Reading ' + file.name + '...';
  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      let fileContent = '';
      if(file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        fileContent = e.target.result;
      } else if(file.type.startsWith('image/')) {
        content.textContent = 'Analyzing image document ' + file.name + '...';
        const base64 = e.target.result.split(',')[1];
        const r = await fetch('https://essential-ea-app-production.up.railway.app/api/ea-read-doc', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ filename: file.name, content: base64, isImage: true })
        });
        const d = await r.json();
        if(d.success) content.textContent = d.analysis;
        else content.textContent = 'Error: ' + (d.error||'Failed to analyze');
        return;
      } else {
        fileContent = 'Document: ' + file.name + ' (binary file - extracting key details for analysis)';
      }
      const r = await fetch('https://essential-ea-app-production.up.railway.app/api/ea-read-doc', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ filename: file.name, content: fileContent, isImage: false })
      });
      const d = await r.json();
      if(d.success) content.textContent = d.analysis;
      else content.textContent = 'Error: ' + (d.error||'Failed to analyze');
    };
    if(file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  } catch(err) {
    content.textContent = 'Error reading file: ' + err.message;
  }
}

function renderEATaskList() {
  const el = document.getElementById('ea-task-list-content');
  if(!el) return;
  if(eaTaskListData.length === 0) {
    el.innerHTML = '<div class="empty" style="padding:40px;text-align:center;color:var(--mid)">No tasks in your EA list yet. Classify a Bouncy Ball task and click Add to EA Task List.</div>';
    return;
  }
  el.innerHTML = '<div class="ea-task-list">' + eaTaskListData.map((t,i) =>
    '<div class="ea-task-item">' +
    '<div class="ea-task-check ' + (t.done?'done':'') + '" onclick="toggleEATask(' + i + ')">' + (t.done?'&#10003;':'') + '</div>' +
    '<div class="ea-task-body">' +
    '<div class="ea-task-title">' + t.task + '</div>' +
    '<div class="ea-task-instruction">' + t.action + '</div>' +
    '<div class="ea-task-tag">EA Owned - Added ' + t.addedAt + '</div>' +
    '</div></div>'
  ).join('') + '</div>';
}

function toggleEATask(idx) {
  eaTaskListData[idx].done = !eaTaskListData[idx].done;
  renderEATaskList();
}

async function playEAVoice(btn, text) {
  if(btn.classList.contains('playing')) {
    window._eaAudio && window._eaAudio.pause();
    btn.classList.remove('playing');
    btn.innerHTML = '<svg viewBox="0 0 10 10"><polygon points="0,0 10,5 0,10"/></svg>Listen';
    return;
  }
  document.querySelectorAll('.play-btn.playing,.play-btn-light.playing').forEach(b => {
    b.classList.remove('playing');
    b.innerHTML = '<svg viewBox="0 0 10 10"><polygon points="0,0 10,5 0,10"/></svg>Listen';
  });
  window._eaAudio && window._eaAudio.pause();
  btn.classList.add('playing');
  btn.innerHTML = '<svg viewBox="0 0 10 10"><rect x="1" y="1" width="3" height="8"/><rect x="6" y="1" width="3" height="8"/></svg>Playing...';
  try {
    const r = await fetch('https://essential-ea-app-production.up.railway.app/api/speak', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text: text.substring(0, 2500) })
    });
    if(!r.ok) throw new Error('Voice unavailable');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    window._eaAudio = new Audio(url);
    window._eaAudio.play();
    window._eaAudio.onended = () => {
      btn.classList.remove('playing');
      btn.innerHTML = '<svg viewBox="0 0 10 10"><polygon points="0,0 10,5 0,10"/></svg>Listen';
      URL.revokeObjectURL(url);
    };
  } catch(e) {
    btn.classList.remove('playing');
    btn.innerHTML = '<svg viewBox="0 0 10 10"><polygon points="0,0 10,5 0,10"/></svg>Listen';
    console.error('Voice error:', e.message);
  }
}

async function loadStats() {
  try {
    const r = await fetch('/api/stats');
    const d = await r.json();
    if(d.success) {
      const s = d.stats;
      $('k1').textContent = s.totalTasks;
      $('k2').textContent = s.crystal;
      $('k3').textContent = s.bouncy;
      $('k4').textContent = s.avgAccuracy + '%';
      $('tc').textContent = s.totalTasks || '0';
      const total = s.totalTasks || 1;
      const cp = Math.round((s.crystal/total)*100);
      const bp = Math.round((s.bouncy/total)*100);
      $('sc1').textContent = s.crystal; $('sb1').style.width = cp + '%';
      $('sc2').textContent = s.bouncy;  $('sb2').style.width = bp + '%';
      $('sc3').textContent = s.totalTasks; $('sb3').style.width = Math.min(100,s.totalTasks*5) + '%';
      $('sc4').textContent = s.avgAccuracy + '%'; $('sb4').style.width = s.avgAccuracy + '%';
    }
    loadHistory();
  } catch(e) { console.error(e); }
}
async function loadHistory() {
  try {
    const r = await fetch('/api/history?limit=20');
    const d = await r.json();
    if(d.success) {
      const cr = d.tasks.filter(t => t.classification === 'crystal');
      const bo = d.tasks.filter(t => t.classification === 'bouncy');
      $('c-badge').textContent = cr.length;
      $('b-badge').textContent = bo.length;
      $('c-list').innerHTML = cr.length ? cr.map(t => tCard(t)).join('') : '<div class="empty">No crystal ball tasks yet.</div>';
      $('b-list').innerHTML = bo.length ? bo.map(t => tCard(t)).join('') : '<div class="empty">No bouncy ball tasks yet.</div>';
    }
  } catch(e) { console.error(e); }
}
async function loadFullHistory() {
  const el = $('history-list');
  el.innerHTML = '<div class="spin-wrap"><div class="spinner"></div> Loading your history...</div>';
  try {
    const r = await fetch('/api/history?limit=100');
    const d = await r.json();
    if(d.success && d.tasks.length > 0) {
      el.innerHTML = d.tasks.map(t => {
        const ic = t.classification === 'crystal';
        const dt = new Date(t.created_at || t.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
        return '<div class="history-item"><div class="history-date">' + (ic ? 'Crystal Ball' : 'Bouncy Ball') + ' - ' + dt + '</div><div class="history-text">' + (t.description||'') + '</div><div style="font-size:11px;color:var(--mid);margin-top:6px">' + (t.reason||'') + '</div></div>';
      }).join('');
    } else {
      el.innerHTML = '<div class="empty">No task history yet. Go to Crystal Ball Triage to classify your first task.</div>';
    }
  } catch(e) {
    el.innerHTML = '<div class="alert alert-err">Error loading history: ' + e.message + '</div>';
  }
}
function tCard(t) {
  const bc = t.urgency==='urgent'||t.urgency==='today' ? 'badge-u' : t.urgency==='defer' ? 'badge-f' : 'badge-e';
  const bt = t.urgency==='ea_owned' ? 'EA Owned' : (t.urgency||'classified');
  const ic = t.classification === 'crystal';
  return '<div class="t-item"><div class="ti-icon">' + (ic ? '&#128302;' : '&#127934;') + '</div><div class="ti-body"><div class="ti-task">' + (t.description||'') + '</div><div class="ti-reason">' + (t.reason||'') + '</div></div><div class="ti-badge ' + bc + '">' + bt + '</div></div>';
}
async function doClassify() {
  const inp = $('task-in');
  const val = inp.value.trim();
  if(!val) { inp.focus(); return; }
  const btn = $('t-btn');
  const res = $('t-result');
  btn.disabled = true; btn.textContent = 'Analyzing...';
  res.style.display = 'block';
  res.innerHTML = '<div class="spin-wrap"><div class="spinner"></div> Analyzing with the Crystal Ball Framework...</div>';
  try {
    const r = await fetch('/api/classify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({taskDescription:val}) });
    const d = await r.json();
    if(d.success) {
      const c = d.classification;
      const ic = c.classification === 'crystal';
      const em = ic ? '&#128302;' : '&#127934;';
      const taskId = 'task_' + Date.now();
      const actLabel = ic ? 'Keep - Schedule - Protect this time' : 'Delegate - Remove from your calendar';
      const eaButtons = ic ? '' :
        '<div class="ea-actions">' +
        '<div class="ea-actions-title">EA Execution Mode - Your EA Will Handle This</div>' +
        '<div class="ea-action-grid">' +
        '<button class="ea-action-btn" onclick="eaDraftEmail()"><div class="ea-action-icon">&#9993;</div><span class="ea-action-label">Draft Email</span><div class="ea-action-desc">AI writes the reply for you</div></button>' +
        '<button class="ea-action-btn" onclick="eaGenerateDoc()"><div class="ea-action-icon">&#128196;</div><span class="ea-action-label">Generate Document</span><div class="ea-action-desc">AI creates the document</div></button>' +
        '<button class="ea-action-btn" onclick="eaAddToTaskList()"><div class="ea-action-icon">&#9989;</div><span class="ea-action-label">Add to EA Task List</span><div class="ea-action-desc">Queue for later handling</div></button>' +
        '<button class="ea-action-btn" onclick="eaSuggestSchedule()"><div class="ea-action-icon">&#128197;</div><span class="ea-action-label">Suggest Schedule</span><div class="ea-action-desc">Find the right time block</div></button>' +
        '</div>' +
        '<div style="margin:12px 0 8px;padding:12px 16px;background:linear-gradient(135deg,rgba(196,154,138,0.15),rgba(196,154,138,0.05));border:1px solid rgba(196,154,138,0.3);border-radius:8px;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="font-size:12px;color:rgba(26,26,24,0.7);line-height:1.5"><strong style="color:#C49A8A;display:block;margin-bottom:2px">Your EA is ready to handle this.</strong>Choose an action above and your EA executes it instantly.</div>' +
        '</div>' +
        '<div id="ea-result-box" style="display:none;margin-top:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:14px">' +
        '<div style="font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#C49A8A;margin-bottom:8px" id="ea-result-label">EA Output</div>' +
        '<div style="font-size:12.5px;color:rgba(245,240,232,.7);line-height:1.75;white-space:pre-wrap" id="ea-result-content"></div>' +
        '<button style="font-size:9.5px;font-weight:700;padding:7px 14px;border-radius:3px;border:none;cursor:pointer;background:#C49A8A;color:#1A1A18;margin-top:10px" onclick="copyEAResult()">Copy</button>' +
        '</div>' +
        '</div>';
      window._eaTask = val || '';
      window._eaAction = c.recommendedAction || '';
            res.innerHTML = '<div class="t-result-box"><div class="tr-hd"><div class="tr-em">' + em + '</div><div class="tr-ti">' + (ic ? 'Crystal Ball - Only You Can Do This' : 'Bouncy Ball - Your EA Owns This') + '</div></div><div class="tr-meta"><span><strong>Urgency:</strong> ' + (c.urgency||'') + '</span><span><strong>Confidence:</strong> ' + (c.confidence ? (c.confidence*100).toFixed(0)+'%' : '') + '</span></div><div class="tr-body"><strong>Why:</strong> ' + (c.reason||'') + '</div><div class="tr-body"><strong>Action:</strong> ' + (c.recommendedAction||'') + '</div><div class="tr-act">' + actLabel + '</div><button class="play-btn" id="pb-'+triageId+'" onclick="playEAVoice(this,'+JSON.stringify(triageText).replace(/</g,'\u003c')+')"><svg viewBox=\"0 0 10 10\"><polygon points=\"0,0 10,5 0,10\"/></svg>Listen</button>' + eaButtons + '</div>';
      inp.value = '';
      loadStats();
    } else {
      res.innerHTML = '<div class="alert alert-err">Error: ' + (d.error||'Classification failed') + '</div>';
    }
  } catch(e) {
    res.innerHTML = '<div class="alert alert-err">Error: ' + e.message + '</div>';
  } finally {
    btn.disabled = false; btn.textContent = 'Classify Task';
  }
}
$('task-in').addEventListener('keydown', e => { if(e.key==='Enter') doClassify(); });
async function generateWeek() {
  const goals = $('goals').value.trim();
  const revenue = $('revenue').value.trim();
  const timeblocks = $('timeblocks').value.trim();
  if(!goals||!revenue||!timeblocks) { alert('Please fill in all three fields.'); return; }
  const btn = $('gen-btn');
  const res = $('week-result');
  btn.disabled = true; btn.textContent = 'Building your Priority Week...';
  res.style.display = 'block';
  res.innerHTML = '<div class="panel" style="padding:20px"><div class="spin-wrap"><div class="spinner"></div> Building your 5-day Priority Week...</div></div>';
  try {
    const r = await fetch('/api/generate-week', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({goals,revenue,timeblocks}) });
    const d = await r.json();
    if(d.success) {
      const weekId = 'week_' + Date.now();
      res.innerHTML = '<div class="week-card"><div class="week-head"><div><div class="week-title">Your Priority Week</div><div class="week-meta">Built on the Essential EA Priority Week Framework</div></div><button class="play-btn" id="pb-'+weekId+'" onclick="playEAVoice(this,' + JSON.stringify(d.plan.substring(0,1500)).replace(/</g,'\u003c') + ')"><svg viewBox=\"0 0 10 10\"><polygon points=\"0,0 10,5 0,10\"/></svg>Listen to Plan</button></div><div style="padding:18px"><div class="pw-note" style="border-top:none;margin-bottom:12px"><strong>Your plan is ready.</strong> Crystal Ball tasks are in your peak hours. Bouncy Balls are delegated. CEO Protection Protocol is enforced.</div><pre style="white-space:pre-wrap;font-family:DM Sans,sans-serif;font-size:13px;color:var(--blk);line-height:1.85">' + d.plan + '</pre></div></div>';
      $('week-preview').style.display = 'none';
    } else {
      res.innerHTML = '<div class="alert alert-err">Error: ' + d.error + '</div>';
    }
  } catch(e) {
    res.innerHTML = '<div class="alert alert-err">Error: ' + e.message + '</div>';
  } finally {
    btn.disabled = false; btn.textContent = 'Generate My Priority Week';
  }
}
async function generateBrief() {
  const name = $('brief-name').value.trim();
  const role = $('brief-role').value.trim();
  const priorities = $('brief-priorities').value.trim();
  const blocks = $('brief-blocks').value.trim();
  if(!name||!role) { alert('Please enter your name and role.'); return; }
  const btn = $('brief-btn');
  const res = $('brief-result');
  btn.disabled = true; btn.textContent = 'Your EA is preparing your brief...';
  res.style.display = 'block';
  res.innerHTML = '<div class="spin-wrap"><div class="spinner"></div> Your EA is reviewing your calendar and priorities...</div>';
  try {
    const r = await fetch('/api/daily-brief', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,role,priorities,timeblocks:blocks,date:new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}) });
    const d = await r.json();
    if(d.success) {
      const briefId = 'brief_' + Date.now();
      res.innerHTML = '<div class="brief-box"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div class="ai-lbl" style="margin-bottom:0">Your EA Daily Brief</div><button class="play-btn" id="pb-'+briefId+'" onclick="playEAVoice(this,' + JSON.stringify(d.brief).replace(/</g,'\u003c') + ')"><svg viewBox=\"0 0 10 10\"><polygon points=\"0,0 10,5 0,10\"/></svg>Listen to Brief</button></div><pre>' + d.brief + '</pre></div>';
    } else {
      res.innerHTML = '<div class="alert alert-err">Error: ' + (d.error||'Failed to generate brief') + '</div>';
    }
  } catch(e) {
    res.innerHTML = '<div class="alert alert-err">Error: ' + e.message + '</div>';
  } finally {
    btn.disabled = false; btn.textContent = 'Generate My EA Daily Brief';
  }
}
const msgs = [
  { sub:'Counter offer - 2847 Elmwood Dr', from:'Marcus Chen', time:'Today 9:14 AM', route:'<strong>Crystal Ball - Needs You.</strong> Counter offer on an active listing requires your direct judgment. Your EA cannot handle this one.', body:'<p>Hi Kristina,</p><p style="margin-top:10px">They came down to 624,000. Still 11K above our last position but there is room. Inspection contingency ends Friday.</p><p style="margin-top:10px">Can you reach out to the listing agent today? Thanks, Marcus</p>' },
  { sub:'Referral partner meeting request', from:'Sarah Kim - Lender', time:'Today 8:52 AM', route:'<strong>Bouncy Ball - EA Triaging.</strong> Inbound meeting request from a vendor. EA is evaluating against your referral criteria.', body:'<p>Hi Kristina,</p><p style="margin-top:10px">I would love 20 minutes to explore a referral partnership. Available this week or next?</p><p style="margin-top:10px">Best, Sarah</p>' },
  { sub:'Closing confirmed - gift needed by Friday', from:'Rodriguez Closing', time:'Tuesday', route:'<strong>Bouncy Ball - EA Owned.</strong> EA has confirmed the closing and is processing the gift order. No action required from you.', body:'<p>Title confirmed Thursday 2pm for the Rodriguez family.</p><p style="margin-top:10px">EA has selected the Luxury Home Welcome Box. Budget used: 185 of your 200 allowance.</p><p style="margin-top:10px">No action needed. - Your EA</p>' },
  { sub:'Weekly scorecard - Action required', from:'Team Standup Bot', time:'Monday', route:'<strong>Crystal Ball - Needs Your Input.</strong> Two team members missed targets. Only you can address performance accountability.', body:'<p>Two agents completed fewer than 60% of committed tasks for 2 consecutive weeks.</p><p style="margin-top:10px">EA recommends a 15-min 1:1 with each. Would you like your EA to schedule these?</p>' },
  { sub:'Quote renewal - Q2 supplies', from:'Office Supplies Vendor', time:'Monday', route:'<strong>Bouncy Ball - EA Replied.</strong> Routine vendor communication. EA replied per your vendor protocol. No action needed.', body:'<p>Your EA replied on your behalf. No action needed from you.</p>' }
];
function openMsg(idx, el) {
  const m = msgs[idx]; if(!m) return;
  document.querySelectorAll('.msg').forEach(m => m.classList.remove('active'));
  if(el) el.classList.add('active');
  $('d-sub').textContent = m.sub;
  $('d-meta').innerHTML = 'From <strong>' + m.from + '</strong> - ' + m.time;
  $('d-route').innerHTML = m.route;
  $('d-body').innerHTML = m.body;
  $('reply-in').value = '';
  if(window.innerWidth <= 768) { $('inbox-wrap').classList.add('detail-open'); $('back-btn').style.display='block'; }
}
function closeDetail() { $('inbox-wrap').classList.remove('detail-open'); $('back-btn').style.display='none'; }
function setReply(t) { $('reply-in').value = t; $('reply-in').focus(); }
function sendReply() {
  if(!$('reply-in').value.trim()) return;
  $('reply-in').value = '';
  const btn = document.querySelector('.reply-send');
  btn.textContent='Sent'; btn.style.background='#4A7A50';
  setTimeout(()=>{ btn.textContent='Send'; btn.style.background=''; }, 2000);
}
function filterMsgs(tag, btn) {
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#msg-list .msg').forEach(m => { m.style.display = tag==='all'||m.dataset.tag===tag?'':'none'; });
}
let curR = 5;
function setR(r, btn) {
  curR = r; $('fb-rating').value = r;
  document.querySelectorAll('.r-btn').forEach((b,i) => b.classList.toggle('sel', i<r));
}
async function submitFB() {
  const name = $('fb-name').value.trim();
  const email = $('fb-email').value.trim();
  const msg = $('fb-msg').value.trim();
  if(!email||!msg) { alert('Please fill in email and feedback.'); return; }
  const st = $('fb-status');
  st.style.display='block';
  st.innerHTML='<div class="spin-wrap"><div class="spinner"></div> Sending...</div>';
  try {
    const r = await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,rating:parseInt($('fb-rating').value),message:msg}) });
    const d = await r.json();
    if(d.success) {
      st.innerHTML='<div class="alert alert-ok">Thank you! Your feedback has been received.</div>';
      $('fb-name').value=$('fb-email').value=$('fb-msg').value='';
      setTimeout(()=>st.style.display='none', 5000);
    } else {
      st.innerHTML='<div class="alert alert-err">Error: ' + (d.error||'Failed') + '</div>';
    }
  } catch(e) {
    st.innerHTML='<div class="alert alert-err">Error: ' + e.message + '</div>';
  }
}
function bookConsult() {
  window.location.href = 'mailto:kristina@operationalconsultinggroup.com';
}

loadStats();
setTimeout(loadStats, 1500);
setTimeout(loadStats, 4000);
window.addEventListener('focus', loadStats);
</script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/classify', async (req, res) => {
  try {
    const { taskDescription } = req.body;
    if (!taskDescription) return res.status(400).json({ error: 'Task description required', success: false });

    const bookContext = await getBookContext(taskDescription);
    // Get user profile for personalization
    let profileContext = '';
    try {
      const [prof] = await sql`SELECT * FROM user_profiles WHERE user_id = 'default' LIMIT 1`;
      if(prof && prof.name) {
        profileContext = '\n\nUser context: ' + prof.name + ' is a ' + (prof.role||'executive') + (prof.industry ? ' in ' + prof.industry : '') + (prof.company ? ' at ' + prof.company : '') + (prof.priorities ? '. Top priorities: ' + prof.priorities : '') + (prof.peak_hours ? '. Peak hours: ' + prof.peak_hours : '');
      }
    } catch(e) {}
    const prompt = 'You are the Essential EA - an AI-powered executive assistant built on the methodology from the book The Essential EA by Kristina Spencer.\n\nClassify this task using the Crystal Ball and Bouncy Ball Framework.\n\nCrystal Ball tasks: ONLY the executive can do these. Irreplaceable - if dropped, shatters permanently. Includes: client relationships, negotiations, strategy, approvals, legal, financial decisions.\n\nBouncy Ball tasks: CAN and SHOULD be delegated. Bounces back even if dropped. Includes: scheduling, admin, data entry, routine communication, follow-ups, coordination, vendor management.\n\nCEO Protection Protocol: Every minute on a Bouncy Ball task is stolen from a Crystal Ball task.\n\nTask: "' + taskDescription + '"' + (bookContext ? '\\n\\nFrom The Essential EA by Kristina Spencer:\\n' + bookContext : '') + '\\n\\nRespond ONLYJSON:\n{"classification":"crystal or bouncy","emoji":"crystal or bouncy","urgency":"urgent or today or defer or ea_owned","reason":"2-3 sentences explaining why using Essential EA methodology. MUST reference The Essential EA book if context provided.","bookQuote":"If book context provided copy the most relevant sentence verbatim. Otherwise empty string.","recommendedAction":"Specific next step - if crystal what to do and when, if bouncy who handles it and how","confidence":0.95}';

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system: [
        { type: 'text', text: 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. You always use Crystal Ball and Bouncy Ball Framework language naturally. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours.', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'For classification tasks respond with valid JSON only. No markdown. No extra text. Use the word crystal or bouncy for the emoji field.' }
      ],
      messages: [{ role: 'user', content: prompt }]
    });

    let content = response.content[0].text.trim();
    content = content.trim();
    // Strip markdown code blocks if present
    if(content.startsWith('```')) {
      content = content.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
    }
    // Clean content before parsing
    let cleanContent = content.trim();
    // Remove any markdown
    cleanContent = cleanContent.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    // Extract JSON object
    const jStart = cleanContent.indexOf('{');
    const jEnd = cleanContent.lastIndexOf('}');
    if(jStart !== -1 && jEnd !== -1) cleanContent = cleanContent.substring(jStart, jEnd+1);
    // Fix common AI JSON issues - unescaped chars in string values
    cleanContent = cleanContent
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')  // control chars
      .replace(/\\'/g, "'");  // escaped single quotes
    
    let result;
    try {
      result = JSON.parse(cleanContent);
    } catch(parseErr) {
      console.error('Classify parse error:', parseErr.message, 'content:', cleanContent.substring(0,200));
      // Extract fields manually using regex
      const getField = (field) => {
        const m = cleanContent.match(new RegExp('"' + field + '"\\s*:\\s*"([^"]*)"'));
        return m ? m[1] : '';
      };
      result = {
        classification: getField('classification') || (cleanContent.includes('bouncy') ? 'bouncy' : 'crystal'),
        urgency: getField('urgency') || 'medium',
        reason: getField('reason') || 'Unable to parse full response',
        recommendedAction: getField('recommendedAction') || getField('recommended_action') || 'Review manually',
        confidence: 75,
        bookInsight: getField('bookInsight') || ''
      };
    }

    // Sanitize for DB insert
    const safeReason = (result.reason||'').substring(0,500).replace(/'/g, "''");
    const safeAction = (result.recommendedAction||'').substring(0,500).replace(/'/g, "''");

    await sql`INSERT INTO tasks (description, classification, urgency, reason, recommended_action, confidence) VALUES (${taskDescription}, ${result.classification}, ${result.urgency}, ${safeReason}, ${safeAction}, ${result.confidence||75})`;

    res.json({ success: true, classification: result });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to classify', success: false });
  }
});

app.post('/api/generate-week', async (req, res) => {
  try {
    const { goals, revenue, timeblocks, blocks, peak } = req.body;
    const resolvedBlocks = timeblocks || blocks || 'Flexible schedule';
    const resolvedRevenue = revenue || peak || 'Revenue and growth';
    if (!goals) return res.status(400).json({ error: 'Goals required', success: false });

    const prompt = 'You are the Essential EA building a Priority Week. Return ONLY a JSON object, no other text. Format:\n{\n  "focus": ["Crystal Ball item 1", "Crystal Ball item 2", "Crystal Ball item 3"],\n  "days": [\n    {\n      "day": "MON",\n      "slots": [\n        {"task": "Task name", "time": "9:00 AM", "type": "crystal"},\n        {"task": "EA Task name", "type": "ea_owned"},\n        {"task": "Protected block", "time": "12:00 PM", "type": "protected"}\n      ]\n    }\n  ]\n}\nTypes: crystal, ea_owned, protected.\nBuild for goals: ' + goals + ' Revenue goal: ' + resolvedRevenue + ' Protected blocks: ' + resolvedBlocks + '\nInclude MON, TUE, WED, THU, FRI. Each day 2-3 slots max. Crystal Ball tasks in morning, EA tasks in afternoon.'

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      system: [
        { type: 'text', text: 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. You always use Crystal Ball and Bouncy Ball Framework language naturally. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours.', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Build Priority Week plans. Return ONLY valid JSON in this exact format: {"focus":["item1","item2","item3"],"days":[{"day":"MON","slots":[{"task":"Task","time":"9:00 AM","type":"crystal"},{"task":"EA Task","type":"ea_owned"}]}]} Types must be: crystal, ea_owned, or protected. Include MON TUE WED THU FRI. 2-3 slots per day. Crystal Ball in morning slots. No text outside the JSON.' }
      ],
      messages: [{ role: 'user', content: prompt }]
    });

    const plan = response.content[0].text.trim();

    await sql`INSERT INTO weekly_plans (goals, revenue, timeblocks, plan) VALUES (${goals}, ${resolvedRevenue}, ${resolvedBlocks}, ${plan})`;

    let planData = null;
    try {
      planData = safeParseAI(plan);
    } catch(e) { planData = null; }
    res.json({ success: true, plan, planData });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate plan', success: false });
  }
});

app.post('/api/daily-brief', async (req, res) => {
  try {
    const { name, role, priorities, timeblocks, date } = req.body;

    const { context } = req.body;
    const prompt = 'You are the Essential EA for ' + (name || 'the executive') + ', a ' + (role || 'business owner') + '. Today is ' + (date || new Date().toLocaleDateString()) + '.\n\nContext from executive: Priorities: ' + (priorities || 'Revenue and client relationships') + '. What is on their mind: ' + (context || 'General business operations') + '\n\nWrite a COMPREHENSIVE, DETAILED morning brief. Be specific, warm, and act like you have been at your desk since 6:30am. Use Crystal Ball (CEO-only decisions) and Bouncy Ball (delegate to EA) language naturally throughout.\n\nThe brief MUST include ALL of these sections in full detail:\n\n1. PERSONAL GREETING - warm, specific to their situation\n2. YOUR CRYSTAL BALL PRIORITIES TODAY - 3-4 specific items only they can do, with suggested time blocks\n3. FINANCIAL PULSE - address any financial concerns mentioned, specific numbers or context\n4. TIME MANAGEMENT ANALYSIS - how to protect their energy today, specific time blocks\n5. YOUR EA HAS ALREADY HANDLED - 4-5 specific Bouncy Ball tasks completed\n6. WHAT NEEDS YOUR DECISION - 2-3 items requiring executive judgment\n7. STRESS AND ENERGY CHECK - acknowledge what is on their mind, give a reframe\n8. YOUR ACTION PLAN - a prioritized numbered list for the day\n9. ONE INSIGHT FROM THE ESSENTIAL EA METHODOLOGY - a specific quote or principle\n\nBe exhaustive. Minimum 400 words. Reference their specific priorities and concerns directly.';

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: [
        { type: 'text', text: 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. You always use Crystal Ball and Bouncy Ball Framework language naturally. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours.', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Generate personalized EA Daily Briefs. Sound like a real highly competent executive assistant who has been working 2 hours already. Professional, warm, specific. Never generic.' }
      ],
      messages: [{ role: 'user', content: prompt }]
    });

    const brief = response.content[0].text.trim();

    const bname = name || 'Anonymous'; const brole = role || 'Executive';
    await sql`INSERT INTO daily_briefs (name, role, brief) VALUES (${bname}, ${brole}, ${brief})`;

    res.json({ success: true, brief });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate brief', success: false });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const rows = await sql`SELECT * FROM tasks ORDER BY created_at DESC LIMIT ${limit}`;
    res.json({ success: true, tasks: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [tot] = await sql`SELECT COUNT(*) FROM tasks`;
    const [cry] = await sql`SELECT COUNT(*) FROM tasks WHERE classification = 'crystal'`;
    const [bou] = await sql`SELECT COUNT(*) FROM tasks WHERE classification = 'bouncy'`;
    const [avg] = await sql`SELECT AVG(confidence) FROM tasks`;
    const totalCount = parseInt(tot.count);
    const crystalCount = parseInt(cry.count);
    const bouncyCount = parseInt(bou.count);
    const avgAcc = avg.avg ? (parseFloat(avg.avg) * 100).toFixed(1) : '0.0';
    res.json({ success: true, stats: { totalTasks: totalCount, crystal: crystalCount, bouncy: bouncyCount, avgAccuracy: avgAcc } });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!email || !message) return res.status(400).json({ error: 'Email and message required', success: false });
    const fname = name || 'Anonymous'; const frating = rating || 5;
    await sql`INSERT INTO feedback (name, email, rating, message) VALUES (${fname}, ${email}, ${frating}, ${message})`;
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM feedback ORDER BY created_at DESC`;
    res.json({ success: true, feedback: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const [totalRes] = await sql`SELECT COUNT(*) FROM tasks`;
    const [crystalRes] = await sql`SELECT COUNT(*) FROM tasks WHERE classification = 'crystal'`;
    const [bouncyRes] = await sql`SELECT COUNT(*) FROM tasks WHERE classification = 'bouncy'`;
    const [avgConfRes] = await sql`SELECT AVG(confidence) FROM tasks`;
    const [weeklyRes] = await sql`SELECT COUNT(*) FROM weekly_plans`;
    const [briefRes] = await sql`SELECT COUNT(*) FROM daily_briefs`;
    const recentTasks = await sql`SELECT * FROM tasks WHERE created_at > NOW() - INTERVAL '7 days' ORDER BY created_at DESC`;

    const total = parseInt(totalRes.count) || 0;
    const crystal = parseInt(crystalRes.count) || 0;
    const bouncy = parseInt(bouncyRes.count) || 0;
    const avgConf = avgConfRes.avg ? parseFloat(avgConfRes.avg) : 0;
    const weeklyPlansCount = parseInt(weeklyRes.count) || 0;
    const dailyBriefs = parseInt(briefRes.count) || 0;

    const crystalPct = total > 0 ? Math.round((crystal / total) * 100) : 0;
    const bouncyPct = total > 0 ? Math.round((bouncy / total) * 100) : 0;
    const confScore = Math.round(avgConf * 100);

    const d1 = Math.min(100, crystalPct >= 60 ? 85 + Math.round(crystalPct / 10) : crystalPct);
    const d2 = Math.min(100, bouncyPct >= 30 ? 80 + Math.round(bouncyPct / 5) : bouncyPct * 2);
    const d3 = Math.min(100, weeklyPlansCount >= 4 ? 90 : weeklyPlansCount * 22);
    const d4 = Math.min(100, dailyBriefs >= 5 ? 88 : dailyBriefs * 17);
    const d5 = Math.min(100, confScore > 0 ? confScore : 50);
    const d6 = Math.min(100, total >= 20 ? 85 : total * 4);
    const d7 = 72;

    const overall = Math.round((d1 + d2 + d3 + d4 + d5 + d6 + d7) / 7);

    const getInsight = (score) => score >= 80 ? 'Performing well' : score >= 65 ? 'Good progress' : score >= 45 ? 'Needs attention' : 'Critical - action required';

    const dimensions = [
      { name: 'Crystal Ball Protection', score: d1, insight: total === 0 ? 'No tasks classified yet. Start using Crystal Ball Triage to build your protection score.' : crystalPct >= 60 ? 'You are protecting your highest-leverage time well. Crystal Ball tasks represent ' + crystalPct + '% of your classified work.' : 'Only ' + crystalPct + '% of tasks are Crystal Ball. You may be spending time on delegatable work.', action: d1 < 70 ? 'Classify 5 tasks today to identify what should be delegated' : 'Keep protecting your Crystal Ball hours' },
      { name: 'Bouncy Ball Delegation Rate', score: d2, insight: total === 0 ? 'No tasks classified yet. Your delegation rate will appear here once you start triaging.' : bouncyPct >= 30 ? 'Strong delegation rate. ' + bouncy + ' tasks are identified as EA-owned Bouncy Balls.' : 'Low delegation rate detected. You may be doing work that belongs to your EA.', action: d2 < 70 ? 'Review your recent tasks - look for Bouncy Balls you are personally handling' : 'Delegation habits are solid' },
      { name: 'Priority Week Usage', score: d3, insight: weeklyPlansCount === 0 ? 'No Priority Weeks generated yet. A planned week protects your Crystal Ball time.' : weeklyPlansCount >= 4 ? 'Excellent Priority Week habit. You have built ' + weeklyPlansCount + ' structured weeks.' : 'You have generated ' + weeklyPlansCount + ' Priority Weeks. Consistency is key.', action: d3 < 70 ? 'Generate a Priority Week every Monday before checking email' : 'Keep up your weekly planning habit' },
      { name: 'EA Daily Brief Adoption', score: d4, insight: dailyBriefs === 0 ? 'No Daily Briefs generated yet. Start each day with your EA brief to protect your morning.' : dailyBriefs >= 5 ? 'Strong Daily Brief habit. ' + dailyBriefs + ' briefs generated.' : 'You have generated ' + dailyBriefs + ' Daily Briefs. Make this your first action every morning.', action: d4 < 70 ? 'Generate your EA Daily Brief before opening email or social media' : 'Morning brief habit is established' },
      { name: 'AI Classification Confidence', score: d5, insight: total === 0 ? 'No tasks classified yet. Confidence score will appear after your first classification.' : confScore >= 80 ? 'High AI confidence on your task classifications - ' + confScore + '% average accuracy.' : 'AI confidence is building. More classifications will improve accuracy.', action: d5 < 70 ? 'Classify more tasks to improve AI accuracy on your specific work type' : 'Classification accuracy is high' },
      { name: 'Task Triage Consistency', score: d6, insight: total === 0 ? 'No tasks triaged yet. Regular triage is the foundation of operational clarity.' : total >= 20 ? 'Strong triage habit established. ' + total + ' tasks classified total.' : 'You have classified ' + total + ' tasks. Build the daily habit of triaging everything.', action: d6 < 70 ? 'Triage every task before acting on it - even if it takes 10 seconds' : 'Triage habit is strong' },
      { name: 'CEO Protection Protocol', score: d7, insight: 'Based on your usage patterns and time block adherence. Connect your calendar for a precise score.', action: 'Add your non-negotiable blocks to every Priority Week you generate' }
    ];

    const lowScores = dimensions.filter(d => d.score < 65).map(d => d.name);
    const summary = total === 0
      ? 'Your audit is ready but needs data. Start by classifying tasks in Crystal Ball Triage and generating your first Priority Week. Your scores will update in real time as you use the app.'
      : overall >= 80
        ? 'Your operational health is strong. You are protecting your Crystal Ball time and building strong EA habits. Keep the momentum.'
        : overall >= 65
          ? 'Good operational foundation. ' + (lowScores.length > 0 ? lowScores.join(' and ') + ' need attention.' : 'Keep building your habits.')
          : 'Your operations need attention. Focus on ' + (lowScores.length > 0 ? lowScores.slice(0,2).join(' and ') : 'building consistent habits') + ' first.';

    res.json({ success: true, audit: { overall, summary, dimensions } });
  } catch (error) {
    console.error('Audit error:', error.message);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/audit-insights', async (req, res) => {
  try {
    // Gather ALL data sources for comprehensive audit
    const [totalRes] = await sql`SELECT COUNT(*) FROM tasks`;
    const [crystalRes] = await sql`SELECT COUNT(*) FROM tasks WHERE classification = 'crystal'`;
    const [bouncyRes] = await sql`SELECT COUNT(*) FROM tasks WHERE classification = 'bouncy'`;
    const recentTasks = await sql`SELECT description, classification, urgency, reason FROM tasks ORDER BY created_at DESC LIMIT 20`;
    
    // Get user profile
    let profile = null;
    try { [profile] = await sql`SELECT * FROM user_profiles WHERE user_id = 'default' LIMIT 1`; } catch(e) {}
    
    // Get QB financial data if connected
    let financialContext = '';
    try {
      const qbAuth = await getQBAccessToken();
      if(qbAuth) {
        const invRes = await fetch(getQBBase() + '/v3/company/' + qbAuth.realmId + "/query?query=SELECT * FROM Invoice WHERE Balance > '0' MAXRESULTS 50&minorversion=65", {
          headers: { 'Authorization': 'Bearer ' + qbAuth.token, 'Accept': 'application/json' }
        });
        const invData = await invRes.json();
        const invoices = invData.QueryResponse?.Invoice || [];
        const unpaidTotal = invoices.reduce((sum, inv) => sum + (parseFloat(inv.Balance) || 0), 0);
        const overdueCount = invoices.filter(inv => inv.DueDate && new Date(inv.DueDate) < new Date()).length;
        financialContext = 'Financial data: ' + invoices.length + ' unpaid invoices totaling $' + unpaidTotal.toFixed(0) + '. ' + overdueCount + ' invoices are overdue. ';
      }
    } catch(e) {}

    // Get email stats if Gmail connected
    let emailContext = '';
    try {
      const [gToken] = await sql`SELECT * FROM google_tokens WHERE user_id = 'default' LIMIT 1`;
      if(gToken) emailContext = 'Gmail is connected. ';
    } catch(e) {}

    // Get GHL contacts count
    let crmContext = '';
    try {
      if(process.env.GHL_API_KEY) {
        const ghlData = await ghlRequest('/contacts/?locationId=' + process.env.GHL_LOCATION_ID + '&limit=1');
        if(ghlData.meta?.total !== undefined) crmContext = 'CRM has ' + ghlData.meta.total + ' contacts. ';
      }
    } catch(e) {}

    const total = parseInt(totalRes.count) || 0;
    const crystal = parseInt(crystalRes.count) || 0;
    const bouncy = parseInt(bouncyRes.count) || 0;
    const delegationRate = total > 0 ? Math.round((bouncy / total) * 100) : 0;

    const profileContext = profile ? 
      'Executive: ' + (profile.name||'') + ', ' + (profile.role||'') + (profile.industry ? ' in ' + profile.industry : '') + '. ' +
      (profile.revenue_target ? 'Revenue target: ' + profile.revenue_target + '. ' : '') +
      (profile.priorities ? 'Current priorities: ' + profile.priorities + '. ' : '') +
      (profile.peak_hours ? 'Peak hours: ' + profile.peak_hours + '. ' : '') : '';

    const taskSummary = recentTasks.slice(0, 10).map(t => 
      t.classification.toUpperCase() + ': ' + t.description.substring(0, 60)
    ).join('\n');

    const bookContext = await getBookContext('operational efficiency executive performance business intelligence audit');

    const prompt = [
      'You are an elite executive advisor analyzing operational performance. Provide a comprehensive business intelligence audit.',
      '',
      'EXECUTIVE PROFILE:',
      profileContext,
      '',
      'EA USAGE DATA:',
      '- Total tasks classified: ' + total,
      '- Crystal Ball (executive only): ' + crystal + ' (' + (total > 0 ? Math.round(crystal/total*100) : 0) + '%)',
      '- Bouncy Ball (delegatable): ' + bouncy + ' (' + delegationRate + '%)',
      '- Delegation rate: ' + delegationRate + '%',
      '',
      'RECENT TASKS:',
      taskSummary,
      '',
      financialContext,
      emailContext,
      crmContext,
      '',
      bookContext,
      '',
      'Return JSON only with this structure: {"overallScore":85,"scoreLabel":"High Performer","executiveSummary":"assessment","strengths":["s1","s2","s3"],"criticalGaps":["g1","g2","g3"],"crystalBallInsights":["i1","i2"],"financialAlerts":["a1","a2"],"weeklyFocus":["w1","w2","w3"],"delegationOpportunities":["d1","d2"],"thirtyDayPlan":["p1","p2","p3","p4","p5"],"revenueOpportunities":["r1","r2"],"timeRecovery":"X hours per week recovered by..."}'
    ].join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: [{ type: 'text', text: METHODOLOGY_CONTEXT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }]
    });

    let auditText = response.content[0].text.trim();
    console.log('Audit raw:', auditText.substring(0, 200));
    if(auditText.includes('```')) auditText = auditText.replace(/```json?\n?/g,'').replace(/```\n?/g,'').trim();
    const jsonStart = auditText.indexOf('{');
    const jsonEnd = auditText.lastIndexOf('}');
    if(jsonStart !== -1 && jsonEnd !== -1) auditText = auditText.substring(jsonStart, jsonEnd+1);
    let audit = safeParseAI(auditText);
    if(!audit) {
      audit = {
        overallScore: total > 0 ? Math.min(95, 50 + Math.round((bouncy/Math.max(total,1))*30) + 20) : 40,
        scoreLabel: 'Operational Score',
        executiveSummary: response.content[0].text.substring(0,400),
        strengths: ['EA system active','Task classification working',total+' tasks analyzed'],
        criticalGaps: ['Run more classifications to build pattern data'],
        crystalBallInsights: ['Protect peak hours 9am-12pm for Crystal Ball work'],
        financialAlerts: ['Review QuickBooks for latest financial data'],
        weeklyFocus: ['Continue classifying tasks daily'],
        revenueOpportunities: ['Use EA automation to free up executive time'],
        thirtyDayPlan: ['Week 1: Classify 20+ tasks','Week 2: Delegate all Bouncy Ball items','Week 3: Review patterns','Week 4: Full audit review'],
        timeRecovery: 'Estimated 8-12 hours per week recoverable through proper delegation'
      };
    }
    res.json({ success: true, audit, stats: { total, crystal, bouncy, delegationRate } });
  } catch(e) {
    console.error('Audit insights error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});
app.post('/api/ea-draft', async (req, res) => {
  try {
    const { type, task, action, prompt: customPrompt } = req.body;
    // Map action names to types
    const actionTypeMap = {'draft-email':'email','schedule':'schedule','task-list':'task','generate-doc':'document'};
    const resolvedType = type || actionTypeMap[action] || 'email';
    if(!task) return res.status(400).json({ error: 'Task required', success: false });

    let prompt = '';
    let label = '';

    if(resolvedType === 'email') {
      label = 'Email Draft';
      prompt = 'You are a highly competent executive assistant using the Essential EA methodology by Kristina Spencer. ' +
        'Draft a professional, neutral email on behalf of the executive for this task: ' + task + '. ' +
        'Recommended action: ' + action + '. ' +
        'Write a complete email with subject line and body. ' +
        'Tone: professional but warm. Concise. No fluff. ' +
        'Format: SUBJECT: [subject line] then blank line then the email body. ' +
        'Sign off with [Executive Name] as the signature placeholder.';
    } else if(resolvedType === 'document') {
      label = 'Generated Document';
      prompt = 'You are a highly competent executive assistant using the Essential EA methodology by Kristina Spencer. ' +
        'Generate a professional document for this task: ' + task + '. ' +
        'Recommended action: ' + action + '. ' +
        'Create a complete, ready-to-use document appropriate for the task type. ' +
        'Include all relevant sections a professional would expect. ' +
        'Use [PLACEHOLDER] for any specific details that need to be filled in. ' +
        'Be thorough but concise. Professional tone throughout.';
    } else if(resolvedType === 'schedule') {
      label = 'Schedule Suggestion';
      prompt = 'You are a highly competent executive assistant using the Essential EA methodology by Kristina Spencer. ' +
        'This is a Bouncy Ball task that should be delegated or handled efficiently: ' + task + '. ' +
        'Using the Priority Week Framework and CEO Protection Protocol, suggest: ' +
        '1. The best time of day to handle this (avoid Crystal Ball prime hours of 9am-12pm) ' +
        '2. How long it should take ' +
        '3. Whether it should be batched with similar tasks ' +
        '4. Whether it can be fully delegated to an EA or team member ' +
        '5. The specific calendar block recommendation ' +
        'Be specific, decisive, and use Crystal Ball and Bouncy Ball language naturally.';
    } else if(resolvedType === 'task') {
      label = 'EA Task Breakdown';
      prompt = 'You are a highly competent executive assistant using the Essential EA methodology by Kristina Spencer. ' +
        'Break down this Bouncy Ball task into specific, actionable steps an EA can execute: ' + task + '. ' +
        'Provide: ' +
        '1. A clear task title ' +
        '2. Step-by-step action items (numbered) ' +
        '3. Estimated time for each step ' +
        '4. Any resources or information needed ' +
        '5. Definition of done - what success looks like ' +
        'Be specific and actionable. Use the Crystal Ball / Bouncy Ball framework language.';
    } else {
      label = 'EA Response';
      prompt = 'You are the Essential EA. Handle this task: ' + task;
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: [
        { type: 'text', text: 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. You always use Crystal Ball and Bouncy Ball Framework language naturally. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours.', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Execute tasks on behalf of the executive. Draft emails, documents, and schedules that are professional, specific, and ready to use. Never generic or templated.' }
      ],
      messages: [{ role: 'user', content: prompt }]
    });

    const output = response.content[0].text.trim();
    res.json({ success: true, output, label });
  } catch (error) {
    console.error('EA draft error:', error.message);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/ea-read-doc', async (req, res) => {
  try {
    const { filename, content: docContent, document: docDocument, isImage } = req.body;
    const content = docContent || docDocument || '';
    if(!filename) return res.status(400).json({ error: 'Filename required', success: false });
    if(!content) return res.status(400).json({ error: 'Document content required', success: false });

    const ext = filename.split('.').pop().toLowerCase();

    let messages = [];

    if(isImage) {
      messages = [
        { role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: content } },
          { type: 'text', text: 'Analyze this document image. Provide: 1. DOCUMENT SUMMARY - what this document is and its key points. 2. CRYSTAL BALL ACTION ITEMS - things only the executive can handle personally (decisions, approvals, negotiations). 3. BOUNCY BALL ACTION ITEMS - things that can be delegated to an EA or team member. 4. DEADLINES AND DATES - any time-sensitive items. 5. EA RECOMMENDATION - the single most important next action. Be specific and use Essential EA methodology language.' }
        ]}
      ];
    } else {
      const contentPreview = content.length > 3000 ? content.substring(0, 3000) + '...[truncated]' : content;
      const docPrompt = 'Analyze this document: ' + filename + '. Content: ' + contentPreview + '. Provide: 1. DOCUMENT SUMMARY - what this document is and its key points in 2-3 sentences. 2. CRYSTAL BALL ACTION ITEMS - things only the executive can handle personally. List each one. 3. BOUNCY BALL ACTION ITEMS - things that can be delegated to an EA or team member. List each one. 4. DEADLINES AND DATES - any time-sensitive items found in the document. 5. EA RECOMMENDATION - the single most important next action the executive should take today. Use Essential EA methodology language. Be specific to this document.';
      messages = [
        { role: 'user', content: docPrompt }
      ];
    }

    let response;
    if(isImage) {
      // Use Claude Sonnet for vision - Haiku does not support vision
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. You always use Crystal Ball and Bouncy Ball Framework language naturally. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours. Analyze documents and identify Crystal Ball and Bouncy Ball action items. Be specific to the actual document content.',
        messages
      });
    } else {
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        system: [
          { type: 'text', text: 'You are the Essential EA AI - an operational intelligence platform built on the methodology from The Essential EA by Kristina Spencer. You serve real estate agents, financial advisors, insurance agents, coaches, consultants, and executives. Your tone is professional but conversational. You speak as a trusted EA advisor who protects the executive time fiercely. You always use Crystal Ball and Bouncy Ball Framework language naturally. Crystal Ball tasks are irreplaceable activities only the executive can do - if dropped they shatter permanently. Bouncy Ball tasks can and should be delegated - they bounce back. CEO Protection Protocol means the executive prime hours are sacred. Priority Week Framework means Crystal Ball tasks go in peak hours 9am to 12pm and Bouncy Balls never touch those hours.', cache_control: { type: 'ephemeral' } },
          { type: 'text', text: 'Analyze documents and identify Crystal Ball and Bouncy Ball action items. Be specific to the actual document content.' }
        ],
        messages
      });
    }

    const analysis = response.content[0].text.trim();
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Doc reader error:', error.message);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;
    if(!text) return res.status(400).json({ error: 'Text required' });
    if(!process.env.ELEVENLABS_API_KEY) return res.status(503).json({ error: 'Voice not configured' });

    const clean = text
      .replace(/[#*_~`]/g, '')
      .replace(/\n\n+/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2500);

    console.log('ElevenLabs request: chars=', clean.length);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const elResponse = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/ImnfuV8oxhB7ya99oJfc',
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: clean,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.8,
              style: 0.1,
              use_speaker_boost: true
            }
          })
        }
      );
      clearTimeout(timeout);

      if(!elResponse.ok) {
        const errText = await elResponse.text();
        console.error('ElevenLabs error:', elResponse.status, errText.substring(0, 300));
        return res.status(502).json({ error: 'Voice error ' + elResponse.status + ': ' + errText.substring(0, 150) });
      }

      const audioBuffer = await elResponse.arrayBuffer();
      console.log('ElevenLabs audio received:', audioBuffer.byteLength, 'bytes');

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.byteLength);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Accept-Ranges', 'bytes');
      res.send(Buffer.from(audioBuffer));

    } catch(fetchErr) {
      clearTimeout(timeout);
      if(fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Voice generation timed out' });
      }
      throw fetchErr;
    }

  } catch (error) {
    console.error('Speak error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/speak', async (req, res) => {
  try {
    const text = req.query.text;
    if(!text) return res.status(400).json({ error: 'Text required' });
    if(!process.env.ELEVENLABS_API_KEY) return res.status(503).json({ error: 'Voice not configured' });
    const clean = text.replace(/[#*_~`]/g, '').replace(/\n/g, ' ').substring(0, 500);
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ text: clean, model_id: 'eleven_turbo_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });
    if(!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs GET error:', response.status, err.substring(0,200));
      return res.status(502).json({ error: 'Voice error: ' + response.status });
    }
    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Speak GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ea-execute', async (req, res) => {
  try {
    const { task, action, type } = req.body;
    const bookContext = await getBookContext(task || action || '');
    const prompt = 'You are the Essential EA executing a task on behalf of the executive. Task: ' + (task||'') + '. Requested action: ' + (action||type||'handle this') + '. Execute this completely and professionally. Produce a ready-to-use output - if it is an email write the full email, if it is a document write the full document, if it is a schedule provide the time blocks, if it is a task provide the action plan.' + bookContext;
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: [
        { type: 'text', text: METHODOLOGY_CONTEXT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Execute delegatable tasks completely. Produce professional ready-to-use outputs. Sound like a highly competent EA.' }
      ],
      messages: [{ role: 'user', content: prompt }]
    });
    const output = response.content[0].text.trim();
    res.json({ success: true, output });
  } catch(error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ GOOGLE OAUTH ============

app.get('/auth/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if(error) return res.redirect('https://essential-ea-unified.vercel.app/?google_error=' + error);
  if(!code) return res.redirect('https://essential-ea-unified.vercel.app/?google_error=no_code');
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenRes.json();
    if(tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Get user email
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + tokens.access_token }
    });
    const profile = await profileRes.json();

    // Store tokens
    const expiry = tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null;
    // Delete existing and insert fresh
    await sql`DELETE FROM google_tokens WHERE user_id = 'default'`;
    await sql`INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry_date, email)
      VALUES ('default', ${tokens.access_token}, ${tokens.refresh_token || null}, ${expiry}, ${profile.email})`;

    console.log('Google OAuth success for:', profile.email);
    res.redirect('https://essential-ea-unified.vercel.app/?google_connected=true&email=' + encodeURIComponent(profile.email));
  } catch(e) {
    console.error('Google OAuth error:', e.message);
    res.redirect('https://essential-ea-unified.vercel.app/?google_error=' + encodeURIComponent(e.message));
  }
});

app.get('/api/google/status', async (req, res) => {
  try {
    const [token] = await sql`SELECT email, updated_at FROM google_tokens WHERE user_id = 'default' LIMIT 1`;
    if(token) {
      res.json({ connected: true, email: token.email, connectedAt: token.updated_at });
    } else {
      res.json({ connected: false });
    }
  } catch(e) {
    res.json({ connected: false, error: e.message });
  }
});

app.get('/api/google/disconnect', async (req, res) => {
  try {
    await sql`DELETE FROM google_tokens WHERE user_id = 'default'`;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

async function getGoogleAccessToken() {
  try {
    const [token] = await sql`SELECT * FROM google_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!token) return null;
    // Check if token needs refresh
    if(token.expiry_date && Date.now() > token.expiry_date - 60000) {
      if(!token.refresh_token) return null;
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token'
        })
      });
      const newTokens = await refreshRes.json();
      if(newTokens.access_token) {
        const newExpiry = Date.now() + ((newTokens.expires_in || 3600) * 1000);
        await sql`UPDATE google_tokens SET access_token = ${newTokens.access_token}, expiry_date = ${newExpiry}, updated_at = NOW() WHERE user_id = 'default'`;
        return newTokens.access_token;
      }
      return null;
    }
    return token.access_token;
  } catch(e) {
    console.error('getGoogleAccessToken error:', e.message);
    return null;
  }
}


app.post('/api/gmail/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Google not connected' });

    const email = ['To: ' + to, 'Subject: ' + subject, 'Content-Type: text/plain; charset=utf-8', '', body].join('\n');
    const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded })
    });
    const sendData = await sendRes.json();
    if(sendData.id) {
      res.json({ success: true, messageId: sendData.id });
    } else {
      res.json({ success: false, error: sendData.error?.message || 'Send failed' });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/calendar/events', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Google not connected', events: [] });

    const now = new Date().toISOString();
    const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + now + '&timeMax=' + weekLater + '&singleEvents=true&orderBy=startTime&maxResults=20', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const calData = await calRes.json();
    const events = (calData.items || []).map(e => ({
      id: e.id,
      summary: e.summary || '(no title)',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || '',
      description: e.description || ''
    }));
    res.json({ success: true, events });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message, events: [] });
  }
});




// ============ GMAIL - FULL MANAGEMENT ============

app.get('/api/gmail/messages', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Google not connected', messages: [] });
    const folder = req.query.folder || 'inbox';
    const search = req.query.search || '';
    const pageToken = req.query.pageToken || '';
    let query = folder === 'inbox' ? 'in:inbox' : folder === 'sent' ? 'in:sent' : folder === 'drafts' ? 'in:drafts' : folder === 'starred' ? 'is:starred' : folder === 'trash' ? 'in:trash' : 'in:inbox';
    if(search) query += ' ' + search;
    let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=' + encodeURIComponent(query);
    if(pageToken) url += '&pageToken=' + pageToken;
    const listRes = await fetch(url, { headers: { Authorization: 'Bearer ' + accessToken } });
    const listData = await listRes.json();
    if(!listData.messages) return res.json({ success: true, messages: [], nextPageToken: null });
    const messages = await Promise.all(
      listData.messages.slice(0, 15).map(async (msg) => {
        const msgRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + msg.id + '?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To', {
          headers: { Authorization: 'Bearer ' + accessToken }
        });
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
        return {
          id: msg.id,
          threadId: msgData.threadId,
          subject: getHeader('Subject') || '(no subject)',
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: msgData.snippet || '',
          labelIds: msgData.labelIds || [],
          isUnread: (msgData.labelIds || []).includes('UNREAD'),
          isStarred: (msgData.labelIds || []).includes('STARRED')
        };
      })
    );
    res.json({ success: true, messages, nextPageToken: listData.nextPageToken || null });
  } catch(e) {
    console.error('Gmail messages error:', e.message);
    res.status(500).json({ success: false, error: e.message, messages: [] });
  }
});

app.get('/api/gmail/message/:id', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    const msgRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + req.params.id + '?format=full', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const msg = await msgRes.json();
    const headers = msg.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
    // Extract body
    let body = '';
    const extractBody = (parts) => {
      if(!parts) return;
      for(const part of parts) {
        if(part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if(part.mimeType === 'text/html' && part.body?.data && !body) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if(part.parts) extractBody(part.parts);
      }
    };
    if(msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
    } else {
      extractBody(msg.payload?.parts);
    }
    res.json({
      success: true,
      id: msg.id,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      body: body || msg.snippet || '',
      labelIds: msg.labelIds || [],
      isUnread: (msg.labelIds || []).includes('UNREAD')
    });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/gmail/send', async (req, res) => {
  try {
    const { to, subject, body, threadId } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Google not connected' });
    const emailLines = ['To: ' + to, 'Subject: ' + subject, 'Content-Type: text/plain; charset=utf-8', '', body];
    if(threadId) emailLines.unshift('Thread-Id: ' + threadId);
    const email = emailLines.join('\n');
    const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded, threadId: threadId || undefined })
    });
    const sendData = await sendRes.json();
    if(sendData.id) res.json({ success: true, messageId: sendData.id });
    else res.json({ success: false, error: sendData.error?.message || 'Send failed' });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/gmail/archive', async (req, res) => {
  try {
    const { messageId } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '/modify', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['INBOX'] })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/gmail/trash', async (req, res) => {
  try {
    const { messageId } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '/trash', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken }
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/gmail/markread', async (req, res) => {
  try {
    const { messageId, unread } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '/modify', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(unread ? { addLabelIds: ['UNREAD'] } : { removeLabelIds: ['UNREAD'] })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/gmail/star', async (req, res) => {
  try {
    const { messageId, starred } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '/modify', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(starred ? { addLabelIds: ['STARRED'] } : { removeLabelIds: ['STARRED'] })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/gmail/move', async (req, res) => {
  try {
    const { messageId, addLabel, removeLabel } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    const body = {};
    if(addLabel) body.addLabelIds = [addLabel];
    if(removeLabel) body.removeLabelIds = [removeLabel];
    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + messageId + '/modify', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/gmail/bulk', async (req, res) => {
  try {
    const { messageIds, action } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await Promise.all(messageIds.map(async (id) => {
      if(action === 'archive') {
        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id + '/modify', {
          method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ removeLabelIds: ['INBOX'] })
        });
      } else if(action === 'trash') {
        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id + '/trash', {
          method: 'POST', headers: { Authorization: 'Bearer ' + accessToken }
        });
      } else if(action === 'read') {
        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id + '/modify', {
          method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
        });
      }
    }));
    res.json({ success: true, processed: messageIds.length });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/gmail/ai-classify', async (req, res) => {
  try {
    const { messages } = req.body;
    if(!messages || !messages.length) return res.json({ success: true, classified: [] });
    const bookContext = await getBookContext('email inbox management Crystal Ball Bouncy Ball');
    const classified = await Promise.all(messages.map(async (msg) => {
      try {
        const text = msg.subject + ': ' + msg.snippet;
        const r = await fetch('https://essential-ea-app-production.up.railway.app/api/classify', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ taskDescription: text })
        });
        const d = await r.json();
        return { id: msg.id, classification: d.success ? d.classification : null };
      } catch(e) { return { id: msg.id, classification: null }; }
    }));
    res.json({ success: true, classified });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/gmail/labels', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, labels: [] });
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const d = await r.json();
    const userLabels = (d.labels || []).filter(l => l.type === 'user');
    res.json({ success: true, labels: userLabels });
  } catch(e) { res.status(500).json({ success: false, labels: [] }); }
});

// ============ CALENDAR - FULL ============

app.get('/api/calendar/events', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Google not connected', events: [] });
    const days = parseInt(req.query.days) || 7;
    const now = new Date().toISOString();
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + now + '&timeMax=' + future + '&singleEvents=true&orderBy=startTime&maxResults=50', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const calData = await calRes.json();
    const events = (calData.items || []).map(e => ({
      id: e.id, summary: e.summary || '(no title)',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || '', description: e.description || '',
      attendees: (e.attendees || []).map(a => a.email),
      isAllDay: !e.start?.dateTime
    }));
    res.json({ success: true, events });
  } catch(e) { res.status(500).json({ success: false, error: e.message, events: [] }); }
});

app.post('/api/calendar/create', async (req, res) => {
  try {
    const { summary, start, end, description, location, attendees, title, date, startTime, endTime } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected to Google Calendar. Please reconnect Gmail.' });
    
    // Handle both formats: {summary,start,end} or {title,date,startTime,endTime}
    const eventTitle = summary || title || 'New Event';
    const eventDate = date || new Date().toISOString().split('T')[0];
    const eventStart = start || `${eventDate}T${(startTime||'09:00:00').replace(/^(\d{2}:\d{2})$/, '$1:00')}`;
    const eventEnd = end || `${eventDate}T${(endTime||'10:00:00').replace(/^(\d{2}:\d{2})$/, '$1:00')}`;
    
    // Ensure proper ISO format with seconds
    const formatDT = (dt) => {
      if(dt.includes('T') && dt.split('T')[1].length === 5) return dt + ':00';
      return dt;
    };
    
    const event = {
      summary: eventTitle,
      description: description || '',
      location: location || '',
      start: { dateTime: formatDT(eventStart), timeZone: 'America/Chicago' },
      end: { dateTime: formatDT(eventEnd), timeZone: 'America/Chicago' },
      attendees: (attendees || []).filter(Boolean).map(e => ({ email: e.trim() }))
    };
    const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    const d = await r.json();
    if(d.id) res.json({ success: true, event: d });
    else res.json({ success: false, error: d.error?.message || 'Failed' });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/calendar/event/:id', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/' + req.params.id, {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + accessToken }
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/calendar/suggest', async (req, res) => {
  try {
    const { emailText } = req.body;
    const bookContext = await getBookContext('calendar meeting schedule Crystal Ball time blocks');
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 400,
      system: [{ type: 'text', text: METHODOLOGY_CONTEXT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: 'This email mentions a meeting or appointment. Extract the event details and return JSON only: {"shouldAdd": true/false, "summary": "event title", "suggestedDate": "YYYY-MM-DD", "suggestedTime": "HH:MM", "duration": 60, "notes": "any relevant notes"}. Email: ' + emailText + bookContext }]
    });
    const text = response.content[0].text;
    try {
      const data = safeParseAI(text) || { shouldAdd: false };
      res.json({ success: true, suggestion: data });
    } catch(e) { res.json({ success: true, suggestion: { shouldAdd: false } }); }
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});


// ============ EA RUN MY INBOX - AUTONOMOUS EXECUTION ============

app.post('/api/ea-run-inbox', async (req, res) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Gmail not connected' });

    // Fetch unread inbox messages
    const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=is:unread in:inbox', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const listData = await listRes.json();
    if(!listData.messages || !listData.messages.length) {
      return res.json({ success: true, summary: 'Your inbox is clear. No unread emails to process.', results: [], handled: 0, needsApproval: 0 });
    }

    // Fetch message details
    const messages = await Promise.all(
      listData.messages.slice(0, 15).map(async (msg) => {
        const msgRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + msg.id + '?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date', {
          headers: { Authorization: 'Bearer ' + accessToken }
        });
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
        return {
          id: msg.id,
          threadId: msgData.threadId,
          subject: getHeader('Subject') || '(no subject)',
          from: getHeader('From'),
          date: getHeader('Date'),
          snippet: msgData.snippet || ''
        };
      })
    );

    const bookContext = await getBookContext('Bouncy Ball email delegation EA handles routine emails');
    const results = [];
    let handled = 0;
    let needsApproval = 0;

    // Process each message with AI decision
    for(const msg of messages) {
      try {
        const prompt = 'You are the Essential EA analyzing an email on behalf of Kristina Spencer. Decide what to do with this email using the Crystal Ball and Bouncy Ball Framework.' +
          '\n\nFrom: ' + msg.from +
          '\nSubject: ' + msg.subject +
          '\nPreview: ' + msg.snippet +
          '\n\nRespond ONLY with JSON:\n{"action":"auto_reply|draft_approval|archive|flag","classification":"crystal|bouncy","reason":"brief explanation (max 15 words)","reply":"full reply text if action is auto_reply or draft_approval, else empty string","confidence":0.0-1.0}' +
          '\n\nRules:\\n- archive: newsletters, marketing, promotions, no-reply, automated, subscription emails. Be AGGRESSIVE - if it looks commercial, archive it.\\n- flag: real person emailing about clients, deals, money, legal (Crystal Ball decisions)\\n- draft_approval: real person who needs a thoughtful reply\\n- auto_reply: only simple scheduling confirmations with confidence > 0.9' +
           bookContext;

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 600,
          system: [
            { type: 'text', text: METHODOLOGY_CONTEXT, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: 'You are processing emails as an EA. Return only valid JSON. Be conservative - when in doubt, flag for user review.' }
          ],
          messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content[0].text.trim();
        let decision;
        try {
          decision = safeParseAI(text);
          if(!decision) { throw new Error('No JSON in response'); }
          if(!decision.action) throw new Error('No action in decision');
        } catch(parseErr) {
          console.error('Parse error for msg', msg.id, ':', parseErr.message, 'Text:', text.substring(0,100));
          results.push({ id: msg.id, subject: msg.subject, from: msg.from, action: 'flag', classification: 'crystal', reason: 'Could not process - flagged for review', executedLabel: 'Flagged', executed: false });
          needsApproval++;
          continue;
        }

        const result = {
          id: msg.id,
          threadId: msg.threadId,
          from: msg.from,
          subject: msg.subject,
          action: decision.action,
          classification: decision.classification,
          reason: decision.reason,
          reply: decision.reply || '',
          confidence: decision.confidence || 0.8,
          executed: false
        };

        // Execute the decision
        if(decision.action === 'archive') {
          await fetch(RAILWAY + '/api/gmail/archive', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: msg.id })
          });
          result.executed = true;
          result.executedLabel = 'Archived';
          handled++;
        } else if(decision.action === 'auto_reply' && decision.reply && decision.confidence > 0.85) {
          // Send the reply
          const email = ['To: ' + msg.from, 'Subject: Re: ' + msg.subject, 'Content-Type: text/plain; charset=utf-8', '', decision.reply].join('\n');
          const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw: encoded })
          });
          const sendData = await sendRes.json();
          if(sendData.id) {
            // Archive after replying
            await fetch(RAILWAY + '/api/gmail/archive', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageId: msg.id })
            });
            result.executed = true;
            result.executedLabel = 'Replied & Archived';
            handled++;
          } else {
            result.action = 'draft_approval';
            result.executedLabel = 'Draft - Needs Approval';
            needsApproval++;
          }
        } else if(decision.action === 'draft_approval') {
          result.executedLabel = 'Draft Ready - Needs Your Approval';
          needsApproval++;
        } else {
          result.executedLabel = 'Flagged for Your Review';
          needsApproval++;
        }

        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));

      } catch(e) {
        console.error('EA inbox error for message:', msg.id, 'Error:', e.message, 'Stack:', e.stack?.substring(0,200));
        results.push({ 
          id: msg.id, 
          subject: msg.subject, 
          from: msg.from, 
          action: 'flag', 
          classification: 'crystal',
          reason: 'EA could not process: ' + e.message.substring(0,50), 
          executedLabel: 'Flagged', 
          executed: false 
        });
        needsApproval++;
      }
    }

    const summary = 'Your EA processed ' + messages.length + ' emails. ' +
      (handled > 0 ? handled + ' handled automatically. ' : '') +
      (needsApproval > 0 ? needsApproval + ' need your review.' : 'All clear!');

    res.json({ success: true, summary, results, handled, needsApproval, total: messages.length });

  } catch(e) {
    console.error('EA run inbox error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ea-approve-reply', async (req, res) => {
  try {
    const { messageId, threadId, to, subject, reply } = req.body;
    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    const email = ['To: ' + to, 'Subject: Re: ' + subject, 'Content-Type: text/plain; charset=utf-8', '', reply].join('\n');
    const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded, threadId: threadId || undefined })
    });
    const sendData = await sendRes.json();
    if(sendData.id) {
      // Archive after approving
      await fetch(RAILWAY + '/api/gmail/archive', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Send failed' });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// ============ MICROSOFT OAUTH ============

app.get('/auth/microsoft', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    scope: 'openid email profile Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite offline_access',
    response_mode: 'query',
    prompt: 'select_account'
  });
  // Use 'common' to support both personal and work accounts
  res.redirect('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + params.toString());
});

app.get('/auth/microsoft/callback', async (req, res) => {
  const { code, error } = req.query;
  if(error) return res.redirect(VERCEL + '/?microsoft_error=' + error);
  if(!code) return res.redirect(VERCEL + '/?microsoft_error=no_code');
  try {
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'openid email profile Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite offline_access'
      })
    });
    const tokens = await tokenRes.json();
    if(tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Get user profile
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: 'Bearer ' + tokens.access_token }
    });
    const profile = await profileRes.json();
    const email = profile.mail || profile.userPrincipalName || '';

    // Store tokens
    const expiry = tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null;
    await sql`DELETE FROM microsoft_tokens WHERE user_id = 'default'`;
    await sql`INSERT INTO microsoft_tokens (user_id, access_token, refresh_token, expiry_date, email)
      VALUES ('default', ${tokens.access_token}, ${tokens.refresh_token || null}, ${expiry}, ${email})`;

    console.log('Microsoft OAuth success for:', email);
    res.redirect(VERCEL + '/?microsoft_connected=true&email=' + encodeURIComponent(email));
  } catch(e) {
    console.error('Microsoft OAuth error:', e.message);
    res.redirect(VERCEL + '/?microsoft_error=' + encodeURIComponent(e.message));
  }
});

app.get('/api/microsoft/status', async (req, res) => {
  try {
    const [token] = await sql`SELECT email, updated_at FROM microsoft_tokens WHERE user_id = 'default' LIMIT 1`;
    if(token) res.json({ connected: true, email: token.email });
    else res.json({ connected: false });
  } catch(e) { res.json({ connected: false }); }
});

app.get('/api/microsoft/disconnect', async (req, res) => {
  try {
    await sql`DELETE FROM microsoft_tokens WHERE user_id = 'default'`;
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false }); }
});

async function getMicrosoftAccessToken() {
  try {
    const [token] = await sql`SELECT * FROM microsoft_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!token) return null;
    if(token.expiry_date && Date.now() > token.expiry_date - 60000) {
      if(!token.refresh_token) return null;
      const refreshRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
          scope: 'Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite offline_access'
        })
      });
      const newTokens = await refreshRes.json();
      if(newTokens.access_token) {
        const newExpiry = Date.now() + ((newTokens.expires_in || 3600) * 1000);
        await sql`UPDATE microsoft_tokens SET access_token = ${newTokens.access_token}, expiry_date = ${newExpiry}, updated_at = NOW() WHERE user_id = 'default'`;
        return newTokens.access_token;
      }
      return null;
    }
    return token.access_token;
  } catch(e) { return null; }
}

app.get('/api/outlook/messages', async (req, res) => {
  try {
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Outlook not connected', messages: [] });
    const folder = req.query.folder || 'inbox';
    const search = req.query.search || '';
    // Build folder filter
    let folderFilter = '';
    if(folder === 'inbox') folderFilter = "parentFolderId eq 'inbox'";
    else if(folder === 'sent') folderFilter = "parentFolderId eq 'sentitems'";
    else if(folder === 'drafts') folderFilter = "parentFolderId eq 'drafts'";
    else if(folder === 'trash') folderFilter = "parentFolderId eq 'deleteditems'";
    else if(folder === 'starred') folderFilter = "flag/flagStatus eq 'flagged'";

    let url;
    if(search) {
      url = 'https://graph.microsoft.com/v1.0/me/messages?$search="' + search + '"&$top=25&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    } else if(folder === 'inbox') {
      url = 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    } else if(folder === 'sent') {
      url = 'https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages?$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    } else if(folder === 'drafts') {
      url = 'https://graph.microsoft.com/v1.0/me/mailFolders/drafts/messages?$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    } else if(folder === 'trash') {
      url = 'https://graph.microsoft.com/v1.0/me/mailFolders/deleteditems/messages?$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    } else if(folder === 'starred') {
      url = 'https://graph.microsoft.com/v1.0/me/messages?$filter=flag/flagStatus eq \'flagged\'&$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    } else {
      url = 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=25&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,flag,hasAttachments';
    }
    console.log('Outlook URL:', url);
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + accessToken } });
    const responseText = await r.text();
    console.log('Outlook response status:', r.status);
    console.log('Outlook response preview:', responseText.substring(0, 200));
    
    // Handle 401 - try to refresh token first
    if(r.status === 401) {
      console.log('Outlook 401 - attempting token refresh...');
      try {
        const [token] = await sql`SELECT * FROM microsoft_tokens WHERE user_id = 'default' LIMIT 1`;
        if(token && token.refresh_token) {
          const refreshRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.MICROSOFT_CLIENT_ID,
              client_secret: process.env.MICROSOFT_CLIENT_SECRET,
              refresh_token: token.refresh_token,
              grant_type: 'refresh_token',
              scope: 'Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite offline_access'
            })
          });
          const newTokens = await refreshRes.json();
          console.log('Refresh result:', newTokens.access_token ? 'SUCCESS' : 'FAILED', newTokens.error || '');
          if(newTokens.access_token) {
            const newExpiry = Date.now() + ((newTokens.expires_in || 3600) * 1000);
            await sql`UPDATE microsoft_tokens SET access_token = \${newTokens.access_token}, expiry_date = \${newExpiry}, updated_at = NOW() WHERE user_id = 'default'`;
            // Retry with new token
            const r2 = await fetch(url, { headers: { Authorization: 'Bearer ' + newTokens.access_token } });
            const rt2 = await r2.text();
            if(r2.status === 200 && rt2) {
              const d2 = JSON.parse(rt2);
              const messages = (d2.value || []).map(msg => ({
                id: msg.id, subject: msg.subject || '(no subject)',
                from: msg.from?.emailAddress?.address || '',
                fromName: msg.from?.emailAddress?.name || '',
                date: msg.receivedDateTime, snippet: msg.bodyPreview || '',
                isUnread: !msg.isRead, isStarred: msg.flag?.flagStatus === 'flagged',
                hasAttachments: msg.hasAttachments
              }));
              return res.json({ success: true, messages });
            }
          }
        }
      } catch(refreshErr) { console.error('Refresh error:', refreshErr.message); }
      // If refresh failed, prompt reconnect
      await sql`DELETE FROM microsoft_tokens WHERE user_id = 'default'`.catch(() => {});
      return res.json({ success: false, error: 'Outlook session expired - please reconnect', needsReconnect: true, messages: [] });
    }
    
    if(!responseText || responseText.trim() === '') {
      return res.json({ success: false, error: 'Empty response from Outlook', messages: [] });
    }
    let d;
    try { d = JSON.parse(responseText); } catch(parseErr) {
      console.error('Outlook JSON parse error:', parseErr.message);
      return res.json({ success: false, error: 'Invalid response from Outlook', messages: [] });
    }
    if(!d || d.error) {
      console.error('Outlook messages error:', JSON.stringify(d?.error));
      return res.json({ success: false, error: d?.error?.message || 'Failed to fetch messages', messages: [] });
    }
    const messages = (d.value || []).map(msg => ({
      id: msg.id,
      subject: msg.subject || '(no subject)',
      from: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name || '',
      date: msg.receivedDateTime,
      snippet: msg.bodyPreview || '',
      isUnread: !msg.isRead,
      isStarred: msg.flag?.flagStatus === 'flagged',
      hasAttachments: msg.hasAttachments
    }));
    res.json({ success: true, messages });
  } catch(e) { res.status(500).json({ success: false, error: e.message, messages: [] }); }
});

app.get('/api/outlook/message/:id', async (req, res) => {
  try {
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    const r = await fetch('https://graph.microsoft.com/v1.0/me/messages/' + req.params.id + '?$select=id,subject,from,toRecipients,receivedDateTime,body,isRead', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const msgText = await r.text();
    if(!msgText) return res.json({ success: false, error: 'Empty response' });
    const msg = JSON.parse(msgText);
    res.json({
      success: true,
      id: msg.id,
      subject: msg.subject,
      from: msg.from?.emailAddress?.address,
      fromName: msg.from?.emailAddress?.name,
      date: msg.receivedDateTime,
      body: msg.body?.content || msg.bodyPreview || '',
      bodyType: msg.body?.contentType || 'text',
      isUnread: !msg.isRead
    });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/outlook/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    const message = {
      subject,
      body: { contentType: 'Text', content: body },
      toRecipients: [{ emailAddress: { address: to } }]
    };
    const r = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, saveToSentItems: true })
    });
    if(r.status === 202) res.json({ success: true });
    else { const d = await r.json(); res.json({ success: false, error: d.error?.message || 'Send failed' }); }
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/outlook/archive', async (req, res) => {
  try {
    const { messageId } = req.body;
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://graph.microsoft.com/v1.0/me/messages/' + messageId + '/move', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: 'archive' })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/outlook/trash', async (req, res) => {
  try {
    const { messageId } = req.body;
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://graph.microsoft.com/v1.0/me/messages/' + messageId + '/move', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: 'deleteditems' })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/outlook/markread', async (req, res) => {
  try {
    const { messageId, unread } = req.body;
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://graph.microsoft.com/v1.0/me/messages/' + messageId, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: !unread })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/outlook/star', async (req, res) => {
  try {
    const { messageId, starred } = req.body;
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected' });
    await fetch('https://graph.microsoft.com/v1.0/me/messages/' + messageId, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag: { flagStatus: starred ? 'flagged' : 'notFlagged' } })
    });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/outlook/calendar', async (req, res) => {
  try {
    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.json({ success: false, error: 'Not connected', events: [] });
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const r = await fetch('https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=' + now + '&endDateTime=' + future + '&$top=20&$orderby=start/dateTime&$select=id,subject,start,end,location,bodyPreview', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    const d = await r.json();
    const events = (d.value || []).map(e => ({
      id: e.id,
      summary: e.subject || '(no title)',
      start: e.start?.dateTime,
      end: e.end?.dateTime,
      location: e.location?.displayName || '',
      description: e.bodyPreview || ''
    }));
    res.json({ success: true, events });
  } catch(e) { res.status(500).json({ success: false, error: e.message, events: [] }); }
});

app.get('/api/microsoft/debug', async (req, res) => {
  try {
    const [token] = await sql`SELECT user_id, email, expiry_date, updated_at, 
      CASE WHEN refresh_token IS NOT NULL THEN 'yes' ELSE 'no' END as has_refresh,
      CASE WHEN access_token IS NOT NULL THEN 'yes' ELSE 'no' END as has_access
      FROM microsoft_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!token) return res.json({ stored: false });
    const now = Date.now();
    res.json({
      stored: true,
      email: token.email,
      hasAccess: token.has_access === 'yes',
      hasRefresh: token.has_refresh === 'yes',
      expiryDate: token.expiry_date,
      expired: token.expiry_date ? now > token.expiry_date : 'unknown',
      updatedAt: token.updated_at
    });
  } catch(e) { res.json({ error: e.message }); }
});


// ============ USER PROFILE ============

app.get('/api/profile', async (req, res) => {
  try {
    const [profile] = await sql`SELECT * FROM user_profiles WHERE user_id = 'default' LIMIT 1`;
    res.json({ success: true, profile: profile || null });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { name, role, industry, company, revenue_target, team_size, timezone, working_hours, peak_hours, priorities, protected_blocks, ai_tone } = req.body;
    await sql`INSERT INTO user_profiles (user_id, name, role, industry, company, revenue_target, team_size, timezone, working_hours, peak_hours, priorities, protected_blocks, ai_tone, updated_at)
      VALUES ('default', ${name||''}, ${role||''}, ${industry||''}, ${company||''}, ${revenue_target||''}, ${team_size||''}, ${timezone||'America/Chicago'}, ${working_hours||'8am-6pm'}, ${peak_hours||'9am-12pm'}, ${priorities||''}, ${protected_blocks||''}, ${ai_tone||'professional'}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name, role = EXCLUDED.role, industry = EXCLUDED.industry,
        company = EXCLUDED.company, revenue_target = EXCLUDED.revenue_target,
        team_size = EXCLUDED.team_size, timezone = EXCLUDED.timezone,
        working_hours = EXCLUDED.working_hours, peak_hours = EXCLUDED.peak_hours,
        priorities = EXCLUDED.priorities, protected_blocks = EXCLUDED.protected_blocks,
        ai_tone = EXCLUDED.ai_tone, updated_at = NOW()`;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// ============ SECURITY - Rate limiting ============

const requestCounts = new Map();
function rateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    if(!requestCounts.has(key)) requestCounts.set(key, []);
    const requests = requestCounts.get(key).filter(t => now - t < windowMs);
    if(requests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.', success: false });
    }
    requests.push(now);
    requestCounts.set(key, requests);
    next();
  };
}

// Apply rate limiting to AI routes
app.use('/api/classify', rateLimit(30, 60000));
app.use('/api/generate-week', rateLimit(10, 60000));
app.use('/api/daily-brief', rateLimit(10, 60000));
app.use('/api/ea-draft', rateLimit(20, 60000));
app.use('/api/ea-run-inbox', rateLimit(5, 60000));
app.use('/api/audit', rateLimit(10, 60000));

// Security headers + CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ============ MEETING RECORDINGS ============

app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio, filename } = req.body;
    if(!audio) return res.status(400).json({ success: false, error: 'No audio data provided' });

    // Decode base64 audio
    const audioBuffer = Buffer.from(audio, 'base64');
    const fileExt = (filename || 'recording.webm').split('.').pop();

    // Use OpenAI Whisper for transcription
    const { OpenAI } = await import('openai');
    const openaiClient2 = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { Blob } = await import('buffer');
    const audioBlob = new Blob([audioBuffer], { type: 'audio/' + fileExt });
    const audioFile = new File([audioBlob], filename || 'recording.' + fileExt, { type: 'audio/' + fileExt });

    const transcription = await openaiClient2.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text'
    });

    const transcript = typeof transcription === 'string' ? transcription : transcription.text || '';
    
    // Validate transcript quality
    if(!transcript || transcript.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Recording too short or unclear. Please ensure microphone is working and speak clearly.' });
    }
    
    // Check if transcript looks like noise/product names (less than 3 words that form sentences)
    const words = transcript.trim().split(/\s+/);
    const hasFullSentences = transcript.includes('.') || transcript.includes(',') || words.length > 10;
    if(!hasFullSentences && words.length < 5) {
      return res.status(400).json({ success: false, error: 'Could not detect clear speech. Check microphone permissions and try again in a quiet environment.' });
    }

    // Analyze transcript with Claude
    const bookContext = await getBookContext('meeting action items Crystal Ball decisions follow up');
    const analysis = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: [
        { type: 'text', text: METHODOLOGY_CONTEXT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Analyze meeting transcripts and extract actionable intelligence using the Crystal Ball and Bouncy Ball Framework.' }
      ],
      messages: [{
        role: 'user',
        content: 'Analyze this meeting transcript and return JSON only: {"summary": "2-3 sentence meeting summary", "crystalBall": ["decisions or actions only the executive can handle"], "bouncyBall": ["tasks that can be delegated to EA"], "followUps": ["specific follow-up items with who is responsible"], "keyDecisions": ["major decisions made"], "nextSteps": "recommended immediate next action"}\n\nTranscript: ' + transcript.substring(0, 3000) + bookContext
      }]
    });

    const analysisText = analysis.content[0].text.trim();
    let analysisData = null;
    try {
      const match = analysisText.match(/\{[\s\S]*\}/);
      if(match) analysisData = JSON.parse(match[0]);
    } catch(e) {}

    // Save to database
    await sql`CREATE TABLE IF NOT EXISTS meeting_recordings (
      id SERIAL PRIMARY KEY,
      filename TEXT,
      transcript TEXT,
      summary TEXT,
      analysis JSONB,
      duration_seconds INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
    const [saved] = await sql`INSERT INTO meeting_recordings (filename, transcript, summary, analysis)
      VALUES (${filename||'Recording'}, ${transcript}, ${analysisData?.summary||''}, ${JSON.stringify(analysisData)})
      RETURNING id`;

    res.json({
      success: true,
      transcript,
      analysis: analysisData,
      id: saved.id
    });
  } catch(e) {
    console.error('Transcription error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/meetings', async (req, res) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS meeting_recordings (id SERIAL PRIMARY KEY, filename TEXT, transcript TEXT, summary TEXT, analysis JSONB, duration_seconds INTEGER, created_at TIMESTAMP DEFAULT NOW())`;
    const meetings = await sql`SELECT id, filename, summary, created_at FROM meeting_recordings ORDER BY created_at DESC LIMIT 20`;
    res.json({ success: true, meetings });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/meetings/:id', async (req, res) => {
  try {
    const [meeting] = await sql`SELECT * FROM meeting_recordings WHERE id = \${parseInt(req.params.id)}`;
    if(!meeting) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, meeting });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// ============ CLERK AUTHENTICATION ============

async function verifyClerkToken(req) {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-clerk-session-token'] || 
                         req.cookies?.['__session'] ||
                         (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
    
    if(!sessionToken) return null;
    
    // Verify with Clerk
    const verifyRes = await fetch('https://api.clerk.com/v1/sessions/' + sessionToken + '/verify', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if(!verifyRes.ok) return null;
    const session = await verifyRes.json();
    return session.user_id || null;
  } catch(e) {
    return null;
  }
}

// Middleware to check auth on protected routes
function requireAuth(req, res, next) {
  // Skip auth in development or if no Clerk key set
  if(!process.env.CLERK_SECRET_KEY || process.env.NODE_ENV === 'development') {
    return next();
  }
  // Allow OPTIONS requests
  if(req.method === 'OPTIONS') return next();
  next(); // For now pass through - will enforce after testing
}

// Auth status endpoint
app.get('/api/auth/status', async (req, res) => {
  if(!process.env.CLERK_PUBLISHABLE_KEY) {
    return res.json({ enabled: false, authenticated: true });
  }
  res.json({ 
    enabled: true, 
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    authenticated: false
  });
});


// ============ STRIPE PAYMENTS ============

app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { priceId, plan } = req.body;
    if(!priceId) return res.status(400).json({ success: false, error: 'No price ID provided' });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': VERCEL + '/?subscription=success&plan=' + (plan||''),
        'cancel_url': VERCEL + '/?subscription=cancelled',
        'allow_promotion_codes': 'true',
        'billing_address_collection': 'auto'
      })
    });

    const session = await response.json();
    if(session.error) return res.status(400).json({ success: false, error: session.error.message });
    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/stripe/prices', (req, res) => {
  res.json({
    success: true,
    prices: {
      solo: { id: process.env.STRIPE_PRICE_SOLO, name: 'Solo', price: 79, description: 'Perfect for individual executives' },
      founding: { id: process.env.STRIPE_PRICE_FOUNDING, name: 'Founding Member', price: 67, description: 'Locked for life - founding rate' },
      blueprint: { id: process.env.STRIPE_PRICE_BLUEPRINT, name: 'Blueprint', price: 167, description: 'For teams up to 5' }
    }
  });
});

app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    // Verify webhook signature
    if(webhookSecret && sig) {
      // Manual signature verification without Stripe SDK
      const crypto = await import('crypto');
      const payload = req.body.toString('utf8');
      const parts = sig.split(',');
      const timestamp = parts.find(p => p.startsWith('t=')).slice(2);
      const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.slice(3));
      
      const signedPayload = timestamp + '.' + payload;
      const expectedSig = crypto.default.createHmac('sha256', webhookSecret)
        .update(signedPayload).digest('hex');
      
      if(!signatures.includes(expectedSig)) {
        console.error('Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
      event = JSON.parse(payload);
    } else {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch(e) {
    console.error('Webhook parse error:', e.message);
    return res.status(400).json({ error: e.message });
  }

  console.log('Stripe webhook event:', event.type);

  try {
    // Create subscriptions table if needed
    await sql`CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) DEFAULT 'default',
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      plan VARCHAR(100),
      status VARCHAR(50),
      current_period_end BIGINT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;

    switch(event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session.id, 'customer:', session.customer);
        await sql`INSERT INTO subscriptions (stripe_customer_id, stripe_subscription_id, status, updated_at)
          VALUES (${session.customer}, ${session.subscription}, 'active', NOW())
          ON CONFLICT (stripe_subscription_id) DO UPDATE SET
            status = 'active', updated_at = NOW()`.catch(e => console.log('DB insert error:', e.message));
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const plan = sub.items?.data?.[0]?.price?.id || 'unknown';
        const planName = plan === process.env.STRIPE_PRICE_SOLO ? 'solo' :
                         plan === process.env.STRIPE_PRICE_FOUNDING ? 'founding' :
                         plan === process.env.STRIPE_PRICE_BLUEPRINT ? 'blueprint' : 'unknown';
        console.log('Subscription updated:', sub.id, 'status:', sub.status, 'plan:', planName);
        await sql`INSERT INTO subscriptions (stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, updated_at)
          VALUES (${sub.customer}, ${sub.id}, ${planName}, ${sub.status}, ${sub.current_period_end}, NOW())
          ON CONFLICT (stripe_subscription_id) DO UPDATE SET
            plan = EXCLUDED.plan, status = EXCLUDED.status,
            current_period_end = EXCLUDED.current_period_end, updated_at = NOW()`.catch(e => console.log('DB error:', e.message));
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log('Subscription cancelled:', sub.id);
        await sql`UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
          WHERE stripe_subscription_id = ${sub.id}`.catch(e => console.log('DB error:', e.message));
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice.id, 'amount:', invoice.amount_paid);
        await sql`UPDATE subscriptions SET status = 'active', updated_at = NOW()
          WHERE stripe_customer_id = ${invoice.customer}`.catch(e => console.log('DB error:', e.message));
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice.id);
        await sql`UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
          WHERE stripe_customer_id = ${invoice.customer}`.catch(e => console.log('DB error:', e.message));
        break;
      }
      default:
        console.log('Unhandled webhook event:', event.type);
    }
  } catch(e) {
    console.error('Webhook handler error:', e.message);
  }

  res.json({ received: true });
});

app.get('/api/subscription/status', async (req, res) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, user_id VARCHAR(255) DEFAULT 'default', stripe_customer_id VARCHAR(255), stripe_subscription_id VARCHAR(255) UNIQUE, plan VARCHAR(100), status VARCHAR(50), current_period_end BIGINT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    const [sub] = await sql`SELECT * FROM subscriptions WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1`;
    if(sub) {
      res.json({ success: true, active: true, plan: sub.plan, status: sub.status });
    } else {
      res.json({ success: true, active: false });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/stripe/publishable-key', (req, res) => {
  res.json({ key: process.env.STRIPE_PUBLISHABLE_KEY });
});


// ============ GO HIGH LEVEL CRM ============

const GHL_BASE = 'https://services.leadconnectorhq.com';

async function ghlRequest(endpoint, method, body) {
  // Try both v1 and v2 auth formats
  const headers = {
    'Authorization': 'Bearer ' + process.env.GHL_API_KEY,
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  };
  console.log('GHL request:', method || 'GET', GHL_BASE + endpoint);
  const res = await fetch(GHL_BASE + endpoint, {
    method: method || 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  console.log('GHL response status:', res.status, 'body:', text.substring(0, 150));
  try { return JSON.parse(text); } catch(e) { return { error: text, status: res.status }; }
}

app.get('/api/ghl/status', async (req, res) => {
  try {
    if(!process.env.GHL_API_KEY) return res.json({ connected: false });
    // Test connection by fetching location info
    // Use contacts endpoint to verify connection - locations requires extra scope
    const contacts = await ghlRequest('/contacts/?locationId=' + process.env.GHL_LOCATION_ID + '&limit=1');
    console.log('GHL status check:', JSON.stringify(contacts).substring(0, 150));
    if(contacts.contacts !== undefined || Array.isArray(contacts.contacts)) {
      res.json({ connected: true, name: 'Be. Coaching - Go High Level', id: process.env.GHL_LOCATION_ID });
    } else if(contacts.statusCode === 401) {
      res.json({ connected: false, error: 'Token not authorized - check scopes in GHL' });
    } else {
      res.json({ connected: false, error: contacts.message || JSON.stringify(contacts).substring(0, 100) });
    }
  } catch(e) {
    res.json({ connected: false, error: e.message });
  }
});

app.get('/api/ghl/contacts', async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit || 20;
    let endpoint = '/contacts/?locationId=' + process.env.GHL_LOCATION_ID + '&limit=' + limit;
    if(search) endpoint += '&query=' + encodeURIComponent(search);
    const data = await ghlRequest(endpoint);
    res.json({ success: true, contacts: data.contacts || [], total: data.total || 0 });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ghl/contacts', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, tags, notes } = req.body;
    const contact = {
      locationId: process.env.GHL_LOCATION_ID,
      firstName, lastName, email, phone,
      tags: tags || ['Essential EA'],
      source: 'The Essential EA'
    };
    const data = await ghlRequest('/contacts/', 'POST', contact);
    if(data.contact) {
      if(notes) {
        await ghlRequest('/contacts/' + data.contact.id + '/notes', 'POST', {
          body: notes,
          userId: data.contact.id
        });
      }
      res.json({ success: true, contact: data.contact });
    } else {
      res.json({ success: false, error: data.message || 'Failed to create contact' });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ghl/tasks', async (req, res) => {
  try {
    const { title, dueDate, contactId, assignedTo, description } = req.body;
    const task = {
      title,
      body: description || '',
      dueDate: dueDate || new Date(Date.now() + 24*60*60*1000).toISOString(),
      completed: false,
      contactId: contactId || null,
      assignedTo: assignedTo || null
    };
    const endpoint = '/contacts/' + (contactId || 'none') + '/tasks';
    const data = await ghlRequest('/locations/' + process.env.GHL_LOCATION_ID + '/tasks', 'POST', task);
    res.json({ success: true, task: data });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ghl/opportunities', async (req, res) => {
  try {
    const { title, contactId, pipelineId, stageId, monetaryValue, status } = req.body;
    // Get pipelines first if no pipelineId
    let pipeline = pipelineId;
    if(!pipeline) {
      const pipelines = await ghlRequest('/opportunities/pipelines?locationId=' + process.env.GHL_LOCATION_ID);
      pipeline = pipelines.pipelines?.[0]?.id;
    }
    const opp = {
      title,
      contactId,
      locationId: process.env.GHL_LOCATION_ID,
      pipelineId: pipeline,
      pipelineStageId: stageId || null,
      monetaryValue: monetaryValue || 0,
      status: status || 'open',
      source: 'The Essential EA'
    };
    const data = await ghlRequest('/opportunities/', 'POST', opp);
    res.json({ success: true, opportunity: data });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ghl/sync-task', async (req, res) => {
  try {
    const { task, classification, reason, action } = req.body;
    // When EA classifies a Bouncy Ball task, create it in GHL
    if(classification === 'bouncy') {
      const ghlTask = {
        title: task,
        body: 'EA Classification: Bouncy Ball - Delegate\nReason: ' + reason + '\nRecommended Action: ' + action,
        dueDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
        completed: false
      };
      const data = await ghlRequest('/locations/' + process.env.GHL_LOCATION_ID + '/tasks', 'POST', ghlTask);
      res.json({ success: true, synced: true, taskId: data.id });
    } else {
      res.json({ success: true, synced: false, reason: 'Crystal Ball tasks stay with executive' });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/ghl/pipelines', async (req, res) => {
  try {
    const data = await ghlRequest('/opportunities/pipelines?locationId=' + process.env.GHL_LOCATION_ID);
    res.json({ success: true, pipelines: data.pipelines || [] });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// ============ QUICKBOOKS INTEGRATION ============

const QB_BASE_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com';
const QB_BASE_PRODUCTION = 'https://quickbooks.api.intuit.com';

function getQBBase() {
  return process.env.QUICKBOOKS_ENVIRONMENT === 'production' ? QB_BASE_PRODUCTION : QB_BASE_SANDBOX;
}

app.get('/auth/quickbooks', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state: 'essential_ea_qb'
  });
  res.redirect('https://appcenter.intuit.com/connect/oauth2?' + params.toString());
});

app.get('/auth/quickbooks/callback', async (req, res) => {
  const { code, realmId, error } = req.query;
  if(error) return res.redirect(VERCEL + '/?qb_error=' + error);
  if(!code) return res.redirect(VERCEL + '/?qb_error=no_code');
  try {
    const credentials = Buffer.from(process.env.QUICKBOOKS_CLIENT_ID + ':' + process.env.QUICKBOOKS_CLIENT_SECRET).toString('base64');
    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI
      })
    });
    const tokens = await tokenRes.json();
    if(tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Store tokens and realmId
    await sql`CREATE TABLE IF NOT EXISTS quickbooks_tokens (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) DEFAULT 'default' UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      realm_id VARCHAR(255),
      expiry_date BIGINT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;
    await sql`DELETE FROM quickbooks_tokens WHERE user_id = 'default'`;
    const expiry = Date.now() + ((tokens.expires_in || 3600) * 1000);
    await sql`INSERT INTO quickbooks_tokens (user_id, access_token, refresh_token, realm_id, expiry_date)
      VALUES ('default', ${tokens.access_token}, ${tokens.refresh_token}, ${realmId}, ${expiry})`;

    console.log('QuickBooks connected, realmId:', realmId);
    res.redirect(VERCEL + '/?qb_connected=true');
  } catch(e) {
    console.error('QuickBooks OAuth error:', e.message);
    res.redirect(VERCEL + '/?qb_error=' + encodeURIComponent(e.message));
  }
});

async function getQBAccessToken() {
  try {
    const [token] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!token) return null;
    if(token.expiry_date && Date.now() > token.expiry_date - 60000) {
      const credentials = Buffer.from(process.env.QUICKBOOKS_CLIENT_ID + ':' + process.env.QUICKBOOKS_CLIENT_SECRET).toString('base64');
      const refreshRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refresh_token })
      });
      const newTokens = await refreshRes.json();
      if(newTokens.access_token) {
        const newExpiry = Date.now() + ((newTokens.expires_in || 3600) * 1000);
        await sql`UPDATE quickbooks_tokens SET access_token = ${newTokens.access_token}, expiry_date = ${newExpiry}, updated_at = NOW() WHERE user_id = 'default'`;
        return { token: newTokens.access_token, realmId: token.realm_id };
      }
      return null;
    }
    return { token: token.access_token, realmId: token.realm_id };
  } catch(e) { return null; }
}

app.get('/api/quickbooks/status', async (req, res) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS quickbooks_tokens (id SERIAL PRIMARY KEY, user_id VARCHAR(255) DEFAULT 'default' UNIQUE, access_token TEXT, refresh_token TEXT, realm_id VARCHAR(255), expiry_date BIGINT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    const [token] = await sql`SELECT realm_id, updated_at FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(token) res.json({ connected: true, realmId: token.realm_id });
    else res.json({ connected: false });
  } catch(e) { res.json({ connected: false }); }
});

app.get('/api/quickbooks/disconnect', async (req, res) => {
  try {
    await sql`DELETE FROM quickbooks_tokens WHERE user_id = 'default'`;
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false }); }
});

app.get('/api/quickbooks/company', async (req, res) => {
  try {
    const auth = await getQBAccessToken();
    if(!auth) return res.json({ success: false, error: 'Not connected' });
    const r = await fetch(getQBBase() + '/v3/company/' + auth.realmId + '/companyinfo/' + auth.realmId + '?minorversion=65', {
      headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/json' }
    });
    const d = await r.json();
    res.json({ success: true, company: d.CompanyInfo });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/quickbooks/pnl', async (req, res) => {
  try {
    const auth = await getQBAccessToken();
    if(!auth) return res.json({ success: false, error: 'Not connected' });
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    const r = await fetch(getQBBase() + '/v3/company/' + auth.realmId + '/reports/ProfitAndLoss?start_date=' + startDate + '&end_date=' + endDate + '&minorversion=65', {
      headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/json' }
    });
    const d = await r.json();
    res.json({ success: true, report: d });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/quickbooks/invoices', async (req, res) => {
  try {
    const auth = await getQBAccessToken();
    if(!auth) return res.json({ success: false, error: 'Not connected', invoices: [] });
    const r = await fetch(getQBBase() + '/v3/company/' + auth.realmId + "/query?query=SELECT * FROM Invoice WHERE Balance > '0' ORDERBY DueDate DESC MAXRESULTS 20&minorversion=65", {
      headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/json' }
    });
    const d = await r.json();
    const invoices = d.QueryResponse?.Invoice || [];
    res.json({ success: true, invoices });
  } catch(e) { res.status(500).json({ success: false, error: e.message, invoices: [] }); }
});

app.get('/api/quickbooks/expenses', async (req, res) => {
  try {
    const auth = await getQBAccessToken();
    if(!auth) return res.json({ success: false, error: 'Not connected', expenses: [] });
    const r = await fetch(getQBBase() + '/v3/company/' + auth.realmId + '/query?query=SELECT * FROM Purchase ORDERBY TxnDate DESC MAXRESULTS 20&minorversion=65', {
      headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/json' }
    });
    const d = await r.json();
    const expenses = d.QueryResponse?.Purchase || [];
    res.json({ success: true, expenses });
  } catch(e) { res.status(500).json({ success: false, error: e.message, expenses: [] }); }
});

app.get('/api/quickbooks/summary', async (req, res) => {
  try {
    const auth = await getQBAccessToken();
    if(!auth) return res.json({ success: false, error: 'Not connected' });
    // Get invoices and expenses in parallel
    const [invRes, expRes] = await Promise.all([
      fetch(getQBBase() + '/v3/company/' + auth.realmId + "/query?query=SELECT * FROM Invoice WHERE Balance > '0' MAXRESULTS 50&minorversion=65", {
        headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/json' }
      }),
      fetch(getQBBase() + '/v3/company/' + auth.realmId + '/query?query=SELECT * FROM Purchase MAXRESULTS 50&minorversion=65', {
        headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/json' }
      })
    ]);
    const invData = await invRes.json();
    const expData = await expRes.json();
    const invoices = invData.QueryResponse?.Invoice || [];
    const expenses = expData.QueryResponse?.Purchase || [];
    const unpaidTotal = invoices.reduce((sum, inv) => sum + (parseFloat(inv.Balance) || 0), 0);
    const expenseTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.TotalAmt) || 0), 0);
    res.json({
      success: true,
      summary: {
        unpaidInvoices: invoices.length,
        unpaidTotal: unpaidTotal.toFixed(2),
        recentExpenses: expenses.length,
        expenseTotal: expenseTotal.toFixed(2),
        topUnpaid: invoices.slice(0,3).map(inv => ({
          customer: inv.CustomerRef?.name || 'Unknown',
          amount: inv.Balance,
          due: inv.DueDate
        }))
      }
    });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});



// ============ EA TASK LIST ============

app.get('/api/ea-tasks', async (req, res) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS ea_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      priority VARCHAR(50) DEFAULT 'normal',
      source VARCHAR(100),
      due_date TEXT,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;
    const tasks = await sql`SELECT * FROM ea_tasks ORDER BY created_at DESC LIMIT 50`;
    res.json({ success: true, tasks });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ea-tasks', async (req, res) => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS ea_tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, status VARCHAR(50) DEFAULT 'pending', priority VARCHAR(50) DEFAULT 'normal', source VARCHAR(100), due_date TEXT, completed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
    const { title, description, priority, source, due_date } = req.body;
    const [task] = await sql`INSERT INTO ea_tasks (title, description, priority, source, due_date)
      VALUES (${title}, ${description||''}, ${priority||'normal'}, ${source||'manual'}, ${due_date||''})
      RETURNING *`;
    res.json({ success: true, task });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/ea-tasks/:id', async (req, res) => {
  try {
    const { status, title, description } = req.body;
    const updates = [];
    if(status) {
      const completed = status === 'completed' ? new Date().toISOString() : null;
      await sql`UPDATE ea_tasks SET status = ${status}, completed_at = ${completed}, updated_at = NOW() WHERE id = ${parseInt(req.params.id)}`;
    }
    if(title) await sql`UPDATE ea_tasks SET title = ${title}, updated_at = NOW() WHERE id = ${parseInt(req.params.id)}`;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/ea-tasks/:id', async (req, res) => {
  try {
    await sql`DELETE FROM ea_tasks WHERE id = ${parseInt(req.params.id)}`;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
      elevenlabs: process.env.ELEVENLABS_API_KEY ? 'configured' : 'missing',
      pinecone: process.env.PINECONE_API_KEY ? 'configured' : 'missing'
    }
  });
});


// ============================================================
// QUICKBOOKS WRITE OPERATIONS
// ============================================================

app.post('/api/quickbooks/create-invoice', async (req, res) => {
  try {
    const { customerName, customerEmail, items, dueDate, memo } = req.body;
    const [tokens] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!tokens) return res.status(401).json({ success: false, error: 'QuickBooks not connected' });

    const line = (items || [{ description: 'Services', amount: 0 }]).map((item, i) => ({
      DetailType: 'SalesItemLineDetail',
      Amount: parseFloat(item.amount || 0),
      Description: item.description || 'Services',
      SalesItemLineDetail: { Qty: item.qty || 1, UnitPrice: parseFloat(item.amount || 0) }
    }));

    const invoice = {
      Line: line,
      CustomerRef: { name: customerName || 'Client' },
      DueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      PrivateNote: memo || ''
    };

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    const r = await fetch(`${baseUrl}/v3/company/${tokens.realm_id}/invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ Invoice: invoice })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: JSON.stringify(d) });
    res.json({ success: true, invoice: d.Invoice });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/quickbooks/mark-paid', async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod } = req.body;
    const [tokens] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!tokens) return res.status(401).json({ success: false, error: 'QuickBooks not connected' });

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    const payment = {
      TotalAmt: parseFloat(amount || 0),
      CustomerRef: { value: '1' },
      Line: [{ Amount: parseFloat(amount || 0), LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }] }]
    };

    const r = await fetch(`${baseUrl}/v3/company/${tokens.realm_id}/payment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ Payment: payment })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: JSON.stringify(d) });
    res.json({ success: true, payment: d.Payment });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/quickbooks/create-expense', async (req, res) => {
  try {
    const { vendorName, amount, category, memo, date } = req.body;
    const [tokens] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!tokens) return res.status(401).json({ success: false, error: 'QuickBooks not connected' });

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    const expense = {
      PaymentType: 'Cash',
      TxnDate: date || new Date().toISOString().split('T')[0],
      PrivateNote: memo || '',
      Line: [{
        DetailType: 'AccountBasedExpenseLineDetail',
        Amount: parseFloat(amount || 0),
        Description: category || 'General Expense',
        AccountBasedExpenseLineDetail: { AccountRef: { name: category || 'Miscellaneous' } }
      }]
    };

    const r = await fetch(`${baseUrl}/v3/company/${tokens.realm_id}/purchase`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ Purchase: expense })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: JSON.stringify(d) });
    res.json({ success: true, expense: d.Purchase });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// CALENDAR - BLOCK CRYSTAL BALL TIME
// ============================================================

app.post('/api/calendar/block-crystal', async (req, res) => {
  try {
    const { date, startTime, endTime, title } = req.body;
    const [gTokens] = await sql`SELECT * FROM google_tokens WHERE user_id = 'default'`;
    if(!gTokens) return res.status(401).json({ success: false, error: 'Google Calendar not connected' });

    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: gTokens.access_token,
      refresh_token: gTokens.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const eventDate = date || new Date().toISOString().split('T')[0];

    const event = await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: title || 'Crystal Ball Crystal Ball Time - Focus Block',
        description: 'Protected executive focus time. No meetings, no interruptions. Crystal Ball only.',
        start: { dateTime: `${eventDate}T${startTime || '09:00:00'}`, timeZone: 'America/Chicago' },
        end: { dateTime: `${eventDate}T${endTime || '12:00:00'}`, timeZone: 'America/Chicago' },
        colorId: '11',
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] }
      }
    });
    res.json({ success: true, event: event.data });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// EMAIL - COMPOSE NEW (already have /api/gmail/send for replies)
// ============================================================

app.post('/api/gmail/compose', async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;
    if(!to || !subject || !body) return res.status(400).json({ success: false, error: 'To, subject and body required' });

    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.status(401).json({ success: false, error: 'Gmail not connected. Please reconnect in Communication Hub.' });

    const ccLine = cc ? `Cc: ${cc}\n` : '';
    const email = [`To: ${to}`, `Subject: ${subject}`, ccLine ? ccLine.trim() : '', 'Content-Type: text/plain; charset=utf-8', '', body].filter(l => l !== '').join('\n');
    const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: d.error?.message || 'Send failed' });
    res.json({ success: true, messageId: d.id });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/outlook/compose', async (req, res) => {
  try {
    const { to, subject, body, cc } = req.body;
    if(!to || !subject || !body) return res.status(400).json({ success: false, error: 'To, subject and body required' });

    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.status(401).json({ success: false, error: 'Outlook not connected. Please reconnect in Communication Hub.' });

    const r = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'Text', content: body },
          toRecipients: [{ emailAddress: { address: to } }],
          ccRecipients: cc ? [{ emailAddress: { address: cc } }] : []
        }
      })
    });
    if(!r.ok) {
      const errText = await r.text();
      return res.status(400).json({ success: false, error: errText.substring(0,200) });
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Something went wrong', detail: err.message });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

app.listen(PORT, '0.0.0.0', async () => {
  await initDB();
  console.log('\nEssential EA is running on port ' + PORT);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

// ADD THESE ROUTES BEFORE LINE 4039 in server.js

// QUICKBOOKS WRITE OPERATIONS
// ============================================================

app.post('/api/quickbooks/create-invoice', async (req, res) => {
  try {
    const { customerName, customerEmail, items, dueDate, memo } = req.body;
    const [tokens] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!tokens) return res.status(401).json({ success: false, error: 'QuickBooks not connected' });

    const line = (items || [{ description: 'Services', amount: 0 }]).map((item, i) => ({
      DetailType: 'SalesItemLineDetail',
      Amount: parseFloat(item.amount || 0),
      Description: item.description || 'Services',
      SalesItemLineDetail: { Qty: item.qty || 1, UnitPrice: parseFloat(item.amount || 0) }
    }));

    const invoice = {
      Line: line,
      CustomerRef: { name: customerName || 'Client' },
      DueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      PrivateNote: memo || ''
    };

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    const r = await fetch(`${baseUrl}/v3/company/${tokens.realm_id}/invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ Invoice: invoice })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: JSON.stringify(d) });
    res.json({ success: true, invoice: d.Invoice });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/quickbooks/mark-paid', async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod } = req.body;
    const [tokens] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!tokens) return res.status(401).json({ success: false, error: 'QuickBooks not connected' });

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    const payment = {
      TotalAmt: parseFloat(amount || 0),
      CustomerRef: { value: '1' },
      Line: [{ Amount: parseFloat(amount || 0), LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }] }]
    };

    const r = await fetch(`${baseUrl}/v3/company/${tokens.realm_id}/payment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ Payment: payment })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: JSON.stringify(d) });
    res.json({ success: true, payment: d.Payment });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/quickbooks/create-expense', async (req, res) => {
  try {
    const { vendorName, amount, category, memo, date } = req.body;
    const [tokens] = await sql`SELECT * FROM quickbooks_tokens WHERE user_id = 'default' LIMIT 1`;
    if(!tokens) return res.status(401).json({ success: false, error: 'QuickBooks not connected' });

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';

    const expense = {
      PaymentType: 'Cash',
      TxnDate: date || new Date().toISOString().split('T')[0],
      PrivateNote: memo || '',
      Line: [{
        DetailType: 'AccountBasedExpenseLineDetail',
        Amount: parseFloat(amount || 0),
        Description: category || 'General Expense',
        AccountBasedExpenseLineDetail: { AccountRef: { name: category || 'Miscellaneous' } }
      }]
    };

    const r = await fetch(`${baseUrl}/v3/company/${tokens.realm_id}/purchase`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ Purchase: expense })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: JSON.stringify(d) });
    res.json({ success: true, expense: d.Purchase });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// CALENDAR - BLOCK CRYSTAL BALL TIME
// ============================================================

app.post('/api/calendar/block-crystal', async (req, res) => {
  try {
    const { date, startTime, endTime, title } = req.body;
    const [gTokens] = await sql`SELECT * FROM google_tokens WHERE user_id = 'default'`;
    if(!gTokens) return res.status(401).json({ success: false, error: 'Google Calendar not connected' });

    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: gTokens.access_token,
      refresh_token: gTokens.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const eventDate = date || new Date().toISOString().split('T')[0];

    const event = await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: title || 'Crystal Ball Crystal Ball Time - Focus Block',
        description: 'Protected executive focus time. No meetings, no interruptions. Crystal Ball only.',
        start: { dateTime: `${eventDate}T${startTime || '09:00:00'}`, timeZone: 'America/Chicago' },
        end: { dateTime: `${eventDate}T${endTime || '12:00:00'}`, timeZone: 'America/Chicago' },
        colorId: '11',
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] }
      }
    });
    res.json({ success: true, event: event.data });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// EMAIL - COMPOSE NEW (already have /api/gmail/send for replies)
// ============================================================

app.post('/api/gmail/compose', async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;
    if(!to || !subject || !body) return res.status(400).json({ success: false, error: 'To, subject and body required' });

    const accessToken = await getGoogleAccessToken();
    if(!accessToken) return res.status(401).json({ success: false, error: 'Gmail not connected. Please reconnect in Communication Hub.' });

    const ccLine = cc ? `Cc: ${cc}\n` : '';
    const email = [`To: ${to}`, `Subject: ${subject}`, ccLine ? ccLine.trim() : '', 'Content-Type: text/plain; charset=utf-8', '', body].filter(l => l !== '').join('\n');
    const encoded = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded })
    });
    const d = await r.json();
    if(!r.ok) return res.status(400).json({ success: false, error: d.error?.message || 'Send failed' });
    res.json({ success: true, messageId: d.id });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/outlook/compose', async (req, res) => {
  try {
    const { to, subject, body, cc } = req.body;
    if(!to || !subject || !body) return res.status(400).json({ success: false, error: 'To, subject and body required' });

    const accessToken = await getMicrosoftAccessToken();
    if(!accessToken) return res.status(401).json({ success: false, error: 'Outlook not connected. Please reconnect in Communication Hub.' });

    const r = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'Text', content: body },
          toRecipients: [{ emailAddress: { address: to } }],
          ccRecipients: cc ? [{ emailAddress: { address: cc } }] : []
        }
      })
    });
    if(!r.ok) {
      const errText = await r.text();
      return res.status(400).json({ success: false, error: errText.substring(0,200) });
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
export default app;
