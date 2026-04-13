// ============================================================
// ESSENTIAL EA &#x2014; PHASE 1 FRONTEND REPLACEMENT
// Replace the entire frontendHTML variable in server.js
// with this string (lines starting after: const frontendHTML = `
// and ending before the closing backtick)
// ALL existing API calls are preserved exactly as Manus built them
// ============================================================

export const frontendHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>The Essential EA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>

/* ?? RESET & BASE ??????????????????????????????????????? */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
html, body { height: 100%; }
body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #FAF8F4;
  color: #1A1A18;
  line-height: 1.6;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ?? BRAND TOKENS ??????????????????????????????????????? */
:root {
  --black:       #1A1A18;
  --black2:      #222220;
  --black3:      #2C2C2A;
  --cream:       #FAF8F4;
  --cream2:      #F5F0E8;
  --warm-white:  #FFFEF9;
  --tan:         #E8E2D8;
  --tan2:        #D8D0C4;
  --mid:         #8A8880;
  --dim:         #6A6860;
  --gold:        #C8A96A;
  --gold2:       #A88A50;
  --gold-lite:   #E8D0A0;
  --green:       #4A7A50;
  --amber:       #A87830;
  --red:         #8A3A30;
  --sidebar-w:   240px;
  --topbar-h:    54px;
  --radius:      6px;
  --radius-lg:   10px;
}

/* ?? ANIMATIONS ????????????????????????????????????????? */
@keyframes fadeUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
@keyframes popIn    { from { opacity:0; transform:scale(.95) }        to { opacity:1; transform:scale(1) } }
@keyframes spin     { to   { transform:rotate(360deg) } }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes barGrow  { from { width:0 } }
@keyframes shimmer  {
  0%   { background-position: -200% 0 }
  100% { background-position:  200% 0 }
}

/* ?? SHELL ?????????????????????????????????????????????? */
.shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* ?? OVERLAY (mobile) ??????????????????????????????????? */
.overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 200;
  backdrop-filter: blur(2px);
}
.overlay.open { display: block; }

/* ?? SIDEBAR ???????????????????????????????????????????? */
.sidebar {
  width: var(--sidebar-w);
  min-width: var(--sidebar-w);
  background: var(--black);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  z-index: 300;
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}

.sb-top {
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}
.sb-wordmark {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px; font-weight: 300; letter-spacing: .04em;
  color: var(--cream); line-height: 1.2;
}
.sb-wordmark em { font-style: italic; font-weight: 600; color: var(--gold); }
.sb-tagline {
  font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
  color: rgba(255,255,255,.22); margin-top: 4px;
}

.sb-user {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}
.sb-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--gold2));
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: var(--black); flex-shrink: 0;
}
.sb-uname  { font-size: 12.5px; font-weight: 500; color: var(--cream); }
.sb-role   { font-size: 10px; color: rgba(255,255,255,.3); margin-top: 1px; }

.sb-nav { flex: 1; overflow-y: auto; padding: 12px 0; }
.sb-nav::-webkit-scrollbar { width: 0; }

.sb-section {
  font-size: 8.5px; font-weight: 600; letter-spacing: .2em;
  text-transform: uppercase; color: rgba(255,255,255,.2);
  padding: 10px 20px 4px;
}
.sb-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; cursor: pointer; font-size: 13px;
  color: rgba(255,255,255,.45);
  border-left: 2px solid transparent;
  transition: all .15s; user-select: none;
}
.sb-item:hover { color: var(--cream); background: rgba(255,255,255,.04); }
.sb-item.active {
  color: var(--cream); background: rgba(200,169,106,.1);
  border-left-color: var(--gold); font-weight: 500;
}
.sb-icon { width: 18px; text-align: center; font-size: 14px; flex-shrink: 0; }
.sb-badge {
  margin-left: auto; background: var(--gold); color: var(--black);
  font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 8px;
}

.sb-status {
  padding: 12px 20px; border-top: 1px solid rgba(255,255,255,.06);
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #5A9A60;
  animation: pulse 2.5s ease-in-out infinite; flex-shrink: 0;
}
.status-label { font-size: 11px; color: rgba(255,255,255,.3); }
.status-label strong { color: var(--gold); font-weight: 500; }

/* ?? MAIN ??????????????????????????????????????????????? */
.main {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; min-width: 0;
}

/* ?? TOP BAR ???????????????????????????????????????????? */
.topbar {
  height: var(--topbar-h);
  background: var(--black);
  border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center;
  padding: 0 20px; gap: 12px; flex-shrink: 0;
}
.tb-menu {
  display: none; background: none; border: none;
  color: rgba(255,255,255,.6); font-size: 20px;
  cursor: pointer; padding: 4px; line-height: 1;
  flex-shrink: 0;
}
.tb-title-wrap { flex: 1; min-width: 0; }
.tb-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px; font-weight: 300; color: var(--cream);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tb-title em { font-style: italic; color: var(--gold); }
.tb-date { font-size: 11px; color: rgba(255,255,255,.3); }
.tb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tb-btn {
  font-size: 10.5px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; padding: 7px 14px;
  border-radius: 3px; border: none; cursor: pointer; transition: all .15s;
  font-family: 'DM Sans', sans-serif; white-space: nowrap;
}
.tb-ghost {
  background: transparent;
  border: 1px solid rgba(255,255,255,.15);
  color: rgba(255,255,255,.5);
}
.tb-ghost:hover { border-color: var(--gold); color: var(--gold); }
.tb-primary { background: var(--gold); color: var(--black); }
.tb-primary:hover { background: var(--gold2); }

/* ?? CONTENT ???????????????????????????????????????????? */
.content {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 24px; background: var(--cream);
  -webkit-overflow-scrolling: touch;
}
.content::-webkit-scrollbar { width: 4px; }
.content::-webkit-scrollbar-thumb { background: var(--tan2); border-radius: 2px; }

/* ?? SCREENS ???????????????????????????????????????????? */
.screen { display: none; animation: fadeUp .3s ease; }
.screen.active { display: block; }

/* ?? PAGE HEADER ???????????????????????????????????????? */
.pg-greeting {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.4rem, 4vw, 2rem);
  font-weight: 300; color: var(--black); margin-bottom: 3px;
}
.pg-greeting em { font-style: italic; font-weight: 600; color: var(--gold2); }
.pg-sub { font-size: 13px; color: var(--mid); margin-bottom: 24px; }
.pg-head {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.3rem, 3.5vw, 1.8rem);
  font-weight: 300; color: var(--black); margin-bottom: 4px;
}
.pg-sub2 { font-size: 12px; color: var(--mid); margin-bottom: 22px; }

/* ?? CARDS & PANELS ????????????????????????????????????? */
.panel {
  background: var(--warm-white);
  border: 1px solid var(--tan);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--tan);
}
.panel-title {
  font-size: 11px; font-weight: 600; color: var(--black);
  letter-spacing: .07em; text-transform: uppercase;
}
.panel-link {
  font-size: 10px; color: var(--gold2); background: transparent;
  border: none; cursor: pointer; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase;
  font-family: 'DM Sans', sans-serif; transition: color .15s;
}
.panel-link:hover { color: var(--black); }
.panel-body { padding: 14px 18px; }

/* ?? KPI GRID ??????????????????????????????????????????? */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 22px;
}
.kpi {
  background: var(--warm-white);
  border: 1px solid var(--tan);
  border-top: 2px solid var(--tan);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  transition: all .2s; cursor: default;
}
.kpi:hover {
  border-top-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
}
.kpi-val {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.6rem, 4vw, 2.1rem);
  font-weight: 300; line-height: 1; color: var(--black); margin-bottom: 5px;
}
.kpi-lbl {
  font-size: 10px; color: var(--mid);
  letter-spacing: .07em; text-transform: uppercase;
}
.kpi-delta { font-size: 11px; margin-top: 6px; }
.up { color: var(--green); } .dn { color: var(--red); }

/* ?? DASHBOARD GRID ????????????????????????????????????? */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
.col { display: flex; flex-direction: column; gap: 14px; }
.col-wide { grid-column: span 2; display: flex; flex-direction: column; gap: 14px; }

/* ?? PRIORITY ITEMS ????????????????????????????????????? */
.p-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--tan);
}
.p-item:last-child { border-bottom: none; }
.p-gem, .p-ball {
  width: 26px; height: 26px; border-radius: 50%;
  flex-shrink: 0; margin-top: 1px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
}
.p-gem  { background: rgba(200,169,106,.12); border: 1px solid rgba(200,169,106,.25); }
.p-ball { background: rgba(138,58,48,.08);  border: 1px solid rgba(138,58,48,.18); }
.p-body { flex: 1; min-width: 0; }
.p-task { font-size: 13px; font-weight: 500; color: var(--black); margin-bottom: 2px; line-height: 1.35; }
.p-note { font-size: 10.5px; color: var(--mid); line-height: 1.4; }
.p-time { font-size: 10px; color: var(--mid); white-space: nowrap; flex-shrink: 0; margin-top: 3px; }

