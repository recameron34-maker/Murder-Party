// Host pages. Every route that renders these is behind host authentication.
import { html, raw } from '../lib/html.mjs';
import { md, mdInline } from '../lib/markdown.mjs';
import { rosterHelpers, STATUSES, numberWords } from '../lib/roster.mjs';
import { textSchedule } from '../lib/texts.mjs';
import { formatTimeIn, parseClock } from '../lib/time.mjs';
import { checkContent, wordCount } from '../lib/check.mjs';
import { flexCoverage } from '../lib/flex.mjs';
import { page } from './layout.mjs';
import { HOST_CSS } from './styles.mjs';

const NAV = [
  ['/host', 'Dashboard'],
  ['/host/script', 'Run of show'],
  ['/host/texts', 'Texts'],
  ['/host/roster', 'Roster'],
  ['/host/characters', 'Characters'],
  ['/host/evidence', 'Evidence'],
  ['/host/timeline', 'Timeline'],
  ['/host/flex', 'Flex'],
  ['/host/check', 'Checker'],
  ['/host/print', 'Print'],
];
const ROUND_LABEL = { 0: 'Before the Supper', 1: 'Round One', 2: 'Round Two', 3: 'Round Three', 4: 'The reveal', 9: 'Reference' };

function shell(ctx, active, title, content) {
  const body = html`<nav class="host">${NAV.map(([href, label]) => html`<a href="${href}" class="${href === active ? 'on' : ''}">${label}</a>`)}<span class="spacer"></span>
<span class="small muted" style="align-self:center">Live: <b>${ROUND_LABEL[ctx.state.liveRound]}</b></span>
<form method="post" action="/host/logout"><button class="btn ghost small" type="submit">Log out</button></form></nav>
<main class="wrap">
${ctx.flash ? html`<div class="flash ${ctx.flash.bad ? 'bad' : ''}">${ctx.flash.msg}</div>` : ''}
<h1>${title}</h1>
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
  const { roster, liveIds, canLogin, guestCount } = rosterHelpers(content, state);
  const findings = checkContent(content, state);
  const errors = findings.filter((f) => f.level === 'error').length;
  const warns = findings.filter((f) => f.level === 'warn').length;
  const loginIds = content.characterOrder.filter(canLogin);
  const loggedIn = loginIds.filter((id) => state.firstLogin[id]).length;
  const missingPass = loginIds.filter((id) => !state.passphrases[id]).length;
  const cueSegs = content.script.filter((s) => s.round === state.liveRound && s.send_texts.length);
  const sched = textSchedule(content, state, liveIds, ctx.now).filter((t) => t.status === 'scheduled').sort((a, b) => a.at.localeCompare(b.at)).slice(0, 8);

  return shell(ctx, '/host', 'Dashboard', html`
<div class="card">
  <h2 style="margin-top:0">Rounds</h2>
  <p class="small muted">Unlocking a round puts that envelope on every guest's phone within ~15 seconds and starts that round's timed texts.</p>
  <div class="rounds">${[0, 1, 2, 3].map((n) => html`<form method="post" action="/host/round" onsubmit="return confirm('Set the live round to ${ROUND_LABEL[n]}?')"><input type="hidden" name="round" value="${n}"><button class="btn ${state.liveRound === n ? 'on' : 'ghost'}" type="submit">${ROUND_LABEL[n]}</button></form>`)}</div>
  <p class="small muted">${[1, 2, 3].map((n) => (state.roundUnlockedAt[n] ? `${ROUND_LABEL[n]} unlocked at ${fmtTime(ctx, state.roundUnlockedAt[n])}. ` : ''))}</p>
</div>
<div class="grid">
  <div class="card"><h3 style="margin-top:0">Cast</h3>
    <p><b>${guestCount}</b> guests in play · ${loggedIn}/${loginIds.length} have logged in</p>
    ${missingPass ? html`<p class="pill warn">${missingPass} without passphrases. Open Roster to generate them.</p>` : ''}
    <p><a href="/host/roster">Roster & passphrases →</a></p></div>
  <div class="card"><h3 style="margin-top:0">Consistency</h3>
    <p>${errors ? pill('err', `${errors} errors`) : pill('ok', 'no errors')} ${warns ? pill('warn', `${warns} warnings`) : ''}</p>
    <p><a href="/host/check">Checker →</a></p></div>
  <div class="card"><h3 style="margin-top:0">Flex characters</h3>
    <ul class="small">${content.characterOrder.filter((id) => content.characters[id].tier === 'flex' && roster[id].status !== 'spare-unassigned').map((id) => html`<li>${content.characters[id].name}: ${pill(['confirmed', 'spare-assigned'].includes(roster[id].status) ? 'ok' : 'warn', roster[id].status)} ${roster[id].player || ''}</li>`)}</ul>
    <p><a href="/host/flex">Live vs. fallback →</a></p></div>
</div>
<div class="card">
  <h2 style="margin-top:0">Cue texts for ${ROUND_LABEL[state.liveRound]}</h2>
  ${cueSegs.length ? cueSegs.map((s) => html`<p><b>${s.title}</b></p>${s.send_texts.map((id) => cueButton(ctx, id))}`) : html`<p class="muted small">None linked to this round's run of show. All cue texts are on the <a href="/host/texts">Texts</a> page.</p>`}
</div>
<div class="card">
  <h2 style="margin-top:0">Coming up</h2>
  ${sched.length ? html`<table><tr><th>When</th><th>To</th><th>From</th><th>Text</th></tr>${sched.map((t) => html`<tr><td>${fmtTime(ctx, t.at)}</td><td>${t.to === 'all' ? 'Everyone' : content.names[t.to]}</td><td>${t.from}</td><td>${t.body}</td></tr>`)}</table>` : html`<p class="muted small">Nothing scheduled. Timed texts start when a round is unlocked.</p>`}
</div>
<div class="card">
  <h2 style="margin-top:0">Party date</h2>
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
  const segs = content.script.filter((s) => filterRound == null || s.round === filterRound);
  const rounds = [...new Set(content.script.map((s) => s.round))].sort((a, b) => a - b);
  return shell(ctx, '/host/script', 'Run of show', html`
<p class="inline-form small">${html`<a class="btn small ${filterRound == null ? '' : 'ghost'}" href="/host/script">All</a>`}${rounds.map((r) => html`<a class="btn small ${filterRound === r ? '' : 'ghost'}" href="/host/script?round=${r}">${ROUND_LABEL[r]}</a>`)}</p>
<p class="small muted">🆕 marks material added for the Part Two upgrades. Part One itself is unchanged in docs/source.</p>
${segs.map((s) => html`<section class="seg kind-${s.kind}" id="${s.slug}">
  <h2>${s.title}</h2>
  <div class="meta">${ROUND_LABEL[s.round]} · ${s.kind}${s.changes ? html` · <i>Changed: ${s.changes}</i>` : ''}</div>
  ${s.clues.length ? html`<p class="small">Evidence: ${s.clues.map((id) => html`<a class="pill" href="/host/evidence#${id}">${content.clues[id]?.title || id}</a> `)}</p>` : ''}
  ${s.send_texts.map((id) => cueButton(ctx, id))}
  ${raw(md(substitute(s.body, ctx), isLive))}
</section>`)}`);
}

