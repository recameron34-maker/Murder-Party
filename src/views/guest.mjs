// Guest-facing pages. A guest page contains ONLY the logged-in character's
// content, only for rounds already unlocked, and only texts already
// delivered. Every character's page has exactly the same sections.
import { html, raw } from '../lib/html.mjs';
import { md, mdInline, applyConditionals } from '../lib/markdown.mjs';
import { deliveredTexts } from '../lib/texts.mjs';
import { formatTimeIn } from '../lib/time.mjs';
import { rosterHelpers } from '../lib/roster.mjs';
import { page, RAVEN_SVG } from './layout.mjs';
import { crest, roundStepper, eveningStrip, yourWeb, manorMap, familyTree } from './visuals.mjs';
import { GUEST_CSS } from './styles.mjs';

const ROUND_WORDS = { 1: 'One', 2: 'Two', 3: 'Three' };

export function loginPage({ prefill = '', error = '' } = {}) {
  const body = html`<main class="wrap login"><div>
  ${raw(RAVEN_SVG)}
  <h1>Blackwood Manor</h1>
  <p class="muted"><i>The Midnight Supper</i></p>
  <form class="card" method="post" action="/login" autocomplete="off">
    <p>Speak your passphrase, and the house will remember you.</p>
    ${error ? html`<p class="err">${error}</p>` : ''}
    <input name="passphrase" value="${prefill}" placeholder="three-secret-words" autocapitalize="none" autocorrect="off" spellcheck="false" required aria-label="Passphrase">
    <button class="btn" type="submit">Enter</button>
  </form>
  <p class="small muted">No passphrase? Ask your host. Never share yours.</p>
</div></main>`;
  return page({ css: GUEST_CSS, body });
}

function textWhen(t, tz) {
  if (t.stamp) return t.stamp;
  if (!t.at) return '';
  return formatTimeIn(new Date(t.at), tz);
}

function renderText(t, tz) {
  return html`<div class="msg" data-id="${t.id}">
  <div class="from">${t.from}</div>
  <div class="bubble">${t.body}</div>
  <div class="when">${t.at && !t.stamp ? html`<time datetime="${t.at}">${textWhen(t, tz)}</time>` : textWhen(t, tz)}</div>
</div>`;
}

const ICONS = {
  you: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7"/></svg>',
  envelopes: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></svg>',
  manor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/><path d="M12 3v-1"/></svg>',
};

function nowCard(live) {
  if (live === 0) return html`<div class="now-card"><b>The Supper hasn't started.</b> Read your character, plan your costume, and check your phone. Envelopes arrive once the lights go out.</div>`;
  return html`<a class="now-card live" href="#envelopes"><b>Round ${ROUND_WORDS[live]} is open.</b> Read your envelope and make sure your reveals come out before the round ends. →</a>`;
}