/* ?? AI INSIGHT BOX ????????????????????????????????????? */
.ai-box {
  background: var(--black); border-radius: var(--radius-lg);
  padding: 16px 18px;
}
.ai-box-label {
  font-size: 9px; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: var(--gold);
  margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.ai-box-text { font-size: 12.5px; color: rgba(245,240,232,.55); line-height: 1.75; }
.ai-box-text strong { color: var(--gold-lite); font-weight: 500; }
.ai-box-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.ai-btn {
  font-size: 10px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; padding: 8px 14px;
  border-radius: 3px; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all .15s;
}
.ai-btn-p { background: var(--gold); color: var(--black); }
.ai-btn-p:hover { background: var(--gold2); }
.ai-btn-g {
  background: transparent; color: rgba(245,240,232,.4);
  border: 1px solid rgba(255,255,255,.12);
}
.ai-btn-g:hover { border-color: var(--gold); color: var(--gold); }

/* ?? TIMELINE ??????????????????????????????????????????? */
.tl-item {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 8px 0; border-bottom: 1px solid var(--tan);
}
.tl-item:last-child { border-bottom: none; }
.tl-time { font-size: 10px; color: var(--mid); width: 36px; flex-shrink: 0; padding-top: 2px; }
.tl-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.dot-gold  { background: var(--gold); }
.dot-green { background: var(--green); }
.dot-amber { background: var(--amber); }
.dot-dim   { background: var(--tan2); }
.tl-name { font-size: 12.5px; color: var(--black); font-weight: 500; margin-bottom: 2px; }
.tl-sub  { font-size: 10px; color: var(--mid); }

/* ?? SCORE RING ????????????????????????????????????????? */
.ring-wrap { display: flex; align-items: center; gap: 14px; padding: 4px 0; margin-bottom: 14px; }
.ring { position: relative; width: 62px; height: 62px; flex-shrink: 0; }
.ring svg { transform: rotate(-90deg); }
.ring-val {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem; font-weight: 300; color: var(--black);
}
.ring-label { font-size: 12.5px; color: var(--black); font-weight: 500; margin-bottom: 3px; }
.ring-sub   { font-size: 10px; color: var(--mid); line-height: 1.5; }

.metric-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--tan); font-size: 12px;
}
.metric-row:last-child { border-bottom: none; }
.metric-name { color: var(--mid); }
.metric-val  { font-weight: 600; color: var(--black); }
.bar-wrap { width: 60px; height: 2px; background: var(--tan); border-radius: 2px; overflow: hidden; }
.bar { height: 100%; background: var(--gold); border-radius: 2px; animation: barGrow .8s ease .3s both; }

/* ?? PRIORITY WEEK ?????????????????????????????????????? */
.pw-layout { display: grid; grid-template-columns: 300px 1fr; gap: 18px; align-items: start; }

.setup-card {
  background: var(--warm-white); border: 1px solid var(--tan);
  border-radius: var(--radius-lg); overflow: hidden;
}
.setup-head {
  padding: 14px 18px; border-bottom: 1px solid var(--tan);
  font-size: 11px; font-weight: 600; color: var(--black);
  letter-spacing: .07em; text-transform: uppercase;
}
.setup-body { padding: 18px; }

.field-label {
  font-size: 9.5px; font-weight: 600; letter-spacing: .14em;
  text-transform: uppercase; color: var(--gold2); margin-bottom: 6px;
}
.field, .field-area {
  width: 100%; background: var(--cream); border: 1px solid var(--tan);
  border-radius: 4px; padding: 10px 12px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--black);
  outline: none; transition: border-color .15s; margin-bottom: 14px;
}
.field-area { resize: vertical; min-height: 80px; }
.field:focus, .field-area:focus { border-color: var(--gold); }
.field::placeholder, .field-area::placeholder { color: var(--mid); }

.field-row { display: flex; gap: 8px; margin-bottom: 14px; }
.field-chip {
  flex: 1; background: var(--cream); border: 1px solid var(--tan);
  border-radius: 4px; padding: 9px 11px;
  font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--black);
  outline: none; transition: border-color .15s;
}
.field-chip:focus { border-color: var(--gold); }
.field-chip::placeholder { color: var(--mid); }

.gen-btn {
  width: 100%; background: var(--black); color: var(--cream);
  border: none; border-radius: 4px; padding: 13px;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
  transition: background .15s; margin-top: 2px;
}
.gen-btn:hover { background: var(--black3); }
.gen-btn:disabled { opacity: .5; cursor: not-allowed; }

.week-card { background: var(--warm-white); border: 1px solid var(--tan); border-radius: var(--radius-lg); overflow: hidden; }
.week-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--tan);
}
.week-title {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1rem; font-weight: 300; color: var(--black);
}
.week-title em { font-style: italic; color: var(--gold2); }
.week-meta { font-size: 10px; color: var(--mid); }

.day-grid { display: grid; grid-template-columns: repeat(5, 1fr); border-bottom: 1px solid var(--tan); }
.day-col { border-right: 1px solid var(--tan); }
.day-col:last-child { border-right: none; }
.day-hd {
  padding: 9px 10px; border-bottom: 1px solid var(--tan);
  font-size: 9px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--mid);
}
.day-hd.today { color: var(--gold2); }
.day-tasks { padding: 8px; }
.d-task {
  border-radius: 3px; padding: 6px 8px; margin-bottom: 5px;
  border-left: 2px solid var(--tan); background: var(--cream);
  transition: transform .15s; cursor: default;
}
.d-task:hover { transform: translateX(2px); }
.d-task.crystal { border-left-color: var(--gold); }
.d-task.bouncy  { border-left-color: rgba(138,58,48,.4); }
.d-task.block   { border-left-color: var(--green); background: rgba(74,122,80,.05); }
.dt-name { font-size: 10.5px; color: var(--black); font-weight: 500; line-height: 1.3; margin-bottom: 2px; }
.dt-time { font-size: 9px; color: var(--mid); }
.dt-tag {
  display: inline-block; font-size: 7.5px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  padding: 1px 5px; border-radius: 2px; margin-top: 3px;
}
.tag-c { background: rgba(200,169,106,.12); color: var(--gold2); }
.tag-b { background: rgba(138,58,48,.08);  color: #A86050; }
.tag-p { background: rgba(74,122,80,.1);   color: var(--green); }

.pw-note {
  padding: 12px 18px; border-top: 1px solid var(--tan);
  font-size: 12px; color: var(--mid); line-height: 1.7;
  background: rgba(200,169,106,.03);
}
.pw-note strong { color: var(--gold2); font-weight: 500; }

/* AI Plan Result */
.plan-result {
  background: var(--warm-white); border: 1px solid var(--tan);
  border-radius: var(--radius-lg); padding: 18px;
  margin-top: 14px; animation: popIn .25s ease;
}
.plan-result pre {
  white-space: pre-wrap; font-family: 'DM Sans', sans-serif;
  font-size: 13px; color: var(--black); line-height: 1.75;
}

/* ?? CRYSTAL BALL TRIAGE ???????????????????????????????? */
.triage-hint { font-size: 13px; color: var(--mid); margin-bottom: 14px; }

.triage-input-row { display: flex; gap: 10px; margin-bottom: 14px; }
.triage-input {
  flex: 1; background: var(--warm-white); border: 1px solid var(--tan);
  border-radius: 4px; padding: 12px 14px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--black);
  outline: none; transition: border-color .15s;
}
.triage-input:focus { border-color: var(--gold); }
.triage-input::placeholder { color: var(--mid); }
.analyze-btn {
  background: var(--black); color: var(--cream);
  border: none; border-radius: 4px; padding: 12px 18px;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; cursor: pointer;
  transition: all .15s; white-space: nowrap; flex-shrink: 0;
}
.analyze-btn:hover { background: var(--black3); }
.analyze-btn:disabled { opacity: .5; cursor: not-allowed; }

.triage-result-box {
  background: var(--black); border-radius: var(--radius-lg);
  padding: 16px 18px; margin-bottom: 18px;
  animation: popIn .25s ease;
}
.tr-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.tr-emoji  { font-size: 24px; flex-shrink: 0; }
.tr-title  { font-size: 17px; font-weight: 600; color: var(--cream); }
.tr-meta   { display: flex; gap: 14px; margin-bottom: 10px; font-size: 12px; }
.tr-meta span { color: rgba(245,240,232,.45); }
.tr-meta strong { color: var(--gold); }
.tr-body   { font-size: 12.5px; color: rgba(245,240,232,.55); line-height: 1.7; margin-bottom: 8px; }
.tr-action {
  display: inline-block; font-size: 9.5px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 12px; border-radius: 2px;
  background: rgba(200,169,106,.15); color: var(--gold);
}

.triage-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.tcol-head {
  padding: 13px 16px 11px; border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border: 1px solid var(--tan); border-bottom: none;
  display: flex; align-items: center; gap: 10px;
}
.tcol-head.ch { background: rgba(200,169,106,.05); }
.tcol-head.bh { background: rgba(138,58,48,.04); }
.tc-icon  { font-size: 17px; }
.tc-title { font-size: 12.5px; font-weight: 600; color: var(--black); }
.tc-sub   { font-size: 9.5px; color: var(--mid); margin-top: 1px; }
.tc-count {
  margin-left: auto; font-size: 10.5px; font-weight: 700;
  padding: 2px 9px; border-radius: 9px;
}
.cc { background: rgba(200,169,106,.12); color: var(--gold2); }
.bc { background: rgba(138,58,48,.1);   color: #A86050; }

.tcol-list {
  border: 1px solid var(--tan); border-top: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: var(--warm-white); min-height: 80px;
}
.t-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 14px; border-bottom: 1px solid var(--tan);
  cursor: pointer; transition: background .15s;
}
.t-item:last-child { border-bottom: none; }
.t-item:hover { background: var(--cream); }
.ti-icon   { font-size: 14px; flex-shrink: 0; margin-top: 2px; }
.ti-body   { flex: 1; min-width: 0; }
.ti-task   { font-size: 12.5px; font-weight: 500; color: var(--black); margin-bottom: 2px; line-height: 1.35; }
.ti-reason { font-size: 10px; color: var(--mid); line-height: 1.45; }
.ti-badge {
  flex-shrink: 0; font-size: 8.5px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 2px; margin-top: 2px;
  white-space: nowrap;
}
.badge-u { background: rgba(200,169,106,.12); color: var(--gold2); }
.badge-d { background: rgba(74,122,80,.1);   color: var(--green); }
.badge-f { background: rgba(168,120,48,.1);  color: var(--amber); }
.badge-e { background: var(--cream); color: var(--mid); border: 1px solid var(--tan); }

