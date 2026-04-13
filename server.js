#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

let tasks = db.getAllTasks();
let weeklyPlans = db.getWeeklyPlans();
let taskIdCounter = tasks.length > 0 ? Math.max(...tasks.map(t => t.id || 0)) + 1 : 1;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('\nStarting Essential EA...');
console.log('PORT:', PORT);
console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');

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
:root{--blk:#1A1A18;--blk2:#222220;--blk3:#2C2C2A;--cream:#FAF8F4;--warm:#FFFEF9;--tan:#E8E2D8;--tan2:#D8D0C4;--mid:#8A8880;--gold:#C8A96A;--gold2:#A88A50;--gl:#E8D0A0;--grn:#4A7A50;--amb:#A87830;--red:#8A3A30;--sw:240px;--th:54px}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes barGrow{from{width:0}}
@keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.shell{display:flex;height:100vh;width:100vw;overflow:hidden}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;pointer-events:none}.overlay.open{display:block;pointer-events:all}

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
.sb-item.active{color:#FAF8F4;background:rgba(200,169,106,.1);border-left-color:var(--gold);font-weight:500}
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
.tbtn-p{background:var(--gold);color:var(--blk)}
.tbtn-p:hover{background:var(--gold2)}
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
.pg2{background:rgba(200,169,106,.12);border:1px solid rgba(200,169,106,.25)}
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
.abtn-p{background:var(--gold);color:var(--blk)}
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
.tag-c{background:rgba(200,169,106,.12);color:var(--gold2)}
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
.tr-act{display:inline-block;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:2px;background:rgba(200,169,106,.15);color:var(--gold)}
.t-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tc-head{padding:13px 16px 11px;border-radius:10px 10px 0 0;border:1px solid var(--tan);border-bottom:none;display:flex;align-items:center;gap:10px}
.tc-head.ch{background:rgba(200,169,106,.05)}
.tc-head.bh{background:rgba(138,58,48,.04)}
.tc-icon{font-size:17px}
.tc-title{font-size:12.5px;font-weight:600;color:var(--blk)}
.tc-sub{font-size:9.5px;color:var(--mid);margin-top:1px}
.tc-count{margin-left:auto;font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:9px}
.cc{background:rgba(200,169,106,.12);color:var(--gold2)}
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
.badge-u{background:rgba(200,169,106,.12);color:var(--gold2)}
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
.msg.active{background:rgba(200,169,106,.06);border-left-color:var(--gold)}
.msg.unread .msg-sub{color:var(--blk);font-weight:600}
.msg.flagged{border-left-color:var(--amb)}
.msg-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px}
.msg-from{font-size:12.5px;font-weight:500;color:var(--blk)}
.msg-when{font-size:10px;color:var(--mid);flex-shrink:0}
.msg-sub{font-size:11px;color:#6A6860;margin-bottom:3px}
.msg-prev{font-size:10px;color:var(--mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msg-tags{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}
.mtag{font-size:7.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 5px;border-radius:2px}
.mt-you{background:rgba(200,169,106,.12);color:var(--gold2)}
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
.d-primary{background:var(--blk);color:#FAF8F4}
.ai-routing{margin:14px 20px 0;background:var(--blk);border-radius:6px;padding:12px 16px;display:flex;align-items:flex-start;gap:10px;flex-shrink:0}
.ar-icon{font-size:15px;flex-shrink:0;margin-top:1px}
.ar-text{font-size:12px;color:rgba(245,240,232,.5);line-height:1.65}
.ar-text strong{color:var(--gl);font-weight:500}
.ar-pills{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.ar-pill{font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif}
.arp-h{background:rgba(200,169,106,.12);color:var(--gold);border:1px solid rgba(200,169,106,.2)}
.arp-f{background:rgba(168,120,48,.1);color:#C8963A;border:1px solid rgba(168,120,48,.2)}
.detail-body{flex:1;overflow-y:auto;padding:16px 20px;font-size:13px;color:#6A6860;line-height:1.85}
.opt-box{background:var(--warm);border-radius:4px;padding:12px;margin-bottom:8px;border:1px solid var(--tan);cursor:pointer;font-size:12.5px;color:var(--mid);line-height:1.55}
.opt-box:hover{border-color:var(--gold)}
.opt-label{font-size:8.5px;color:var(--gold2);font-weight:700;margin-bottom:4px;letter-spacing:.05em}
.opt-sep{font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold2);margin:14px 0 8px}
.detail-reply{border-top:1px solid var(--tan);padding:12px 20px;display:flex;gap:8px;align-items:flex-end;background:var(--warm);flex-shrink:0}
.reply-input{flex:1;background:var(--cream);border:1px solid var(--tan);border-radius:4px;padding:9px 12px;resize:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--blk);outline:none;min-height:40px}
.reply-input:focus{border-color:var(--gold)}
.reply-input::placeholder{color:var(--mid)}
.reply-send{background:var(--blk);color:#FAF8F4;border:none;border-radius:4px;padding:9px 16px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
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
.sub-btn{width:100%;padding:12px 24px;background:var(--blk);color:#FAF8F4;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13.5px;font-family:'DM Sans',sans-serif}
.alert{padding:12px 14px;border-radius:4px;font-size:13px;margin-top:10px}
.alert-ok{background:#e8f5e9;border:1px solid #a5d6a7;color:#2e7d32}
.alert-err{background:#fdecea;border:1px solid #f5c6cb;color:#c62828}
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
    <div class="sb-item" onclick="nav('priorityweek',this)"><span class="sb-icon">&#128197;</span>Priority Week</div>
    <div class="sb-item" onclick="nav('triage',this)"><span class="sb-icon">&#128302;</span>Crystal Ball Triage<span class="sb-badge" id="tc">0</span></div>
    <div class="sb-item" onclick="nav('inbox',this)"><span class="sb-icon">&#9993;</span>Communication<span class="sb-badge">4</span></div>
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
      <div class="pg-s">Your EA has 3 actions waiting for review.</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kv" id="k1">0</div><div class="kl">Total Tasks Analyzed</div><div class="kd up">This session</div></div>
        <div class="kpi"><div class="kv" id="k2">0</div><div class="kl">Crystal Ball</div><div class="kd" style="color:var(--mid)">Only you can do these</div></div>
        <div class="kpi"><div class="kv" id="k3">0</div><div class="kl">Bouncy Ball</div><div class="kd" style="color:var(--mid)">Delegate these</div></div>
        <div class="kpi"><div class="kv" id="k4">0%</div><div class="kl">Avg AI Confidence</div><div class="kd up">Accuracy</div></div>
      </div>
      <div class="dg">
        <div class="cw">
          <div class="panel">
            <div class="ph"><span class="pt">Today's Priority Actions</span><button class="pl" onclick="nav('triage',document.querySelectorAll('.sb-item')[2])">Classify tasks</button></div>
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
            <div class="ai-txt">Your calendar shows <strong>6.5 hours of meeting time before 10am on Tuesday and Wednesday.</strong> Your EA recommends shifting team admin meetings to Thursday afternoon to protect your prime selling hours.</div>
            <div class="ai-acts">
              <button class="abtn abtn-p" onclick="this.textContent='Approved';this.disabled=true">Approve change</button>
              <button class="abtn abtn-g" onclick="nav('inbox',document.querySelectorAll('.sb-item')[3])">Discuss with EA</button>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="panel">
            <div class="ph"><span class="pt">Today's Schedule</span></div>
            <div class="pb" style="padding-top:10px">
              <div class="tl-item"><div class="tl-time">8:00</div><div class="tl-dot dot-grn"></div><div><div class="tl-n">EA Daily Brief</div><div class="tl-s">AI-generated and reviewed</div></div></div>
              <div class="tl-item"><div class="tl-time">9:30</div><div class="tl-dot dot-gold"></div><div><div class="tl-n">Marcus Chen call</div><div class="tl-s">Crystal ball - 30 min</div></div></div>
              <div class="tl-item"><div class="tl-time">11:00</div><div class="tl-dot dot-amb"></div><div><div class="tl-n">Listing photos review</div><div class="tl-s">2847 Elmwood - 45 min</div></div></div>
              <div class="tl-item"><div class="tl-time">12:30</div><div class="tl-dot dot-dim"></div><div><div class="tl-n">Lunch - protected</div><div class="tl-s">Boundary block - EA enforced</div></div></div>
              <div class="tl-item"><div class="tl-time">2:00</div><div class="tl-dot dot-gold"></div><div><div class="tl-n">CFO - Q1 review</div><div class="tl-s">Crystal ball - 60 min</div></div></div>
              <div class="tl-item"><div class="tl-time">5:30</div><div class="tl-dot dot-dim"></div><div><div class="tl-n">Hard stop</div><div class="tl-s">CEO protection - no meetings after</div></div></div>
            </div>
          </div>
          <div class="panel">
            <div class="ph"><span class="pt">Weekly Scorecard</span></div>
            <div class="pb">
              <div class="ring-wrap">
                <div class="ring">
                  <svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="25" fill="none" stroke="#E8E2D8" stroke-width="4.5"/><circle cx="31" cy="31" r="25" fill="none" stroke="#C8A96A" stroke-width="4.5" stroke-dasharray="157" stroke-dashoffset="20" stroke-linecap="round"/></svg>
                  <div class="ring-val">87</div>
                </div>
                <div><div class="ring-lbl">Operational Health</div><div class="ring-sub">Up 4 pts vs last week.<br>Crystal ball protection 94%.</div></div>
              </div>
              <div class="m-row"><span class="m-name">Crystal balls protected</span><span class="m-val">17/18</span><div class="bar-wrap"><div class="bar" style="width:94%"></div></div></div>
              <div class="m-row"><span class="m-name">Bouncy balls delegated</span><span class="m-val">12/14</span><div class="bar-wrap"><div class="bar" style="width:85%"></div></div></div>
              <div class="m-row"><span class="m-name">Inbox response time</span><span class="m-val">2.4 hrs</span><div class="bar-wrap"><div class="bar" style="width:78%"></div></div></div>
              <div class="m-row"><span class="m-name">Leads followed up</span><span class="m-val">14/14</span><div class="bar-wrap"><div class="bar" style="width:100%"></div></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="screen" id="screen-priorityweek">
      <div class="pg-h2">Priority Week Generator</div>
      <div class="pg-s2">Your AI-powered week built from your goals, time blocks, and methodology.</div>
      <div class="pw-layout">
        <div class="setup-card">
          <div class="setup-head">Generate Your Priority Week</div>
          <div class="setup-body">
            <div class="fl">Top goals this week</div>
            <textarea class="fa" id="goals" placeholder="e.g. Close the Elmwood listing, meet 3 buyer leads, Q1 review..."></textarea>
            <div class="fl">Revenue target</div>
            <input class="fi" id="revenue" type="text" placeholder="e.g. $45,000 GCI">
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
              <div class="day-col"><div class="day-hd today">Mon</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">Listing call - Marcus</div><div class="dt-time">9:30 AM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task bouncy"><div class="dt-name">Team standup</div><div class="dt-time">11:00 AM</div><div class="dt-tag tag-b">EA Owned</div></div></div></div>
              <div class="day-col"><div class="day-hd">Tue</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">Buyer consult - Lee</div><div class="dt-time">10:00 AM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task bouncy"><div class="dt-name">Marketing review</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div></div></div>
              <div class="day-col"><div class="day-hd">Wed</div><div class="day-tasks"><div class="d-task block"><div class="dt-name">Deep work block</div><div class="dt-time">9-11 AM</div><div class="dt-tag tag-p">Protected</div></div><div class="d-task crystal"><div class="dt-name">Buyer consult</div><div class="dt-time">2:00 PM</div><div class="dt-tag tag-c">Crystal</div></div></div></div>
              <div class="day-col"><div class="day-hd">Thu</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">CFO - Q1 review</div><div class="dt-time">2:00 PM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task bouncy"><div class="dt-name">Closing gifts</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div></div></div>
              <div class="day-col"><div class="day-hd">Fri</div><div class="day-tasks"><div class="d-task crystal"><div class="dt-name">Photo approval</div><div class="dt-time">10:00 AM</div><div class="dt-tag tag-c">Crystal</div></div><div class="d-task block"><div class="dt-name">Friday PM protected</div><div class="dt-time">1:00 PM+</div><div class="dt-tag tag-p">Protected</div></div></div></div>
            </div>
            <div class="pw-note"><strong>EA Note:</strong> Generate your plan above to see your personalized week.</div>
          </div>
          <div id="week-result" style="display:none"></div>
        </div>
      </div>
    </div>

    <div class="screen" id="screen-triage">
      <div class="pg-h2">Crystal Ball Triage</div>
      <div class="pg-s2">Type any task - your EA AI classifies it instantly using the Essential EA methodology.</div>
      <div class="triage-row">
        <input class="triage-in" id="task-in" placeholder="e.g. Reply to vendor quote or Call from buyer asking about timeline..." onkeydown="if(event.key==='Enter')doClassify()">
        <button class="triage-btn" id="t-btn" onclick="doClassify()">Classify Task</button>
      </div>
      <div id="t-result" style="display:none"></div>
      <div class="t-cols">
        <div>
          <div class="tc-head ch"><div class="tc-icon">&#128302;</div><div><div class="tc-title">Crystal Ball Tasks</div><div class="tc-sub">Only you can do these</div></div><div class="tc-count cc" id="c-badge">0</div></div>
          <div class="tc-list" id="c-list"><div class="empty">Classify tasks above to see them here.</div></div>
        </div>
        <div>
          <div class="tc-head bh"><div class="tc-icon">&#127934;</div><div><div class="tc-title">Bouncy Ball Tasks</div><div class="tc-sub">Delegate these</div></div><div class="tc-count bc" id="b-badge">0</div></div>
          <div class="tc-list" id="b-list"><div class="empty">Tasks your EA can own will appear here.</div></div>
        </div>
      </div>
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
            <div class="msg unread active" data-tag="you" onclick="openMsg(0,this)"><div class="msg-header"><span class="msg-from"><span class="udot"></span>Marcus Chen</span><span class="msg-when">9:14 AM</span></div><div class="msg-sub">Counter offer - 2847 Elmwood Dr</div><div class="msg-prev">I've reviewed the seller's position and I think we can move...</div><div class="msg-tags"><span class="mtag mt-you">Needs You</span><span class="mtag mt-urgent">Urgent</span></div></div>
            <div class="msg unread" data-tag="ea" onclick="openMsg(1,this)"><div class="msg-header"><span class="msg-from"><span class="udot"></span>Sarah Kim - Lender</span><span class="msg-when">8:52 AM</span></div><div class="msg-sub">Referral partner meeting request</div><div class="msg-prev">Hi Kristina, I'd love 20 minutes to explore a referral...</div><div class="msg-tags"><span class="mtag mt-ea">EA Triaging</span></div></div>
            <div class="msg" data-tag="ea" onclick="openMsg(2,this)"><div class="msg-header"><span class="msg-from">Rodriguez Closing</span><span class="msg-when">Tue</span></div><div class="msg-sub">Closing confirmed - gift needed by Friday</div><div class="msg-prev">Title confirmed Thursday 2pm. Per your gift protocol...</div><div class="msg-tags"><span class="mtag mt-ea">EA Owned</span></div></div>
            <div class="msg unread" data-tag="you" onclick="openMsg(3,this)"><div class="msg-header"><span class="msg-from"><span class="udot"></span>Team Standup Bot</span><span class="msg-when">Mon</span></div><div class="msg-sub">Weekly scorecard - Action required</div><div class="msg-prev">2 team members missed their weekly task completion...</div><div class="msg-tags"><span class="mtag mt-you">Needs You</span></div></div>
            <div class="msg flagged" data-tag="defer" onclick="openMsg(4,this)"><div class="msg-header"><span class="msg-from">Office Supplies Vendor</span><span class="msg-when">Mon</span></div><div class="msg-sub">Quote renewal - Q2 supplies</div><div class="msg-prev">As discussed, here is our updated pricing for Q2...</div><div class="msg-tags"><span class="mtag mt-ea">EA Replied</span><span class="mtag mt-none">No Action</span></div></div>
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
          <div class="ai-routing"><div class="ar-icon">&#128302;</div><div><div class="ar-text" id="d-route"><strong>Crystal Ball - Needs You.</strong> Counter offer on active listing requires your direct judgment. EA has prepared two response approaches.</div><div class="ar-pills"><div class="ar-pill arp-h">Handle personally</div><div class="ar-pill arp-f">Schedule callback</div></div></div></div>
          <div class="detail-body" id="d-body">
            <p style="margin-bottom:14px">Hi Kristina,</p>
            <p style="margin-bottom:14px">They came down to $624,000. Still $11K above but there's room. Inspection contingency ends Friday.</p>
            <p>Can you reach out to the listing agent today? Thanks, Marcus</p>
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E8E2D8">
              <div class="opt-sep">EA-prepared response options</div>
             <div class="opt-box" onclick="setReply('Reaching out to listing agent about 618K plus closing costs. Update by noon. - Kristina')"><div class="opt-label">OPTION A - Move forward</div>Confirm position, contact listing agent.</div>
             <div class="opt-box" onclick="setReply('Need to review inspection report first. Can we connect at 9:30am tomorrow? - Kristina')"><div class="opt-label">OPTION B - Review first</div>Request inspection report. Schedule call.</div>
            </div>
          </div>
          <div class="detail-reply"><textarea class="reply-input" id="reply-in" rows="2" placeholder="Type your reply or click a suggested response above..."></textarea><button class="reply-send" onclick="sendReply()">Send</button></div>
        </div>
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
      <div class="cs"><div class="cs-title">Full Operations Suite - Coming in Phase 3</div><div class="cs-body">These modules are being integrated with your CRM and business systems. Crystal Ball and Priority Week are live now.</div></div>
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
          <div><strong>Plan:</strong> <span style="color:#A88A50;font-weight:600">Blueprint - $147/month</span></div>
          <div><strong>Member Since:</strong> <span style="color:#8A8880">April 2026 - Founding Member</span></div>
        </div>
      </div>
      <div class="panel">
        <div class="ph"><span class="pt">Send Feedback</span></div>
        <div class="pb">
          <div class="fg"><label class="fl2">Your Name (Optional)</label><input type="text" id="fb-name" class="fi2" placeholder="e.g. Kristina Spencer"></div>
          <div class="fg"><label class="fl2">Email Address</label><input type="email" id="fb-email" class="fi2" placeholder="your@email.com"></div>
          <div class="fg"><label class="fl2">How would you rate your experience?</label><div class="r-row"><button class="r-btn" onclick="setR(1,this)">1</button><button class="r-btn" onclick="setR(2,this)">2</button><button class="r-btn" onclick="setR(3,this)">3</button><button class="r-btn" onclick="setR(4,this)">4</button><button class="r-btn sel" onclick="setR(5,this)">5</button></div><input type="hidden" id="fb-rating" value="5"></div>
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
const titles = { dashboard:'Good morning, <em>Kristina.</em>', priorityweek:'Priority Week Generator', triage:'Crystal Ball Triage', inbox:'Communication Hub', operations:'Operations', settings:'Settings' };
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
  res.innerHTML = '<div class="spin-wrap"><div class="spinner"></div> Analyzing your task with AI...</div>';
  try {
    const r = await fetch('/api/classify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({taskDescription:val}) });
    const d = await r.json();
    if(d.success) {
      const c = d.classification;
      const ic = c.classification === 'crystal';
      const em = ic ? '&#128302;' : '&#127934;';
      res.innerHTML = '<div class="t-result-box"><div class="tr-hd"><div class="tr-em">' + em + '</div><div class="tr-ti">' + (ic ? 'Crystal Ball - Only You Can Do This' : 'Bouncy Ball - Your EA Owns This') + '</div></div><div class="tr-meta"><span><strong>Urgency:</strong> ' + (c.urgency||'') + '</span><span><strong>Confidence:</strong> ' + (c.confidence ? (c.confidence*100).toFixed(0)+'%' : '') + '</span></div><div class="tr-body"><strong>Why:</strong> ' + (c.reason||'') + '</div><div class="tr-body"><strong>Action:</strong> ' + (c.recommendedAction||'') + '</div><div class="tr-act">' + (ic ? 'Keep - Schedule - Protect this time' : 'Delegate - Remove from your calendar') + '</div></div>';
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
  btn.disabled = true; btn.textContent = 'Generating your week...';
  res.style.display = 'block';
  res.innerHTML = '<div class="panel" style="padding:20px"><div class="spin-wrap"><div class="spinner"></div> Building your 5-day Priority Week with AI...</div></div>';
  try {
    const r = await fetch('/api/generate-week', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({goals,revenue,timeblocks}) });
    const d = await r.json();
    if(d.success) {
      res.innerHTML = '<div class="week-card"><div class="week-head"><div><div class="week-title">Your AI-Generated Priority Week</div><div class="week-meta">Essential EA Priority Week Framework</div></div></div><div style="padding:18px"><div class="pw-note" style="border-top:none;margin-bottom:12px"><strong>Your plan is ready.</strong> Crystal ball tasks are in your peak hours. Bouncy balls are routed to your EA.</div><pre style="white-space:pre-wrap;font-family:DM Sans,sans-serif;font-size:13px;color:var(--blk);line-height:1.75">' + d.plan + '</pre></div></div>';
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
const msgs = [
{ sub:'Counter offer - 2847 Elmwood Dr', from:'Marcus Chen', time:'Today 9:14 AM', route:'<strong>Crystal Ball - Needs You.</strong> Counter offer requires your direct judgment. EA has prepared two response approaches.', body:'<p style="margin-bottom:14px">Hi Kristina,</p><p style="margin-bottom:14px">They came down to $624,000. Still $11K above but there is room. Inspection contingency ends Friday.</p><p>Can you reach out to the listing agent today? Thanks, Marcus</p><div style="margin-top:20px;padding-top:16px;border-top:1px solid #E8E2D8"><div class="opt-sep">EA-prepared response options</div><div class="opt-box" onclick="setReply(\'Reaching out to listing agent about 618K plus closing costs. Update by noon. - Kristina\')"><div class="opt-label">OPTION A - Move forward</div>Confirm position, contact listing agent.</div><div class="opt-box" onclick="setReply(\'Need to review inspection first. Connect at 9:30am tomorrow? - Kristina\')"><div class="opt-label">OPTION B - Review first</div>Request inspection report. Schedule call.</div></div>' },
  { sub:'Referral partner meeting request', from:'Sarah Kim - Lender', time:'Today 8:52 AM', route:'<strong>Bouncy Ball - EA Triaging.</strong> Inbound meeting request. EA is evaluating against your referral criteria.', body:'<p style="margin-bottom:14px">Hi Kristina,</p><p>I would love 20 minutes to explore a referral partnership. Available this week or next?</p><p style="margin-top:14px">Best, Sarah</p>' },
  { sub:'Closing confirmed - gift needed by Friday', from:'Rodriguez Closing', time:'Tuesday', route:'<strong>Bouncy Ball - EA Owned.</strong> EA has confirmed the closing and is processing the gift order. No action required.', body:'<p style="margin-bottom:14px">Title confirmed Thursday 2pm for the Rodriguez family.</p><p>EA has selected the Luxury Home Welcome Box. Budget used: $185 of your $200 allowance.</p><p style="margin-top:14px">No action needed. - Your EA</p>' },
  { sub:'Weekly scorecard - Action required', from:'Team Standup Bot', time:'Monday', route:'<strong>Crystal Ball - Needs Your Input.</strong> Two team members missed targets. Only you can address performance accountability.', body:'<p style="margin-bottom:14px">Two agents completed fewer than 60% of committed tasks for 2 consecutive weeks.</p><p>EA recommends a 15-min 1:1 with each. Would you like your EA to schedule these?</p>' },
  { sub:'Quote renewal - Q2 supplies', from:'Office Supplies Vendor', time:'Monday', route:'<strong>Bouncy Ball - EA Replied.</strong> Routine vendor communication. EA replied per your vendor protocol. No action needed.', body:'<p style="margin-bottom:14px">Your EA replied on your behalf.</p><p style="color:#8A8880">No action needed from you.</p>' }
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
loadStats();
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
    const prompt = 'You are a task classification AI for executives and brokers using the Essential EA methodology.\nClassify this task as either crystal (only the executive can do this) or bouncy (can be delegated).\nCrystal Ball tasks: Decisions, negotiations, client relationships, legal, strategy, approvals.\nBouncy Ball tasks: Admin, scheduling, data entry, communication, follow-ups, coordination.\nTask: "' + taskDescription + '"\nRespond ONLY with valid JSON:\n{"classification":"crystal","emoji":"crystal","urgency":"urgent","reason":"why","recommendedAction":"what to do","confidence":0.95}';
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a task classification AI. Always respond with valid JSON only. For emoji field use the word crystal or bouncy not an actual emoji.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    let content = response.choices[0].message.content.trim();
    if (content.includes('```')) content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(content);
    const task = { id: taskIdCounter++, description: taskDescription, ...result, createdAt: new Date().toISOString() };
    tasks.push(task);
    db.addTask(task);
    res.json({ success: true, task, classification: result });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to classify', success: false });
  }
});

app.post('/api/generate-week', async (req, res) => {
  try {
    const { goals, revenue, timeblocks } = req.body;
    if (!goals || !revenue || !timeblocks) return res.status(400).json({ error: 'Missing required fields', success: false });
    const prompt = 'You are an executive assistant AI using the Essential EA Priority Week Framework.\nCreate a detailed 5-day priority week plan based on:\nGoals: ' + goals + '\nRevenue Target: ' + revenue + '\nNon-Negotiable Time Blocks: ' + timeblocks + '\nFormat as a structured 5-day calendar with Crystal Ball tasks and Bouncy Ball tasks. Make it actionable and specific.';
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert executive assistant using the Essential EA methodology.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });
    const plan = response.choices[0].message.content.trim();
    const weeklyPlan = { id: Date.now(), goals, revenue, timeblocks, plan, createdAt: new Date().toISOString() };
    weeklyPlans.push(weeklyPlan);
    db.addWeeklyPlan(weeklyPlan);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate plan', success: false });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ success: true, tasks: tasks.slice(-limit).reverse(), count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const crystalCount = tasks.filter(t => t.classification === 'crystal').length;
    const bouncyCount = tasks.filter(t => t.classification === 'bouncy').length;
    const avgConfidence = tasks.length > 0 ? (tasks.reduce((sum, t) => sum + (t.confidence || 0), 0) / tasks.length).toFixed(2) : 0;
    res.json({ success: true, stats: { totalTasks: tasks.length, crystal: crystalCount, bouncy: bouncyCount, avgAccuracy: (parseFloat(avgConfidence) * 100).toFixed(1) } });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/feedback', (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!email || !message) return res.status(400).json({ error: 'Email and message required', success: false });
    const feedback = { id: Date.now(), name: name || 'Anonymous', email, rating: rating || 5, message, createdAt: new Date().toISOString() };
    db.addFeedback(feedback);
    res.json({ success: true, feedback, message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/feedback', (req, res) => {
  try {
    res.json({ success: true, feedback: db.getFeedback(), count: db.getFeedback().length });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\nEssential EA is running on port ' + PORT);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export default app;
