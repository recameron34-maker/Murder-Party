#!/usr/bin/env node
// Builds a static, read-only PREVIEW of the whole site into site/ for
// GitHub Pages: the host planner (run of show, timeline, evidence, checker,
// characters, flex, print views) and every guest page at every round.
//
// It is NOT the party site. Static hosting can't check passphrases, unlock
// rounds or deliver texts, so buttons are inert, and everything here is
// visible to anyone with the link, spoilers included. No passphrases are
// generated, so nothing in it can be used to log in to the real site.
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/content-loader.mjs';
import { defaultState } from '../src/lib/state.mjs';
import { checkContent } from '../src/lib/check.mjs';
import { rosterHelpers } from '../src/lib/roster.mjs';
import * as host from '../src/views/host.mjs';
import { guestPage, loginPage } from '../src/views/guest.mjs';
import { printView } from '../src/views/print.mjs';
import { html, toString } from '../src/lib/html.mjs';
import { page } from '../src/views/layout.mjs';
import { HOST_CSS } from '../src/views/styles.mjs';

const OUT = path.resolve('site');
const content = loadContent();
const state = defaultState();
const now = new Date();
const ctx = (p) => ({ content, state, now, path: p, origin: '', canEdit: false, flash: null });
const ROUNDS = [0, 1, 2, 3];

// route ("/host/script?round=2") → html
const pages = new Map();
const add = (route, body) => pages.set(route, body);

add('/host', host.dashboardPage(ctx('/host')));
add('/host/roster', host.rosterPage(ctx('/host/roster')));
add('/host/texts', host.textsPage(ctx('/host/texts')));
add('/host/script', host.scriptPage(ctx('/host/script'), null));
for (const r of [...new Set(content.script.map((s) => s.round))]) add(`/host/script?round=${r}`, host.scriptPage(ctx('/host/script'), r));
add('/host/timeline', host.timelinePage(ctx('/host/timeline')));
add('/host/evidence', host.evidencePage(ctx('/host/evidence')));
add('/host/characters', host.charactersPage(ctx('/host/characters')));
add('/host/check', host.checkPage(ctx('/host/check')));
add('/host/flex', host.flexPage(ctx('/host/flex')));
add('/host/print', host.printIndexPage(ctx('/host/print')));
add('/host/map', host.mapPage(ctx('/host/map')));
add('/host/setup', host.setupPage(ctx('/host/setup')));
add('/host/web', host.webPage(ctx('/host/web')));
add('/host/suspicion', host.suspicionPage(ctx('/host/suspicion')));
for (const id of content.characterOrder) {
  add(`/host/characters/${id}`, host.characterPage(ctx('/host/characters'), id));
  add(`/host/preview/${id}`, guestPage(content, state, id, { round: 0, preview: true, now }));
  for (const r of ROUNDS) add(`/host/preview/${id}?round=${r}`, guestPage(content, state, id, { round: r, preview: true, now }));
}
for (const kind of ['cards', 'evidence', 'ballots', 'cash', 'hints', 'signs']) add(`/host/print/${kind}`, printView(ctx('/host/print'), kind, new URLSearchParams()));
for (const r of [1, 2, 3]) add(`/host/print/envelopes?round=${r}`, printView(ctx('/host/print'), 'envelopes', new URLSearchParams({ round: String(r) })));
add('/guest-login', loginPage());

// ---------------------------------------------------------------- paths
function fileFor(route) {
  const [p, q] = route.split('?');
  const round = q ? new URLSearchParams(q).get('round') : null;
  const dir = p.replace(/^\/+|\/+$/g, '');
  return path.join(dir, round != null ? `round-${round}` : '', 'index.html');
}

function rel(fromRoute, href) {
  if (!href.startsWith('/')) return href;
  const [target, hash = ''] = href.split('#');
  const key = target.replace(/\/+$/, '') || '/';
  if (!pages.has(key) && key !== '/') return '#';
  const toFile = key === '/' ? 'index.html' : fileFor(key);
  const fromDir = path.dirname(fileFor(fromRoute));
  let r = path.relative(fromDir, path.dirname(toFile)) || '.';
  r = r.split(path.sep).join('/') + '/';
  return r + (hash ? `#${hash}` : '');
}