.empty-state {
  padding: 24px 14px; text-align: center;
  font-size: 12px; color: var(--mid); font-style: italic;
}

/* ?? INBOX ?????????????????????????????????????????????? */
.inbox-wrap {
  display: grid; grid-template-columns: 280px 1fr;
  height: calc(100vh - var(--topbar-h) - 48px);
  border: 1px solid var(--tan); border-radius: var(--radius-lg);
  overflow: hidden;
}
.inbox-list {
  background: var(--warm-white);
  border-right: 1px solid var(--tan);
  overflow-y: auto; display: flex; flex-direction: column;
  -webkit-overflow-scrolling: touch;
}
.inbox-list::-webkit-scrollbar { width: 3px; }
.inbox-list::-webkit-scrollbar-thumb { background: var(--tan2); }
.inbox-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 16px; border-bottom: 1px solid var(--tan);
  position: sticky; top: 0; background: var(--warm-white); z-index: 1;
  flex-shrink: 0;
}
.inbox-head-title {
  font-size: 11px; font-weight: 600; color: var(--black);
  letter-spacing: .07em; text-transform: uppercase;
}
.inbox-count {
  background: var(--black); color: var(--cream);
  font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 9px;
}
.filter-row {
  display: flex; padding: 8px 10px; border-bottom: 1px solid var(--tan);
  gap: 3px; flex-shrink: 0; flex-wrap: wrap;
}
.fpill {
  font-size: 9px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
  padding: 4px 8px; border: none; background: transparent; cursor: pointer;
  color: var(--mid); border-radius: 3px; transition: all .15s;
  font-family: 'DM Sans', sans-serif;
}
.fpill.active { background: var(--black); color: var(--cream); }

.msg {
  padding: 12px 14px; border-bottom: 1px solid var(--tan);
  cursor: pointer; transition: background .15s; border-left: 2px solid transparent;
}
.msg:hover { background: var(--cream); }
.msg.active { background: rgba(200,169,106,.06); border-left-color: var(--gold); }
.msg.unread .msg-sub { color: var(--black); font-weight: 600; }
.msg.flagged { border-left-color: var(--amber); }
.msg-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
.msg-from    { font-size: 12.5px; font-weight: 500; color: var(--black); }
.msg-when    { font-size: 10px; color: var(--mid); flex-shrink: 0; }
.msg-sub     { font-size: 11px; color: var(--dim); margin-bottom: 3px; }
.msg-prev    { font-size: 10px; color: var(--mid); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-tags    { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
.mtag {
  font-size: 7.5px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; padding: 2px 5px; border-radius: 2px;
}
.mt-you    { background: rgba(200,169,106,.12); color: var(--gold2); }
.mt-ea     { background: rgba(74,122,80,.1);    color: var(--green); }
.mt-defer  { background: rgba(168,120,48,.1);   color: var(--amber); }
.mt-none   { background: var(--cream); color: var(--mid); border: 1px solid var(--tan); }
.mt-urgent { background: rgba(138,58,48,.1);    color: #A86050; }
.unread-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--gold);
  display: inline-block; margin-right: 5px; flex-shrink: 0; vertical-align: middle;
}

/* Detail pane */
.msg-detail {
  background: var(--cream); display: flex; flex-direction: column;
  overflow: hidden;
}
.detail-head {
  padding: 14px 20px; border-bottom: 1px solid var(--tan);
  display: flex; align-items: flex-start; justify-content: space-between;
  background: var(--warm-white); flex-shrink: 0;
}
.detail-subject {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.05rem; font-weight: 300; color: var(--black); margin-bottom: 4px;
}
.detail-meta { font-size: 11px; color: var(--mid); line-height: 1.6; }
.detail-meta strong { color: var(--dim); }
.detail-acts { display: flex; gap: 6px; flex-shrink: 0; margin-left: 12px; }
.d-btn {
  font-size: 9.5px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  padding: 6px 12px; border-radius: 3px; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all .15s; white-space: nowrap;
}
.d-ghost   { background: transparent; border: 1px solid var(--tan); color: var(--mid); }
.d-ghost:hover { border-color: var(--black); color: var(--black); }
.d-primary { background: var(--black); color: var(--cream); }
.d-primary:hover { background: var(--black3); }

.ai-routing {
  margin: 14px 20px 0;
  background: var(--black); border-radius: var(--radius);
  padding: 12px 16px; display: flex; align-items: flex-start; gap: 10px;
  flex-shrink: 0;
}
.ar-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
.ar-text  { font-size: 12px; color: rgba(245,240,232,.5); line-height: 1.65; }
.ar-text strong { color: var(--gold-lite); font-weight: 500; }
.ar-pills { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.ar-pill {
  font-size: 8.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 9px; cursor: pointer; transition: all .15s;
  font-family: 'DM Sans', sans-serif;
}
.arp-handle   { background: rgba(200,169,106,.12); color: var(--gold);  border: 1px solid rgba(200,169,106,.2); }
.arp-delegate { background: rgba(74,122,80,.12);   color: #6AAA70;      border: 1px solid rgba(74,122,80,.2); }
.arp-defer    { background: rgba(168,120,48,.1);   color: #C8963A;      border: 1px solid rgba(168,120,48,.2); }
.arp-handle:hover   { background: rgba(200,169,106,.22); }
.arp-delegate:hover { background: rgba(74,122,80,.22); }
.arp-defer:hover    { background: rgba(168,120,48,.2); }

.detail-body {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  font-size: 13px; color: var(--dim); line-height: 1.85;
  -webkit-overflow-scrolling: touch;
}
.detail-body::-webkit-scrollbar { width: 3px; }
.detail-body::-webkit-scrollbar-thumb { background: var(--tan2); }

.opt-box {
  background: var(--warm-white); border-radius: 4px;
  padding: 12px; margin-bottom: 8px;
  border: 1px solid var(--tan); cursor: pointer;
  font-size: 12.5px; color: var(--mid); transition: border-color .15s;
  line-height: 1.55;
}
.opt-box:hover { border-color: var(--gold); }
.opt-label { font-size: 8.5px; color: var(--gold2); font-weight: 700; margin-bottom: 4px; letter-spacing: .05em; }
.opt-sep { font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--gold2); margin: 14px 0 8px; }

.detail-reply {
  border-top: 1px solid var(--tan); padding: 12px 20px;
  display: flex; gap: 8px; align-items: flex-end;
  background: var(--warm-white); flex-shrink: 0;
}
.reply-input {
  flex: 1; background: var(--cream); border: 1px solid var(--tan);
  border-radius: 4px; padding: 9px 12px; resize: none;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--black);
  outline: none; transition: border-color .15s; min-height: 40px;
}
.reply-input:focus { border-color: var(--gold); }
.reply-input::placeholder { color: var(--mid); }
.reply-send {
  background: var(--black); color: var(--cream); border: none;
  border-radius: 4px; padding: 9px 16px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; transition: all .15s;
  white-space: nowrap; flex-shrink: 0;
}
.reply-send:hover { background: var(--black3); }

/* ?? SETTINGS ??????????????????????????????????????????? */
.settings-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 12px; margin-bottom: 18px;
}
.s-card {
  background: var(--warm-white); border: 1px solid var(--tan);
  border-radius: var(--radius-lg); padding: 18px;
  cursor: pointer; transition: all .2s;
}
.s-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.s-icon  { font-size: 26px; margin-bottom: 10px; }
.s-title { font-size: 13.5px; font-weight: 600; color: var(--black); margin-bottom: 4px; }
.s-desc  { font-size: 11.5px; color: var(--mid); }

/* ?? FEEDBACK FORM ?????????????????????????????????????? */
.rating-row { display: flex; gap: 6px; margin-top: 8px; }
.r-btn {
  flex: 1; padding: 9px 4px; background: var(--cream);
  border: 1px solid var(--tan); border-radius: 4px;
  color: var(--mid); cursor: pointer; transition: all .15s;
  font-family: 'DM Sans', sans-serif; font-size: 12px; text-align: center;
}
.r-btn.selected { background: var(--black); color: var(--cream); border-color: var(--black); }

/* ?? LOADING SPINNER ???????????????????????????????????? */
.spinner-wrap { display: flex; align-items: center; gap: 10px; padding: 20px; color: var(--mid); font-size: 13px; }
.spinner {
  width: 18px; height: 18px; border: 2px solid var(--tan);
  border-top-color: var(--black); border-radius: 50%;
  animation: spin .8s linear infinite; flex-shrink: 0;
}

/* ?? FORM ELEMENTS (shared) ????????????????????????????? */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--black); margin-bottom: 6px; }
.form-input, .form-textarea {
  width: 100%; padding: 11px 14px; background: var(--warm-white);
  border: 1px solid var(--tan); border-radius: 4px;
  color: var(--black); font-family: 'DM Sans', sans-serif; font-size: 13.5px;
  outline: none; transition: border-color .15s;
}
.form-input:focus, .form-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(200,169,106,.1); }
.form-textarea { resize: vertical; min-height: 90px; }
.submit-btn {
  width: 100%; padding: 12px 24px; background: var(--black);
  color: var(--cream); border: none; border-radius: 4px;
  font-weight: 600; cursor: pointer; transition: all .15s;
  font-size: 13.5px; font-family: 'DM Sans', sans-serif;
}
.submit-btn:hover { background: var(--black3); }

