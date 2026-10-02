// Host pages. Every route that renders these is behind host authentication.
import { html, raw } from '../lib/html.mjs';
import { md, mdInline, IF_BLOCK } from '../lib/markdown.mjs';
import { rosterHelpers, STATUSES, numberWords } from '../lib/roster.mjs';
import { textSchedule } from '../lib/texts.mjs';
import { formatTimeIn, parseClock } from '../lib/time.mjs';
import { checkContent, wordCount } from '../lib/check.mjs';
import { flexCoverage } from '../lib/flex.mjs';
import { page } from './layout.mjs';
import { HOST_CSS } from './styles.mjs';
import { crest, crestSvg, roundStepper, manorMap, slotsIn, timelineChart, eveningStrip, yourWeb, webGraph, suspicionHeatmap, initials, shortNames, KIND_LABELS, ROOM_GEO } from './visuals.mjs';

const NAV = [
  ['Tonight', [['/host', 'Dashboard'], ['/host/script', 'Run of show'], ['/host/texts', 'Texts']]],
  ['The case', [['/host/map', 'Map'], ['/host/timeline', 'Timeline'], ['/host/evidence', 'Evidence'], ['/host/suspicion', 'Suspicion'], ['/host/web', 'Web']]],
  ['People', [['/host/characters', 'Characters'], ['/host/roster', 'Roster'], ['/host/flex', 'Flex']]],
  ['Prep', [['/host/print', 'Print'], ['/host/check', 'Checker']]],
];
const PAGE_INFO = {
  '/host': 'Where the night stands, and what needs to happen next.',
  '/host/script': "Reggie's lines, cues and rescues, round by round. 🆕 marks the Part Two upgrades.",
  '/host/texts': 'Send cue texts, text anyone as anyone, and see what is scheduled.',
  '/host/map': 'The manor, the hidden passage, where the evidence is, and where everyone was, minute by minute.',
  '/host/timeline': 'What really happened, and when the players find out.',
  '/host/evidence': 'Every prop and clue by round: where it hides, who carries it, and what it really means.',
  '/host/suspicion': 'Who the room should suspect at each stage, so you can steer with counterweights.',
  '/host/web': 'Who is tied to whom. Click a face to see their connections.',
  '/host/characters': 'Every character at a glance. Open one for the full dossier, or preview their phone.',
  '/host/roster': 'Who plays whom, passphrases and login links, and assigning spares to late guests.',
  '/host/flex': 'Which optional-character lines are live, given who is coming.',
  '/host/print': 'Print-ready envelopes, cards, evidence, ballots, Blackmail Cash and hint cards.',
  '/host/check': 'Contradictions with the true timeline, missing pieces, and spoiler risks.',
};
const ROUND_LABEL = { 0: 'Before the Supper', 1: 'Round One', 2: 'Round Two', 3: 'Round Three', 4: 'The reveal', 9: 'Reference' };

function shell(ctx, active, title, content, { info = PAGE_INFO[active] } = {}) {
  const body = html`<nav class="host"><a class="brand" href="/host">✦ Blackwood</a>
${NAV.map(([group, links]) => html`<div class="grp"><span class="grp-label">${group}</span>${links.map(([href, label]) => html`<a href="${href}" class="${href === active ? 'on' : ''}">${label}</a>`)}</div>`)}
<span class="spacer"></span>
<span class="live-pill">Live: <b>${ROUND_LABEL[ctx.state.liveRound]}</b></span>
<form method="post" action="/host/logout"><button class="btn ghost small" type="submit">Log out</button></form></nav>
<main class="wrap" id="top">
${ctx.flash ? html`<div class="flash ${ctx.flash.bad ? 'bad' : ''}">${ctx.flash.msg}</div>` : ''}
<h1>${title}</h1>
${info ? html`<p class="page-info">${info}</p>` : ''}
${content}
</main>`;
  return page({ title: `Host · ${title}`, css: HOST_CSS, body });
}

const pill = (cls, text) => html`<span class="pill ${cls}">${text ?? cls}</span>`;
const postButton = (action, fields, label, cls = 'btn small') =>
  html`<form method="post" action="${action}" class="inline-form">${Object.entries(fields).map(([k, v]) => html`<input type="hidden" name="${k}" value="${v}">`)}<button class="${cls}" type="submit">${label}</button></form>`;

function fmtTime(ctx, iso) {
  return iso ? formatTimeIn(new Date(iso), ctx.content.party.timezone || 'UTC') : '';
}

export function substitute(text, ctx) {
  const { guestCount } = rosterHelpers(ctx.content, ctx.state);
  return String(text)
    .replace(/\{\{guest_count_words\}\}/g, numberWords(guestCount))
    .replace(/\{\{guest_count\}\}/g, String(guestCount));
}

export function hostLoginPage({ error = '', configured = true } = {}) {
  const body = html`<main class="wrap" style="max-width:420px;padding-top:12vh">
<h1>Host entrance</h1>
${configured ? '' : html`<p class="flash bad">HOST_PASSWORD is not configured on the server. Set it before the party (see README).</p>`}
${error ? html`<p class="flash bad">${error}</p>` : ''}
<form method="post" action="/host/login" class="card">
  <p><input type="password" name="password" placeholder="Host password" required style="width:100%"></p>
  <button class="btn" type="submit">Enter</button>
</form></main>`;
  return page({ title: 'Host', css: HOST_CSS, body });
}