export function guestPage(content, state, charId, { round, preview = false, now = new Date() } = {}) {
  const c = content.characters[charId];
  const gc = content.guestCommon;
  const { isLive, liveIds, roster } = rosterHelpers(content, state);
  const live = round ?? state.liveRound ?? 0;
  const tz = content.party.timezone || 'UTC';
  const M = (text) => raw(md(text, isLive));
  const I = (text) => raw(mdInline(applyConditionals(text, isLive)));
  const name = (id) => content.names[id] || id;
  const texts = deliveredTexts(content, { ...state, liveRound: live }, charId, now);
  const rels = (c.relationships || []).filter((r) => !r.if || isLive(r.if));
  const opened = [1, 2, 3].filter((n) => n <= live).length;

  const envelopes = [1, 2, 3].map((n) => {
    if (n > live) {
      return html`<article class="card envelope sealed">
  <div class="seal">✦</div>
  <h3>Round ${ROUND_WORDS[n]}</h3>
  <p>Sealed. Reggie will break the seal when the time comes.</p>
</article>`;
    }
    const r = c.rounds[n];
    return html`<article class="card envelope${n === live ? ' current' : ''}">
  <h3>Round ${ROUND_WORDS[n]}${n === live ? html` <span class="pill-now">now</span>` : ''}</h3>
  ${M(r.text)}
  <div class="reveal"><h4>You must reveal this round</h4><ul>${r.reveal.map((x) => html`<li>${I(x)}</li>`)}</ul></div>
</article>`;
  });

  const guestList = liveIds.map((id) => html`<li class="${id === charId ? 'me' : ''}">${crest(id, content.characters[id].name, 44)}<div><b>${content.characters[id].name}</b>${id === charId ? html` <span class="pill-now">you</span>` : ''}<span class="pr">${content.characters[id].public_role}</span>${roster[id]?.player ? html`<span class="player">played by ${roster[id].player}</span>` : ''}</div></li>`);
  const roomList = Object.entries(gc.rooms || {}).map(([id, text]) => html`<li id="room-${id}"><b>${content.lore.rooms[id]?.name || id}</b> ${text}</li>`);

  const body = html`
${preview ? html`<div class="preview-bar">Host preview of ${c.name} at Round ${live}. <a href="/host/characters/${charId}">Back to host</a></div>` : ''}
<div id="banner" hidden>A new envelope has been unsealed. <button class="btn small ghost" type="button" onclick="location.hash='#envelopes';location.reload()">Open it</button></div>
<main class="wrap guest">
<header class="title">
  ${crest(charId, c.name, 76)}
  <div class="role">${c.role}</div>
  <h1>${c.name}</h1>
  <p class="tag">${c.tagline}</p>
  ${roundStepper(live, { compact: true })}
</header>
<nav class="tabs" aria-label="Sections">
  <a href="#character">${raw(ICONS.you)}<span>You</span></a>
  <a href="#envelopes">${raw(ICONS.envelopes)}<span>Envelopes</span><span class="badge" id="sealed">${opened}/3</span></a>
  <a href="#phone">${raw(ICONS.phone)}<span>Phone</span><span class="badge" id="unread" hidden>0</span></a>
  <a href="#manor">${raw(ICONS.manor)}<span>Manor</span></a>
</nav>

<section class="panel" id="character">
  ${nowCard(live)}
  <h2>Who you are</h2>
  <div class="card">${M(c.intro)}</div>
  <h3>Your costume</h3>
  <div class="card">${M(c.costume)}</div>
  <h3>Your story</h3>
  <div class="card">${M(c.backstory)}</div>
  <h3>Your connections</h3>
  <div class="card">${yourWeb(c, rels, content.names)}<ul class="rel">${rels.map((r) => html`<li><b>${name(r.with)}</b>: ${I(r.text)}</li>`)}</ul></div>
  <h3>Your evening</h3>
  <div class="card">${eveningStrip(c)}<ul class="evening">${c.evening.map((e) => html`<li><span class="t">${e.at}${e.until ? html`<br>– ${e.until}` : ''}</span><span>${I(e.text)}</span></li>`)}</ul></div>
  <h3>What you know</h3>
  <div class="card"><ul>${c.knows.map((k) => html`<li>${I(k)}</li>`)}</ul></div>
  <h3>Your secret</h3>
  <details class="secret"><summary>Tap to reveal (check no one's looking)</summary>${M(c.secret)}</details>
  <h3>If someone pays you</h3>
  <div class="card"><p class="small muted">Accept $1,000 and you must answer a question about these truthfully.</p><ul>${c.blackmail.map((b) => html`<li>${I(b)}</li>`)}</ul></div>
  <h3>Private instructions</h3>
  <div class="card"><ul>${c.instructions.map((x) => html`<li>${I(x)}</li>`)}</ul></div>
  <h3>Secret mission <span class="small muted">· $1,000 from Reggie</span></h3>
  ${live >= 1 ? html`<div class="card mission">${M(c.mission)}</div>` : html`<div class="card envelope sealed"><div class="seal">✦</div><p>Your mission arrives with Round One.</p></div>`}
</section>

<section class="panel" id="envelopes">
  <h2>Envelopes</h2>
  <p class="small muted">${opened} of 3 unsealed. New envelopes appear here the moment Reggie opens a round.</p>
  ${envelopes}
</section>

<section class="panel" id="phone">
  <h2>Phone</h2>
  <p class="small muted">Texts arrive here during the night. Keep this page open; your phone will buzz.
  <button class="btn small ghost" type="button" id="alerts" hidden>Turn on alerts</button></p>
  <div class="phone" id="thread" data-known="${texts.map((t) => t.id).join(',')}" data-round="${live}" data-tz="${tz}">
    ${texts.length ? texts.map((t) => renderText(t, tz)) : html`<div class="empty" id="empty">No messages yet.</div>`}
  </div>
</section>

<section class="panel" id="manor">
  <h2>The Manor</h2>
  <div class="card">${M(gc.welcome)}</div>
  <h3>How tonight works</h3>
  <ol class="steps">${(gc.tonight_steps || []).map((st, i) => html`<li class="${st.round < live ? 'done' : st.round === live ? 'now' : ''}"><span class="n">${i + 1}</span><div><b>${st.title}</b><p>${st.text}</p></div></li>`)}</ol>
  <h3>The guest list</h3>
  <ul class="guest-list">${guestList}</ul>
  <h3>The house</h3>
  <div class="card">${M(gc.house)}${manorMap({ mode: 'guest', linkRooms: true })}<ul class="rooms">${roomList}</ul></div>
  <h3>The Blackwoods</h3>
  <div class="card">${familyTree(gc.family_tree || [])}</div>
  <h3>The legend</h3>
  <div class="card">${M(gc.legend)}</div>
  <h3>Rules of the Supper</h3>
  <div class="card"><ol class="rules">${gc.supper_rules.map((r) => html`<li>${I(r)}</li>`)}</ol></div>
  <h3>Blackmail Cash</h3>
  <div class="card"><div class="bills" aria-hidden="true"><span>$1,000</span><span>$1,000</span><span>$1,000</span></div>
  <ol class="flow"><li><b>Offer</b> $1,000</li><li><b>Ask</b> one question</li><li><b>If they take it</b>, the truth is owed</li></ol>
  ${M(gc.blackmail_rules)}</div>
  <h3>How to play</h3>
  <div class="card">${M(gc.how_to_play)}</div>
</section>

<footer>
  ${preview ? '' : html`<form method="post" action="/logout"><button class="btn ghost small" type="submit">Leave the manor (log out)</button></form>`}
  <p>${raw(RAVEN_SVG)}<br>Blackwood Manor</p>
</footer>
</main>
<div id="toast" role="status" aria-live="polite"></div>`;

  return page({ css: GUEST_CSS, body, script: preview ? '' : GUEST_JS });
}

