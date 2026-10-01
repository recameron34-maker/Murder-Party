export const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap';

const BASE = `
:root{--bg:#0d090f;--panel:#161017;--panel2:#1e1620;--ink:#efe5d3;--muted:#ad9f8b;--gold:#c9a45c;--gold2:#e3c788;--blood:#8f2636;--line:#33263a;--ok:#6e9b6a;--warn:#c99a3c;--err:#c0495a;--radius:14px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg) radial-gradient(ellipse 120% 60% at 50% -10%,#2a1a2c 0%,#130d15 45%,#0d090f 100%) fixed;color:var(--ink);font:18px/1.55 'EB Garamond',Georgia,'Times New Roman',serif}
a{color:var(--gold2)}
h1,h2,h3,h4{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;letter-spacing:.01em;line-height:1.15;margin:1.2em 0 .45em}
h1{font-size:2.1rem;margin:.2em 0}
h2{font-size:1.55rem;color:var(--gold2)}
h3{font-size:1.25rem}
p{margin:.55em 0}
blockquote{margin:.8em 0;padding:.6em 1em;border-left:3px solid var(--gold);background:rgba(201,164,92,.08);border-radius:0 8px 8px 0;font-style:italic}
code{font-size:.9em}
.wrap{max-width:720px;margin:0 auto;padding:16px}
.muted{color:var(--muted)}
.small{font-size:.86rem}
.card{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;margin:14px 0;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.btn{display:inline-block;font:inherit;font-size:1rem;background:var(--blood);color:#fff;border:1px solid #b23a4b;border-radius:999px;padding:.55em 1.2em;cursor:pointer;text-decoration:none}
.btn.ghost{background:transparent;color:var(--gold2);border-color:var(--gold)}
.btn.small{font-size:.85rem;padding:.35em .9em}
input,select,textarea{font:inherit;font-size:16px;background:#0f0a11;color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:.5em .7em;max-width:100%}
textarea{width:100%;min-height:8em;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}
ul{padding-left:1.2em}
li{margin:.25em 0}
.raven{font-size:1.6rem;line-height:1}
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
`;

export const HOST_CSS = `${BASE}
body{font-size:16px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif}
.wrap{max-width:1100px}
nav.host{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;border-bottom:1px solid var(--line);background:rgba(13,9,15,.95);position:sticky;top:0;z-index:5}
nav.host a{color:var(--muted);text-decoration:none;padding:4px 10px;border-radius:999px;font-size:.9rem}
nav.host a.on,nav.host a:hover{color:var(--ink);background:var(--panel2)}
nav.host .spacer{flex:1}
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
@page{size:letter;margin:0}
@media print{.noprint{display:none}}
`;