// ---------------------------------------------------------------- dashboard
export function dashboardPage(ctx) {
  const { content, state } = ctx;
  const { roster, liveIds, canLogin, guestCount, isLive } = rosterHelpers(content, state);
  const findings = checkContent(content, state);
  const errors = findings.filter((f) => f.level === 'error').length;
  const warns = findings.filter((f) => f.level === 'warn').length;
  const loginIds = content.characterOrder.filter(canLogin);
  const loggedIn = loginIds.filter((id) => state.firstLogin[id]).length;
  const missingPass = loginIds.filter((id) => !state.passphrases[id]).length;
  const live = state.liveRound;
  const focusRound = live === 0 ? 1 : live;
  const cueSegs = content.script.filter((s) => s.round === live && s.send_texts.length);
  const sched = textSchedule(content, state, liveIds, ctx.now).filter((t) => t.status === 'scheduled').sort((a, b) => a.at.localeCompare(b.at)).slice(0, 8);
  const spoken = content.clueOrder.filter((id) => content.clues[id].kind === 'spoken' && content.clues[id].round === focusRound);
  const phys = content.clueOrder.filter((id) => content.clues[id].kind !== 'spoken' && content.clues[id].round === focusRound);
  const segs = content.script.filter((s) => s.round === live);
  const aims = (content.suspicion?.stages || []).filter((st) => st.round === focusRound);
  const carrier = (c) => (c === 'host' ? 'Reggie' : c === 'found' ? 'hidden for the hunt' : shortNames(content.names)[c] || c);

  return shell(ctx, '/host', 'Dashboard', html`
<div class="card hero">
  ${roundStepper(live, { labels: ['Before', 'Round One', 'Round Two', 'Round Three', 'Reveal'] })}
  <div class="rounds">${[0, 1, 2, 3].map((n) => html`<form method="post" action="/host/round" onsubmit="return confirm('Set the live round to ${ROUND_LABEL[n]}?')"><input type="hidden" name="round" value="${n}"><button class="btn ${live === n ? 'on' : 'ghost'}" type="submit">${n === live ? '● ' : ''}${ROUND_LABEL[n]}</button></form>`)}</div>
  <p class="small muted">Unlocking a round puts that envelope on every guest's phone within ~15 seconds and starts its timed texts. ${[1, 2, 3].map((n) => (state.roundUnlockedAt[n] ? `${ROUND_LABEL[n]} opened ${fmtTime(ctx, state.roundUnlockedAt[n])}. ` : ''))}</p>
</div>

<div class="now-grid">
  <div class="card">
    <h2 class="h-card">${live === 0 ? 'Getting ready for Round One' : `Right now: ${ROUND_LABEL[live]}`}</h2>
    <h3>Must come out ${live === 0 ? 'in Round One' : 'this round'}</h3>
    <ul class="checklist">${spoken.map((id) => {
      const c = content.clues[id];
      return html`<li>${content.characters[c.carrier] ? crest(c.carrier, content.characters[c.carrier].name, 26) : ''}<span>${c.critical ? html`<b>★ </b>` : ''}${c.title} <span class="muted">· ${carrier(c.carrier)}</span> ${isLive(c.carrier) ? '' : pill('warn', 'not cast')}</span></li>`;
    })}</ul>
    <p class="small muted">★ solution-critical. Rescue lines are in the <a href="/host/script?round=${focusRound}">run of show</a>.</p>
  </div>
  <div class="card">
    <h3 class="h-card">Evidence ${live === 0 ? 'to hide before Round One' : 'for this round'}</h3>
    <ul class="checklist">${phys.map((id) => {
      const c = content.clues[id];
      return html`<li><span class="pin-dot r${c.round}">${c.round}</span><span>${state.prepDone[id] ? '✓ ' : ''}<a href="/host/evidence#${id}">${c.title}</a> <span class="muted">· ${c.timing} · ${carrier(c.carrier)}${c.room ? ` · ${ROOM_GEO[c.room]?.label || c.room}` : ''}</span></span></li>`;
    })}</ul>
    <p class="small"><a href="/host/map">See it on the map →</a></p>
    ${aims.length ? html`<h3>Suspicion target</h3>${aims.map((st) => html`<p class="small"><b>${st.title}:</b> ${st.aim}</p>`)}` : ''}
  </div>
  <div class="card">
    <h3 class="h-card">Cue texts${live === 0 ? '' : ' this round'}</h3>
    ${cueSegs.length ? cueSegs.map((s) => html`<p class="small"><b>${s.title}</b></p>${s.send_texts.map((id) => cueButton(ctx, id))}`) : html`<p class="muted small">None linked to ${ROUND_LABEL[live]}. All cue texts are on <a href="/host/texts">Texts</a>.</p>`}
    <h3>Run of show</h3>
    <ol class="mini-toc">${segs.map((s) => html`<li><a href="/host/script#${s.slug}">${s.title}</a></li>`)}</ol>
  </div>
</div>

<div class="grid">
  <div class="card"><h3 class="h-card">Cast</h3>
    <p class="big-num">${guestCount}<span> guests in play</span></p>
    <p class="small">${loggedIn}/${loginIds.length} have logged in</p>
    ${missingPass ? html`<p class="pill warn">${missingPass} without passphrases. Open Roster.</p>` : ''}
    <div class="face-row">${liveIds.map((id) => html`<a href="/host/characters/${id}" title="${content.characters[id].name}">${crest(id, content.characters[id].name, 30)}</a>`)}</div>
    <p><a href="/host/roster">Roster & passphrases →</a></p></div>
  <div class="card"><h3 class="h-card">Consistency</h3>
    <p class="big-num">${errors}<span> errors</span></p>
    <p>${errors ? pill('err', `${errors} errors`) : pill('ok', 'no errors')} ${warns ? pill('warn', `${warns} warnings`) : ''}</p>
    <p><a href="/host/check">Checker →</a></p></div>
  <div class="card"><h3 class="h-card">Flex characters</h3>
    <ul class="small">${content.characterOrder.filter((id) => content.characters[id].tier === 'flex' && roster[id].status !== 'spare-unassigned').map((id) => html`<li>${content.characters[id].name}: ${pill(['confirmed', 'spare-assigned'].includes(roster[id].status) ? 'ok' : 'warn', roster[id].status)} ${roster[id].player || ''}</li>`)}</ul>
    <p><a href="/host/flex">Live vs. fallback →</a></p></div>
</div>

<div class="card">
  <h2 class="h-card">The suspicion curve</h2>
  ${suspicionHeatmap(content, { highlightRound: focusRound })}
</div>

<div class="card">
  <h2 class="h-card">Coming up on guests' phones</h2>
  ${sched.length ? html`<table><tr><th>When</th><th>To</th><th>From</th><th>Text</th></tr>${sched.map((t) => html`<tr><td>${fmtTime(ctx, t.at)}</td><td>${t.to === 'all' ? 'Everyone' : content.names[t.to]}</td><td>${t.from}</td><td>${t.body}</td></tr>`)}</table>` : html`<p class="muted small">Nothing scheduled. Timed texts start when a round is unlocked.</p>`}
</div>
<div class="card">
  <h2 class="h-card">Party date</h2>
  <form method="post" action="/host/settings" class="inline-form">
    <input type="date" name="partyDate" value="${state.partyDate || content.party.date || ''}">
    <span class="small muted">${content.party.timezone}. Used for pre-party teaser texts.</span>
    <button class="btn small" type="submit">Save</button>
  </form>
</div>`);
}