/* ?? STATUS ALERTS ?????????????????????????????????????? */
.alert { padding: 12px 14px; border-radius: 4px; font-size: 13px; margin-top: 10px; }
.alert-success { background: #e8f5e9; border: 1px solid #a5d6a7; color: #2e7d32; }
.alert-error   { background: #fdecea; border: 1px solid #f5c6cb; color: #c62828; }

/* ?? OPERATIONS PLACEHOLDER ????????????????????????????? */
.ops-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px; }
.ops-card {
  background: var(--warm-white); border: 1px solid var(--tan);
  border-radius: var(--radius-lg); padding: 20px;
  cursor: pointer; transition: all .2s;
}
.ops-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.ops-icon  { font-size: 28px; margin-bottom: 10px; }
.ops-title { font-size: 13.5px; font-weight: 600; color: var(--black); margin-bottom: 4px; }
.ops-desc  { font-size: 11.5px; color: var(--mid); }

.coming-soon {
  background: var(--warm-white); border: 1px solid var(--tan);
  border-radius: var(--radius-lg); padding: 20px;
}
.cs-title { font-size: 13.5px; font-weight: 600; color: var(--black); margin-bottom: 8px; }
.cs-body  { font-size: 13px; color: var(--mid); line-height: 1.6; }

/* ??????????????????????????????????????????????????????
   RESPONSIVE &#x2014; TABLET
?????????????????????????????????????????????????????? */
@media (max-width: 1024px) {
  .kpi-grid    { grid-template-columns: repeat(2, 1fr); }
  .dash-grid   { grid-template-columns: 1fr 1fr; }
  .col-wide    { grid-column: span 2; }
  .pw-layout   { grid-template-columns: 1fr; }
  .settings-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ??????????????????????????????????????????????????????
   RESPONSIVE &#x2014; MOBILE
?????????????????????????????????????????????????????? */
@media (max-width: 768px) {
  /* Sidebar slides off-canvas */
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0;
    transform: translateX(-100%);
    z-index: 300;
  }
  .sidebar.open { transform: translateX(0); }

  /* Show hamburger */
  .tb-menu { display: block; }

  /* Hide desktop actions */
  .tb-actions .tb-ghost { display: none; }

  /* Content padding */
  .content { padding: 16px; }

  /* KPI single column */
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }

  /* Dashboard single column */
  .dash-grid { grid-template-columns: 1fr; }
  .col-wide  { grid-column: span 1; }

  /* Priority week single column */
  .pw-layout { grid-template-columns: 1fr; }

  /* Day grid scroll on mobile */
  .day-grid {
    grid-template-columns: repeat(5, minmax(130px, 1fr));
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Triage columns stack */
  .triage-cols { grid-template-columns: 1fr; }

  /* Triage input stacks */
  .triage-input-row { flex-direction: column; }
  .analyze-btn { width: 100%; }

  /* Inbox full width (hide detail on mobile) */
  .inbox-wrap { grid-template-columns: 1fr; height: calc(100vh - var(--topbar-h) - 80px); }
  .msg-detail { display: none; }
  .inbox-wrap.detail-open .inbox-list   { display: none; }
  .inbox-wrap.detail-open .msg-detail   { display: flex; }

  /* Settings / ops 1 col */
  .settings-grid { grid-template-columns: 1fr; }
  .ops-grid      { grid-template-columns: 1fr; }

  /* Detail head stacks */
  .detail-head { flex-direction: column; gap: 10px; }
  .detail-acts { margin-left: 0; }
  .d-btn.d-ghost { display: none; }

  /* Rating row */
  .rating-row { gap: 4px; }
  .r-btn { font-size: 11px; padding: 8px 2px; }

  /* Top bar date hidden */
  .tb-date { display: none; }
}

@media (max-width: 400px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi-val  { font-size: 1.4rem; }
  .content  { padding: 12px; }
}
</style>
</head>
<body>

<div class="overlay" id="overlay" onclick="closeSidebar()"></div>

<div class="shell">

  <!-- ?? SIDEBAR ??????????????????????????????????????? -->
  <aside class="sidebar" id="sidebar">
    <div class="sb-top">
      <div class="sb-wordmark">The <em>Essential</em> EA</div>
      <div class="sb-tagline">Operational Intelligence</div>
    </div>

    <div class="sb-user">
      <div class="sb-avatar" id="sb-avatar">KS</div>
      <div>
        <div class="sb-uname" id="sb-uname">Kristina Spencer</div>
        <div class="sb-role">Broker &#xB7; Team Lead</div>
      </div>
    </div>

    <nav class="sb-nav">
      <div class="sb-section">Overview</div>
      <div class="sb-item active" onclick="nav('dashboard',this)">
        <span class="sb-icon">&#x229E;</span>Dashboard
      </div>

      <div class="sb-section">Your EA</div>
      <div class="sb-item" onclick="nav('priorityweek',this)">
        <span class="sb-icon">&#x1F4C5;</span>Priority Week
      </div>
      <div class="sb-item" onclick="nav('triage',this)">
        <span class="sb-icon">&#x1F52E;</span>Crystal Ball Triage
        <span class="sb-badge" id="triage-count">&#x2014;</span>
      </div>
      <div class="sb-item" onclick="nav('inbox',this)">
        <span class="sb-icon">&#x2709;</span>Communication
        <span class="sb-badge">4</span>
      </div>

      <div class="sb-section">Operations</div>
      <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#x1F465;</span>Team & Pipeline</div>
      <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#x1F4B0;</span>Financial Tracking</div>
      <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#x1F4E3;</span>Marketing Content</div>
      <div class="sb-item" onclick="nav('operations',this)"><span class="sb-icon">&#x1F381;</span>Gifting & Database</div>

      <div class="sb-section">Settings</div>
      <div class="sb-item" onclick="nav('settings',this)"><span class="sb-icon">&#x2699;</span>Preferences</div>
      <div class="sb-item" onclick="nav('settings',this)"><span class="sb-icon">&#x25CE;</span>Account</div>
    </nav>

    <div class="sb-status">
      <div class="status-dot"></div>
      <span class="status-label">EA AI &#x2014; <strong>Active</strong></span>
    </div>
  </aside>

  <!-- ?? MAIN ????????????????????????????????????????? -->
  <main class="main">

    <!-- TOP BAR -->
    <div class="topbar">
      <button class="tb-menu" onclick="openSidebar()">?</button>
      <div class="tb-title-wrap">
        <div class="tb-title" id="tb-title">Good morning, <em>Kristina.</em></div>
      </div>
      <div class="tb-date" id="tb-date"></div>
      <div class="tb-actions">
        <button class="tb-btn tb-ghost" id="btn-report">Weekly Report</button>
        <button class="tb-btn tb-primary" onclick="nav('triage',null)">+ Add Task</button>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content" id="content">

      <!-- ???????????? DASHBOARD ???????????? -->
      <div class="screen active" id="screen-dashboard">
        <div class="pg-greeting">Good morning, <em>Kristina.</em></div>
        <div class="pg-sub" id="dash-sub">Your EA has 3 actions waiting for review.</div>

        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi-val" id="kpi-total">0</div>
            <div class="kpi-lbl">Total Tasks Analyzed</div>
            <div class="kpi-delta up" id="kpi-total-d">&#x2191; This session</div>
          </div>
          <div class="kpi">
            <div class="kpi-val" id="kpi-crystal">0</div>
            <div class="kpi-lbl">&#x1F52E; Crystal Ball</div>
            <div class="kpi-delta" id="kpi-crystal-d" style="color:var(--mid)">Only you can do these</div>
          </div>
          <div class="kpi">
            <div class="kpi-val" id="kpi-bouncy">0</div>
            <div class="kpi-lbl">&#x1F3BE; Bouncy Ball</div>
            <div class="kpi-delta" id="kpi-bouncy-d" style="color:var(--mid)">Delegate these</div>
          </div>
          <div class="kpi">
            <div class="kpi-val" id="kpi-conf">0%</div>
            <div class="kpi-lbl">Avg AI Confidence</div>
            <div class="kpi-delta up">&#x2191; Accuracy</div>
          </div>
        </div>

        <div class="dash-grid">
          <div class="col-wide">
            <div class="panel">
              <div class="panel-head">
                <span class="panel-title">Today's Priority Actions</span>
                <button class="panel-link" onclick="nav('triage',document.querySelectorAll('.sb-item')[2])">Classify tasks &#x2192;</button>
              </div>
              <div class="panel-body">
                <div class="p-item">
                  <div class="p-gem">&#x1F52E;</div>
                  <div class="p-body"><div class="p-task">Call Marcus Chen &#x2014; listing follow-up</div><div class="p-note">Crystal ball &#xB7; Relationship at risk if not actioned today</div></div>
                  <div class="p-time">9:30 AM</div>
                </div>
                <div class="p-item">
                  <div class="p-gem">&#x1F52E;</div>
                  <div class="p-body"><div class="p-task">Review Q1 commission report with CFO</div><div class="p-note">Crystal ball &#xB7; Financial stewardship cadence &#x2014; monthly</div></div>
                  <div class="p-time">2:00 PM</div>
                </div>
                <div class="p-item">
                  <div class="p-ball">&#x1F3BE;</div>
                  <div class="p-body"><div class="p-task">Schedule team standup for next week</div><div class="p-note">Bouncy ball &#xB7; Delegated to EA &#x2014; no action needed from you</div></div>
                  <div class="p-time">EA owned</div>
                </div>
                <div class="p-item">
                  <div class="p-ball">&#x1F3BE;</div>
                  <div class="p-body"><div class="p-task">Order closing gift for the Rodriguez family</div><div class="p-note">Bouncy ball &#xB7; Gift preferences logged &#xB7; EA processing</div></div>
                  <div class="p-time">EA owned</div>
                </div>
                <div class="p-item">
                  <div class="p-gem">&#x1F52E;</div>
                  <div class="p-body"><div class="p-task">Approve listing photos &#x2014; 2847 Elmwood</div><div class="p-note">Crystal ball &#xB7; Your eye and your standard &#xB7; Non-delegatable</div></div>
                  <div class="p-time">4:00 PM</div>
                </div>
              </div>
            </div>

            <div class="ai-box">
              <div class="ai-box-label"><span>&#x2726;</span> EA AI Insight &#xB7; This week</div>
              <div class="ai-box-text" id="dash-insight">Your calendar shows <strong>6.5 hours of meeting time before 10am on Tuesday and Wednesday.</strong> Based on your Priority Week, your highest-revenue activity is scheduled for those same windows. Your EA recommends shifting team admin meetings to Thursday afternoon to protect your prime selling hours. <strong>Approve below to action this change.</strong></div>
              <div class="ai-box-actions">
                <button class="ai-btn ai-btn-p" onclick="this.textContent='&#x2713; Approved';this.disabled=true">Approve change</button>
                <button class="ai-btn ai-btn-g" onclick="nav('inbox',document.querySelectorAll('.sb-item')[3])">Discuss with EA</button>
              </div>
            </div>
          </div>

          <div class="col">
            <div class="panel">
              <div class="panel-head"><span class="panel-title">Today's Schedule</span></div>
              <div class="panel-body" style="padding-top:10px">
                <div class="tl-item"><div class="tl-time">8:00</div><div class="tl-dot dot-green"></div><div><div class="tl-name">EA Daily Brief</div><div class="tl-sub">AI-generated &#xB7; reviewed</div></div></div>
                <div class="tl-item"><div class="tl-time">9:30</div><div class="tl-dot dot-gold"></div><div><div class="tl-name">Marcus Chen call</div><div class="tl-sub">Crystal ball &#xB7; 30 min</div></div></div>
                <div class="tl-item"><div class="tl-time">11:00</div><div class="tl-dot dot-amber"></div><div><div class="tl-name">Listing photos review</div><div class="tl-sub">2847 Elmwood &#xB7; 45 min</div></div></div>
                <div class="tl-item"><div class="tl-time">12:30</div><div class="tl-dot dot-dim"></div><div><div class="tl-name">Lunch &#x2014; protected</div><div class="tl-sub">Boundary block &#xB7; EA enforced</div></div></div>
                <div class="tl-item"><div class="tl-time">2:00</div><div class="tl-dot dot-gold"></div><div><div class="tl-name">CFO &#x2014; Q1 review</div><div class="tl-sub">Crystal ball &#xB7; 60 min</div></div></div>
                <div class="tl-item"><div class="tl-time">4:00</div><div class="tl-dot dot-green"></div><div><div class="tl-name">Photo approval</div><div class="tl-sub">EA has prepped all assets</div></div></div>
                <div class="tl-item"><div class="tl-time">5:30</div><div class="tl-dot dot-dim"></div><div><div class="tl-name">Hard stop</div><div class="tl-sub">CEO protection &#xB7; no meetings after</div></div></div>
              </div>
            </div>

            <div class="panel">
              <div class="panel-head"><span class="panel-title">Weekly Scorecard</span><button class="panel-link">Full report</button></div>
              <div class="panel-body">
                <div class="ring-wrap">
                  <div class="ring">
                    <svg width="62" height="62" viewBox="0 0 62 62">
                      <circle cx="31" cy="31" r="25" fill="none" stroke="var(--tan)" stroke-width="4.5"/>
                      <circle cx="31" cy="31" r="25" fill="none" stroke="var(--gold)" stroke-width="4.5" stroke-dasharray="157" stroke-dashoffset="20" stroke-linecap="round"/>
                    </svg>
                    <div class="ring-val">87</div>
                  </div>
                  <div><div class="ring-label">Operational Health</div><div class="ring-sub">Up 4 pts vs last week.<br>Crystal ball protection 94%.</div></div>
                </div>
                <div class="metric-row"><span class="metric-name">Crystal balls protected</span><span class="metric-val">17/18</span><div class="bar-wrap"><div class="bar" style="width:94%"></div></div></div>
                <div class="metric-row"><span class="metric-name">Bouncy balls delegated</span><span class="metric-val">12/14</span><div class="bar-wrap"><div class="bar" style="width:85%"></div></div></div>
                <div class="metric-row"><span class="metric-name">Inbox response time</span><span class="metric-val">2.4 hrs</span><div class="bar-wrap"><div class="bar" style="width:78%"></div></div></div>
                <div class="metric-row"><span class="metric-name">Leads followed up</span><span class="metric-val">14/14</span><div class="bar-wrap"><div class="bar" style="width:100%"></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /dashboard -->

      <!-- ???????????? PRIORITY WEEK ???????????? -->
      <div class="screen" id="screen-priorityweek">
        <div class="pg-head">Priority Week Generator</div>
        <div class="pg-sub2">Your AI-powered week &#x2014; built from your goals, your time blocks, and your methodology.</div>

        <div class="pw-layout">
          <div class="setup-card">
            <div class="setup-head">&#x2726; Generate Your Priority Week</div>
            <div class="setup-body">
              <div class="field-label">Top goals this week</div>
              <textarea class="field-area" id="goals" placeholder="e.g. Close the Elmwood listing, meet with 3 buyer leads, complete Q1 review&#x2026;"></textarea>

              <div class="field-label">Revenue target</div>
              <input class="field" id="revenue" type="text" placeholder="e.g. $45,000 GCI">

              <div class="field-label">Non-negotiable time blocks</div>
              <textarea class="field-area" id="timeblocks" style="min-height:70px" placeholder="e.g. No meetings before 9am, lunch 12:30&#x2013;1:30, hard stop 5:30pm&#x2026;"></textarea>

              <button class="gen-btn" id="gen-btn" onclick="generateWeek()">&#x2726; Generate My Priority Week</button>
            </div>
          </div>

          <div>
            <!-- Static preview week -->
            <div class="week-card" id="week-preview">
              <div class="week-head">
                <div>
                  <div class="week-title">Sample Week &#xB7; <em>Click Generate for Your Plan</em></div>
                  <div class="week-meta">Priority Week Framework &#xB7; The Essential EA</div>
                </div>
                <button class="tb-btn tb-ghost" style="padding:6px 12px;font-size:9.5px;color:var(--mid);border-color:var(--tan)">Export PDF</button>
              </div>
              <div class="day-grid">
                <div class="day-col"><div class="day-hd today">Mon</div><div class="day-tasks">
                  <div class="d-task crystal"><div class="dt-name">Listing call &#x2014; Marcus</div><div class="dt-time">9:30 AM</div><div class="dt-tag tag-c">Crystal</div></div>
                  <div class="d-task bouncy"><div class="dt-name">Team standup</div><div class="dt-time">11:00 AM</div><div class="dt-tag tag-b">EA Owned</div></div>
                  <div class="d-task crystal"><div class="dt-name">Buyer consult</div><div class="dt-time">3:00 PM</div><div class="dt-tag tag-c">Crystal</div></div>
                </div></div>
                <div class="day-col"><div class="day-hd">Tue</div><div class="day-tasks">
                  <div class="d-task crystal"><div class="dt-name">Buyer consult &#x2014; Lee</div><div class="dt-time">10:00 AM</div><div class="dt-tag tag-c">Crystal</div></div>
                  <div class="d-task bouncy"><div class="dt-name">Marketing review</div><div class="dt-time">1:00 PM</div><div class="dt-tag tag-b">EA Owned</div></div>
                  <div class="d-task crystal"><div class="dt-name">Offer review</div><div class="dt-time">4:00 PM</div><div class="dt-tag tag-c">Crystal</div></div>
                </div></div>
                <div class="day-col"><div class="day-hd">Wed</div><div class="day-tasks">
                  <div class="d-task block"><div class="dt-name">Deep work block</div><div class="dt-time">9&#x2013;11 AM</div><div class="dt-tag tag-p">Protected</div></div>
                  <div class="d-task crystal"><div class="dt-name">Buyer consult</div><div class="dt-time">2:00 PM</div><div class="dt-tag tag-c">Crystal</div></div>
                  <div class="d-task bouncy"><div class="dt-name">CRM audit</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div>
                </div></div>
                <div class="day-col"><div class="day-hd">Thu</div><div class="day-tasks">
                  <div class="d-task crystal"><div class="dt-name">CFO &#x2014; Q1 review</div><div class="dt-time">2:00 PM</div><div class="dt-tag tag-c">Crystal</div></div>
                  <div class="d-task bouncy"><div class="dt-name">Closing gifts</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div>
                  <div class="d-task bouncy"><div class="dt-name">Social posts</div><div class="dt-time">EA Owned</div><div class="dt-tag tag-b">EA Owned</div></div>
                </div></div>
                <div class="day-col"><div class="day-hd">Fri</div><div class="day-tasks">
                  <div class="d-task crystal"><div class="dt-name">Photo approval</div><div class="dt-time">10:00 AM</div><div class="dt-tag tag-c">Crystal</div></div>
                  <div class="d-task block"><div class="dt-name">Friday PM &#x2014; protected</div><div class="dt-time">1:00 PM+</div><div class="dt-tag tag-p">Protected</div></div>
                </div></div>
              </div>
              <div class="pw-note"><strong>&#x2726; EA Note:</strong> Crystal ball tasks account for <strong>9 of 18 scheduled items</strong>. The remaining 9 are fully EA-owned. Generate your plan above to see your personalized week.</div>
            </div>

            <!-- AI Generated result -->
            <div id="week-ai-result" style="display:none"></div>
          </div>
        </div>
      </div><!-- /priorityweek -->

      <!-- ???????????? CRYSTAL BALL TRIAGE ???????????? -->
      <div class="screen" id="screen-triage">
        <div class="pg-head">&#x1F52E; Crystal Ball Triage</div>
        <div class="pg-sub2">Type any task &#x2014; your EA AI classifies it instantly using the Essential EA methodology.</div>

        <div class="triage-input-row">
          <input class="triage-input" id="task-input"
            placeholder="e.g. 'Reply to vendor quote for office supplies' or 'Call from buyer asking about timeline'&#x2026;"
            onkeydown="if(event.key==='Enter')classifyTask()">
          <button class="analyze-btn" id="analyze-btn" onclick="classifyTask()">&#x2726; Classify Task</button>
        </div>

        <div id="triage-result" style="display:none"></div>

        <div class="triage-cols">
          <div>
            <div class="tcol-head ch">
              <div class="tc-icon">&#x1F52E;</div>
              <div><div class="tc-title">Crystal Ball Tasks</div><div class="tc-sub">Only you can do these &#xB7; protect fiercely</div></div>
              <div class="tc-count cc" id="crystal-count-badge">0</div>
            </div>
            <div class="tcol-list" id="crystal-list">
              <div class="empty-state">Classify tasks above to see them here.</div>
            </div>
          </div>
          <div>
            <div class="tcol-head bh">
              <div class="tc-icon">&#x1F3BE;</div>
              <div><div class="tc-title">Bouncy Ball Tasks</div><div class="tc-sub">Delegate these &#xB7; they bounce back</div></div>
              <div class="tc-count bc" id="bouncy-count-badge">0</div>
            </div>
            <div class="tcol-list" id="bouncy-list">
              <div class="empty-state">Tasks your EA can own will appear here.</div>
            </div>
          </div>
        </div>
      </div><!-- /triage -->

      <!-- ???????????? INBOX ???????????? -->
      <div class="screen" id="screen-inbox" style="padding:0">
        <div class="inbox-wrap" id="inbox-wrap">
          <!-- Message list -->
          <div class="inbox-list">
            <div class="inbox-head">
              <span class="inbox-head-title">Communication Hub</span>
              <span class="inbox-count">4 need you</span>
            </div>
            <div class="filter-row">
              <button class="fpill active" onclick="filterMsgs('all',this)">All</button>
              <button class="fpill" onclick="filterMsgs('you',this)">Needs You</button>
              <button class="fpill" onclick="filterMsgs('ea',this)">EA Owned</button>
              <button class="fpill" onclick="filterMsgs('defer',this)">Deferred</button>
            </div>
            <div id="msg-list">
              <div class="msg unread active" data-tag="you" onclick="openMsg(0,this)">
                <div class="msg-header"><span class="msg-from"><span class="unread-dot"></span>Marcus Chen</span><span class="msg-when">9:14 AM</span></div>
                <div class="msg-sub">Counter offer &#x2014; 2847 Elmwood Dr</div>
                <div class="msg-prev">I've reviewed the seller's position and I think we can move&#x2026;</div>
                <div class="msg-tags"><span class="mtag mt-you">Needs You</span><span class="mtag mt-urgent">Urgent</span></div>
              </div>
              <div class="msg unread" data-tag="ea" onclick="openMsg(1,this)">
                <div class="msg-header"><span class="msg-from"><span class="unread-dot"></span>Sarah Kim &#x2014; Lender</span><span class="msg-when">8:52 AM</span></div>
                <div class="msg-sub">Referral partner meeting request</div>
                <div class="msg-prev">Hi Kristina, I'd love 20 minutes to explore a referral&#x2026;</div>
                <div class="msg-tags"><span class="mtag mt-ea">EA Triaging</span></div>
              </div>
              <div class="msg" data-tag="ea" onclick="openMsg(2,this)">
                <div class="msg-header"><span class="msg-from">Rodriguez Closing</span><span class="msg-when">Tue</span></div>
                <div class="msg-sub">Closing confirmed &#x2014; gift needed by Friday</div>
                <div class="msg-prev">Title confirmed Thursday 2pm. Per your gift protocol&#x2026;</div>
                <div class="msg-tags"><span class="mtag mt-ea">EA Owned</span></div>
              </div>
              <div class="msg unread" data-tag="you" onclick="openMsg(3,this)">
                <div class="msg-header"><span class="msg-from"><span class="unread-dot"></span>Team Standup Bot</span><span class="msg-when">Mon</span></div>
                <div class="msg-sub">Weekly scorecard &#x2014; Action required</div>
                <div class="msg-prev">2 team members missed their weekly task completion&#x2026;</div>
                <div class="msg-tags"><span class="mtag mt-you">Needs You</span></div>
              </div>
              <div class="msg flagged" data-tag="defer" onclick="openMsg(4,this)">
                <div class="msg-header"><span class="msg-from">Office Supplies Vendor</span><span class="msg-when">Mon</span></div>
                <div class="msg-sub">Quote renewal &#x2014; Q2 supplies</div>
                <div class="msg-prev">As discussed, here is our updated pricing for Q2&#x2026;</div>
                <div class="msg-tags"><span class="mtag mt-ea">EA Replied</span><span class="mtag mt-none">No Action</span></div>
              </div>
              <div class="msg" data-tag="ea" onclick="openMsg(5,this)">
                <div class="msg-header"><span class="msg-from">NAR Events</span><span class="msg-when">Last wk</span></div>
                <div class="msg-sub">April conference &#x2014; booking confirmation</div>
                <div class="msg-prev">Your registration and hotel are confirmed for April 14&#x2013;16&#x2026;</div>
                <div class="msg-tags"><span class="mtag mt-ea">EA Booked</span></div>
              </div>
            </div>
          </div><!-- /inbox-list -->

          <!-- Detail pane -->
          <div class="msg-detail" id="msg-detail">
            <div class="detail-head">
              <div style="flex:1;min-width:0">
                <div class="detail-subject" id="d-subject">Counter offer &#x2014; 2847 Elmwood Dr</div>
                <div class="detail-meta" id="d-meta">From <strong>Marcus Chen</strong> &#xB7; Today 9:14 AM</div>
              </div>
              <div class="detail-acts">
                <button class="d-btn d-ghost" id="btn-back" onclick="closeDetail()" style="display:none">&#x2190; Back</button>
                <button class="d-btn d-ghost">Forward to EA</button>
                <button class="d-btn d-primary">Reply</button>
              </div>
            </div>

            <div class="ai-routing">
              <div class="ar-icon">&#x1F52E;</div>
              <div>
                <div class="ar-text" id="d-routing"><strong>Crystal Ball &#x2014; Needs You.</strong> This email involves a counter offer on an active listing and requires your direct judgment and client relationship. Your EA has prepared two suggested response approaches.</div>
                <div class="ar-pills">
                  <div class="ar-pill arp-handle">Handle personally</div>
                  <div class="ar-pill arp-defer">Schedule callback</div>
                  <div class="ar-pill arp-delegate" id="ar-delegate" style="display:none">Delegate to EA</div>
                </div>
              </div>
            </div>

            <div class="detail-body" id="d-body">
              <p style="margin-bottom:14px">Hi Kristina,</p>
              <p style="margin-bottom:14px">I've reviewed the seller's counter and I think we're close. They came down to $624,000 &#x2014; still $11K above our last position but I believe there's room. The inspection contingency ends Friday.</p>
              <p style="margin-bottom:14px">If we can get to $618,000 with the seller covering closing costs, we have a deal. Can you reach out to the listing agent today?</p>
              <p>Thanks,<br>Marcus</p>

              <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--tan)">
                <div class="opt-sep">&#x2726; EA-prepared response options</div>
                <div class="opt-box" onclick="setReply('Hi Marcus, great news &#x2014; let me reach out to the listing agent this morning about the \\$618K + closing costs position. Will confirm Tuesday walkthrough and have an update by noon. &#x2014; Kristina')">
                  <div class="opt-label">OPTION A &#x2014; Move forward</div>
                  Confirm position, contact listing agent, hold Tuesday walkthrough.
                </div>
                <div class="opt-box" onclick="setReply('Marcus &#x2014; I want to review the inspection report before responding to the counter. Can we connect at 9:30am tomorrow for 15 minutes? &#x2014; Kristina')">
                  <div class="opt-label">OPTION B &#x2014; Review first</div>
                  Request inspection report before negotiating. Schedule call.
                </div>
              </div>
            </div>

            <div class="detail-reply">
              <textarea class="reply-input" id="reply-input" rows="2" placeholder="Type your reply or click a suggested response above&#x2026;"></textarea>
              <button class="reply-send" onclick="sendReply()">Send</button>
            </div>
          </div><!-- /msg-detail -->
        </div>
      </div><!-- /inbox -->

      <!-- ???????????? OPERATIONS ???????????? -->
      <div class="screen" id="screen-operations">
        <div class="pg-head">Operations</div>
        <div class="pg-sub2">Your business infrastructure &#x2014; coming online as the platform builds.</div>

        <div class="ops-grid">
          <div class="ops-card"><div class="ops-icon">&#x1F465;</div><div class="ops-title">Team & Pipeline</div><div class="ops-desc">Manage team members, roles, and deal pipeline in one view.</div></div>
          <div class="ops-card"><div class="ops-icon">&#x1F4B0;</div><div class="ops-title">Financial Tracking</div><div class="ops-desc">GCI goals, commission tracking, and financial stewardship cadence.</div></div>
          <div class="ops-card"><div class="ops-icon">&#x1F4E3;</div><div class="ops-title">Marketing Content</div><div class="ops-desc">AI-generated content from your brand guide &#x2014; approved in one tap.</div></div>
          <div class="ops-card"><div class="ops-icon">&#x1F381;</div><div class="ops-title">Gifting & Database</div><div class="ops-desc">Sphere touchpoints, closing gifts, and relationship cadence &#x2014; EA owned.</div></div>
        </div>

        <div class="coming-soon">
          <div class="cs-title">Full Operations Suite &#x2014; Coming in Phase 3</div>
          <div class="cs-body">These modules are being integrated with your CRM, transaction management, and business systems. Crystal Ball and Priority Week are live now. Operations launches with full functionality in the next release.</div>
        </div>
      </div><!-- /operations -->

      <!-- ???????????? SETTINGS ???????????? -->
      <div class="screen" id="screen-settings">
        <div class="pg-head">Settings</div>
        <div class="pg-sub2">Manage your account, preferences, and integrations.</div>

        <div class="settings-grid">
          <div class="s-card"><div class="s-icon">&#x2699;?</div><div class="s-title">Preferences</div><div class="s-desc">Customize notifications, time blocks, and EA behavior.</div></div>
          <div class="s-card"><div class="s-icon">&#x1F512;</div><div class="s-title">Security</div><div class="s-desc">Manage passwords, 2FA, and account access.</div></div>
          <div class="s-card"><div class="s-icon">&#x1F50C;</div><div class="s-title">Integrations</div><div class="s-desc">Connect your CRM, calendar, and business tools.</div></div>
          <div class="s-card"><div class="s-icon">&#x1F464;</div><div class="s-title">Account</div><div class="s-desc">Update your profile, plan, and billing details.</div></div>
        </div>

        <div class="panel" style="margin-bottom:16px">
          <div class="panel-head"><span class="panel-title">Account Information</span></div>
          <div class="panel-body" style="display:grid;gap:12px;font-size:13.5px">
            <div><strong>Email:</strong> <span style="color:var(--mid)">kristina@operationalconsultinggroup.com</span></div>
            <div><strong>Role:</strong> <span style="color:var(--mid)">Broker &#xB7; Team Lead</span></div>
            <div><strong>Plan:</strong> <span style="color:var(--gold2);font-weight:600">Blueprint &#x2014; $147/month</span></div>
            <div><strong>Member Since:</strong> <span style="color:var(--mid)">April 2026 &#xB7; Founding Member</span></div>
          </div>
        </div>

        <!-- Feedback form &#x2014; preserves existing /api/feedback endpoint -->
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Send Feedback</span></div>
          <div class="panel-body">
            <div class="form-group">
              <label class="form-label">Your Name (Optional)</label>
              <input type="text" id="fb-name" class="form-input" placeholder="e.g. Kristina Spencer">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="fb-email" class="form-input" placeholder="your@email.com">
            </div>
            <div class="form-group">
              <label class="form-label">How would you rate your experience?</label>
              <div class="rating-row">
                <button class="r-btn" onclick="setRating(1,this)">&#x1F61E; 1</button>
                <button class="r-btn" onclick="setRating(2,this)">&#x1F610; 2</button>
                <button class="r-btn" onclick="setRating(3,this)">&#x1F642; 3</button>
                <button class="r-btn" onclick="setRating(4,this)">&#x1F60A; 4</button>
                <button class="r-btn selected" onclick="setRating(5,this)">&#x1F929; 5</button>
              </div>
              <input type="hidden" id="fb-rating" value="5">
            </div>
            <div class="form-group">
              <label class="form-label">Your Feedback *</label>
              <textarea id="fb-msg" class="form-textarea" placeholder="What's working well? What could be improved?"></textarea>
            </div>
            <button class="submit-btn" onclick="submitFeedback()">Send Feedback &#x2709;?</button>
            <div id="fb-status" style="display:none"></div>
          </div>
        </div>
      </div><!-- /settings -->

    </div><!-- /content -->
  </main>