// Identical for every guest; contains no character data.
const GUEST_JS = `
(function(){
  var panels=[].slice.call(document.querySelectorAll('section.panel'));
  var tabs=[].slice.call(document.querySelectorAll('nav.tabs a'));
  var ids=panels.map(function(p){return p.id});
  document.body.classList.add('tabbed');
  function show(id,scroll){
    if(ids.indexOf(id)<0) id='character';
    panels.forEach(function(p){p.classList.toggle('active',p.id===id)});
    tabs.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+id)});
    if(id==='phone'){unread=0;bump(0)}
    if(scroll!==false) window.scrollTo(0,0);
  }
  tabs.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var id=a.getAttribute('href').slice(1);history.replaceState(null,'','#'+id);show(id)})});
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.closest('nav.tabs'))return;var id=a.getAttribute('href').slice(1);if(ids.indexOf(id)>=0){e.preventDefault();history.replaceState(null,'','#'+id);show(id)}});
  window.addEventListener('hashchange',function(){var id=location.hash.slice(1);if(ids.indexOf(id)>=0)show(id)});
  var thread=document.getElementById('thread');
  var known=new Set((thread.dataset.known||'').split(',').filter(Boolean));
  var round=Number(thread.dataset.round||0);
  var unread=0, badge=document.getElementById('unread'), toast=document.getElementById('toast');
  function fmt(iso){try{return new Date(iso).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}catch(e){return ''}}
  Array.prototype.forEach.call(document.querySelectorAll('time[datetime]'),function(t){t.textContent=fmt(t.getAttribute('datetime'))});
  function add(t){
    var empty=document.getElementById('empty'); if(empty) empty.remove();
    var d=document.createElement('div'); d.className='msg new';
    var f=document.createElement('div'); f.className='from'; f.textContent=t.from;
    var b=document.createElement('div'); b.className='bubble'; b.textContent=t.body;
    var w=document.createElement('div'); w.className='when'; w.textContent=t.stamp||fmt(t.at);
    d.appendChild(f); d.appendChild(b); d.appendChild(w); thread.appendChild(d);
  }
  function showToast(msg){toast.textContent=msg; toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show')},6000)}
  function bump(n){unread+=n; badge.textContent=unread; badge.hidden=!unread; document.title=unread?'('+unread+') Blackwood Manor':'Blackwood Manor'}
  function alertNew(list){
    var t=list[list.length-1];
    showToast('💬 '+t.from+': '+(t.body.length>90?t.body.slice(0,90)+'…':t.body));
    if(location.hash!=='#phone') bump(list.length);
    try{navigator.vibrate&&navigator.vibrate([90,60,90])}catch(e){}
    try{if(window.Notification&&Notification.permission==='granted'&&document.hidden){new Notification(t.from,{body:t.body})}}catch(e){}
  }
  show(location.hash.slice(1)||'character',false);
  async function poll(){
    try{
      var r=await fetch('/api/updates',{cache:'no-store',credentials:'same-origin'});
      if(r.status===401){location.reload();return}
      if(!r.ok) return;
      var d=await r.json();
      if(d.round!==round){document.getElementById('banner').hidden=false; try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}}
      var fresh=d.texts.filter(function(t){return !known.has(t.id)});
      if(fresh.length){fresh.forEach(function(t){known.add(t.id); add(t)}); alertNew(fresh)}
    }catch(e){}
  }
  setInterval(poll,15000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)poll()});
  var ab=document.getElementById('alerts');
  if(window.Notification&&Notification.permission==='default'){ab.hidden=false; ab.onclick=function(){Notification.requestPermission().then(function(){ab.hidden=true})}}
})();`;