function findText(content, id) {
  for (const cid of content.characterOrder) for (const t of content.characters[cid].texts || []) if (t.id === id) return { ...t, to: cid };
  for (const t of content.globalTexts || []) if (t.id === id) return { ...t, to: 'all' };
  return null;
}

function cueButton(ctx, id) {
  const t = findText(ctx.content, id);
  if (!t) return html`<p class="pill err">Unknown text ${id}</p>`;
  const sent = ctx.state.cueSent[id];
  const live = t.to === 'all' || rosterHelpers(ctx.content, ctx.state).isLive(t.to);
  return html`<div class="inline-form" style="margin:6px 0">
  ${sent ? pill('ok', `sent ${fmtTime(ctx, sent)}`) : postButton('/host/cue', { id, back: ctx.path }, `Send to ${t.to === 'all' ? 'everyone' : ctx.content.names[t.to]}`)}
  ${live ? '' : pill('warn', 'not cast')}
  <span class="small"><b>${t.from}:</b> ${t.body}</span>
</div>`;
}

// ---------------------------------------------------------------- roster
export function rosterPage(ctx) {
  const { content, state } = ctx;
  const { roster, canLogin } = rosterHelpers(content, state);
  const origin = ctx.origin;
  return shell(ctx, '/host/roster', 'Roster & passphrases', html`
<p class="small muted">Change status and player, then Save that row. Assign a spare to a late guest by entering their name and choosing <b>spare-assigned</b>. A passphrase is generated automatically. Send each guest their link (it pre-fills the passphrase), or print login cards from <a href="/host/print">Print</a>.</p>
<table>
<tr><th>Character</th><th>Tier</th><th>Player · status</th><th>Passphrase / link</th><th>Seen</th></tr>
${content.characterOrder.map((id) => {
  const c = content.characters[id];
  const r = roster[id];
  const pass = state.passphrases[id];
  const link = pass ? `${origin}/?p=${pass}` : '';
  return html`<tr class="${canLogin(id) ? '' : 'off'}">
  <td><a href="/host/characters/${id}">${c.name}</a><div class="small muted">${c.role}</div></td>
  <td>${pill(c.tier)} ${c.effort ? html`<div class="small muted">${c.effort} effort</div>` : ''}</td>
  <td><form method="post" action="/host/roster" class="inline-form">
    <input type="hidden" name="id" value="${id}">
    <input name="player" value="${r.player || ''}" placeholder="Guest name" size="12">
    <select name="status">${STATUSES.map((s) => html`<option ${s === r.status ? raw('selected') : ''}>${s}</option>`)}</select>
    <button class="btn small ghost" type="submit">Save</button></form></td>
  <td>${canLogin(id) && pass ? html`<div class="pass">${pass}</div><div class="small mono" style="word-break:break-all">${link}</div>${postButton('/host/passphrase', { id }, 'New passphrase', 'btn small ghost')}` : html`<span class="muted small">No login</span>`}</td>
  <td class="small">${state.firstLogin[id] ? fmtTime(ctx, state.firstLogin[id]) : ''}</td>
</tr>`;
})}
</table>`);
}

// ---------------------------------------------------------------- texts
export function textsPage(ctx) {
  const { content, state } = ctx;
  const { liveIds, canLogin } = rosterHelpers(content, state);
  const rows = textSchedule(content, state, liveIds, ctx.now);
  const cues = rows.filter((t) => t.trigger?.cue);
  const timed = rows.filter((t) => t.trigger?.round != null || t.trigger?.time).sort((a, b) => (a.trigger.round ?? 0) - (b.trigger.round ?? 0) || (a.trigger.after ?? 0) - (b.trigger.after ?? 0));
  const loginIds = content.characterOrder.filter(canLogin);
  return shell(ctx, '/host/texts', 'Phone texts', html`
<div class="card">
  <h2 style="margin-top:0">Send a text now</h2>
  <form method="post" action="/host/custom">
    <p class="inline-form"><label>To <select name="to"><option value="all">Everyone</option>${loginIds.map((id) => html`<option value="${id}">${content.characters[id].name}</option>`)}</select></label>
    <label>From <input name="from" value="Unknown number" size="18"></label></p>
    <p><textarea name="body" required placeholder="The raven is watching." style="min-height:4em;font-family:inherit;font-size:16px"></textarea></p>
    <button class="btn" type="submit">Send</button>
  </form>
  ${state.custom.length ? html`<h3>Sent by you</h3><table>${state.custom.map((c) => html`<tr><td class="small">${fmtTime(ctx, c.sentAt)}</td><td>${c.to === 'all' ? 'Everyone' : content.names[c.to]}</td><td><b>${c.from}:</b> ${c.body}</td><td>${postButton('/host/custom/delete', { id: c.id }, 'Unsend', 'btn small ghost')}</td></tr>`)}</table>` : ''}
</div>
<div class="card">
  <h2 style="margin-top:0">Cue texts</h2>
  <p class="small muted">These fire only when you press Send, usually at a moment in the run of show.</p>
  <table><tr><th>Cue</th><th>To</th><th>Text</th><th></th></tr>
  ${cues.map((t) => html`<tr><td class="small">${t.trigger.cue}</td><td>${t.to === 'all' ? 'Everyone' : content.names[t.to]}</td><td><b>${t.from}:</b> ${t.body}</td>
  <td>${state.cueSent[t.id] ? html`${pill('ok', 'sent ' + fmtTime(ctx, state.cueSent[t.id]))}${postButton('/host/cue', { id: t.id, undo: '1' }, 'Unsend', 'btn small ghost')}` : postButton('/host/cue', { id: t.id }, 'Send')}</td></tr>`)}
  </table>
</div>
<div class="card">
  <h2 style="margin-top:0">Timed texts</h2>
  <table><tr><th>Trigger</th><th>Status</th><th>To</th><th>Text</th></tr>
  ${timed.map((t) => html`<tr><td class="small">${t.trigger.round != null ? `Round ${t.trigger.round} + ${t.trigger.after || 0} min` : `Day ${t.trigger.day || 0} ${t.trigger.time}`}</td>
  <td>${pill(t.status === 'delivered' ? 'ok' : t.status === 'scheduled' ? 'warn' : 'info', t.status === 'scheduled' ? 'at ' + fmtTime(ctx, t.at) : t.status)}</td>
  <td>${t.to === 'all' ? 'Everyone' : content.names[t.to]}</td><td><b>${t.from}:</b> ${t.body}</td></tr>`)}
  </table>
  <p class="small muted">Plus ${rows.filter((t) => t.status === 'history').length} "history" texts already sitting in guests' phones from their first login.</p>
</div>`);
}

