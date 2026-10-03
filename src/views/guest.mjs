// Guest-facing pages. A guest page contains ONLY the logged-in character's
// content, only for rounds already unlocked, and only texts already
// delivered. Every character's page has exactly the same sections.
import { html, raw } from '../lib/html.mjs';
import { md, mdInline, applyConditionals } from '../lib/markdown.mjs';
import { deliveredTexts, guestState, phonesOn } from '../lib/texts.mjs';
import { formatTimeIn } from '../lib/time.mjs';
import { rosterHelpers } from '../lib/roster.mjs';
import { page, RAVEN_SVG } from './layout.mjs';
import { sketch } from './sketches.mjs';
import { prop } from './props.mjs';
import { crest, roundStepper, eveningStrip, yourWeb, venueMap, venueWhere, familyTree } from './visuals.mjs';
import { GUEST_CSS } from './styles.mjs';

const ROUND_WORDS = { 1: 'One', 2: 'Two', 3: 'Three' };

export function loginPage({ prefill = '', error = '' } = {}) {
  const body = html`<main class="wrap login"><div>
  ${raw(RAVEN_SVG)}
  <div class="house-line">You are expected</div>
  <h1>Cameron Castle</h1>
  <p class="muted"><i>The Midnight Supper</i></p>
  <div class="flourish">✦</div>
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

function nowCard(live, paper) {
  if (paper) return html`<div class="now-card"><b>Read everything here before the party.</b> On the night, phones stay away: your envelopes come on paper, one per round, from Roderick.</div>`;
  if (live === 0) return html`<div class="now-card"><b>The Supper hasn't started.</b> Read your character, plan your costume, and check your phone. Envelopes arrive once the lights go out.</div>`;
  return html`<a class="now-card live" href="#envelopes"><b>Round ${ROUND_WORDS[live]} is open.</b> Read your envelope and make sure your reveals come out before the round ends. →</a>`;
}

