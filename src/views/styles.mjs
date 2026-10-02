export const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap';

const BASE = `
:root{--bg:#0d090f;--panel:#161017;--panel2:#1e1620;--ink:#efe5d3;--muted:#ad9f8b;--gold:#c9a45c;--gold2:#e3c788;--blood:#8f2636;--line:#33263a;--ok:#6e9b6a;--warn:#c99a3c;--err:#c0495a;--radius:14px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background-color:var(--bg);background-image:radial-gradient(ellipse 120% 60% at 50% -10%,rgba(58,30,52,.9) 0%,rgba(19,13,21,.6) 45%,rgba(13,9,15,0) 100%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23c9a45c' stroke-opacity='.07' stroke-width='1'%3E%3Cpath d='M60 0 L120 60 L60 120 L0 60 Z'/%3E%3Cpath d='M60 38 C70 48 70 52 60 60 C50 52 50 48 60 38 Z M60 82 C50 72 50 68 60 60 C70 68 70 72 60 82 Z M38 60 C48 50 52 50 60 60 C52 70 48 70 38 60 Z M82 60 C72 70 68 70 60 60 C68 50 72 50 82 60 Z'/%3E%3Ccircle cx='60' cy='60' r='3'/%3E%3Ccircle cx='0' cy='0' r='2'/%3E%3Ccircle cx='120' cy='0' r='2'/%3E%3Ccircle cx='0' cy='120' r='2'/%3E%3Ccircle cx='120' cy='120' r='2'/%3E%3C/g%3E%3C/svg%3E");background-attachment:fixed;color:var(--ink);font:18px/1.55 'EB Garamond',Georgia,'Times New Roman',serif}
/* Candlelit vignette over the wallpaper, under everything else. */
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background:radial-gradient(ellipse at 50% 35%,transparent 50%,rgba(0,0,0,.6) 100%)}
::selection{background:rgba(201,164,92,.35);color:#fff}
a{color:var(--gold2)}
h1,h2,h3,h4{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;letter-spacing:.01em;line-height:1.15;margin:1.2em 0 .45em}
h1{font-size:2.1rem;margin:.2em 0;color:var(--gold2)}
@supports ((-webkit-background-clip:text) or (background-clip:text)){h1{background:linear-gradient(180deg,#f8ebc2 0%,#ddb86c 48%,#a27a37 100%);-webkit-background-clip:text;background-clip:text;color:transparent}}
.flourish{display:flex;align-items:center;justify-content:center;gap:12px;color:var(--gold);margin:10px auto;max-width:280px;font-size:.9rem}
.flourish::before,.flourish::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(201,164,92,.7),transparent)}
.house-line{font:600 .78rem 'Cormorant Garamond',Georgia,serif;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);opacity:.85}
@media (max-width:480px){.house-line{letter-spacing:.16em;font-size:.72rem}}
h2{font-size:1.55rem;color:var(--gold2)}
h3{font-size:1.25rem}
p{margin:.55em 0}
blockquote{margin:.8em 0;padding:.6em 1em;border-left:3px solid var(--gold);background:rgba(201,164,92,.08);border-radius:0 8px 8px 0;font-style:italic}
code{font-size:.9em}
.wrap{max-width:720px;margin:0 auto;padding:16px}
.muted{color:var(--muted)}
.small{font-size:.86rem}
.card{position:relative;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;margin:14px 0;box-shadow:inset 0 1px 0 rgba(227,199,136,.06),0 10px 30px rgba(0,0,0,.35)}
/* An engraved inner frame, like a good invitation. */
.card::before{content:"";position:absolute;inset:5px;border:1px solid rgba(201,164,92,.09);border-radius:calc(var(--radius) - 4px);pointer-events:none}
@keyframes candle{0%,100%{filter:drop-shadow(0 0 10px rgba(227,170,90,.35)) drop-shadow(0 6px 14px rgba(0,0,0,.5))}45%{filter:drop-shadow(0 0 16px rgba(227,170,90,.5)) drop-shadow(0 6px 14px rgba(0,0,0,.5))}70%{filter:drop-shadow(0 0 8px rgba(227,170,90,.28)) drop-shadow(0 6px 14px rgba(0,0,0,.5))}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
.btn{display:inline-block;font:inherit;font-size:1rem;background:linear-gradient(180deg,#a3293b,var(--blood));color:#fff;border:1px solid #b23a4b;border-radius:999px;padding:.55em 1.2em;cursor:pointer;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 2px 8px rgba(0,0,0,.35)}
.btn:hover{filter:brightness(1.1)}
.btn.ghost{background:transparent;color:var(--gold2);border-color:var(--gold)}
.btn.small{font-size:.85rem;padding:.35em .9em}
input,select,textarea{font:inherit;font-size:16px;background:#0f0a11;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:.5em .7em;max-width:100%}
textarea{width:100%;min-height:8em;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}
ul{padding-left:1.2em}
li{margin:.25em 0}
.raven{font-size:1.6rem;line-height:1}

.crest{display:block;flex:none}
.chart-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:6px 0}
.chart-scroll>svg{display:block;width:100%;height:auto}
.map-wrap{overflow-x:auto;margin:10px 0;border-radius:10px}
.manor-map{display:block;width:100%;min-width:620px;height:auto;border-radius:10px}
.venue-map{display:block;width:100%;height:auto;border-radius:10px}
.venue-tall{display:none;max-width:460px;margin:0 auto}
@media (max-width:760px){.venue-wide{display:none}.venue-tall{display:block}}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font:13px system-ui,sans-serif;color:var(--muted);margin:6px 0 2px}
.legend .lg{display:inline-flex;align-items:center;gap:6px}
.legend i{display:inline-block;width:18px;height:10px;border-radius:3px}
.stepper{display:flex;list-style:none;padding:0;margin:14px auto 4px;max-width:520px;counter-reset:s}
.stepper li{flex:1;text-align:center;position:relative;font:12px system-ui,sans-serif;color:var(--muted)}
.stepper li::before{content:'';position:absolute;top:13px;left:-50%;width:100%;height:2px;background:var(--line);z-index:0}
.stepper li:first-child::before{display:none}
.stepper .dot{position:relative;z-index:1;display:grid;place-items:center;width:28px;height:28px;margin:0 auto 4px;border-radius:50%;background:var(--panel);border:1.5px solid var(--line);font:600 12px system-ui,sans-serif;color:var(--muted)}
.stepper li.done .dot{background:#3a2a1a;border-color:var(--gold);color:var(--gold2)}
.stepper li.done::before,.stepper li.now::before{background:var(--gold)}
.stepper li.now .dot{background:var(--blood);border-color:#e7a0aa;color:#fff;box-shadow:0 0 0 4px rgba(143,38,54,.25)}
.stepper li.now .lbl{color:var(--ink);font-weight:600}
.stepper.compact .lbl{font-size:11px}
.web-wrap>svg{display:block;width:100%;max-width:520px;height:auto;margin:0 auto}
.family-notes{font-size:.92rem;color:var(--muted);margin-top:8px}
.family-notes b{color:var(--ink)}
.pill-now{display:inline-block;font:600 11px/1.6 system-ui,sans-serif;padding:0 8px;border-radius:999px;background:var(--blood);color:#fff;vertical-align:middle;letter-spacing:.03em}
`;