// ---------------------------------------------------------------- run of show
export function scriptPage(ctx, filterRound) {
  const { content } = ctx;
  const { isLive } = rosterHelpers(content, ctx.state);
  const all = content.script;
  const segs = all.filter((s) => filterRound == null || s.round === filterRound);
  const rounds = [...new Set(all.map((s) => s.round))].sort((a, b) => a - b);
  const KIND_ICON = { speech: '🎙', cue: '⏱', checklist: '☑', rescue: '🛟', evidence: '🔎', reference: '📖' };
  const num = (s) => all.indexOf(s) + 1;
  return shell(ctx, '/host/script', 'Run of show', html`
<p class="inline-form small">${html`<a class="btn small ${filterRound == null ? '' : 'ghost'}" href="/host/script">All</a>`}${rounds.map((r) => html`<a class="btn small ${filterRound === r ? '' : 'ghost'}" href="/host/script?round=${r}">${ROUND_LABEL[r]}</a>`)}</p>
<div class="legend">${Object.entries(KIND_ICON).map(([k, i]) => html`<span class="lg">${i} ${k}</span>`)}</div>
<div class="script-layout">
<aside class="toc"><nav>${rounds.filter((r) => filterRound == null || r === filterRound).map((r) => html`<p class="toc-round">${ROUND_LABEL[r]}</p><ol>${all.filter((s) => s.round === r).map((s) => html`<li><a href="#${s.slug}">${KIND_ICON[s.kind] || '·'} ${s.title}</a></li>`)}</ol>`)}</nav></aside>
<div>
${segs.map((s, i) => {
  const prev = segs[i - 1];
  const next = segs[i + 1];
  return html`<section class="seg kind-${s.kind}" id="${s.slug}">
  <div class="seg-head"><span class="seg-num">§${num(s)}</span><h2>${KIND_ICON[s.kind] || ''} ${s.title}</h2></div>
  <div class="meta">${ROUND_LABEL[s.round]} · ${s.kind}${s.changes ? html` · <i>Changed: ${s.changes}</i>` : ''}</div>
  ${s.clues.length ? html`<p class="small">Evidence: ${s.clues.map((id) => html`<a class="pill" href="/host/evidence#${id}">${content.clues[id]?.title || id}</a> `)}</p>` : ''}
  ${s.send_texts.map((id) => cueButton(ctx, id))}
  ${raw(md(substitute(s.body, ctx), isLive))}
  <p class="seg-nav small">${prev ? html`<a href="#${prev.slug}">← ${prev.title}</a>` : html`<span></span>`}<a href="#top">↑ top</a>${next ? html`<a href="#${next.slug}">${next.title} →</a>` : html`<span></span>`}</p>
</section>`;
})}
</div></div>`);
}

// ---------------------------------------------------------------- timeline
export function timelinePage(ctx) {
  const { content } = ctx;
  const ev = content.timeline.events;
  const name = (id) => content.names[id] || id;
  const via = (v) => (v === 'host' ? 'Reggie' : content.clues[v] ? `clue: ${content.clues[v].title}` : name(v));
  const byRound = [0, 1, 2, 3].map((r) => ({ r, items: ev.flatMap((e) => (e.learned || []).filter((l) => l.round === r).map((l) => ({ e, l }))) }));
  const { liveIds } = rosterHelpers(content, ctx.state);
  return shell(ctx, '/host/timeline', 'True timeline', html`
<div class="card">
  <h2 class="h-card">Where everyone was</h2>
  <p class="small muted">Each bar is one character's whereabouts from their own card. Red = the study and the corridor outside it; gold = the library end of the passage. Hover a bar for details. Only Morgan is in the study between 9:34 and 9:38.</p>
  ${timelineChart(content, { from: '9:25 PM', to: '9:50 PM', ids: liveIds, title: 'The critical half hour (9:25 to 9:50)' })}
  ${timelineChart(content, { from: '8:00 PM', to: '10:00 PM', ids: liveIds, title: 'The whole evening (8:00 to 10:00)' })}
</div>
<p class="small muted">Canonical source: content/timeline.yaml. Times shown are in-world.</p>
<table><tr><th>When</th><th>Who</th><th>Where</th><th>What really happened</th><th>Players learn it</th></tr>
${ev.map((e) => html`<tr class="${e.flex ? 'off' : ''}">
  <td class="mono">${e.at ? `${e.approx ? '~' : ''}${e.at}${e.until ? '–' + e.until : ''}` : e.when}</td>
  <td class="small">${(e.who || []).map(name).join(', ')}</td>
  <td class="small">${e.where ? content.lore.rooms[e.where]?.name || e.where : ''}</td>
  <td>${e.critical ? pill('core', 'critical') : ''} ${e.flex ? pill('flex', 'flex: ' + e.flex) : ''} ${e.what}</td>
  <td class="small">${(e.learned || []).map((l) => html`<div>R${l.round}: ${via(l.via)} <span class="muted">(${l.how})</span></div>`)}</td>
</tr>`)}
</table>
<h2>What players learn, round by round</h2>
${byRound.map(({ r, items }) => html`<div class="card"><h3 style="margin-top:0">${ROUND_LABEL[r]}</h3><ul>${items.map(({ e, l }) => html`<li>${e.critical ? '★ ' : ''}<b>${e.at || e.when}</b> ${l.how}: <span class="muted">via ${via(l.via)}</span></li>`)}</ul></div>`)}`);
}