// ---------------------------------------------------------------- timeline
export function timelinePage(ctx) {
  const { content } = ctx;
  const ev = content.timeline.events;
  const name = (id) => content.names[id] || id;
  const via = (v) => (v === 'host' ? 'Reggie' : content.clues[v] ? `clue: ${content.clues[v].title}` : name(v));
  const byRound = [0, 1, 2, 3].map((r) => ({ r, items: ev.flatMap((e) => (e.learned || []).filter((l) => l.round === r).map((l) => ({ e, l }))) }));
  return shell(ctx, '/host/timeline', 'True timeline', html`
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
  return shell(ctx, '/host/evidence', 'Evidence & props', html`
<p class="small muted">Tick props off as you prepare them. Hiding spots are suggestions; set the real ones in content/clues/*.yaml.</p>
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
  <td><b>${c.title}</b> ${c.critical ? pill('core', 'critical') : ''} ${pill('info', c.kind)} ${c.source === 'new' ? pill('flex', 'new') : ''}
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
<table><tr><th>Character</th><th>Tier</th><th>Player</th><th>Words</th><th>Preview as guest</th></tr>
${content.characterOrder.map((id) => {
  const c = content.characters[id];
  return html`<tr><td><a href="/host/characters/${id}">${c.name}</a><div class="small muted">${c.role}</div></td><td>${pill(c.tier)}</td>
  <td class="small">${roster[id].player || '—'} · ${roster[id].status}</td><td class="small">${wordCount(c)}</td>
  <td class="small">${[0, 1, 2, 3].map((r) => html`<a href="/host/preview/${id}?round=${r}">R${r}</a> `)}${ctx.canEdit ? html` · <a href="/host/edit/${id}">edit</a>` : ''}</td></tr>`;
})}</table>`);
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
  return shell(ctx, '/host/characters', c.name, html`
<p>${pill(c.tier)} ${c.effort ? pill('info', c.effort + ' effort') : ''} ${roster[id].player || 'unassigned'} · ${roster[id].status} · <span class="small muted">${c._file}</span></p>
<p class="small">Preview as guest: ${[0, 1, 2, 3].map((r) => html`<a href="/host/preview/${id}?round=${r}">Round ${r}</a> `)}${ctx.canEdit ? html` · <a href="/host/edit/${id}">Edit YAML</a>` : ''}</p>
${c.host_notes ? html`<div class="card"><b>Host notes.</b> ${raw(md(c.host_notes))}</div>` : ''}
${c.fallback ? html`<div class="card"><b>Fallback if not cast.</b> ${raw(md(c.fallback))}</div>` : ''}
<div class="grid">
  <div class="card"><h3 style="margin-top:0">Secret</h3>${raw(md(c.secret))}<h3>Mission</h3>${raw(md(c.mission))}</div>
  <div class="card"><h3 style="margin-top:0">Evening</h3><ul>${c.evening.map((e) => html`<li><span class="mono">${e.at}${e.until ? '–' + e.until : ''}</span> <span class="muted">${e.where}</span>: ${raw(mdInline(e.text))}</li>`)}</ul></div>
</div>
${[1, 2, 3].map((n) => html`<div class="card"><h3 style="margin-top:0">${ROUND_LABEL[n]}</h3><div class="mono small" style="white-space:pre-wrap">${c.rounds[n].text}</div><p><b>Reveal:</b></p><ul>${c.rounds[n].reveal.map((r) => html`<li>${r}</li>`)}</ul></div>`)}
<div class="card"><h3 style="margin-top:0">Texts</h3><table>${(c.texts || []).map((t) => html`<tr><td class="small">${trig(t)}</td><td><b>${t.from}</b>${t.stamp ? html` <span class="muted small">(${t.stamp})</span>` : ''}: ${t.body}</td></tr>`)}</table></div>
<div class="card"><h3 style="margin-top:0">Connections</h3><ul>${c.relationships.map((r) => html`<li><b>${name(r.with)}</b>${r.if ? html` ${pill('flex', 'if ' + r.if)}` : ''}: ${r.text}</li>`)}</ul></div>`);
}

export function editPage(ctx, id, text, error) {
  const c = ctx.content.characters[id];
  return shell(ctx, '/host/characters', `Edit ${c.name}`, html`
<p class="small muted">Editing <span class="mono">${c._file}</span> directly. This page only exists when running locally (npm run dev). Commit your changes with git.</p>
${error ? html`<div class="flash bad">${error}</div>` : ''}
<form method="post" action="/host/edit/${id}"><textarea name="yaml" style="min-height:70vh">${text}</textarea>
<p><button class="btn" type="submit">Save</button> <a href="/host/characters/${id}">Cancel</a></p></form>`);
}

// ---------------------------------------------------------------- checker
export function checkPage(ctx) {
  const findings = checkContent(ctx.content, ctx.state);
  return shell(ctx, '/host/check', 'Consistency checker', html`
<p class="small muted">Checks every character, clue, text and script segment against the true timeline and the spoiler rules: undefined characters, impossible whereabouts, flex characters near the study, page-length parity, and more. Run it from the terminal with <span class="mono">npm run check</span>.</p>
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

export function hostNotFound(ctx) {
  return shell(ctx, '', 'Not found', html`<p>No such page.</p>`);
}