</div><!-- /shell -->

<script>
// ?? HELPERS ???????????????????????????????????????????????
const $ = id => document.getElementById(id);
const today = new Date();
const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Set date
$('tb-date').textContent = days[today.getDay()] + ', ' + months[today.getMonth()] + ' ' + today.getDate() + ', ' + today.getFullYear();

// ?? SIDEBAR ????????????????????????????????????????????????
function openSidebar()  { $('sidebar').classList.add('open');  $('overlay').classList.add('open'); }
function closeSidebar() { $('sidebar').classList.remove('open'); $('overlay').classList.remove('open'); }

// ?? NAVIGATION ?????????????????????????????????????????????
const screenTitles = {
  dashboard:   'Good morning, <em>Kristina.</em>',
  priorityweek:'Priority Week Generator',
  triage:      '&#x1F52E; Crystal Ball Triage',
  inbox:       'Communication Hub',
  operations:  'Operations',
  settings:    'Settings',
};

function nav(name, el) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));

  const screen = $('screen-' + name);
  if (screen) screen.classList.add('active');
  if (el) el.classList.add('active');

  $('tb-title').innerHTML = screenTitles[name] || name;

  // Close mobile sidebar
  closeSidebar();

  // Scroll content to top
  $('content').scrollTop = 0;

  // Load data for screen
  if (name === 'dashboard' || name === 'triage') loadStats();
}