// ---------------------------------------------------------------- evidence
export function evidencePage(ctx) {
  const { content, state } = ctx;
  const { isLive } = rosterHelpers(content, state);
  const carrier = (c) => (c === 'host' ? 'Reggie' : c === 'found' ? 'Hidden for the hunt' : content.names[c] || c);
  const pinNo = Object.fromEntries(mapPins(content).map((p) => [p.id, p.label]));
  return shell(ctx, '/host/evidence', 'Evidence & props', html`
<p class="small muted">Tick props off as you prepare them. Hiding spots are suggestions; set the real ones in content/clues/*.yaml. Numbered pins match the <a href="/host/map">map</a>.</p>
${[1, 2, 3].map((r) => {
  const phys = content.clueOrder.filter((id) => content.clues[id].round === r && content.clues[id].kind !== 'spoken');
  const spoken = content.clueOrder.filter((id) => content.clues[id].round === r && content.clues[id].kind === 'spoken');
  return html`<h2>${ROUND_LABEL[r]}</h2>
<div class="card"><table><tr><th>Prep</th><th>Evidence</th><th>When / who</th><th>Hide</th></tr>
${phys.map((id) => {
  const c = content.clues[id];
  const off = c.carrier !== 'host' && c.carrier !== 'found' && !isLive(c.carrier);
  return html`<tr id="${id}" class="${off ? 'off' : ''}">
  <td>${postButton('/host/prep', { id, done: state.prepDone[id] ? '' : '1' }, state.prepDone[id] ? '✓ ready' : '☐ prep', state.prepDone[id] ? 'btn small' : 'btn small ghost')}</td>
  <td>${pinNo[id] ? html`<span class="pin-dot r${c.round}">${pinNo[id]}</span> ` : ''}<b>${c.title}</b> ${c.critical ? pill('core', 'critical') : ''} ${pill('info', c.kind)} ${c.source === 'new' ? pill('flex', 'new') : ''}
    <details><summary class="small">Printed text · truth</summary><div class="small mono" style="white-space:pre-wrap">${c.print || ''}</div><p class="small"><b>Truth:</b> ${c.truth}</p>${c.prop_needed ? html`<p class="small"><b>Prop:</b> ${c.prop_needed}</p>` : ''}${c.fallback ? html`<p class="small"><b>Fallback:</b> ${c.fallback}</p>` : ''}</details></td>
  <td class="small">${c.timing} · ${carrier(c.carrier)}${off ? html` ${pill('warn', 'carrier not cast')}` : ''}<div class="muted">${c.delivery}</div></td>
  <td class="small">${c.hide}</td></tr>`;
})}</table></div>
<div class="card"><h3 style="margin-top:0">Must come out this round (spoken)</h3><ul>${spoken.map((id) => {
  const c = content.clues[id];
  return html`<li>${c.critical ? '★ ' : ''}${c.title}: <span class="muted">${carrier(c.carrier)}</span> ${isLive(c.carrier) ? '' : pill('warn', 'not cast')}</li>`;
})}</ul></div>`;
})}`);
}

// ---------------------------------------------------------------- characters
export function charactersPage(ctx) {
  const { content, state } = ctx;
  const { roster } = rosterHelpers(content, state);
  return shell(ctx, '/host/characters', 'Characters', html`
<div class="filter-bar"><input id="filter" type="search" placeholder="Filter by name, role or player…" aria-label="Filter characters">
${['all', 'core', 'supporting', 'flex'].map((t) => html`<button class="btn small ${t === 'all' ? '' : 'ghost'}" type="button" data-tier="${t}">${t}</button>`)}</div>
<div class="char-grid">
${content.characterOrder.map((id) => {
  const c = content.characters[id];
  const r = roster[id];
  return html`<article class="char-card t-${c.tier}" data-tier="${c.tier}" data-search="${[c.name, c.role, c.public_role, r.player || '', r.status].join(' ').toLowerCase()}">
  <a class="cc-head" href="/host/characters/${id}">${crest(id, c.name, 52)}<div><b>${c.name}</b><span class="small muted">${c.role}</span></div></a>
  <p class="small">${pill(c.tier)} ${c.effort ? pill('info', c.effort + ' effort') : ''} <span class="muted">${r.player || 'unassigned'} · ${r.status}</span></p>
  <p class="small cc-links">Preview: ${[0, 1, 2, 3].map((n) => html`<a href="/host/preview/${id}?round=${n}">R${n}</a> `)}${ctx.canEdit ? html` · <a href="/host/edit/${id}">edit</a>` : ''}</p>
</article>`;
})}
</div>
<script>
(function(){var q=document.getElementById('filter'),tier='all';var cards=[].slice.call(document.querySelectorAll('.char-card'));
function apply(){var v=q.value.toLowerCase().trim();cards.forEach(function(c){c.hidden=!((tier==='all'||c.dataset.tier===tier)&&(!v||c.dataset.search.indexOf(v)>=0))})}
q.addEventListener('input',apply);[].forEach.call(document.querySelectorAll('[data-tier]'),function(b){if(b.tagName!=='BUTTON')return;b.addEventListener('click',function(){tier=b.dataset.tier;[].forEach.call(document.querySelectorAll('button[data-tier]'),function(x){x.classList.toggle('ghost',x!==b)});apply()})});})();
</script>`);
}

// Markdown for the host: flex-only blocks stay visible, boxed and labelled.
function mdHost(text, names) {
  const marked = String(text ?? '').replace(IF_BLOCK, (_, id, inner) => `\n<div class="if-block"><p class="if-label">Only if ${names[id] || id} is cast</p>\n\n${inner}\n</div>\n`);
  return md(marked);
}