export const GUEST_CSS = `${BASE}
header.title{padding:28px 0 6px;text-align:center}
header.title .role{color:var(--gold);font-variant:small-caps;letter-spacing:.08em}
header.title .tag{font-style:italic;color:var(--muted);max-width:32em;margin:.6em auto 0}
nav.tabs{position:sticky;top:0;z-index:5;display:flex;gap:4px;justify-content:space-between;background:rgba(13,9,15,.92);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:8px 0;margin:0 -16px;padding-left:16px;padding-right:16px}
nav.tabs a{flex:1;text-align:center;text-decoration:none;color:var(--muted);font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.05rem;padding:6px 2px;border-radius:999px;position:relative}
nav.tabs a:hover,nav.tabs a:focus{color:var(--gold2)}
.badge{display:inline-block;min-width:1.3em;padding:0 .35em;border-radius:999px;background:var(--blood);color:#fff;font:600 .72rem/1.3em system-ui,sans-serif;margin-left:4px;vertical-align:middle}
.badge[hidden]{display:none}
section.panel{scroll-margin-top:60px}
details.secret{border:1px dashed var(--blood);border-radius:var(--radius);padding:10px 14px;background:rgba(143,38,54,.08)}
details.secret summary{cursor:pointer;color:#e7a0aa;font-weight:600}
.evening{list-style:none;padding:0;margin:0}
.evening li{display:grid;grid-template-columns:5.2em 1fr;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
.evening li:last-child{border-bottom:0}
.evening .t{color:var(--gold);font-variant-numeric:tabular-nums;font-size:.92rem;padding-top:2px}
.rel{list-style:none;padding:0}
.rel li{padding:6px 0;border-bottom:1px solid var(--line)}
.rel b{color:var(--gold2)}
.envelope{position:relative}
.envelope.sealed{text-align:center;color:var(--muted);padding:26px 16px}
.seal{width:54px;height:54px;border-radius:50%;margin:0 auto 10px;background:radial-gradient(circle at 35% 30%,#c44a5c,#7a1c2b 60%,#4d0f19);display:grid;place-items:center;color:#f3d3d8;font-size:1.4rem;box-shadow:0 4px 12px rgba(0,0,0,.5)}
.reveal{border-top:1px solid var(--line);margin-top:10px;padding-top:8px}
.reveal h4{margin:.2em 0 .3em;color:#e7a0aa;font-size:1.05rem}
.phone{background:#0b080c;border:1px solid var(--line);border-radius:22px;padding:12px}
.msg{margin:10px 0;max-width:92%}
.msg .from{font:600 .78rem/1.2 system-ui,sans-serif;color:var(--gold);margin:0 0 3px 8px}
.msg .bubble{background:#231a26;border:1px solid #3a2c40;border-radius:16px 16px 16px 4px;padding:8px 12px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:.95rem;line-height:1.4;white-space:pre-wrap}
.msg .when{font:.72rem system-ui,sans-serif;color:var(--muted);margin:3px 0 0 8px}
.msg.new .bubble{border-color:var(--gold);box-shadow:0 0 0 2px rgba(201,164,92,.25)}
.empty{color:var(--muted);text-align:center;padding:12px}
#toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(150%);transition:transform .35s,opacity .35s;opacity:0;visibility:hidden;pointer-events:none;background:#241a27;border:1px solid var(--gold);color:var(--ink);border-radius:16px;padding:10px 14px;max-width:min(92vw,420px);z-index:20;box-shadow:0 10px 30px rgba(0,0,0,.6);font-family:system-ui,sans-serif;font-size:.92rem}
#toast.show{transform:translateX(-50%) translateY(0);opacity:1;visibility:visible}
#banner{position:fixed;top:0;left:0;right:0;z-index:30;background:var(--blood);color:#fff;text-align:center;padding:12px 16px;font-family:system-ui,sans-serif}
#banner[hidden]{display:none}
#banner button{margin-left:10px}
.rules li{margin:.4em 0}
footer{color:var(--muted);text-align:center;font-size:.85rem;padding:30px 0 50px}
.login{min-height:100vh;display:grid;place-items:center;text-align:center}
.login .card{max-width:420px;width:100%;padding:26px 20px}
.login input{width:100%;text-align:center;margin:10px 0;font-size:18px}
.err{color:#ff9fac}
.preview-bar{background:#3b2a12;color:#f7dfa9;text-align:center;padding:8px;font-family:system-ui,sans-serif;font-size:.9rem}

header.title .crest{margin:8px auto 10px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));animation:candle 5s ease-in-out infinite}
header.title h1{font-size:2.4rem}
.login .raven{animation:candle 5s ease-in-out infinite;width:56px;height:56px}
.login h1{font-size:2.6rem;letter-spacing:.02em}
.login .card{border-color:rgba(201,164,92,.35)}
.login .card::before{border-color:rgba(201,164,92,.18)}
.seal{background:radial-gradient(circle at 35% 30%,#d0566a,#8a1f2d 55%,#4d0f19);border:2px solid rgba(0,0,0,.25);box-shadow:inset 0 0 0 3px rgba(255,255,255,.06),0 4px 12px rgba(0,0,0,.5)}
.now-card{display:block;text-decoration:none;color:var(--ink);background:linear-gradient(90deg,rgba(201,164,92,.16),rgba(201,164,92,.04));border:1px solid rgba(201,164,92,.5);border-radius:var(--radius);padding:12px 14px;margin:18px 0 6px;font-size:.98rem}
.now-card.live{background:linear-gradient(90deg,rgba(143,38,54,.35),rgba(143,38,54,.08));border-color:#b23a4b}
.envelope.current{border-color:var(--gold);box-shadow:0 0 0 1px rgba(201,164,92,.35),0 10px 30px rgba(0,0,0,.35)}
.card.mission{border-color:rgba(201,164,92,.6)}
nav.tabs svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;display:block;margin:0 auto 2px}
nav.tabs a{display:flex;flex-direction:column;align-items:center;font-size:.95rem}
nav.tabs a.on{color:var(--gold2)}
nav.tabs .badge{position:absolute;top:0;left:calc(50% + 6px)}
nav.tabs #sealed{background:#3a2a1a;color:var(--gold2);border:1px solid var(--gold)}
body.tabbed section.panel{display:none}
body.tabbed section.panel.active{display:block;animation:fade .25s ease}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (max-width:760px){
  body.tabbed{padding-bottom:84px}
  body.tabbed nav.tabs{position:fixed;top:auto;bottom:0;left:0;right:0;margin:0;padding:6px 8px calc(6px + env(safe-area-inset-bottom));border-top:1px solid var(--line);border-bottom:0;background:rgba(13,9,15,.97);z-index:10}
  body.tabbed #toast{bottom:92px}
}
.steps{list-style:none;padding:0;margin:8px 0}
.steps li{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);color:var(--muted)}
.steps li:last-child{border-bottom:0}
.steps .n{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;border:1.5px solid var(--line);font:600 13px system-ui,sans-serif}
.steps li b{color:var(--ink)}
.steps li p{margin:.15em 0 0;font-size:.95rem}
.steps li.done .n{border-color:var(--gold);color:var(--gold2)}
.steps li.now{color:var(--ink)}
.steps li.now .n{background:var(--blood);border-color:#e7a0aa;color:#fff}
.guest-list{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.guest-list li{display:flex;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 10px}
.guest-list li.me{border-color:var(--gold)}
.guest-list .pr{display:block;font-size:.88rem;color:var(--muted);line-height:1.3}
.guest-list .player{display:block;font:12px system-ui,sans-serif;color:#8f8070}
.rooms{list-style:none;padding:0;margin:10px 0 0}
.rooms .tonight{display:block;font:600 .8rem system-ui,sans-serif;color:var(--gold);margin-top:2px}
.rooms li{padding:6px 0;border-bottom:1px solid var(--line);font-size:.95rem;scroll-margin-top:70px}
.rooms li:target{background:rgba(201,164,92,.12)}
.rooms b{color:var(--gold2);margin-right:4px}
.bills{display:flex;gap:8px;justify-content:center;margin:4px 0 12px}
.bills span{font:700 1.05rem 'Cormorant Garamond',serif;color:#2b2016;background:repeating-linear-gradient(45deg,#efe2c0,#efe2c0 6px,#e2d1a8 6px,#e2d1a8 7px);border:2px solid #8a7350;border-radius:6px;padding:10px 12px;transform:rotate(-3deg);box-shadow:0 4px 10px rgba(0,0,0,.4)}
.bills span:nth-child(2){transform:rotate(2deg)}
.bills span:nth-child(3){transform:rotate(-1deg)}
.flow{display:flex;list-style:none;padding:0;gap:6px;flex-wrap:wrap;margin:0 0 8px}
.flow li{flex:1;min-width:120px;background:rgba(201,164,92,.08);border:1px solid var(--line);border-radius:10px;padding:8px;text-align:center;font-size:.95rem}
.flow li b{display:block;color:var(--gold2)}
`;