// ?? STATS (calls existing /api/stats) ?????????????????????
async function loadStats() {
  try {
    const res  = await fetch('/api/stats');
    const data = await res.json();
    if (data.success) {
      const s = data.stats;
      $('kpi-total').textContent   = s.totalTasks;
      $('kpi-crystal').textContent = s.crystal;
      $('kpi-bouncy').textContent  = s.bouncy;
      $('kpi-conf').textContent    = s.avgAccuracy + '%';
      $('triage-count').textContent = s.totalTasks || '&#x2014;';
      if (s.totalTasks > 0) {
        $('kpi-total-d').textContent   = '&#x2191; ' + s.totalTasks + ' classified';
        $('kpi-total-d').className     = 'kpi-delta up';
        $('kpi-crystal-d').textContent = s.crystal + ' tasks &#x2014; your time only';
        $('kpi-bouncy-d').textContent  = s.bouncy  + ' tasks &#x2014; ready to delegate';
      }
    }
    loadHistory();
  } catch(e) { console.error('Stats error:', e); }
}

// ?? HISTORY (calls existing /api/history) ?????????????????
async function loadHistory() {
  try {
    const res  = await fetch('/api/history?limit=20');
    const data = await res.json();
    if (data.success) {
      const crystal = data.tasks.filter(t => t.classification === 'crystal');
      const bouncy  = data.tasks.filter(t => t.classification === 'bouncy');

      $('crystal-count-badge').textContent = crystal.length;
      $('bouncy-count-badge').textContent  = bouncy.length;

      $('crystal-list').innerHTML = crystal.length
        ? crystal.map(t => taskCard(t)).join('')
        : '<div class="empty-state">No crystal ball tasks yet.</div>';

      $('bouncy-list').innerHTML = bouncy.length
        ? bouncy.map(t => taskCard(t)).join('')
        : '<div class="empty-state">No bouncy ball tasks yet.</div>';
    }
  } catch(e) { console.error('History error:', e); }
}