export function characterPage(ctx, id) {
  const { content, state } = ctx;
  const c = content.characters[id];
  const { roster } = rosterHelpers(content, state);
  const name = (x) => content.names[x] || x;
  const trig = (t) => {
    const g = t.trigger || {};
    if (g.history) return 'history';
    if (g.round != null) return `Round ${g.round} + ${g.after || 0} min`;
    if (g.cue) return `cue: ${g.cue}`;
    return `day ${g.day || 0} ${g.time}`;
  };
  const rels = c.relationships || [];
  return shell(ctx, '/host/characters', c.name, html`
<p class="page-info"><a href="/host/characters">← All characters</a></p>
<div class="dossier-head">${crest(id, c.name, 84)}<div>
<p class="small muted">${c.role}<br>Everyone knows them as: <i>${c.public_role}</i></p>
<p>${pill(c.tier)} ${c.effort ? pill('info', c.effort + ' effort') : ''} ${roster[id].player || 'unassigned'} · ${roster[id].status} · <span class="small muted">${c._file}</span></p></div></div>
<div class="card"><h3 class="h-card">Their evening</h3>${eveningStrip(c, { host: true, rooms: content.lore.rooms })}</div>
<div class="card"><h3 class="h-card">Their web</h3>${yourWeb(c, rels, content.names)}</div>
<p class="small">Preview as guest: ${[0, 1, 2, 3].map((r) => html`<a href="/host/preview/${id}?round=${r}">Round ${r}</a> `)}${ctx.canEdit ? html` · <a href="/host/edit/${id}">Edit YAML</a>` : ''}</p>
${c.host_notes ? html`<div class="card"><b>Host notes.</b> ${raw(md(c.host_notes))}</div>` : ''}
${c.fallback ? html`<div class="card"><b>Fallback if not cast.</b> ${raw(md(c.fallback))}</div>` : ''}
<div class="grid">
  <div class="card"><h3 style="margin-top:0">Secret</h3>${raw(md(c.secret))}<h3>Mission</h3>${raw(md(c.mission))}</div>
  <div class="card"><h3 style="margin-top:0">Evening</h3><ul>${c.evening.map((e) => html`<li><span class="mono">${e.at}${e.until ? '–' + e.until : ''}</span> <span class="muted">${e.where}</span>: ${raw(mdInline(e.text))}</li>`)}</ul></div>
</div>
<div class="grid">${[1, 2, 3].map((n) => html`<div class="card envelope-host"><h3 class="h-card">${ROUND_LABEL[n]} envelope</h3>${raw(mdHost(c.rounds[n].text, content.names))}<p class="small"><b>Must come out:</b></p><ul class="small">${c.rounds[n].reveal.map((r) => html`<li>${r}</li>`)}</ul></div>`)}</div>
<div class="card"><h3 style="margin-top:0">Texts</h3><table>${(c.texts || []).map((t) => html`<tr><td class="small">${trig(t)}</td><td><b>${t.from}</b>${t.stamp ? html` <span class="muted small">(${t.stamp})</span>` : ''}: ${t.body}</td></tr>`)}</table></div>
<div class="card"><h3 style="margin-top:0">Connections</h3><ul>${c.relationships.map((r) => html`<li><b>${name(r.with)}</b>${r.if ? html` ${pill('flex', 'if ' + r.if)}` : ''}: ${r.text}</li>`)}</ul></div>`, { info: '' });
}

export function editPage(ctx, id, text, error) {
  const c = ctx.content.characters[id];
  return shell(ctx, '/host/characters', `Edit ${c.name}`, html`
<p class="small muted">Editing <span class="mono">${c._file}</span> directly. This page only exists when running locally (npm run dev). Commit your changes with git.</p>
${error ? html`<div class="flash bad">${error}</div>` : ''}
<form method="post" action="/host/edit/${id}"><textarea name="yaml" style="min-height:70vh">${text}</textarea>
<p><button class="btn" type="submit">Save</button> <a href="/host/characters/${id}">Cancel</a></p></form>`, { info: '' });
}

// ---------------------------------------------------------------- checker
export function checkPage(ctx) {
  const findings = checkContent(ctx.content, ctx.state);
  return shell(ctx, '/host/check', 'Consistency checker', html`
${findings.length ? html`<table><tr><th>Level</th><th>Where</th><th>Finding</th></tr>${findings.map((f) => html`<tr><td>${pill(f.level)}</td><td class="small mono">${f.area}</td><td>${f.message}</td></tr>`)}</table>` : html`<p class="flash">All clear.</p>`}`);
}

// ---------------------------------------------------------------- flex
export function flexPage(ctx) {
  const { content } = ctx;
  const cov = flexCoverage(content, ctx.state);
  return shell(ctx, '/host/flex', 'Flex coverage', html`
<p class="small muted">The game works whether or not flex characters show up. Lines tied to a flex character appear on other guests' pages only while that character is cast (confirmed or spare-assigned).</p>
<table><tr><th>Flex character</th><th>Status</th><th>If not cast</th></tr>
${cov.flex.map((f) => html`<tr><td><a href="/host/characters/${f.id}">${f.name}</a>${f.effort ? html`<div class="small muted">${f.effort} effort</div>` : ''}</td>
<td>${pill(f.live ? 'ok' : 'warn', f.live ? 'LIVE' : 'fallback')} <div class="small muted">${f.status}${f.player ? ' · ' + f.player : ''}</div></td><td class="small">${f.fallback}</td></tr>`)}
</table>
${[0, 1, 2, 3].map((r) => {
  const items = cov.blocks.filter((b) => b.round === r);
  return items.length
    ? html`<h2>${ROUND_LABEL[r]}</h2><table><tr><th>Status</th><th>On whose page</th><th>Depends on</th><th>Line</th></tr>${items.map((b) => html`<tr><td>${pill(b.live ? 'ok' : 'warn', b.live ? 'LIVE' : 'hidden')}</td><td>${content.names[b.owner]}<div class="small muted">${b.field}</div></td><td>${content.names[b.flexId]}</td><td class="small">${raw(mdInline(b.text))}</td></tr>`)}</table>`
    : '';
})}
${cov.events.length ? html`<h2>Timeline events that only exist if cast</h2><ul>${cov.events.map((e) => html`<li>${pill(e.live ? 'ok' : 'warn', e.live ? 'LIVE' : 'off')} ${e.at}: ${e.what}</li>`)}</ul>` : ''}`);
}

// ---------------------------------------------------------------- print index
export function printIndexPage(ctx) {
  const items = [
    ['passphrases', 'Login cards', 'One card per guest with their passphrase and the site address. Hand out at arrival or text the link.'],
    ['cards', 'Character cards', 'The pre-Supper character sheet for every cast guest (intro, story, connections, evening, secret, instructions).'],
    ['envelopes?round=1', 'Round One envelopes', 'One page per cast guest, including their secret mission.'],
    ['envelopes?round=2', 'Round Two envelopes', 'Remember the props: Morgan\'s email, Joji\'s floor plan.'],
    ['envelopes?round=3', 'Round Three envelopes', 'Props: Carlotta\'s note, Martin\'s note, Kevin\'s bank statement.'],
    ['evidence', 'Evidence cards', 'Printed text for every physical clue and prop, stamped BLACKWOOD EVIDENCE.'],
    ['ballots', 'Accusation ballots', 'Four per page.'],
    ['cash', 'Blackmail Cash', '$1,000 notes: three per guest plus a float.'],
    ['hints', 'Hint cards', 'For the $3,000 private hint.'],
  ];
  return shell(ctx, '/host/print', 'Print', html`
<p class="small muted">Each view opens a print-ready page. Use your browser's Print and choose "Save as PDF" or a printer. Envelopes reflect the current roster (flex lines included or dropped).</p>
<div class="grid">${items.map(([href, title, desc]) => html`<a class="card" style="text-decoration:none;color:inherit" href="/host/print/${raw(href)}" target="_blank"><h3 style="margin-top:0">${title}</h3><p class="small muted">${desc}</p></a>`)}</div>`);
}

