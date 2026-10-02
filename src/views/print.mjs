// Print-ready pages (host only). Envelopes and cards resolve flex
// conditionals against the current roster, so they print what's live.
import { html, raw, toString } from '../lib/html.mjs';
import { md, mdInline, applyConditionals } from '../lib/markdown.mjs';
import { rosterHelpers } from '../lib/roster.mjs';
import { FONTS, PRINT_CSS } from './styles.mjs';
import { gameLabel } from './visuals.mjs';
import { prop } from './props.mjs';
import { portrait } from './portraits.mjs';

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
  <div class="card-portrait">${portrait(id, c.name, content.portraits?.[id], 90)}</div>
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
  <div class="ev-art">${prop(id, { size: 96 })}</div>
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
    case 'badges':
      // Name badges: name and public role only (what everyone knows).
      return printPage('Name badges', chunk(liveIds, 8).map((group) => html`<div class="page"><div class="badges">${group.map((id) => html`<div class="badge"><div class="stamp">BLACKWOOD MANOR · MIDNIGHT SUPPER</div><div class="b-portrait">${portrait(id, chars[id].name, content.portraits?.[id], 64)}</div><div class="b-name">${chars[id].name}</div><div class="b-role">${chars[id].public_role}</div></div>`)}</div></div>`));
    case 'awards': {
      const awards = content.party.awards || [];
      return printPage('Award certificates', awards.map((a) => html`<div class="page sign certificate"><div class="stamp">BLACKWOOD MANOR · THE MIDNIGHT SUPPER</div><p class="sign-sub">The house is pleased to recognise</p><div class="cert-line"></div><h1>${a.title}</h1><p class="sign-line">${a.for}</p><p class="cert-foot">Signed at midnight, in the presence of the raven.<br>Reginald Blackwood, host</p></div>`));
    }
    case 'signs': {
      const venue = content.venue || {};
      const gc = content.guestCommon || {};
      const sign = (big, small, line) => html`<div class="page sign"><div class="stamp">BLACKWOOD MANOR</div><h1>${big}</h1><p class="sign-sub">${small}</p>${line ? html`<p class="sign-line">${I(line)}</p>` : ''}</div>`;
      const games = [...(venue.areas || []).filter((a) => a.game).map((a) => a.game), ...(venue.spots || []).map((sp) => sp.game)];
      const shutDoors = (venue.areas || []).filter((a) => a.shut && !/closet/i.test(a.name));
      return printPage('Room signs', [
        ...games.map((g) => sign(`THE ${gameLabel(g, content.lore.rooms).toUpperCase()}`, 'A room of Blackwood Manor', gc.rooms?.[g])),
        ...shutDoors.map((a) => sign('EAST WING · SHUT', a.name, 'The east wing stays dark. Nothing in here is part of the game.')),
      ]);
    }
    default:
      return null;
  }
}