export const HOST_CSS = `${BASE}
body{font-size:16px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif}
.wrap{max-width:1100px}
nav.host{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;padding:8px 16px;border-bottom:1px solid var(--line);background:rgba(13,9,15,.96);position:sticky;top:0;z-index:5}
nav.host a{color:var(--muted);text-decoration:none;padding:3px 9px;border-radius:999px;font-size:.88rem;white-space:nowrap}
nav.host a.on,nav.host a:hover{color:var(--ink);background:var(--panel2)}
nav.host a.on{box-shadow:inset 0 0 0 1px var(--gold)}
nav.host .brand{font:700 1.15rem 'Cormorant Garamond',Georgia,serif;color:var(--gold2);padding-left:0;letter-spacing:.04em}
nav.host{box-shadow:0 1px 0 rgba(201,164,92,.15),0 8px 24px rgba(0,0,0,.35)}
nav.host .grp{display:flex;align-items:center;gap:2px;border-left:1px solid var(--line);padding-left:10px}
nav.host .grp-label{font-size:.66rem;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-right:4px}
nav.host .spacer{flex:1}
nav.host .live-pill{font-size:.82rem;color:var(--muted)}
nav.host .live-pill b{color:var(--gold2)}
@media (max-width:760px){nav.host{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}nav.host::-webkit-scrollbar{display:none}nav.host .grp{flex:none}nav.host .spacer{display:none}nav.host form{flex:none}}
.if-block{border:1px dashed #5d7f9b;border-radius:8px;padding:2px 10px;margin:8px 0;background:rgba(93,127,155,.08)}
.if-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#a9c8e2;margin:.4em 0 0}
.envelope-host p{margin:.4em 0}
h2[id],.card[id],section[id]{scroll-margin-top:96px}
.page-info{color:var(--muted);margin:-.3em 0 1em;font-style:italic}
.h-card{margin-top:0}
.hero .stepper{margin-bottom:10px}
.big-num{font:700 2.4rem/1 'Cormorant Garamond',Georgia,serif;color:var(--gold2);margin:.1em 0}
.big-num span{font:400 .95rem system-ui,sans-serif;color:var(--muted)}
.now-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin:12px 0}
.checklist{list-style:none;padding:0;margin:.4em 0}
.checklist li{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px dashed var(--line)}
.checklist li:last-child{border-bottom:0}
.checklist .crest{flex:none}
.pin-dot{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font:700 .72rem system-ui,sans-serif;color:#fff;border:2px solid #0d090f}
.pin-dot.r1{background:#7fa7d8}.pin-dot.r2{background:#c9a45c}.pin-dot.r3{background:#d0607a}
.mini-toc{margin:.3em 0;padding-left:1.3em;font-size:.9rem}
.face-row{display:flex;flex-wrap:wrap;gap:3px;margin:8px 0}
.face-row a{line-height:0}
.heatmap{border-collapse:separate;border-spacing:3px;min-width:640px}
.heatmap th{font-size:.75rem}
.heatmap th.now{color:#fff;background:var(--panel2);border-radius:6px}
.heatmap .who{display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font:600 1rem 'Cormorant Garamond',Georgia,serif;color:var(--ink);white-space:nowrap;border:0}
.heatmap td.heat{border:0;border-radius:6px;padding:6px 8px;width:22%;font-size:.78rem;color:#efe5d3;vertical-align:top}
.heatmap td.heat b{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;opacity:.9}
.heatmap td.heat span{opacity:.82}
.heatmap td.now{outline:2px solid var(--gold2);outline-offset:-1px}
.aims{font-size:.88rem;color:var(--muted)}
.aims li.now{color:var(--ink)}
.script-layout{display:grid;grid-template-columns:240px 1fr;gap:20px;align-items:start}
.toc{position:sticky;top:64px;max-height:calc(100vh - 80px);overflow:auto;font-size:.85rem;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 12px}
.toc ol{padding-left:1.1em;margin:.2em 0 .6em}
.toc a{color:var(--muted);text-decoration:none}
.toc a:hover{color:var(--ink)}
.toc-round{color:var(--gold);text-transform:uppercase;letter-spacing:.1em;font-size:.7rem;margin:.6em 0 .2em}
@media (max-width:860px){.script-layout{grid-template-columns:1fr}.toc{position:static;max-height:none}}
.seg{scroll-margin-top:70px}
.seg-head{display:flex;align-items:baseline;gap:10px}
.seg-head h2{margin:.2em 0}
.seg-num{color:var(--gold);font:600 .8rem system-ui,sans-serif}
.seg-nav{display:flex;justify-content:space-between;gap:10px;border-top:1px dashed var(--line);padding-top:6px;margin-top:10px}
.seg-nav a{color:var(--muted)}
.filter-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 14px}
.filter-bar input[type=search]{flex:1;min-width:220px}
.kind-toggle{font-size:.88rem;display:inline-flex;gap:5px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:3px 10px}
.char-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.char-card{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--line);border-radius:12px;padding:10px 12px}
.char-card.t-core{border-left-color:var(--blood)}
.char-card.t-supporting{border-left-color:var(--gold)}
.char-card.t-flex{border-left-color:#5d7f9b}
.char-card p{margin:.4em 0}
.cc-head{display:flex;gap:10px;align-items:center;text-decoration:none;color:var(--ink)}
.cc-head b{display:block;font:700 1.1rem 'Cormorant Garamond',Georgia,serif}
.cc-links a{color:var(--muted)}
.dossier-head{display:flex;gap:14px;align-items:center;margin-bottom:10px}
.dossier-head p{margin:.2em 0}
.map-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.map-controls input[type=range]{flex:1;min-width:200px;accent-color:var(--gold)}
.m-clock{font:700 1.4rem 'Cormorant Garamond',Georgia,serif;color:var(--gold2);min-width:90px}
.m-events{flex-basis:100%;color:var(--muted);min-height:2.6em}
.pin-list{list-style:none;padding:0}
.ready-list .tick{flex:none;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--line);font:700 .75rem system-ui,sans-serif;color:var(--muted)}
.ready-list li.ok .tick{border-color:var(--ok);color:#a7d3a2}
.ready-list li.todo .tick{border-color:var(--warn);color:#f0cf8a}
.ready-list li.ok a{color:var(--muted)}
.now-step{border-color:var(--gold);box-shadow:0 0 0 1px rgba(201,164,92,.25),0 10px 30px rgba(0,0,0,.35)}
.now-step h2{font-size:1.6rem}
.ns-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ns-top a{margin-left:auto}
.ns-body{max-height:340px;overflow:auto;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);margin:10px 0;padding:6px 2px}
.ns-nav{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.ns-nav form{display:inline}
.unlock{margin:8px 0}
.lights-box{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:8px 12px;margin:8px 0;background:rgba(201,164,92,.06)}
.lights-box.fire{border-color:var(--gold);background:rgba(201,164,92,.13)}
.lb-icon{font-size:1.3rem;line-height:1}
.sched{list-style:none;padding:0;margin:.3em 0}
.sched li{display:grid;grid-template-columns:78px 1fr;gap:8px;padding:5px 6px;border-bottom:1px dashed var(--line);font-size:.92rem}
.sched li.on{background:rgba(201,164,92,.12);border-radius:6px}
.lights-table{display:grid;gap:8px}
.lt-row{display:grid;grid-template-columns:220px 1fr;gap:14px;margin:0}
.lt-row p{margin:.2em 0}
.lt-steps{margin:.3em 0;padding-left:1.3em}
@media (max-width:700px){.lt-row{grid-template-columns:1fr}}
.room-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.room-card.rc-study{border-color:#7a2a36}
.pin-list li{display:flex;gap:8px;align-items:flex-start;margin:6px 0}
.web-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;align-items:start}
.web-panel{position:sticky;top:64px;max-height:calc(100vh - 80px);overflow:auto}
@media (max-width:900px){.web-layout{grid-template-columns:1fr}.web-panel{position:static;max-height:none}}
#webgraph.hide-romance .k-romance,#webgraph.hide-money .k-money,#webgraph.hide-family .k-family,#webgraph.hide-rivalry .k-rivalry,#webgraph.hide-ties .k-ties,#webgraph.hide-arthur .to-arthur{display:none}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th,td{text-align:left;vertical-align:top;padding:7px 8px;border-bottom:1px solid var(--line)}
th{color:var(--gold);font-weight:600;font-size:.82rem;text-transform:uppercase;letter-spacing:.05em}
tr.off td{opacity:.5}
.pill{display:inline-block;border-radius:999px;padding:1px 8px;font-size:.78rem;border:1px solid var(--line);white-space:nowrap}
.pill.core{border-color:var(--blood);color:#f0a5b0}
.pill.supporting{border-color:var(--gold);color:var(--gold2)}
.pill.flex{border-color:#5d7f9b;color:#a9c8e2}
.pill.ok{border-color:var(--ok);color:#a7d3a2}
.pill.warn{border-color:var(--warn);color:#f0cf8a}
.pill.err,.pill.error{border-color:var(--err);color:#ff9fac}
.pill.info{border-color:#5d7f9b;color:#a9c8e2}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.rounds{display:flex;flex-wrap:wrap;gap:8px}
.rounds form{display:inline}
.rounds .btn.on{background:var(--gold);color:#1b1208;border-color:var(--gold2)}
.seg{border-left:3px solid var(--line);padding-left:12px;margin:18px 0}
.seg.kind-cue{border-left-color:var(--gold)}
.seg.kind-rescue{border-left-color:#5d7f9b}
.seg.kind-evidence{border-left-color:var(--blood)}
.seg .meta{font-size:.8rem;color:var(--muted)}
.seg p{margin:.35em 0}
.inline-form{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.88rem}
.pass{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--gold2)}
.flash{background:#1f2a1d;border:1px solid var(--ok);border-radius:10px;padding:8px 12px;margin:10px 0}
.flash.bad{background:#2a1d20;border-color:var(--err)}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px}
`;

