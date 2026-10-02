// Visuals: portrait crests, the manor map, timeline charts, relationship
// webs, the family tree, the suspicion heat map and the round stepper.
// Everything is server-rendered inline SVG/HTML, so it works in the Worker,
// in local dev and in the static preview with no client libraries.
//
// SPOILER RULE: anything with `mode: 'guest'` (or used on guest pages) may
// only show public lore or the viewing guest's own data. The hidden passage,
// evidence locations, other people's whereabouts and room "zones" are host-only.
import { html, raw } from '../lib/html.mjs';
import { parseClock, formatClock } from '../lib/time.mjs';

// ---------------------------------------------------------------- helpers
function hash(str) {
  let h = 2166136261;
  for (const ch of String(str)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}
const CREST_COLORS = ['#7a1f2b', '#2f4f4f', '#4b3a6b', '#6b4f1d', '#1f4a6b', '#5a2d4a', '#3f5a2a', '#6b2f1f', '#3a3f6b', '#5e3a1f'];
const ROOM_COLORS = ['#5a4a6b', '#4a5a6b', '#6b5a4a', '#4a6b5a', '#6b4a5a', '#5a6b4a', '#4a4a6b', '#6b4a4a'];

export function initials(name) {
  const cleaned = String(name)
    .replace(/"[^"]*"/g, ' ')
    .replace(/,.*$/, ' ')
    .replace(/\b(Dr|Professor|Lady|Mrs|Mr|Sir)\.?\s/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  if (!words.length) return String(name).slice(0, 1).toUpperCase();
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

export function shortName(name) {
  const nick = /"([^"]+)"/.exec(name);
  if (nick) return nick[1].replace(/^Mrs\. /, 'Mrs. ');
  return String(name).replace(/^(Dr\.|Professor|Lady)\s+/, '').split(/[\s,]/)[0];
}

// Short labels for a whole names map, with clashes told apart by surname
// initial ("Jimmy C." and "Jimmy F."). Same output for every viewer.
const shortCache = new WeakMap();
export function shortNames(names) {
  let out = shortCache.get(names);
  if (out) return out;
  out = {};
  const groups = {};
  for (const [id, n] of Object.entries(names)) (groups[shortName(n)] ||= []).push(id);
  for (const [short, ids] of Object.entries(groups)) {
    for (const id of ids) {
      const last = String(names[id]).replace(/"[^"]*"/g, ' ').replace(/\(.*\)/, ' ').trim().split(/\s+/).pop();
      out[id] = ids.length > 1 && last && last !== short ? `${short} ${last[0]}.` : short;
    }
  }
  shortCache.set(names, out);
  return out;
}
const labelOf = (content, id) => shortNames(content.names || {})[id] || shortName(content.characters[id]?.name || id);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------------------------------------------------------------- crest (portrait medallion)
export function crestSvg(id, name, size = 56) {
  const color = id === 'arthur' ? '#1a1214' : CREST_COLORS[hash(id) % CREST_COLORS.length];
  const ini = initials(name);
  const fs = ini.length > 1 ? 21 : 26;
  return `<svg class="crest" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(name)}"><circle cx="32" cy="32" r="30" fill="${color}" stroke="#c9a45c" stroke-width="2.5"/><circle cx="32" cy="32" r="25" fill="none" stroke="#e3c788" stroke-opacity=".45" stroke-width="1" stroke-dasharray="1.5 3"/><path d="M14 22 Q32 8 50 22" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="6"/><text x="32" y="${ini.length > 1 ? 39.5 : 41}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="700" font-size="${fs}" fill="#f3e6c8">${esc(ini)}</text></svg>`;
}
export const crest = (id, name, size) => raw(crestSvg(id, name, size));

// ---------------------------------------------------------------- round stepper
export function roundStepper(live, { labels = ['Before', 'Round One', 'Round Two', 'Round Three', 'Reveal'], compact = false } = {}) {
  return html`<ol class="stepper${compact ? ' compact' : ''}" aria-label="Progress through the night">${labels.map((label, i) => html`<li class="${i < live ? 'done' : i === live ? 'now' : ''}"><span class="dot">${i < live ? '✓' : i === 0 ? '✦' : ['', 'I', 'II', 'III', '★'][i]}</span><span class="lbl">${label}</span></li>`)}</ol>`;
}

// ---------------------------------------------------------------- the manor map
// Coordinates are in a 900×540 plan. Labels are short versions of lore.yaml names.
export const ROOM_GEO = {
  terrace: { x: 130, y: 16, w: 280, h: 58, label: 'Terrace', outside: true },
  conservatory: { x: 20, y: 90, w: 110, h: 310, label: 'Conservatory' },
  'drawing-room': { x: 130, y: 90, w: 280, h: 150, label: 'Drawing Room' },
  gallery: { x: 410, y: 90, w: 310, h: 150, label: 'Portrait Gallery' },
  study: { x: 720, y: 150, w: 160, h: 180, label: 'Study' },
  'east-corridor': { x: 410, y: 240, w: 310, h: 45, label: 'East Corridor', corridor: true },
  'front-hall': { x: 290, y: 240, w: 120, h: 160, label: 'Front Hall' },
  'billiard-room': { x: 130, y: 240, w: 160, h: 160, label: 'Billiard Room' },
  'library-corridor': { x: 410, y: 355, w: 310, h: 45, label: 'Library Corridor', corridor: true },
  library: { x: 720, y: 330, w: 160, h: 170, label: 'Library' },
  'dining-room': { x: 130, y: 400, w: 280, h: 120, label: 'Dining Room' },
  kitchen: { x: 20, y: 400, w: 110, h: 120, label: 'Kitchens ↓' },
  'east-wing': { x: 410, y: 400, w: 310, h: 120, label: 'East Wing (shut)', shut: true },
};
const ZONE_STROKE = { 'murder-zone': '#c0495a', 'escape-zone': '#e3c788' };

export function manorMap({ mode = 'guest', rooms = {}, pins = [], linkRooms = false } = {}) {
  const host = mode === 'host';
  const parts = [];
  parts.push(`<rect x="0" y="0" width="900" height="540" fill="#120d14"/>`);
  // wall mass between the two east corridors
  parts.push(`<rect x="410" y="285" width="310" height="70" fill="#0c080d"/>`);
  parts.push(`<text x="565" y="326" text-anchor="middle" class="m-wall">· · ·  the walls  · · ·</text>`);
  for (const [id, g] of Object.entries(ROOM_GEO)) {
    const zone = rooms[id]?.zone;
    const stroke = host && ZONE_STROKE[zone] ? ZONE_STROKE[zone] : '#6d5a74';
    const fill = g.outside ? 'url(#m-rain)' : g.shut ? 'url(#m-hatch)' : g.corridor ? '#241b27' : id === 'study' ? '#2a1519' : '#1f1722';
    const rect = `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${fill}" stroke="${stroke}" stroke-width="${host && ZONE_STROKE[zone] ? 3 : 2}"${g.outside ? ' stroke-dasharray="8 6"' : ''} rx="3"/>`;
    const lx = g.x + g.w / 2;
    const ly = g.corridor ? g.y + g.h / 2 + 7 : g.y + 30;
    const label = `<text x="${lx}" y="${ly}" text-anchor="middle" class="m-label${g.corridor ? ' m-corr' : ''}">${esc(g.label)}</text>`;
    const group = `<g class="m-room" data-room="${id}"><title>${esc(rooms[id]?.title || g.label)}</title>${rect}${label}</g>`;
    parts.push(linkRooms ? `<a href="#room-${id}">${group}</a>` : group);
  }
  // furniture flourishes (public): the desk and raven in the study, the long table
  parts.push(`<rect x="770" y="225" width="70" height="28" fill="#3a2a1f" stroke="#6b4f1d"/><text x="805" y="218" text-anchor="middle" class="m-tiny">desk</text>`);
  parts.push(`<rect x="170" y="455" width="200" height="26" rx="13" fill="#2e2219" stroke="#6b4f1d"/><text x="270" y="500" text-anchor="middle" class="m-tiny">the Supper table</text>`);
  parts.push(`<path d="M300 300 h50 v40 h-50" fill="none" stroke="#6d5a74" stroke-width="1.5"/><text x="350" y="360" text-anchor="middle" class="m-tiny">stairs</text>`);
  if (host) {
    // The Raven's Walk: study fireplace → library bookcase.
    parts.push(`<path d="M864 296 C 880 316, 850 344, 864 366" fill="none" stroke="#c0495a" stroke-width="4" stroke-dasharray="7 5"/><circle cx="864" cy="296" r="5" fill="#c0495a"/><circle cx="864" cy="366" r="5" fill="#c0495a"/><text x="856" y="392" class="m-secret" text-anchor="end">Raven's Walk ↑</text>`);
    for (const p of pins) {
      parts.push(`<g class="m-pin"><title>${esc(p.title)}</title><circle cx="${p.x}" cy="${p.y}" r="11" fill="${p.color}" stroke="#0d090f" stroke-width="2"/><text x="${p.x}" y="${p.y + 4.5}" text-anchor="middle" class="m-pinnum">${esc(p.label)}</text></g>`);
    }
    parts.push(`<g id="m-dots"></g>`);
  }
  const defs = `<defs><pattern id="m-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#17111a"/><line x1="0" y1="0" x2="0" y2="10" stroke="#2b2230" stroke-width="4"/></pattern><pattern id="m-rain" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#141c18"/><line x1="2" y1="0" x2="0" y2="7" stroke="#2c3d34" stroke-width="1.2"/><line x1="11" y1="6" x2="9" y2="13" stroke="#2c3d34" stroke-width="1.2"/></pattern></defs>`;
  const style = `<style>.m-label{font:600 19px 'Cormorant Garamond',Georgia,serif;fill:#e9dcc6}.m-corr{font-size:16px;fill:#b9a993}.m-tiny{font:italic 13px Georgia,serif;fill:#8f8070}.m-wall{font:italic 14px Georgia,serif;fill:#4a3d50;letter-spacing:.1em}.m-room:hover rect{filter:brightness(1.25)}${host ? ".m-secret{font:700 15px 'Cormorant Garamond',Georgia,serif;fill:#ff9fac}.m-pinnum{font:700 12px system-ui,sans-serif;fill:#fff}" : ''}</style>`;
  return raw(`<div class="map-wrap"><svg class="manor-map" viewBox="0 0 900 540" role="img" aria-label="Plan of the ground floor of Blackwood Manor">${defs}${style}${parts.join('')}</svg></div>`);
}

// ---------------------------------------------------------------- the real venue (Ross's flat)
// Drawn from content/venue.yaml. Guest mode shows rooms, what each one plays
// tonight and which are shut. Host mode adds evidence pins. Neither shows the
// passage: it doesn't exist in the flat, only in the story.
const bbox = (shape) => {
  const xs = shape.map((p) => p[0]);
  const ys = shape.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
export const gameLabel = (id, rooms) => (ROOM_GEO[id]?.label || rooms?.[id]?.name || id).replace(/\s*[↓(].*$/, '').replace(/^Kitchens$/, 'Kitchens');

// Split a label into lines that fit a width, at roughly 0.52em per character.
function wrapLabel(text, width, fs) {
  const max = Math.max(4, Math.floor((width - 10) / (fs * 0.52)));
  const lines = [];
  for (const w of String(text).split(' ')) {
    if (lines.length && (lines[lines.length - 1] + ' ' + w).length <= max) lines[lines.length - 1] += ' ' + w;
    else lines.push(w);
  }
  return lines;
}

export function venueSpot(venue, gameId) {
  const sp = (venue.spots || []).find((x) => x.game === gameId);
  if (sp) return { kind: 'spot', area: sp.area, at: sp.at };
  const a = (venue.areas || []).find((x) => x.game === gameId);
  return a ? { kind: 'area', area: a.id, box: bbox(a.shape) } : null;
}

// "the Living Room, by the front door": where a manor room is tonight.
export function venueWhere(venue, gameId) {
  const sp = (venue.spots || []).find((x) => x.game === gameId);
  const a = (venue.areas || []).find((x) => x.id === (sp ? sp.area : (venue.areas || []).find((y) => y.game === gameId)?.id));
  if (!a) return null;
  const detail = sp ? sp.label : a.game_where;
  return `the ${a.name}${detail ? `, ${detail}` : ''}`;
}

export function venueAreaName(venue, gameId) {
  const where = venueSpot(venue, gameId);
  const a = where && (venue.areas || []).find((x) => x.id === where.area);
  return a ? a.name : null;
}

// Evidence pins for the host setup map: beside the spot's marker, or along
// the bottom of the room that plays the manor room. Positions are worked out
// per orientation in venueSvg.
export function venuePins(venue, items) {
  const counts = new Map();
  const pins = [];
  for (const it of items) {
    const where = venueSpot(venue, it.room);
    if (!where) continue;
    const key = `${where.kind}:${where.area}:${it.room}`;
    const i = counts.get(key) || 0;
    counts.set(key, i + 1);
    pins.push({ ...it, where, i });
  }
  return pins;
}

// One orientation of the plan. `tall` turns it a quarter turn clockwise (the
// balcony at the top, the study at the bottom) so it fits a phone; text stays
// upright because every coordinate goes through T() and text is placed after.
function venueSvg(venue, { host, rooms, pins, linkRooms, tall, secret }) {
  const [vx, vy, vw, vh] = venue.viewbox || [0, 0, 1206, 647];
  const T = tall ? (x, y) => [vy + vh - y, x - vx] : (x, y) => [x - vx, y - vy];
  const W = tall ? vh : vw;
  const H = tall ? vw : vh;
  const k = tall ? 1.15 : 1.35; // font scale
  const pts = (shape) => shape.map(([x, y]) => T(x, y).join(',')).join(' ');
  const parts = [`<rect x="0" y="0" width="${W}" height="${H}" fill="#120d14"/>`];
  for (const a of venue.areas || []) {
    const fill = a.shut ? 'url(#v-hatch)' : a.outside && a.game ? 'url(#v-rain)' : a.outside ? '#0f0b11' : a.game === 'study' ? '#2a1519' : a.game ? '#211825' : '#19131c';
    const stroke = a.outside && !a.game ? '#3a3040' : '#7a6683';
    parts.push(`<polygon points="${pts(a.shape)}" fill="${fill}" stroke="${stroke}" stroke-width="${a.outside && !a.game ? 1.5 : 5}" stroke-linejoin="round"${a.outside ? ' stroke-dasharray="9 6"' : ''}/>`);
  }
  for (const [x1, y1, x2, y2] of venue.openings || []) {
    const [X1, Y1] = T(x1, y1);
    const [X2, Y2] = T(x2, y2);
    parts.push(`<line x1="${X1}" y1="${Y1}" x2="${X2}" y2="${Y2}" stroke="#211825" stroke-width="7"/>`);
  }
  const text = [];
  for (const a of venue.areas || []) {
    const b = bbox(a.shape.map(([x, y]) => T(x, y)));
    const [cx, cy] = a.label_at ? T(...a.label_at) : [b.x + b.w / 2, b.y + b.h / 2];
    const body = [];
    if (a.label === false) {
      // drawn, but unlabelled (an entrance labels it)
    } else if (a.game) {
      const label = gameLabel(a.game, rooms);
      const longest = Math.max(...label.split(' ').map((w) => w.length));
      // shrink (to a floor) when one word is wider than a narrow room
      const fs = Math.round(Math.max(14, Math.min((b.w < 120 ? 16 : 20) * k, (b.w - 4) / (longest * 0.55))));
      const lines = wrapLabel(label, b.w, fs);
      const top = cy - ((lines.length - 1) * fs * 1.05) / 2 - 6;
      lines.forEach((ln, i) => body.push(`<text x="${cx}" y="${top + i * fs * 1.05}" text-anchor="middle" class="v-game" style="font-size:${fs}px">${esc(ln)}</text>`));
      const rs = Math.round(12 * k);
      const room = 2 * Math.min(cx - b.x, b.x + b.w - cx) - 10;
      const withSize = host && a.size && (a.name.length + a.size.length + 3) * rs * 0.55 < room;
      body.push(`<text x="${cx}" y="${top + (lines.length - 1) * fs * 1.05 + 14 + 8 * k}" text-anchor="middle" class="v-real" style="font-size:${rs}px">${esc(a.name)}${withSize ? ` · ${esc(a.size)}` : ''}</text>`);
    } else if (a.shut) {
      const fs = Math.round(12 * k);
      const lines = wrapLabel(a.name, b.w, fs);
      lines.forEach((ln, i) => body.push(`<text x="${cx}" y="${cy - 4 + i * (fs + 2)}" text-anchor="middle" class="v-shut" style="font-size:${fs}px">${esc(ln)}</text>`));
      if (b.w > 60 && b.h > 60) body.push(`<text x="${cx}" y="${cy + fs + 6 + (lines.length - 1) * (fs + 2)}" text-anchor="middle" class="v-shutnote" style="font-size:${Math.round(9 * k)}px">shut</text>`);
    } else {
      const fs = Math.round(12.5 * k);
      const lines = wrapLabel(a.name, b.w, fs);
      lines.forEach((ln, i) => body.push(`<text x="${cx}" y="${cy + i * (fs + 2)}" text-anchor="middle" class="v-plain" style="font-size:${fs}px">${esc(ln)}</text>`));
    }
    const title = a.game ? `${rooms[a.game]?.name || gameLabel(a.game, rooms)}: ${a.name}${a.size ? ` (${a.size})` : ''}` : `${a.name}${a.shut ? ' (shut tonight)' : ''}`;
    const g = `<g class="v-area${a.game ? ' v-game-area' : ''}" data-area="${esc(a.id)}"><title>${esc(title)}</title>${body.join('')}</g>`;
    text.push(linkRooms && a.game ? `<a href="#room-${esc(a.game)}">${g}</a>` : g);
  }
  for (const sp of venue.spots || []) {
    const [x, y] = T(...sp.at);
    const g = `<g class="v-spot"><title>${esc(`${rooms[sp.game]?.name || gameLabel(sp.game, rooms)}: ${sp.label || ''}`)}</title><path d="M${x} ${y - 8} L${x + 8} ${y} L${x} ${y + 8} L${x - 8} ${y} Z" fill="#c9a45c" stroke="#120d14" stroke-width="1.5"/><text x="${x}" y="${y - 14}" text-anchor="middle" class="v-spotname" style="font-size:${Math.round(14 * k)}px">${esc(gameLabel(sp.game, rooms))}</text>${sp.label ? `<text x="${x}" y="${y + 14 + 8 * k}" text-anchor="middle" class="v-real" style="font-size:${Math.round(11 * k)}px">${esc(sp.label)}</text>` : ''}</g>`;
    text.push(linkRooms ? `<a href="#room-${esc(sp.game)}">${g}</a>` : g);
  }
  for (const e of venue.entrances || []) {
    // The door is a gap in the wall; the arrow points in from outside.
    const [dx, dy] = e.dir || [0, -1];
    const [gx1, gy1] = T(e.at[0] - 20 * Math.abs(dy), e.at[1] - 20 * Math.abs(dx));
    const [gx2, gy2] = T(e.at[0] + 20 * Math.abs(dy), e.at[1] + 20 * Math.abs(dx));
    const [tx, ty] = T(e.at[0] - dx * 34, e.at[1] - dy * 34);
    const [hx, hy] = T(e.at[0] - dx * 8, e.at[1] - dy * 8);
    const len = Math.hypot(hx - tx, hy - ty) || 1;
    const ux = (hx - tx) / len;
    const uy = (hy - ty) / len;
    const wing = (sgn) => `${hx - ux * 9 + sgn * uy * 7},${hy - uy * 9 - sgn * ux * 7}`;
    parts.push(`<line x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}" stroke="#211825" stroke-width="7"/>`);
    text.push(`<path d="M${tx} ${ty} L${hx} ${hy} M${wing(1)} L${hx} ${hy} L${wing(-1)}" stroke="#e3c788" stroke-width="2.5" fill="none"/><text x="${tx}" y="${ty + 20}" text-anchor="middle" class="v-entry" style="font-size:${Math.round(12 * k)}px">${esc(e.label)}</text>`);
  }
  if (host && secret) {
    // The real hidden door (host only; it lives in lore.yaml, never venue.yaml).
    const [x1, y1, x2, y2] = secret.line;
    const [X1, Y1] = T(x1, y1);
    const [X2, Y2] = T(x2, y2);
    text.push(`<g class="v-secret"><title>${esc(secret.note || secret.label || '')}</title><line x1="${X1}" y1="${Y1}" x2="${X2}" y2="${Y2}" stroke="#ff5c74" stroke-width="7" stroke-dasharray="7 4"/><text x="${(X1 + X2) / 2 + (tall ? 0 : 0)}" y="${Math.min(Y1, Y2) - 8}" text-anchor="middle" class="v-secretlabel" style="font-size:${Math.round(12 * k)}px">${esc(secret.label || '')}</text></g>`);
  }
  if (host) {
    for (const p of pins) {
      let x;
      let y;
      if (p.where.kind === 'spot') {
        // to the left of the marker: its labels sit above and below it
        [x, y] = T(...p.where.at);
        x -= 24 + p.i * 24;
      } else if ((venue.areas || []).find((ar) => ar.id === p.where.area)?.pins_at) {
        const area = (venue.areas || []).find((ar) => ar.id === p.where.area);
        [x, y] = T(...area.pins_at);
        x += p.i * 24;
      } else {
        const area = (venue.areas || []).find((ar) => ar.id === p.where.area);
        const b = bbox(area.shape.map(([ax, ay]) => T(ax, ay)));
        const per = Math.max(1, Math.floor((b.w - 16) / 24));
        x = b.x + 16 + (p.i % per) * 24;
        y = b.y + b.h - 16 - Math.floor(p.i / per) * 24;
      }
      text.push(`<g class="v-pin"><title>${esc(p.title || '')}</title><circle cx="${x}" cy="${y}" r="11" fill="${p.color}" stroke="#0d090f" stroke-width="2"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" class="v-pinnum">${esc(p.label)}</text></g>`);
    }
  }
  const defs = `<defs><pattern id="v-hatch${tall ? '-t' : ''}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#151018"/><line x1="0" y1="0" x2="0" y2="10" stroke="#2a2030" stroke-width="4"/></pattern><pattern id="v-rain${tall ? '-t' : ''}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#141c18"/><line x1="2" y1="0" x2="0" y2="7" stroke="#2c3d34" stroke-width="1.2"/><line x1="11" y1="6" x2="9" y2="13" stroke="#2c3d34" stroke-width="1.2"/></pattern></defs>`;
  const body = (parts.join('') + text.join('')).replace(/url\(#v-(hatch|rain)\)/g, (_, n) => `url(#v-${n}${tall ? '-t' : ''})`);
  return `<svg class="venue-map${tall ? ' venue-tall' : ' venue-wide'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Plan of the flat, with the manor room each room plays tonight">${defs}${body}</svg>`;
}

export function venueMap(venue, { mode = 'guest', rooms = {}, pins = [], linkRooms = false, secret = null } = {}) {
  const host = mode === 'host';
  const opts = { host, rooms, pins: host ? pins : [], linkRooms, secret: host ? secret : null };
  const style = `<style>.v-game{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;fill:#efe2c8}.v-real{font-family:system-ui,sans-serif;fill:#a8988a}.v-shut{font-family:Georgia,serif;font-style:italic;fill:#6f6176}.v-shutnote{font-family:system-ui,sans-serif;font-weight:600;letter-spacing:.14em;text-transform:uppercase;fill:#6f6176}.v-plain{font-family:system-ui,sans-serif;fill:#a8988a}.v-spotname{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;fill:#e3c788}.v-entry{font-family:system-ui,sans-serif;font-weight:600;fill:#e3c788}.v-game-area:hover text{fill:#fff}${host ? ".v-pinnum{font:700 12px system-ui,sans-serif;fill:#fff}.v-secretlabel{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;fill:#ff9fac}" : ''}</style>`;
  const legend = `<div class="legend"><span class="lg"><i style="background:#211825;border:1px solid #7a6683"></i>Game room: search here</span><span class="lg"><i style="background:repeating-linear-gradient(45deg,#151018 0 3px,#2a2030 3px 6px);border:1px solid #7a6683"></i>Shut tonight: keep out</span><span class="lg"><i style="background:#c9a45c;transform:rotate(45deg);width:10px;height:10px;border-radius:1px"></i>A manor room in one corner</span></div>`;
  return raw(`<div class="map-wrap venue-wrap">${style}${venueSvg(venue, { ...opts, tall: false })}${venueSvg(venue, { ...opts, tall: true })}</div>${legend}`);
}

// Spread pins / dots inside a room rectangle in a grid.
export function slotsIn(roomId, n, { size = 26, top = 44 } = {}) {
  const g = ROOM_GEO[roomId];
  if (!g) return [];
  // Corridors get one row along the top; short rooms (the terrace) along the bottom.
  const usableTop = g.corridor ? g.y + 6 : g.h < 100 ? g.y + g.h - size - 4 : g.y + top;
  const cols = Math.max(1, Math.floor((g.w - 12) / size));
  return Array.from({ length: n }, (_, i) => ({
    x: g.x + 6 + size / 2 + (i % cols) * size,
    y: usableTop + size / 2 + Math.floor(i / cols) * size,
  }));
}

// ---------------------------------------------------------------- timeline swimlanes (HOST)
const ZONE_FILL = { 'murder-zone': '#a3263a', 'escape-zone': '#c9a45c', party: '#56485f', outside: '#3f6b4f', service: '#44607a', private: '#6b5a3f' };

export function timelineChart(content, { from = '8:00 PM', to = '10:00 PM', ids = content.characterOrder, title = '' } = {}) {
  const t0 = parseClock(from);
  const t1 = parseClock(to);
  const left = 150;
  const width = 1000;
  const rowH = 20;
  const top = 58;
  const x = (m) => left + ((m - t0) / (t1 - t0)) * (width - left - 10);
  const rows = ids.filter((id) => (content.characters[id].evening || []).length);
  const height = top + rows.length * rowH + 16;
  const out = [];
  // grid
  const step = t1 - t0 > 60 ? 15 : 5;
  for (let m = Math.ceil(t0 / step) * step; m <= t1; m += step) {
    out.push(`<line x1="${x(m)}" y1="${top - 6}" x2="${x(m)}" y2="${height - 10}" stroke="#2a2130"/><text x="${x(m)}" y="${top - 12}" text-anchor="middle" class="t-tick">${esc(formatClock(m).replace(' PM', '').replace(' AM', 'am'))}</text>`);
  }
  // murder window
  out.push(`<rect x="${x(parseClock('9:31 PM'))}" y="${top - 6}" width="${x(parseClock('9:41 PM')) - x(parseClock('9:31 PM'))}" height="${height - top}" fill="#a3263a" fill-opacity=".09"/>`);
  const marks = [['9:29 PM', 'text'], ['9:38 PM', 'murder'], ['9:45 PM', 'lights out']];
  let lastX = -Infinity;
  let raised = false;
  for (const [t, label] of marks) {
    const m = parseClock(t);
    if (m < t0 || m > t1) continue;
    // Labels closer than ~70px alternate between two heights so they don't collide.
    raised = x(m) - lastX < 70 ? !raised : false;
    lastX = x(m);
    const ly = raised ? top - 42 : top - 30;
    out.push(`<line x1="${x(m)}" y1="${ly}" x2="${x(m)}" y2="${height - 10}" stroke="${label === 'murder' ? '#ff6b7f' : '#e3c788'}" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${x(m) + 4}" y="${ly}" class="t-mark">${esc(label)}</text>`);
  }
  rows.forEach((id, i) => {
    const c = content.characters[id];
    const y = top + i * rowH;
    out.push(`<text x="${left - 8}" y="${y + 14}" text-anchor="end" class="t-name${c.tier === 'flex' ? ' t-flex' : ''}${id === content.timeline?.solution_window?.killer ? ' t-killer' : ''}">${esc(labelOf(content, id))}</text>`);
    if (i % 2) out.push(`<rect x="${left}" y="${y}" width="${width - left - 10}" height="${rowH}" fill="#fff" fill-opacity=".02"/>`);
    for (const e of c.evening) {
      const a = parseClock(e.at);
      const b = e.until ? parseClock(e.until) : a + 1;
      if (a == null || b < t0 || a > t1) continue;
      const xa = x(Math.max(a, t0));
      const xb = Math.max(xa + 4, x(Math.min(b, t1)));
      const zone = content.lore.rooms[e.where]?.zone;
      const room = content.lore.rooms[e.where]?.name || e.where;
      out.push(`<rect x="${xa}" y="${y + 3}" width="${xb - xa}" height="${rowH - 6}" rx="3" fill="${ZONE_FILL[zone] || '#56485f'}"><title>${esc(`${c.name}: ${e.at}${e.until ? '–' + e.until : ''} · ${room}\n${e.text.replace(/\*\*/g, '')}`)}</title></rect>`);
      if (xb - xa > 70) out.push(`<text x="${xa + 5}" y="${y + 14}" class="t-room">${esc(ROOM_GEO[e.where]?.label || room)}</text>`);
    }
  });
  const legend = Object.entries({ 'murder-zone': 'Study & East Corridor', 'escape-zone': 'Library & corridor', party: 'Party rooms', outside: 'Outside', service: 'Below stairs', private: 'Private / walls' })
    .map(([z, l]) => `<span class="lg"><i style="background:${ZONE_FILL[z]}"></i>${esc(l)}</span>`)
    .join('');
  return raw(`${title ? `<h3>${esc(title)}</h3>` : ''}<div class="chart-scroll"><svg class="timeline-chart" viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="Where everyone was, ${esc(from)} to ${esc(to)}"><style>.t-tick{font:12px system-ui,sans-serif;fill:#8f8070}.t-mark{font:700 12px system-ui,sans-serif;fill:#e3c788}.t-name{font:13px system-ui,sans-serif;fill:#d9ccb8}.t-flex{fill:#8fa9bf}.t-killer{fill:#ff9fac;font-weight:700}.t-room{font:11px system-ui,sans-serif;fill:#fff;pointer-events:none}</style>${out.join('')}</svg></div><div class="legend">${legend}<span class="lg"><i style="background:#a3263a;opacity:.35"></i>9:31–9:41 murder window</span></div>`);
}

// ---------------------------------------------------------------- one guest's evening (GUEST-SAFE: own data only)
export function eveningStrip(c, { host = false, rooms = {} } = {}) {
  const entries = (c.evening || []).map((e) => ({ ...e, a: parseClock(e.at), b: e.until ? parseClock(e.until) : parseClock(e.at) + 1 })).filter((e) => e.a != null);
  if (!entries.length) return '';
  const t0 = Math.min(parseClock('7:45 PM'), Math.max(Math.min(...entries.map((e) => e.a)), parseClock('7:00 PM')));
  const t1 = Math.max(parseClock('10:00 PM'), ...entries.map((e) => e.b));
  const W = 640;
  const H = 74;
  const x = (m) => 8 + ((Math.min(Math.max(m, t0), t1) - t0) / (t1 - t0)) * (W - 16);
  const out = [];
  for (let m = Math.ceil(t0 / 30) * 30; m <= t1; m += 30) {
    out.push(`<line x1="${x(m)}" y1="16" x2="${x(m)}" y2="56" stroke="#2a2130"/><text x="${x(m)}" y="70" text-anchor="middle" class="s-tick">${esc(formatClock(m).replace(':00', '').replace(' PM', 'pm'))}</text>`);
  }
  // Lights out at 9:45 is public knowledge.
  out.push(`<line x1="${x(parseClock('9:45 PM'))}" y1="6" x2="${x(parseClock('9:45 PM'))}" y2="58" stroke="#e3c788" stroke-dasharray="3 3"/><text x="${x(parseClock('9:45 PM')) + 3}" y="12" class="s-mark">lights out</text>`);
  const earlier = entries.filter((e) => e.b < t0);
  if (earlier.length) out.push(`<text x="8" y="12" class="s-mark">+ ${earlier.length} earlier</text>`);
  for (const e of entries.filter((e) => e.b >= t0)) {
    const xa = x(e.a);
    const xb = Math.max(xa + 6, x(e.b));
    const zone = rooms[e.where]?.zone;
    const fill = host ? ZONE_FILL[zone] || '#56485f' : ROOM_COLORS[hash(e.where) % ROOM_COLORS.length];
    const label = ROOM_GEO[e.where]?.label || e.where;
    out.push(`<rect x="${xa}" y="20" width="${xb - xa}" height="30" rx="4" fill="${fill}" stroke="#0d090f"><title>${esc(`${e.at}${e.until ? '–' + e.until : ''} · ${label}`)}</title></rect>`);
    if (xb - xa > 62) out.push(`<text x="${xa + 5}" y="39" class="s-room">${esc(label)}</text>`);
  }
  return raw(`<div class="chart-scroll"><svg class="evening-strip" viewBox="0 0 ${W} ${H}" style="min-width:520px" role="img" aria-label="Your evening as a timeline"><style>.s-tick{font:12px system-ui,sans-serif;fill:#8f8070}.s-mark{font:11px system-ui,sans-serif;fill:#e3c788}.s-room{font:12px system-ui,sans-serif;fill:#fff;pointer-events:none}</style>${out.join('')}</svg></div>`);
}

// ---------------------------------------------------------------- relationship kinds
export const KIND_COLORS = { romance: '#d0607a', money: '#c9a45c', family: '#7fa7d8', rivalry: '#e07a3c', ties: '#9a8ca5' };
export const KIND_LABELS = { romance: 'Love & lust', money: 'Money', family: 'Family', rivalry: 'Rivalry', ties: 'Other ties' };

export function relKind(rel) {
  if (rel.kind && KIND_COLORS[rel.kind]) return rel.kind;
  const t = String(rel.text).toLowerCase();
  if (/(lover|affair|sleeping|fling|tryst|\bex\b|ex-|fianc|engaged|married|wife|husband|boyfriend|girlfriend|dating|crush|kiss|romanc|cannes|seeing|flowers|midnight|tuesdays|bride)/.test(t)) return 'romance';
  if (/(daughter|\bson\b|cousin|nephew|niece|father|mother|uncle|aunt|ward|godfather|goddaughter|stepdaughter|family|grand|sister|brother)/.test(t)) return 'family';
  if (/(owe|loan|lent|debt|\$|money|paid|pays|payout|allowance|fee|cash|invest|bank|price|donor|audit|client|employer|hired|patron)/.test(t)) return 'money';
  if (/(hate|resent|rival|lake|strangle|despise|enemy|furious|suspic|watch her|rude)/.test(t)) return 'rivalry';
  return 'ties';
}

function legendHtml() {
  return Object.entries(KIND_LABELS).map(([k, l]) => `<span class="lg"><i style="background:${KIND_COLORS[k]}"></i>${esc(l)}</span>`).join('');
}

// ---------------------------------------------------------------- "your web" (GUEST-SAFE: own relationships only)
export function yourWeb(c, rels, names) {
  const W = 560;
  const H = 400;
  const cx = W / 2;
  const cy = H / 2;
  const R = 150;
  const n = rels.length;
  const out = [];
  rels.forEach((r, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
    const px = cx + R * Math.cos(ang);
    const py = cy + R * 0.92 * Math.sin(ang);
    const kind = relKind(r);
    out.push(`<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="${KIND_COLORS[kind]}" stroke-width="3" stroke-opacity=".8"/>`);
    const nm = shortNames(names)[r.with] || shortName(names[r.with] || r.with);
    out.push(`<g transform="translate(${px - 22},${py - 22})">${crestSvg(r.with, names[r.with] || r.with, 44)}</g><text x="${px}" y="${py + 38}" text-anchor="middle" class="w-name">${esc(nm)}</text>`);
  });
  out.push(`<g transform="translate(${cx - 34},${cy - 34})">${crestSvg(c.id, c.name, 68)}</g><text x="${cx}" y="${cy + 52}" text-anchor="middle" class="w-you">You</text>`);
  return raw(`<div class="web-wrap"><svg class="your-web" viewBox="0 0 ${W} ${H}" role="img" aria-label="Your connections"><style>.w-name{font:600 15px 'Cormorant Garamond',Georgia,serif;fill:#e9dcc6}.w-you{font:700 16px 'Cormorant Garamond',Georgia,serif;fill:#e3c788}</style>${out.join('')}</svg><div class="legend">${legendHtml()}</div></div>`);
}

// ---------------------------------------------------------------- the whole web (HOST)
export function webGraph(content, ids) {
  const S = 860;
  const c0 = S / 2;
  const R = 330;
  const pos = {};
  ids.forEach((id, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / ids.length;
    pos[id] = { x: c0 + R * Math.cos(ang), y: c0 + R * Math.sin(ang), ang };
  });
  pos.arthur = { x: c0, y: c0, ang: 0 };
  const seen = new Map();
  for (const id of ids) {
    for (const r of content.characters[id].relationships || []) {
      if (!pos[r.with]) continue;
      const key = [id, r.with].sort().join('|');
      if (!seen.has(key)) seen.set(key, { a: id, b: r.with, kind: relKind(r), cond: r.if || null });
    }
  }
  const edges = [...seen.values()].map((e) => {
    const A = pos[e.a];
    const B = pos[e.b];
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;
    const qx = mx + (c0 - mx) * 0.55;
    const qy = my + (c0 - my) * 0.55;
    const d = e.b === 'arthur' || e.a === 'arthur' ? `M${A.x},${A.y} L${B.x},${B.y}` : `M${A.x},${A.y} Q${qx},${qy} ${B.x},${B.y}`;
    return `<path class="edge k-${e.kind}${e.b === 'arthur' || e.a === 'arthur' ? ' to-arthur' : ''}" data-a="${e.a}" data-b="${e.b}" d="${d}" stroke="${KIND_COLORS[e.kind]}"${e.cond ? ' stroke-dasharray="5 4"' : ''}/>`;
  });
  const nodes = ids.map((id) => {
    const p = pos[id];
    const c = content.characters[id];
    const lx = c0 + (R + 34) * Math.cos(p.ang);
    const ly = c0 + (R + 34) * Math.sin(p.ang);
    const anchor = Math.abs(Math.cos(p.ang)) < 0.2 ? 'middle' : Math.cos(p.ang) > 0 ? 'start' : 'end';
    return `<g class="node t-${c.tier}" data-id="${id}" tabindex="0" role="button" aria-label="${esc(c.name)}"><g transform="translate(${p.x - 18},${p.y - 18})">${crestSvg(id, c.name, 36)}</g><text x="${lx}" y="${ly + 5}" text-anchor="${anchor}" class="n-label">${esc(labelOf(content, id))}</text></g>`;
  });
  const arthur = `<g class="node" data-id="arthur"><g transform="translate(${c0 - 26},${c0 - 26})">${crestSvg('arthur', 'Arthur Blackwood', 52)}</g><text x="${c0}" y="${c0 + 44}" text-anchor="middle" class="n-label n-arthur">Arthur</text></g>`;
  return raw(`<div class="chart-scroll"><svg id="webgraph" class="web-graph" viewBox="0 0 ${S} ${S}" style="min-width:640px" role="img" aria-label="Who is connected to whom"><style>.edge{fill:none;stroke-width:2;stroke-opacity:.45}.edge.to-arthur{stroke-opacity:.12}.n-label{font:600 14px 'Cormorant Garamond',Georgia,serif;fill:#e9dcc6;cursor:pointer}.n-arthur{fill:#e3c788}.t-flex .n-label{fill:#9fb9cf}.node{cursor:pointer}#webgraph.focus .edge{stroke-opacity:.05}#webgraph.focus .edge.on{stroke-opacity:.95;stroke-width:3.5}#webgraph.focus .node{opacity:.35}#webgraph.focus .node.on{opacity:1}</style>${edges.join('')}${arthur}${nodes.join('')}</svg></div><div class="legend">${legendHtml()}<span class="lg"><i style="background:repeating-linear-gradient(90deg,#9a8ca5 0 5px,transparent 5px 9px)"></i>Only if the flex character is cast</span></div>`);
}

// ---------------------------------------------------------------- family tree (public lore)
export function familyTree(tree) {
  const byId = Object.fromEntries(tree.map((f) => [f.id, { ...f, kids: [] }]));
  for (const f of Object.values(byId)) if (f.parent && byId[f.parent]) byId[f.parent].kids.push(f);
  const roots = Object.values(byId).filter((f) => !f.parent || !byId[f.parent]);
  let slot = 0;
  const place = (f, depth) => {
    f.depth = depth;
    if (!f.kids.length) f.slot = slot++;
    else {
      f.kids.forEach((k) => place(k, depth + 1));
      f.slot = f.kids.reduce((s, k) => s + k.slot, 0) / f.kids.length;
    }
  };
  roots.forEach((r) => place(r, 0));
  const colW = 172;
  const rowH = 104;
  const boxW = 150;
  const boxH = 58;
  const W = Math.max(slot, 1) * colW + 20;
  const depthMax = Math.max(...Object.values(byId).map((f) => f.depth));
  const H = (depthMax + 1) * rowH + 10;
  const X = (f) => 10 + f.slot * colW + (colW - boxW) / 2;
  const Y = (f) => 10 + f.depth * rowH;
  const out = [];
  for (const f of Object.values(byId)) {
    for (const k of f.kids) {
      const x1 = X(f) + boxW / 2;
      const y1 = Y(f) + boxH;
      const x2 = X(k) + boxW / 2;
      const y2 = Y(k);
      const ym = (y1 + y2) / 2;
      out.push(`<path d="M${x1},${y1} V${ym} H${x2} V${y2}" fill="none" stroke="#8a7350" stroke-width="1.6"${k.ward ? ' stroke-dasharray="5 4"' : ''}/>`);
    }
  }
  for (const f of Object.values(byId)) {
    const tip = [f.name, f.years, f.spouse ? `m. ${f.spouse}` : '', f.note].filter(Boolean).join('\n');
    const isArthur = f.id === 'arthur';
    out.push(`<g><title>${esc(tip)}</title><rect x="${X(f)}" y="${Y(f)}" width="${boxW}" height="${boxH}" rx="6" fill="${isArthur ? '#2a1519' : '#1f1722'}" stroke="${isArthur ? '#c0495a' : '#c9a45c'}" stroke-width="${isArthur ? 2 : 1.2}"/><text x="${X(f) + boxW / 2}" y="${Y(f) + 24}" text-anchor="middle" class="f-name">${esc(f.name)}</text><text x="${X(f) + boxW / 2}" y="${Y(f) + 44}" text-anchor="middle" class="f-yrs">${esc(f.ward ? 'ward' : f.years || '')}</text></g>`);
  }
  const notes = tree.filter((f) => f.note || f.spouse).map((f) => `<li><b>${esc(f.name)}</b>${f.years ? ` <span class="muted">(${esc(f.years)})</span>` : ''}${f.spouse ? `, m. ${esc(f.spouse)}` : ''}. ${esc(f.note || '')}</li>`).join('');
  return raw(`<div class="chart-scroll"><svg class="family-tree" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 640)}px" role="img" aria-label="The Blackwood family tree"><style>.f-name{font:700 16px 'Cormorant Garamond',Georgia,serif;fill:#efe5d3}.f-yrs{font:12px system-ui,sans-serif;fill:#ad9f8b}</style>${out.join('')}</svg></div><ul class="family-notes">${notes}</ul>`);
}

// ---------------------------------------------------------------- suspicion heat map (HOST)
const HEAT = ['#231c27', '#4a3622', '#8a5a1f', '#a3263a'];
const HEAT_LABEL = ['cleared', 'murmurs', 'warm', 'hot'];

export function suspicionHeatmap(content, { highlightRound = null } = {}) {
  const s = content.suspicion || { stages: [], suspects: [] };
  if (!s.suspects.length) return '';
  const head = s.stages.map((st) => `<th class="${highlightRound === st.round ? 'now' : ''}">${esc(st.title)}</th>`).join('');
  const rows = s.suspects.map((sus) => {
    const c = content.characters[sus.id];
    const cells = sus.levels.map((lv, i) => `<td class="heat h${lv}${highlightRound === s.stages[i].round ? ' now' : ''}" style="background:${HEAT[lv]}" title="${esc(sus.notes?.[i] || '')}"><b>${HEAT_LABEL[lv]}</b><span>${esc(sus.notes?.[i] || '')}</span></td>`).join('');
    return `<tr><th class="who">${crestSvg(sus.id, c?.name || sus.id, 30)}<span>${esc(labelOf(content, sus.id))}</span></th>${cells}</tr>`;
  });
  const aims = s.stages.map((st) => `<li class="${highlightRound === st.round ? 'now' : ''}"><b>${esc(st.title)}:</b> ${esc(st.aim)}</li>`).join('');
  return raw(`<div class="chart-scroll"><table class="heatmap"><tr><th></th>${head}</tr>${rows.join('')}</table></div><ul class="aims">${aims}</ul>`);
}
