// Print-ready pages (host only). Envelopes and cards resolve flex
// conditionals against the current roster, so they print what's live.
import { html, raw, toString } from '../lib/html.mjs';
import { md, mdInline, applyConditionals } from '../lib/markdown.mjs';
import { rosterHelpers } from '../lib/roster.mjs';
import { FONTS, PRINT_CSS } from './styles.mjs';

const ROUND_WORDS = { 1: 'Round One', 2: 'Round Two', 3: 'Round Three' };

function printPage(title, inner) {
  return (
    '<!doctype html>' +
    toString(html`<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title}</title><link rel="stylesheet" href="${FONTS}"><style>${raw(PRINT_CSS)}</style></head><body>
<div class="noprint">${title}: <button onclick="window.print()">Print / Save as PDF</button> <a href="/host/print">Back</a></div>
${inner}</body></html>`)
  );
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function printView(ctx, kind, query) {
  const { content, state } = ctx;
  const { roster, isLive, liveIds, canLogin } = rosterHelpers(content, state);
  const M = (t) => raw(md(t, isLive));
  const I = (t) => raw(mdInline(applyConditionals(t, isLive)));
  const name = (id) => content.names[id] || id;
  const chars = content.characters;

  switch (kind) {
    case 'passphrases': {
      const ids = content.characterOrder.filter((id) => canLogin(id) && state.passphrases[id]);
      return printPage('Login cards', chunk(ids, 6).map((group) => html`<div class="page"><div class="cards">${group.map((id) => html`<div class="cardp">
  <div class="stamp">BLACKWOOD MANOR</div>
  <p>For <b>${roster[id].player || ''}</b></p>
  <h2>${chars[id].name}</h2>
  <p>Go to <b>${ctx.origin}</b><br>and speak your passphrase:</p>
  <p style="font:700 15pt ui-monospace,Menlo,monospace">${state.passphrases[id]}</p>
  <p style="font-size:9pt">Never share it. Your secrets depend on it.</p></div>`)}</div></div>`));
    }
    case 'cards':
      return printPage('Character cards', liveIds.map((id) => {
        const c = chars[id];
        return html`<div class="page">
  <div class="env-head"><span class="r">Blackwood Manor · Character</span><span>For ${roster[id].player || ''} only</span></div>
  <h1>${c.name}</h1><p><i>${c.role}</i>: ${c.tagline}</p>
  ${M(c.intro)}<h3>Costume</h3>${M(c.costume)}<h3>Your story</h3>${M(c.backstory)}
  <h3>Connections</h3><ul>${c.relationships.filter((r) => !r.if || isLive(r.if)).map((r) => html`<li><b>${name(r.with)}</b>: ${I(r.text)}</li>`)}</ul>
  <h3>Your evening</h3><ul>${c.evening.map((e) => html`<li><b>${e.at}${e.until ? '–' + e.until : ''}</b> ${I(e.text)}</li>`)}</ul>
  <h3>What you know</h3><ul>${c.knows.map((k) => html`<li>${I(k)}</li>`)}</ul>
  <h3>Your secret</h3>${M(c.secret)}
  <h3>If someone pays you</h3><ul>${c.blackmail.map((b) => html`<li>${I(b)}</li>`)}</ul>
  <h3>Private instructions</h3><ul>${c.instructions.map((b) => html`<li>${I(b)}</li>`)}</ul>
</div>`;
      }));
    case 'envelopes': {
      const n = Number(query.get('round')) || 1;
      return printPage(`${ROUND_WORDS[n]} envelopes`, liveIds.map((id) => {
        const c = chars[id];
        const r = c.rounds[n];
        return html`<div class="page">
  <div class="env-head"><span class="r">Blackwood Manor · ${ROUND_WORDS[n]}</span><span>${c.name}: for ${roster[id].player || ''} only</span></div>
  ${M(r.text)}
  <div class="reveal"><b>You must reveal this round:</b><ul>${r.reveal.map((x) => html`<li>${I(x)}</li>`)}</ul></div>
  ${n === 1 ? html`<div class="reveal"><b>Secret mission ($1,000 from Reggie):</b> ${M(c.mission)}</div>` : ''}
</div>`;
      }));
    }
    case 'evidence': {
      const ids = content.clueOrder.filter((id) => content.clues[id].kind !== 'spoken' && content.clues[id].print);
      return printPage('Evidence cards', chunk(ids, 4).map((group) => html`<div class="page"><div class="cards">${group.map((id, i) => html`<div class="cardp">
  <div class="stamp">BLACKWOOD EVIDENCE</div>
  <div class="pre">${content.clues[id].print.trim()}</div>
  <div style="position:absolute;bottom:3mm;right:4mm;font-size:7pt;color:#777">R${content.clues[id].round} · ${id}</div></div>`)}</div></div>`));
    }
    case 'ballots':
      return printPage('Accusation ballots', chunk(Array.from({ length: Math.ceil(liveIds.length / 4) * 4 }), 4).map((g) => html`<div class="page"><div class="cards">${g.map(() => html`<div class="ballot">
  <div class="stamp">ACCUSATION</div>
  <p><b>Who killed Arthur Blackwood?</b></p><div class="line"></div>
  <p><b>Why?</b></p><div class="line"></div>
  <p><b>How did they escape the study?</b></p><div class="line"></div>
  <p><b>Time of death (optional)</b></p><div class="line"></div>
  <p style="font-size:9pt">Your name: ____________________</p></div>`)}</div></div>`));
    case 'cash': {
      const count = liveIds.length * 3 + 30;
      return printPage('Blackmail Cash', chunk(Array.from({ length: count }), 8).map((g) => html`<div class="page"><div class="cards">${g.map(() => html`<div class="bill">
  <div style="display:flex;justify-content:space-between"><span class="amt">$1,000</span><span class="amt">✦</span></div>
  <div class="mid">BLACKWOOD BLACKMAIL NOTE<br><span style="font-size:9pt;letter-spacing:.05em">"Information is the only currency more powerful than money." · A.B.</span></div>
  <div style="display:flex;justify-content:space-between"><span style="font-size:9pt">Payable in truth</span><span class="amt">$1,000</span></div></div>`)}</div></div>`));
    }
    case 'hints':
      return printPage('Hint cards', chunk(content.hints, 6).map((g) => html`<div class="page"><div class="cards">${g.map((h) => html`<div class="cardp" style="min-height:50mm">
  <div class="stamp">${h.category}</div><p style="font-size:15pt"><i>"${h.text}"</i></p>
  <div style="position:absolute;bottom:3mm;right:4mm;font-size:7pt;color:#777">from Round ${h.from_round}</div></div>`)}</div></div>`));
    default:
      return null;
  }
}