// ---------------------------------------------------------------- map
const ROUND_COLORS = { 1: '#7fa7d8', 2: '#c9a45c', 3: '#d0607a' };

export function mapPins(content) {
  const physical = content.clueOrder.filter((id) => content.clues[id].room);
  const byRoom = {};
  for (const id of physical) (byRoom[content.clues[id].room] ||= []).push(id);
  const pins = [];
  let n = 0;
  const numbers = Object.fromEntries(physical.map((id) => [id, ++n]));
  for (const [room, ids] of Object.entries(byRoom)) {
    const g = ROOM_GEO[room];
    if (!g) continue;
    ids.forEach((id, i) => {
      const c = content.clues[id];
      // Pins stack from the room's bottom-left corner (the passage runs down the
      // study's right-hand wall); people dots fill from the top-left. On the
      // short terrace the dots take the bottom-left, so pins go bottom-right.
      pins.push({ id, room, label: String(numbers[id]), x: g.h < 100 ? g.x + g.w - 18 - i * 26 : g.x + 18 + (i % 5) * 26, y: g.y + g.h - 16 - Math.floor(i / 5) * 26, color: ROUND_COLORS[c.round], title: `${numbers[id]}. ${c.title} (Round ${c.round}, ${c.timing})\n${c.hide}` });
    });
  }
  return pins.sort((a, b) => Number(a.label) - Number(b.label));
}

function mapFrames(content, ids) {
  const t0 = parseClock('8:00 PM');
  const t1 = parseClock('10:00 PM');
  const frames = [];
  for (let t = t0; t <= t1; t++) {
    const byRoom = {};
    for (const id of ids) {
      let best = null;
      for (const e of content.characters[id].evening || []) {
        const a = parseClock(e.at);
        const b = e.until ? parseClock(e.until) : a;
        if (a != null && a <= t && t <= b && (!best || a >= best.a)) best = { a, room: e.where };
      }
      if (best && ROOM_GEO[best.room]) (byRoom[best.room] ||= []).push(id);
    }
    const d = [];
    for (const [room, list] of Object.entries(byRoom)) {
      const slots = slotsIn(room, list.length, { size: 28, top: 42 });
      list.forEach((id, i) => d.push([id, Math.round(slots[i].x), Math.round(slots[i].y)]));
    }
    const events = (content.timeline.events || [])
      .filter((e) => e.at && !e.flex)
      .filter((e) => {
        const a = parseClock(e.at);
        const b = e.until ? parseClock(e.until) : a;
        return a <= t && t <= b;
      })
      .map((e) => `${e.at}: ${e.what.replace(/\*\*/g, '')}`);
    frames.push({ d, e: events });
  }
  return { t0, t1, frames };
}

export function mapPage(ctx) {
  const { content, state } = ctx;
  const { liveIds } = rosterHelpers(content, state);
  const pins = mapPins(content);
  const { t0, t1, frames } = mapFrames(content, liveIds);
  const people = Object.fromEntries(liveIds.map((id) => [id, { n: content.characters[id].name, i: initials(content.characters[id].name), c: (crestSvg(id, content.characters[id].name).match(/fill="(#[0-9a-f]{6})"/i) || [])[1] || '#555', k: id === content.timeline.solution_window?.killer ? 1 : 0 }]));
  const data = JSON.stringify({ t0, t1, frames, people, labels: frames.map((_, i) => formatClockSafe(t0 + i)) }).replace(/</g, '\\u003c');
  return shell(ctx, '/host/map', 'The manor', html`
<div class="map-controls card">
  <button class="btn small" type="button" id="m-play">▶ Play 9:25 → 9:50</button>
  <input type="range" id="m-time" min="${t0}" max="${t1}" value="${parseClock('9:38 PM')}" aria-label="Time">
  <b id="m-clock" class="m-clock">9:38 PM</b>
  <div id="m-events" class="m-events small"></div>
</div>
${manorMap({ mode: 'host', rooms: Object.fromEntries(Object.entries(content.lore.rooms).map(([k, v]) => [k, { zone: v.zone, title: v.name }])), pins })}
<div class="legend"><span class="lg"><i style="background:#c0495a"></i>Study & East Corridor (murder zone)</span><span class="lg"><i style="background:#e3c788"></i>Library end of the passage</span><span class="lg"><i style="background:repeating-linear-gradient(90deg,#c0495a 0 6px,transparent 6px 10px)"></i>The Raven's Walk (secret)</span>${[1, 2, 3].map((r) => html`<span class="lg"><i style="background:${ROUND_COLORS[r]};border-radius:50%;width:12px;height:12px"></i>Round ${r} evidence</span>`)}<span class="lg"><i style="border:2px solid #ff6b7f;border-radius:50%;width:12px;height:12px;background:none"></i>The killer</span></div>
<div class="grid">
<div class="card"><h3 class="h-card">Evidence pins</h3><ol class="pin-list">${pins.map((p) => {
  const c = content.clues[p.id];
  return html`<li><span class="pin-dot r${c.round}">${p.label}</span><span><a href="/host/evidence#${p.id}">${c.title}</a> <span class="muted">· ${ROOM_GEO[p.room].label} · Round ${c.round}, ${c.timing}</span><br><span class="small muted">${c.hide}</span></span></li>`;
})}</ol></div>
<div class="card"><h3 class="h-card">How to read it</h3><ul class="small">
<li>Drag the slider (or press play) to watch where everyone is, minute by minute, from their own cards. The red ring is the killer.</li>
<li>At <b>9:34</b> Morgan is alone in the study. At <b>9:39</b> she's in the library, having used the passage. At <b>9:41</b> Alma meets her in the Library Corridor.</li>
<li>Guests see this plan too, but without the passage, the pins or anyone's whereabouts.</li>
<li>Your apartment's floor plan will map onto these rooms; hiding spots live in <span class="mono">content/clues/*.yaml</span>.</li>
</ul></div>
</div>
<script type="application/json" id="mapdata">${raw(data)}</script>
<script>
(function(){
  var D=JSON.parse(document.getElementById('mapdata').textContent);
  var g=document.getElementById('m-dots'),slider=document.getElementById('m-time'),clock=document.getElementById('m-clock'),ev=document.getElementById('m-events'),play=document.getElementById('m-play');
  var NS='http://www.w3.org/2000/svg';
  function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e}
  function render(t){
    var f=D.frames[t-D.t0];if(!f)return;
    while(g.firstChild)g.removeChild(g.firstChild);
    f.d.forEach(function(p){var who=D.people[p[0]];var grp=el('g',{});var tt=el('title',{});tt.textContent=who.n;grp.appendChild(tt);
      grp.appendChild(el('circle',{cx:p[1],cy:p[2],r:12,fill:who.c,stroke:who.k?'#ff6b7f':'#e3c788','stroke-width':who.k?3.5:1.5}));
      var tx=el('text',{x:p[1],y:p[2]+4,'text-anchor':'middle',style:'font:700 10px system-ui,sans-serif;fill:#fff'});tx.textContent=who.i;grp.appendChild(tx);g.appendChild(grp)});
    clock.textContent=D.labels[t-D.t0];
    ev.textContent='';f.e.forEach(function(s){var d=document.createElement('div');d.textContent=s;ev.appendChild(d)});
  }
  slider.addEventListener('input',function(){render(+slider.value)});
  var timer=null;
  play.addEventListener('click',function(){
    if(timer){clearInterval(timer);timer=null;play.textContent='▶ Play 9:25 → 9:50';return}
    var t=D.t0+85;slider.value=t;render(t);play.textContent='❚❚ Pause';
    timer=setInterval(function(){t++;if(t>D.t0+110){clearInterval(timer);timer=null;play.textContent='▶ Play 9:25 → 9:50';return}slider.value=t;render(t)},450);
  });
  render(+slider.value);
})();
</script>`);
}