function taskCard(t) {
  const badge = t.urgency === 'urgent' ? 'badge-u' :
                t.urgency === 'today'  ? 'badge-u' :
                t.urgency === 'defer'  ? 'badge-f' : 'badge-e';
  const badgeText = t.urgency === 'ea_owned' ? 'EA Owned' : (t.urgency || 'classified');
  return \`
    <div class="t-item">
      <div class="ti-icon">\${t.emoji || (t.classification === 'crystal' ? '&#x1F52E;' : '&#x1F3BE;')}</div>
      <div class="ti-body">
        <div class="ti-task">\${t.description || t.task || ''}</div>
        <div class="ti-reason">\${t.reason || ''}</div>
      </div>
      <div class="ti-badge \${badge}">\${badgeText}</div>
    </div>
  \`;
}

// ?? CRYSTAL BALL (calls existing /api/classify) ????????????
async function classifyTask() {
  const input = $('task-input');
  const val   = input.value.trim();
  if (!val) { input.focus(); return; }

  const btn    = $('analyze-btn');
  const result = $('triage-result');

  btn.disabled   = true;
  btn.textContent = 'Analyzing&#x2026;';
  result.style.display = 'block';
  result.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div> Analyzing your task with AI&#x2026;</div>';

  try {
    const res  = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskDescription: val })
    });
    const data = await res.json();

    if (data.success) {
      const c = data.classification;
      const isCrystal = c.classification === 'crystal';
      result.innerHTML = \`
        <div class="triage-result-box">
          <div class="tr-header">
            <div class="tr-emoji">\${c.emoji || (isCrystal ? '&#x1F52E;' : '&#x1F3BE;')}</div>
            <div class="tr-title">\${isCrystal ? 'Crystal Ball &#x2014; Only You Can Do This' : 'Bouncy Ball &#x2014; Your EA Owns This'}</div>
          </div>
          <div class="tr-meta">
            <span><strong>Urgency:</strong> \${c.urgency || '&#x2014;'}</span>
            <span><strong>Confidence:</strong> \${c.confidence ? (c.confidence * 100).toFixed(0) + '%' : '&#x2014;'}</span>
          </div>
          <div class="tr-body"><strong>Why:</strong> \${c.reason || ''}</div>
          <div class="tr-body"><strong>Action:</strong> \${c.recommendedAction || ''}</div>
          <div class="tr-action">\${isCrystal ? '&#x2192; Keep &#xB7; Schedule &#xB7; Protect this time' : '&#x2192; Delegate &#xB7; Remove from your calendar'}</div>
        </div>
      \`;
      input.value = '';
      loadStats();
    } else {
      result.innerHTML = \`<div class="alert alert-error">Error: \${data.error || 'Classification failed'}</div>\`;
    }
  } catch(e) {
    result.innerHTML = \`<div class="alert alert-error">Error: \${e.message}</div>\`;
  } finally {
    btn.disabled    = false;
    btn.textContent = '&#x2726; Classify Task';
  }
}

// Enter key on triage input
$('task-input').addEventListener('keydown', e => { if(e.key === 'Enter') classifyTask(); });

// ?? PRIORITY WEEK (calls existing /api/generate-week) ?????
async function generateWeek() {
  const goals      = $('goals').value.trim();
  const revenue    = $('revenue').value.trim();
  const timeblocks = $('timeblocks').value.trim();

  if (!goals || !revenue || !timeblocks) {
    alert('Please fill in all three fields to generate your week.');
    return;
  }

  const btn    = $('gen-btn');
  const result = $('week-ai-result');

  btn.disabled    = true;
  btn.textContent = 'Generating your week&#x2026;';
  result.style.display = 'block';
  result.innerHTML = '<div class="panel" style="padding:20px"><div class="spinner-wrap"><div class="spinner"></div> Building your 5-day Priority Week with AI&#x2026;</div></div>';

  try {
    const res  = await fetch('/api/generate-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, revenue, timeblocks })
    });
    const data = await res.json();

    if (data.success) {
      result.innerHTML = \`
        <div class="week-card">
          <div class="week-head">
            <div>
              <div class="week-title">Your AI-Generated Priority Week</div>
              <div class="week-meta">Generated from your goals &#xB7; Essential EA Priority Week Framework</div>
            </div>
          </div>
          <div style="padding:18px">
            <div class="pw-note" style="border-top:none;border-radius:6px;margin-bottom:12px">
              <strong>&#x2726; Your plan is ready.</strong> Crystal ball tasks are scheduled during your peak hours. Bouncy balls have been routed to your EA.
            </div>
            <pre style="white-space:pre-wrap;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--black);line-height:1.75">\${data.plan}</pre>
          </div>
        </div>
      \`;
      $('week-preview').style.display = 'none';
    } else {
      result.innerHTML = \`<div class="alert alert-error">Error: \${data.error}</div>\`;
    }
  } catch(e) {
    result.innerHTML = \`<div class="alert alert-error">Error: \${e.message}</div>\`;
  } finally {
    btn.disabled    = false;
    btn.textContent = '&#x2726; Generate My Priority Week';
  }
}

// ?? INBOX ??????????????????????????????????????????????????
const messages = [
  {
    subject: 'Counter offer &#x2014; 2847 Elmwood Dr',
    from: 'Marcus Chen', time: 'Today 9:14 AM',
    routing: '<strong>Crystal Ball &#x2014; Needs You.</strong> Counter offer on an active listing requires your direct judgment and client relationship. EA has prepared two response approaches.',
    pillType: 'crystal',
    body: \`<p style="margin-bottom:14px">Hi Kristina,</p>
<p style="margin-bottom:14px">I've reviewed the seller's counter &#x2014; they came down to $624,000. Still $11K above our last position but there's room. Inspection contingency ends Friday.</p>
<p style="margin-bottom:14px">If we can get to $618,000 with seller covering closing costs, we have a deal. Can you reach out to the listing agent today?</p>
<p>Thanks,<br>Marcus</p>
<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--tan)">
  <div class="opt-sep">&#x2726; EA-prepared response options</div>
  <div class="opt-box" onclick="setReply('Hi Marcus, great news &#x2014; let me reach out to the listing agent this morning about the \\$618K + closing costs position. Will confirm Tuesday walkthrough and have an update by noon. &#x2014; Kristina')">
    <div class="opt-label">OPTION A &#x2014; Move forward</div>Confirm position, contact listing agent, hold Tuesday walkthrough.
  </div>
  <div class="opt-box" onclick="setReply('Marcus &#x2014; I want to review the inspection report before responding. Can we connect at 9:30am tomorrow for 15 minutes? &#x2014; Kristina')">
    <div class="opt-label">OPTION B &#x2014; Review first</div>Request inspection report before negotiating. Schedule call.
  </div>
</div>\`
  },
  {
    subject: 'Referral partner meeting request',
    from: 'Sarah Kim &#x2014; Lender', time: 'Today 8:52 AM',
    routing: '<strong>Bouncy Ball &#x2014; EA Triaging.</strong> Inbound meeting request from a vendor. EA is evaluating against your referral partner criteria and will schedule or decline per your standing instructions.',
    pillType: 'bouncy',
    body: \`<p style="margin-bottom:14px">Hi Kristina,</p><p>I'd love 20 minutes to explore a referral partnership. Are you available this week or next?</p><p style="margin-top:14px">Best,<br>Sarah</p>\`
  },
  {
    subject: 'Closing confirmed &#x2014; gift needed by Friday',
    from: 'Rodriguez Closing', time: 'Tuesday',
    routing: '<strong>Bouncy Ball &#x2014; EA Owned.</strong> EA has confirmed the closing and is processing the gift order per your gift preferences profile. No action required from you.',
    pillType: 'bouncy',
    body: \`<p style="margin-bottom:14px">Title confirmed Thursday 2pm for the Rodriguez family.</p><p>EA has selected the Luxury Home Welcome Box and scheduled delivery for Wednesday AM. Budget used: $185 of your $200 gift allowance.</p><p style="margin-top:14px">No action needed. &#x2014; Your EA</p>\`
  },
  {
    subject: 'Weekly scorecard &#x2014; Action required',
    from: 'Team Standup Bot', time: 'Monday',
    routing: '<strong>Crystal Ball &#x2014; Needs Your Input.</strong> Two team members missed weekly targets. As team leader, only you can address performance accountability.',
    pillType: 'crystal',
    body: \`<p style="margin-bottom:14px">Weekly performance &#x2014; Week of April 7.</p><p style="margin-bottom:14px"><strong>Attention:</strong> Two agents completed fewer than 60% of committed tasks. Pattern has appeared for 2 consecutive weeks.</p><p>EA recommends a 15-min 1:1 with each. Would you like your EA to schedule these?</p>\`
  },
  {
    subject: 'Quote renewal &#x2014; Q2 supplies',
    from: 'Office Supplies Vendor', time: 'Monday',
    routing: '<strong>Bouncy Ball &#x2014; EA Replied.</strong> Routine vendor communication. EA has replied and handled this per your vendor management protocol. No action needed.',
    pillType: 'bouncy',
    body: \`<p style="margin-bottom:14px">Your EA replied to this on your behalf:</p><p style="background:var(--cream);padding:12px;border-radius:4px;border-left:2px solid var(--gold);margin-bottom:14px">Thanks for sending the Q2 pricing. We'll review and be in touch. &#x2014; Essential EA on behalf of Kristina Spencer</p><p style="color:var(--mid)">No action needed from you.</p>\`
  },
  {
    subject: 'April conference &#x2014; booking confirmation',
    from: 'NAR Events', time: 'Last week',
    routing: '<strong>Bouncy Ball &#x2014; EA Booked.</strong> Conference registration and hotel confirmed per your travel preferences. All details below.',
    pillType: 'bouncy',
    body: \`<p style="margin-bottom:14px">Your registration and hotel are confirmed for April 14&#x2013;16, NAR Annual Conference.</p><p style="margin-bottom:14px">Hotel: Marriott Downtown &#xB7; Check-in April 13 &#xB7; Checkout April 17</p><p>Your EA added all details to your calendar. No action needed.</p>\`
  },
];

function openMsg(idx, el) {
  const m = messages[idx];
  if (!m) return;

  // Update active state
  document.querySelectorAll('.msg').forEach(m => m.classList.remove('active'));
  if (el) el.classList.add('active');

  // Populate detail
  $('d-subject').textContent = m.subject;
  $('d-meta').innerHTML = \`From <strong>\${m.from}</strong> &#xB7; \${m.time}\`;
  $('d-routing').innerHTML = m.routing;
  $('d-body').innerHTML = m.body;
  $('reply-input').value = '';

  // Show/hide delegate pill
  const delegateEl = $('ar-delegate');
  if (m.pillType === 'bouncy') {
    delegateEl.style.display = 'inline-block';
    document.querySelector('.arp-handle').style.display = 'none';
    document.querySelector('.arp-defer').style.display  = 'none';
  } else {
    delegateEl.style.display = 'none';
    document.querySelector('.arp-handle').style.display = 'inline-block';
    document.querySelector('.arp-defer').style.display  = 'inline-block';
  }

  // Mobile: show detail pane
  if (window.innerWidth <= 768) {
    $('inbox-wrap').classList.add('detail-open');
    $('btn-back').style.display = 'block';
  }
}

function closeDetail() {
  $('inbox-wrap').classList.remove('detail-open');
  $('btn-back').style.display = 'none';
}

function setReply(text) {
  $('reply-input').value = text;
  $('reply-input').focus();
}

function sendReply() {
  const val = $('reply-input').value.trim();
  if (!val) return;
  $('reply-input').value = '';
  // Could wire to real email API in future phases
  const btn = document.querySelector('.reply-send');
  btn.textContent = '&#x2713; Sent';
  btn.style.background = 'var(--green)';
  setTimeout(() => { btn.textContent = 'Send'; btn.style.background = ''; }, 2000);
}

function filterMsgs(tag, btn) {
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#msg-list .msg').forEach(m => {
    if (tag === 'all') { m.style.display = ''; return; }
    m.style.display = m.dataset.tag === tag ? '' : 'none';
  });
}

// ?? FEEDBACK (calls existing /api/feedback) ????????????????
let currentRating = 5;
function setRating(r, btn) {
  currentRating = r;
  $('fb-rating').value = r;
  document.querySelectorAll('.r-btn').forEach((b, i) => {
    b.classList.toggle('selected', i < r);
  });
}

async function submitFeedback() {
  const name  = $('fb-name').value.trim();
  const email = $('fb-email').value.trim();
  const msg   = $('fb-msg').value.trim();

  if (!email || !msg) { alert('Please fill in email and feedback message.'); return; }

  const status = $('fb-status');
  status.style.display = 'block';
  status.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div> Sending&#x2026;</div>';

  try {
    const res  = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, rating: parseInt($('fb-rating').value), message: msg })
    });
    const data = await res.json();

    if (data.success) {
      status.innerHTML = '<div class="alert alert-success">? Thank you! Your feedback has been received.</div>';
      $('fb-name').value = $('fb-email').value = $('fb-msg').value = '';
      setRating(5, document.querySelectorAll('.r-btn')[4]);
      setTimeout(() => status.style.display = 'none', 5000);
    } else {
      status.innerHTML = \`<div class="alert alert-error">? \${data.error || 'Failed to submit'}</div>\`;
    }
  } catch(e) {
    status.innerHTML = \`<div class="alert alert-error">? \${e.message}</div>\`;
  }
}

// ?? INIT ???????????????????????????????????????????????????
loadStats();
</script>
</body>
</html>
`;
export default app;