const BANNER = `<div class="static-banner">Static preview on GitHub Pages. Buttons and logins don't work here, and this page is visible to anyone with the link, <b>spoilers included</b>. <a href="__HOME__">Preview home</a></div>`;
const BANNER_CSS = `<style>.static-banner{background:#3b2a12;color:#f7dfa9;font:14px/1.4 system-ui,sans-serif;padding:8px 14px;text-align:center}.static-banner a{color:#ffe7b0}form{pointer-events:none;opacity:.55}form input,form select,form textarea{pointer-events:none}@media print{.static-banner{display:none}}</style>`;

function finalize(route, htmlText) {
  let out = htmlText
    .replace(/(href|action)="(\/[^"]*)"/g, (_, attr, href) => `${attr}="${attr === 'action' ? '#' : rel(route, href.replace(/&amp;/g, '&'))}"`)
    .replace(/<\/head>/, `${BANNER_CSS}</head>`);
  const home = rel(route, '/');
  out = out.replace(/(<body[^>]*>)/, `$1${BANNER.replace('__HOME__', home)}`);
  return out;
}

// ---------------------------------------------------------------- index
const findings = checkContent(content, state);
const errors = findings.filter((f) => f.level === 'error').length;
const { guestCount } = rosterHelpers(content, state);
const ROUND_NAMES = ['Before', 'R1', 'R2', 'R3'];
const index = page({
  title: 'Blackwood Manor: preview',
  css: HOST_CSS,
  body: html`<main class="wrap">
<h1>Murder at Blackwood Manor: build preview</h1>
<p class="flash bad"><b>Spoilers.</b> This is a read-only snapshot of the host planner and every guest's page, for checking progress. Anyone with this link can read everything, including the solution. Don't send it to guests. The real party site (passphrase logins, rounds, live texts) runs on Cloudflare; see the README.</p>
<p class="small muted">Built ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · ${guestCount} guests cast · ${content.characterOrder.length} characters · ${content.clueOrder.length} clues · consistency checker: ${errors ? `${errors} errors` : 'no errors'}</p>
<div class="grid">
  ${[
    ['/host', 'Host dashboard', 'Round controls, what must happen this round, the suspicion curve.'],
    ['/host/setup', 'Setting up the flat', 'Your floor plan: which room plays what, and where each piece of evidence hides.'],
    ['/host/map', 'The manor map', 'Rooms, the secret passage, evidence pins, and a minute-by-minute replay of the murder.'],
    ['/host/timeline', 'True timeline', 'Where everyone was, as charts, plus when players learn each fact.'],
    ['/host/web', 'Relationship web', 'Who is tied to whom. Click a face.'],
    ['/host/suspicion', 'Suspicion curve', 'Who the room should suspect at each stage.'],
    ['/host/script', 'Run of show', "Reggie's script, round by round."],
    ['/host/evidence', 'Evidence & props', 'What to hide, where, and what it means.'],
    ['/host/characters', 'Characters', `All ${content.characterOrder.length} dossiers.`],
    ['/host/texts', 'Phone texts', 'Every timed and cue text.'],
    ['/host/flex', 'Flex coverage', 'Which optional lines are live.'],
    ['/host/check', 'Consistency checker', 'Contradictions and spoiler risks.'],
    ['/host/print', 'Print views', 'Envelopes, cards, ballots, cash, hints.'],
    ['/guest-login', 'Guest login screen', 'What guests see first.'],
  ].map(([href, label, desc]) => html`<a class="card" style="text-decoration:none;color:inherit" href="${href}"><h3 style="margin:0">${label}</h3><p class="small muted" style="margin:.3em 0 0">${desc}</p></a>`)}
</div>
<h2>Guest pages (as each guest sees them)</h2>
<table><tr><th>Character</th><th>Tier</th><th>Round</th></tr>
${content.characterOrder.map((id) => html`<tr><td>${content.characters[id].name}</td><td><span class="pill ${content.characters[id].tier}">${content.characters[id].tier}</span></td><td>${ROUNDS.map((r) => html`<a href="/host/preview/${id}?round=${r}">${ROUND_NAMES[r]}</a> `)}</td></tr>`)}
</table>
</main>`,
});
pages.set('/', index);

// ---------------------------------------------------------------- write
fs.rmSync(OUT, { recursive: true, force: true });
for (const [route, body] of pages) {
  const file = route === '/' ? 'index.html' : fileFor(route);
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, finalize(route, typeof body === 'string' ? body : toString(body)));
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(OUT, '404.html'), page({ title: 'Not found', css: HOST_CSS, body: html`<main class="wrap"><h1>Not found</h1><p><a href="/Murder-Party/">Preview home</a></p></main>` }));
console.log(`Built static preview: ${pages.size} pages in site/`);