function formatClockSafe(m) {
  const h24 = (12 + Math.floor(m / 60)) % 24;
  return `${h24 % 12 || 12}:${String(((m % 60) + 60) % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

// ---------------------------------------------------------------- web
export function webPage(ctx) {
  const { content, state } = ctx;
  const { canLogin } = rosterHelpers(content, state);
  const ids = content.characterOrder.filter(canLogin);
  const name = (x) => content.names[x] || x;
  return shell(ctx, '/host/web', 'The web', html`
<div class="filter-bar">${Object.entries(KIND_LABELS).map(([k, l]) => html`<label class="kind-toggle"><input type="checkbox" checked data-kind="${k}"> ${l}</label>`)}<label class="kind-toggle"><input type="checkbox" checked data-kind="arthur"> Ties to Arthur</label></div>
<div class="web-layout">
  <div>${webGraph(content, ids)}</div>
  <aside class="card web-panel" id="webpanel">
    <p class="muted small" data-for="">Click anyone to see their connections. Click empty space to reset. Dashed lines only exist when that flex character is cast.</p>
    ${ids.map((id) => html`<div data-for="${id}" hidden><div class="dossier-head">${crest(id, content.characters[id].name, 48)}<div><b><a href="/host/characters/${id}">${content.characters[id].name}</a></b><br><span class="small muted">${content.characters[id].role}</span></div></div>
    <ul class="small">${(content.characters[id].relationships || []).map((r) => html`<li><b>${name(r.with)}</b>${r.if ? html` <span class="pill flex">if ${r.if}</span>` : ''}: ${r.text}</li>`)}</ul></div>`)}
  </aside>
</div>
<p class="small muted">Showing everyone who can log in (${ids.length}). Unassigned spares are left out. Line colors are inferred from each relationship's wording.</p>
<script>
(function(){
  var svg=document.getElementById('webgraph'),panel=document.getElementById('webpanel');
  function showPanel(id){[].forEach.call(panel.querySelectorAll('[data-for]'),function(d){d.hidden=d.dataset.for!==id})}
  function focus(id){
    [].forEach.call(svg.querySelectorAll('.on'),function(x){x.classList.remove('on')});
    if(!id){svg.classList.remove('focus');showPanel('');return}
    svg.classList.add('focus');
    var me=svg.querySelector('.node[data-id="'+id+'"]');if(me)me.classList.add('on');
    [].forEach.call(svg.querySelectorAll('.edge'),function(e){if(e.dataset.a===id||e.dataset.b===id){e.classList.add('on');var o=e.dataset.a===id?e.dataset.b:e.dataset.a;var n=svg.querySelector('.node[data-id="'+o+'"]');if(n)n.classList.add('on')}});
    showPanel(id);
  }
  svg.addEventListener('click',function(e){var n=e.target.closest('.node');focus(n?n.dataset.id:null)});
  svg.addEventListener('keydown',function(e){if(e.key==='Enter'){var n=e.target.closest('.node');if(n)focus(n.dataset.id)}});
  [].forEach.call(document.querySelectorAll('.kind-toggle input'),function(cb){cb.addEventListener('change',function(){svg.classList.toggle('hide-'+cb.dataset.kind,!cb.checked)})});
})();
</script>`);
}

// ---------------------------------------------------------------- suspicion
export function suspicionPage(ctx) {
  const { content, state } = ctx;
  const focusRound = state.liveRound === 0 ? 1 : state.liveRound;
  return shell(ctx, '/host/suspicion', 'The suspicion curve', html`
<div class="card">${suspicionHeatmap(content, { highlightRound: focusRound })}</div>
<div class="grid">
  <div class="card"><h3 class="h-card">How to use it</h3><ul class="small">
    <li>Each cell is where the room's suspicion <i>should</i> be at that stage, and why (from Part Two §10). The outlined column is the live round.</li>
    <li>If a row is hotter than planned, cool it with a counterweight line. If Morgan goes hot before Round Three, use one of hers: "a lawyer being summoned by a client is hardly a scandal."</li>
    <li>If the room stalls, sell a hint card or use a rescue line from the run of show.</li>
  </ul></div>
  <div class="card"><h3 class="h-card">Counterweights</h3><ul class="small">
    <li><b>Annie's sighting:</b> "Unless attending a scheduled meeting is now murder… we need more."</li>
    <li><b>Alma's sighting:</b> "Being in a library is not yet a capital offense."</li>
    <li><b>Blackwood Legal Counsel:</b> "She's annoyingly correct. The question is whether she abused it."</li>
    <li><b>Too early?</b> "An accusation is not a conviction." Then raise Molly, Louis, James or Carlotta.</li>
  </ul></div>
</div>`);
}

export function hostNotFound(ctx) {
  return shell(ctx, '', 'Not found', html`<p>No such page.</p>`);
}