// "Saturday, October 31" from YYYY-MM-DD, or '' if the date isn't set.
function partyDay(date) {
  if (!date) return '';
  try {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return '';
  }
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// A guest's dossier. Only this character's content, only rounds already
// open, only texts already delivered; everyone else appears by public role
// and public sketch. Every character's page has exactly the same sections.
// standalone: a self-contained file to send before the party (no login,
// no live updates, no links back to the server).
export function guestPage(content, state, charId, { round, preview = false, standalone = false, now = new Date() } = {}) {
  const c = content.characters[charId];
  const gc = content.guestCommon;
  const { isLive, liveIds, roster } = rosterHelpers(content, state);
  // Paper night: a guest's own page never opens a round or shows an
  // in-party text. (The host's preview still can, to read envelopes.)
  const paper = !phonesOn(content);
  const seen = preview ? state : guestState(content, state);
  const live = preview ? round ?? state.liveRound ?? 0 : seen.liveRound ?? 0;
  const tz = content.party.timezone || 'UTC';
  const M = (text) => raw(md(text, isLive));
  const I = (text) => raw(mdInline(applyConditionals(text, isLive)));
  const name = (id) => content.names[id] || id;
  const texts = deliveredTexts(content, { ...seen, liveRound: live }, charId, now);
  const rels = (c.relationships || []).filter((r) => !r.if || isLive(r.if));
  const opened = [1, 2, 3].filter((n) => n <= live).length;
  const night = gc.the_night || {};
  const day = partyDay(state.partyDate || content.party.date);
  const player = roster[charId]?.player;
  const face = (id, size, ghost = true) => (content.characters[id] ? sketch(id, content.characters[id].name, content.portraits?.[id], { size, ghost }) : crest(id, name(id), Math.round(size * 0.8)));

  const envelopes = [1, 2, 3].map((n) => {
    if (n > live) {
      return html`<article class="card envelope sealed">
  <div class="env-flap" aria-hidden="true"></div>
  <div class="seal">✦</div>
  <h3>Round ${ROUND_WORDS[n]}</h3>
  <p>${paper ? 'On paper, on the night. Roderick hands it to you.' : 'Sealed. Roderick will break the seal when the time comes.'}</p>
</article>`;
    }
    const r = c.rounds[n];
    return html`<article class="card envelope${n === live ? ' current' : ''}">
  <h3>Round ${ROUND_WORDS[n]}${n === live ? html` <span class="pill-now">now</span>` : ''}</h3>
  ${M(r.text)}
  <div class="reveal"><h4>You must reveal this round</h4><ul>${r.reveal.map((x) => html`<li>${I(x)}</li>`)}</ul></div>
</article>`;
  });

  const guestList = liveIds.map((id) => html`<li class="${id === charId ? 'me' : ''}"><span class="g-sketch">${face(id, 132, false)}</span><span class="g-who"><b>${content.characters[id].name}</b>${id === charId ? html` <span class="pill-now">you</span>` : ''}<span class="pr">${content.characters[id].public_role}</span>${roster[id]?.player ? html`<span class="player">played by ${roster[id].player}</span>` : ''}</span></li>`);
  const roomList = Object.entries(gc.rooms || {}).map(([id, text]) => {
    const where = id === 'east-wing' ? 'every room marked shut' : venueWhere(content.venue, id);
    return html`<li id="room-${id}"><b>${content.lore.rooms[id]?.name || id}</b> ${text}${where ? html` <span class="tonight">Tonight: ${where}.</span>` : ''}</li>`;
  });

  const body = html`
${preview ? html`<div class="preview-bar">Host preview of ${c.name} at Round ${live}. <a href="/host/characters/${charId}">Back to host</a></div>` : ''}
<div id="banner" hidden>A new envelope has been unsealed. <button class="btn small ghost" type="button" onclick="location.hash='#envelopes';location.reload()">Open it</button></div>
<main class="wrap guest">
<header class="title cover">
  <div class="house-line">Cameron Castle · The Midnight Supper</div>
  <div class="invite">
    <div class="inv-raven" aria-hidden="true">${prop('raven', { size: 64 })}</div>
    <p class="inv-from">Mr. Douglas Cameron<br>requests the pleasure of your company at</p>
    <p class="inv-event">The Midnight Supper</p>
    <p class="inv-when">Cameron Castle${day ? ` · ${day}` : ''} · doors at ${night.doors || '7:30 PM'}</p>
    <p class="inv-motto">At midnight, everything changes.</p>
  </div>
  <div class="dossier">
    <figure class="sketch-frame">${face(charId, 210)}</figure>
    <div class="who">
      <p class="as">${player ? `${player}, you will attend as` : 'You will attend as'}</p>
      <h1>${c.name}</h1>
      <div class="role">${c.role}</div>
      <p class="tag">${c.tagline}</p>
    </div>
  </div>
  ${roundStepper(live, { compact: true })}
</header>
<nav class="tabs" aria-label="Sections">
  <a href="#character">${raw(ICONS.you)}<span>You</span></a>
  <a href="#envelopes">${raw(ICONS.envelopes)}<span>${paper ? 'The night' : 'Envelopes'}</span><span class="badge" id="sealed"${paper ? ' hidden' : ''}>${opened}/3</span></a>
  <a href="#phone">${raw(ICONS.phone)}<span>${paper ? 'Messages' : 'Phone'}</span><span class="badge" id="unread" hidden>0</span></a>
  <a href="#manor">${raw(ICONS.manor)}<span>Castle</span></a>
</nav>

<section class="panel" id="character">
  ${nowCard(live, paper && live === 0)}
  <h2>Who you are</h2>
  <div class="card lede">${M(c.intro)}</div>
  <h3>Your costume</h3>
  <div class="card costume"><div class="hanger" aria-hidden="true">${raw(HANGER)}</div>${M(c.costume)}</div>
  <h3>Your story</h3>
  <div class="card story">${M(c.backstory)}</div>
  <h3>Your connections</h3>
  <div class="card">${yourWeb(c, rels, content.names)}<ul class="rel">${rels.map((r) => html`<li><span class="rel-face">${face(r.with, 46, false)}</span><span><b>${name(r.with)}</b> ${I(r.text)}</span></li>`)}</ul></div>
  <h3>Your evening</h3>
  <div class="card"><p class="small muted">What you did before the lights went out. You'll be asked about it all night; this is the truth, whatever you choose to say.</p>${eveningStrip(c)}<ul class="evening">${c.evening.map((e) => html`<li><span class="t">${e.at}${e.until ? html`<br>– ${e.until}` : ''}</span><span>${I(e.text)}</span></li>`)}</ul></div>
  <h3>What you know</h3>
  <div class="card"><ul class="known">${c.knows.map((k) => html`<li>${I(k)}</li>`)}</ul></div>
  <h3>Your secret</h3>
  <details class="secret"><summary><span class="seal small" aria-hidden="true">✦</span> Tap to break the seal (check no one's looking)</summary>${M(c.secret)}</details>
  <h3>If someone pays you</h3>
  <div class="card"><p class="small muted">Accept $1,000 and you must answer a question about these truthfully.</p><ul>${c.blackmail.map((b) => html`<li>${I(b)}</li>`)}</ul></div>
  <h3>Private instructions</h3>
  <div class="card"><ul>${c.instructions.map((x) => html`<li>${I(x)}</li>`)}</ul></div>
  <h3>Secret mission <span class="small muted">· $1,000 from Roderick</span></h3>
  ${live >= 1 ? html`<div class="card mission">${M(c.mission)}</div>` : html`<div class="card envelope sealed"><div class="seal">✦</div><p>${paper ? 'Your mission is in your Round One envelope.' : 'Your mission arrives with Round One.'}</p></div>`}
</section>

<section class="panel" id="envelopes">
  <h2>${paper ? 'The night' : 'Envelopes'}</h2>
  <div class="card night">
    <div class="night-facts"><div><span class="k">Where</span><span class="v">Cameron Castle</span></div><div><span class="k">When</span><span class="v">${day || 'The night of the Supper'}</span></div><div><span class="k">Doors</span><span class="v">${night.doors || '7:30 PM'}</span></div><div><span class="k">Dress</span><span class="v">In character (see You)</span></div></div>
    <ul class="night-notes">${(night.notes || []).map((x) => html`<li>${I(x)}</li>`)}</ul>
  </div>
  <h3>How tonight works</h3>
  <ol class="steps">${(gc.tonight_steps || []).map((st, i) => html`<li class="${st.round < live ? 'done' : st.round === live ? 'now' : ''}"><span class="n">${i + 1}</span><div><b>${st.title}</b><p>${st.text}</p></div></li>`)}</ol>
  <h3>Your envelopes</h3>
  <p class="small muted">${paper ? 'Tonight the envelopes are paper: one per round, handed to you by Roderick. Nothing new will appear here.' : `${opened} of 3 unsealed. New envelopes appear here the moment Roderick opens a round.`}</p>
  <div class="env-row">${envelopes}</div>
</section>

<section class="panel" id="phone">
  <h2>${paper ? 'Messages' : 'Phone'}</h2>
  <p class="small muted">${paper ? 'Messages from before tonight. On the night your phone stays in your bag; anything new comes on paper, inside your envelopes.' : 'Texts arrive here during the night. Keep this page open; your phone will buzz.'}
  <button class="btn small ghost" type="button" id="alerts" hidden>Turn on alerts</button></p>
  <div class="phone" id="thread" data-known="${texts.map((t) => t.id).join(',')}" data-round="${live}" data-tz="${tz}">
    ${texts.length ? texts.map((t) => renderText(t, tz)) : html`<div class="empty" id="empty">No messages yet.</div>`}
  </div>
</section>

<section class="panel" id="manor">
  <h2>The Castle</h2>
  <div class="card lede">${M(gc.welcome)}</div>
  <h3>The guests at the Supper</h3>
  <ul class="guest-list">${guestList}</ul>
  <h3>The house</h3>
  <div class="card">${M(gc.house)}
  ${gc.house_tonight ? M(gc.house_tonight) : ''}
  ${venueMap(content.venue, { mode: 'guest', rooms: content.lore.rooms, linkRooms: true })}
  <ul class="rooms">${roomList}</ul></div>
  <h3>The Camerons</h3>
  <div class="card">${familyTree(gc.family_tree || [])}</div>
  <h3>The legend</h3>
  <div class="card legend-card"><div class="legend-raven" aria-hidden="true">${prop('raven', { size: 120 })}</div>${M(gc.legend)}</div>
  <h3>Rules of the Supper</h3>
  <div class="card rules-card"><ol class="rules">${gc.supper_rules.map((r, i) => html`<li><span class="rn">${ROMAN[i] || i + 1}</span><span>${I(r)}</span></li>`)}</ol></div>
  <h3>Blackmail Cash</h3>
  <div class="card"><div class="bills" aria-hidden="true"><span>$1,000</span><span>$1,000</span><span>$1,000</span></div>
  <ol class="flow"><li><b>Offer</b> $1,000</li><li><b>Ask</b> one question</li><li><b>If they take it</b>, the truth is owed</li></ol>
  ${M(gc.blackmail_rules)}</div>
  <h3>How to play</h3>
  <div class="card">${M(gc.how_to_play)}</div>
</section>

<footer>
  ${preview || standalone ? '' : html`<form method="post" action="/logout"><button class="btn ghost small" type="submit">Leave the castle (log out)</button></form>`}
  <p>${raw(RAVEN_SVG)}<br>Cameron Castle</p>
</footer>
</main>
<div id="toast" role="status" aria-live="polite"></div>`;

  return page({ css: GUEST_CSS, body, script: preview ? '' : standalone ? TABS_JS : GUEST_JS, title: standalone ? `${c.name} · Cameron Castle` : undefined });
}

const HANGER = '<svg viewBox="0 0 48 32" width="48" height="32"><path d="M24 9a4 4 0 1 1 4-4M24 9v3L4 26h40L24 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Identical for every guest; contains no character data.
const TABS = `
  var panels=[].slice.call(document.querySelectorAll('section.panel'));
  var tabs=[].slice.call(document.querySelectorAll('nav.tabs a'));
  var ids=panels.map(function(p){return p.id});
  document.body.classList.add('tabbed');
  function show(id,scroll){
    if(ids.indexOf(id)<0) id='character';
    panels.forEach(function(p){p.classList.toggle('active',p.id===id)});
    tabs.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+id)});
    if(id==='phone'&&window.__seen) window.__seen();
    if(scroll!==false) window.scrollTo(0,0);
  }
  tabs.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var id=a.getAttribute('href').slice(1);history.replaceState(null,'','#'+id);show(id)})});
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||a.closest('nav.tabs'))return;var id=a.getAttribute('href').slice(1);if(ids.indexOf(id)>=0){e.preventDefault();history.replaceState(null,'','#'+id);show(id)}});
  window.addEventListener('hashchange',function(){var id=location.hash.slice(1);if(ids.indexOf(id)>=0)show(id)});
  function fmt(iso){try{return new Date(iso).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}catch(e){return ''}}
  Array.prototype.forEach.call(document.querySelectorAll('time[datetime]'),function(t){t.textContent=fmt(t.getAttribute('datetime'))});
  show(location.hash.slice(1)||'character',false);
`;

// A sent, standalone page: tabs only, nothing that talks to a server.
const TABS_JS = `(function(){${TABS}})();`;

const GUEST_JS = `
(function(){${TABS}
  var thread=document.getElementById('thread');
  var known=new Set((thread.dataset.known||'').split(',').filter(Boolean));
  var round=Number(thread.dataset.round||0);
  var unread=0, badge=document.getElementById('unread'), toast=document.getElementById('toast');
  window.__seen=function(){unread=0;bump(0)};
  function add(t){
    var empty=document.getElementById('empty'); if(empty) empty.remove();
    var d=document.createElement('div'); d.className='msg new';
    var f=document.createElement('div'); f.className='from'; f.textContent=t.from;
    var b=document.createElement('div'); b.className='bubble'; b.textContent=t.body;
    var w=document.createElement('div'); w.className='when'; w.textContent=t.stamp||fmt(t.at);
    d.appendChild(f); d.appendChild(b); d.appendChild(w); thread.appendChild(d);
  }
  function showToast(msg){toast.textContent=msg; toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show')},6000)}
  function bump(n){unread+=n; badge.textContent=unread; badge.hidden=!unread; document.title=unread?'('+unread+') Cameron Castle':'Cameron Castle'}
  function alertNew(list){
    var t=list[list.length-1];
    showToast('💬 '+t.from+': '+(t.body.length>90?t.body.slice(0,90)+'…':t.body));
    if(location.hash!=='#phone') bump(list.length);
    try{navigator.vibrate&&navigator.vibrate([90,60,90])}catch(e){}
    try{if(window.Notification&&Notification.permission==='granted'&&document.hidden){new Notification(t.from,{body:t.body})}}catch(e){}
  }
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