export const PRINT_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#111;font:12pt/1.45 'EB Garamond',Georgia,serif}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;margin:.2em 0}
.noprint{padding:10px;background:#f4efe6;border-bottom:1px solid #ccc;font-family:system-ui,sans-serif;font-size:14px}
.page{page-break-after:always;break-after:page;padding:14mm 14mm}
.page:last-child{page-break-after:auto}
.env-head{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:4px;margin-bottom:8px;font-family:'Cormorant Garamond',serif}
.env-head .r{font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.reveal{border:1.5px solid #111;padding:6px 10px;margin-top:10px}
blockquote{margin:.6em 0;padding:.3em .8em;border-left:3px solid #111;font-style:italic}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.cardp{border:1.5px solid #111;border-radius:4mm;padding:6mm;min-height:60mm;break-inside:avoid;position:relative}
.stamp{font-family:'Cormorant Garamond',serif;font-weight:700;letter-spacing:.2em;border:2px solid #7a1c2b;color:#7a1c2b;display:inline-block;padding:1mm 3mm;transform:rotate(-3deg);margin-bottom:3mm}
.bill{border:2px solid #222;border-radius:3mm;height:62mm;padding:5mm;display:flex;flex-direction:column;justify-content:space-between;background:repeating-linear-gradient(45deg,#fbf8f1,#fbf8f1 6px,#f1eadb 6px,#f1eadb 7px);break-inside:avoid}
.bill .amt{font:700 26pt 'Cormorant Garamond',serif}
.bill .mid{text-align:center;font:600 13pt 'Cormorant Garamond',serif;letter-spacing:.15em}
.ballot{border:1.5px dashed #111;padding:6mm;min-height:120mm;break-inside:avoid}
.ballot .line{border-bottom:1px solid #999;height:12mm}
.pre{white-space:pre-wrap}
.badges{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.badge{border:1.5px solid #111;border-radius:3mm;height:56mm;padding:5mm;display:flex;flex-direction:column;justify-content:center;text-align:center;break-inside:avoid;background:repeating-linear-gradient(45deg,#fbf8f1,#fbf8f1 6px,#f4eee2 6px,#f4eee2 7px)}
.badge .stamp{font-size:7pt;align-self:center}
.b-name{font:700 22pt 'Cormorant Garamond',serif;line-height:1.05}
.b-role{font:italic 11pt 'Cormorant Garamond',serif;margin-top:2mm}
.certificate{border:3px double #7a1c2b;margin:10mm;min-height:230mm}
.cert-line{width:120mm;border-bottom:1.5px solid #111;height:16mm;margin:6mm auto}
.cert-foot{font:italic 11pt 'Cormorant Garamond',serif;margin-top:16mm}
.sign{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:250mm}
.sign h1{font-size:64pt;letter-spacing:.06em;margin:.2em 0}
.sign-sub{font:italic 18pt 'Cormorant Garamond',serif;margin:0}
.sign-line{max-width:150mm;font-size:14pt;margin-top:12mm}
@page{size:letter;margin:0}
@media print{.noprint{display:none}}
`;
