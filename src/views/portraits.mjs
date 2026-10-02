// Character portraits: a silhouette cameo in a gilt oval, with costume
// details in gold and an emblem medallion for the character's public role.
// Configured in content/portraits.yaml. Every portrait has the same
// structure, so no one's (Morgan's included) looks different in shape.
import { raw } from '../lib/html.mjs';
import { crestColor } from './visuals.mjs';

const INK = '#0e0a0f'; // the silhouette
const GOLD = '#d9b46a';
const CREAM = '#efe2c8';
const ICON = '#2a1d10';

export const HAIRS = ['none', 'short', 'slick', 'bun', 'long', 'curls', 'veil', 'cap', 'beret'];

const HAIR = {
  none: '',
  short: `<path d="M40 63C39 41 81 41 80 63C77 50 43 50 40 63Z" fill="${INK}"/>`,
  slick: `<path d="M41 61C40 37 83 38 80 59C71 45 50 45 41 61Z" fill="${INK}"/><path d="M48 46C58 40 70 41 77 48" fill="none" stroke="${GOLD}" stroke-opacity=".45" stroke-width="1.4"/>`,
  bun: `<circle cx="60" cy="38" r="10" fill="${INK}"/><path d="M41 62C40 42 80 42 79 62C76 50 44 50 41 62Z" fill="${INK}"/>`,
  long: `<path d="M38 66C34 38 86 38 82 66L87 104C79 109 74 100 73 92L47 92C46 100 41 109 33 104Z" fill="${INK}"/>`,
  curls: [[43, 54, 8], [50, 45, 9], [60, 42, 9], [70, 45, 9], [77, 54, 8], [80, 64, 6], [40, 64, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`).join(''),
  veil: `<path d="M36 64C34 34 86 34 84 64L96 118C80 112 40 112 24 118Z" fill="#170f19" fill-opacity=".92"/><path d="M24 118C40 112 80 112 96 118" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="2 3"/>`,
  cap: `<path d="M38 52C40 34 80 34 82 52Z" fill="${INK}"/><rect x="39" y="50" width="42" height="7" fill="${INK}"/><line x1="39" y1="53" x2="81" y2="53" stroke="${GOLD}" stroke-width="1.6"/><path d="M38 57H72L68 62H42Z" fill="${INK}"/>`,
  beret: `<ellipse cx="64" cy="45" rx="23" ry="8" transform="rotate(-12 64 45)" fill="${INK}"/><circle cx="66" cy="37" r="2.5" fill="${INK}"/>`,
};

export const EXTRAS = ['glasses', 'sunglasses', 'pearls', 'necklace', 'bowtie', 'rose', 'stole', 'scarf', 'collar', 'cravat', 'sash', 'tiara', 'headlamp', 'lapels', 'rollneck'];

// Drawn under the head (neckwear, clothing) or over it (eyewear, headwear).
const UNDER = {
  rollneck: `<rect x="50" y="92" width="20" height="16" rx="4" fill="#1d151f"/>`,
  collar: `<path d="M49 98H71L69 108H51Z" fill="${CREAM}" fill-opacity=".9"/>`,
  lapels: `<path d="M50 107L60 128L70 107" fill="none" stroke="${CREAM}" stroke-width="2"/><path d="M47 109L56 142M73 109L64 142" stroke="${GOLD}" stroke-opacity=".45" stroke-width="1.4"/>`,
  stole: `<path d="M18 134C30 112 46 108 60 111C74 108 90 112 102 134" fill="none" stroke="${CREAM}" stroke-opacity=".85" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 6"/>`,
  scarf: `<path d="M50 104C52 120 46 132 44 146M70 104C68 118 74 130 76 146" fill="none" stroke="${GOLD}" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/>`,
  sash: `<path d="M32 116L92 146" stroke="${GOLD}" stroke-opacity=".85" stroke-width="7"/>`,
};
const OVER = {
  pearls: Array.from({ length: 9 }, (_, i) => { const t = i / 8; const x = 46 + 28 * t; const y = 107 + 7 * Math.sin(Math.PI * t); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.9" fill="${CREAM}"/>`; }).join(''),
  necklace: `<path d="M48 106L60 118L72 106" fill="none" stroke="${GOLD}" stroke-width="1.6"/><circle cx="60" cy="121" r="3.2" fill="#111" stroke="${GOLD}" stroke-width="1.2"/>`,
  bowtie: `<path d="M60 108L51 103V113ZM60 108L69 103V113Z" fill="${GOLD}"/><circle cx="60" cy="108" r="2" fill="${GOLD}"/>`,
  cravat: `<ellipse cx="60" cy="108" rx="7" ry="5" fill="${CREAM}"/><path d="M57 112L60 124L63 112Z" fill="${CREAM}"/>`,
  rose: `<circle cx="45" cy="124" r="5" fill="#b8323f"/><path d="M42 123q3-3 6 0" fill="none" stroke="#7a1c2b" stroke-width="1"/><path d="M48 128l5 4" stroke="#3f6b4f" stroke-width="2"/>`,
  glasses: `<circle cx="52" cy="66" r="6" fill="none" stroke="${GOLD}" stroke-width="1.6"/><circle cx="68" cy="66" r="6" fill="none" stroke="${GOLD}" stroke-width="1.6"/><path d="M58 66h4" stroke="${GOLD}" stroke-width="1.6"/>`,
  sunglasses: `<ellipse cx="52" cy="65" rx="7" ry="5" fill="#000" stroke="${GOLD}" stroke-width="1.2"/><ellipse cx="68" cy="65" rx="7" ry="5" fill="#000" stroke="${GOLD}" stroke-width="1.2"/><path d="M59 65h2" stroke="${GOLD}" stroke-width="1.4"/>`,
  tiara: `<path d="M46 47L50 38L54 45L60 33L66 45L70 38L74 47" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="36" r="1.8" fill="${CREAM}"/>`,
  headlamp: `<path d="M41 56Q60 50 79 56" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="60" cy="52" r="4" fill="#fff6c8"/><path d="M60 52L44 20H76Z" fill="#fff6c8" fill-opacity=".12"/>`,
};

export const EMBLEMS = ['keys', 'stethoscope', 'compass', 'camera', 'book', 'signet', 'ledger', 'coin', 'cake', 'mic', 'scales', 'key', 'ring', 'crest', 'cards', 'frame', 'champagne', 'watch', 'fan', 'crystal', 'music', 'car', 'palette', 'quill', 'foil', 'scroll', 'star'];
// Emblems that would give a game away; the checker refuses them outright.
export const TELLING_EMBLEMS = ['raven', 'dagger', 'skull', 'keyhole', 'magnifier', 'blood', 'passage'];

const s = `stroke="${ICON}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const f = `fill="${ICON}"`;
const EMBLEM = {
  keys: `<circle cx="-3" cy="-3" r="4" ${s}/><path d="M0 0l6 6M4 4l2-2M6 6l2-2" ${s}/>`,
  stethoscope: `<path d="M-5-6v4a5 5 0 0 0 10 0v-4M0 3v2a3 3 0 0 0 6 0" ${s}/><circle cx="6" cy="2" r="1.6" ${f}/>`,
  compass: `<circle cx="0" cy="-6" r="1.8" ${f}/><path d="M0-5L-5 7M0-5L5 7M-3 2h6" ${s}/>`,
  camera: `<rect x="-7" y="-4" width="14" height="10" rx="2" ${s}/><circle cx="0" cy="1" r="3" ${s}/><path d="M-3-4l1-2h4l1 2" ${s}/>`,
  book: `<path d="M0-4C-3-6-6-6-8-5v10c2-1 5-1 8 1 3-2 6-2 8-1V-5c-2-1-5-1-8 1zM0-4v10" ${s}/>`,
  signet: `<circle cx="0" cy="2" r="5" ${s}/><rect x="-3" y="-7" width="6" height="4" rx="1" ${f}/>`,
  ledger: `<rect x="-6" y="-7" width="12" height="14" rx="1" ${s}/><path d="M-3-3h6M-3 0h6M-3 3h4" ${s}/>`,
  coin: `<circle cx="0" cy="0" r="6.5" ${s}/><circle cx="0" cy="0" r="3.5" ${s}/>`,
  cake: `<rect x="-6" y="0" width="12" height="6" ${s}/><rect x="-4" y="-4" width="8" height="4" ${s}/><path d="M0-4v-3" ${s}/><circle cx="0" cy="-8" r="1" ${f}/>`,
  mic: `<rect x="-2.5" y="-8" width="5" height="9" rx="2.5" ${f}/><path d="M-5-1a5 5 0 0 0 10 0M0 4v4M-3 8h6" ${s}/>`,
  scales: `<path d="M0-7v14M-7-4h14M-4 7h8M-7-4l-3 6h6zM7-4l-3 6h6z" ${s}/>`,
  key: `<circle cx="-4" cy="0" r="3.5" ${s}/><path d="M-0.5 0h8M4 0v3M6.5 0v2" ${s}/>`,
  ring: `<circle cx="0" cy="2" r="5" ${s}/><path d="M-3-4l3-3 3 3-3 3z" ${f}/>`,
  crest: `<path d="M-6-7h12v6c0 5-3 8-6 9-3-1-6-4-6-9z" ${s}/><path d="M0-4v8M-3 0h6" ${s}/>`,
  cards: `<path d="M0-7c3 4 7 6 7 9a3 3 0 0 1-6 1l1 4h-4l1-4a3 3 0 0 1-6-1c0-3 4-5 7-9z" ${f}/>`,
  frame: `<rect x="-7" y="-6" width="14" height="12" ${s}/><rect x="-4" y="-3" width="8" height="6" ${s}/>`,
  champagne: `<path d="M-6-6h12c0 5-3 7-6 7s-6-2-6-7zM0 1v6M-4 7h8" ${s}/>`,
  watch: `<circle cx="0" cy="1" r="6" ${s}/><path d="M0-5v-2M0 1l2-3M0 1h3" ${s}/>`,
  fan: `<path d="M0 6L-8-3a11 11 0 0 1 16 0z" ${s}/><path d="M0 6l-4-9M0 6V-5M0 6l4-9" ${s}/>`,
  crystal: `<circle cx="0" cy="-2" r="5.5" ${s}/><path d="M-5 6h10l-2-3h-6z" ${f}/>`,
  music: `<path d="M-1 5V-7l7 2v9" ${s}/><circle cx="-3" cy="5" r="2.5" ${f}/><circle cx="4" cy="4" r="2.5" ${f}/>`,
  car: `<path d="M-8 3v-3l3-4h9l3 4h1v3z" ${s}/><circle cx="-4" cy="4" r="2" ${f}/><circle cx="5" cy="4" r="2" ${f}/>`,
  palette: `<path d="M0-7c-6 0-8 4-8 7 0 4 4 7 8 7 2 0 2-2 1-3s0-3 2-3h3c2 0 3-2 2-4-1-3-4-4-8-4z" ${s}/><circle cx="-4" cy="-1" r="1.2" ${f}/><circle cx="0" cy="-4" r="1.2" ${f}/><circle cx="4" cy="-3" r="1.2" ${f}/>`,
  quill: `<path d="M6-8C-2-6-5 2-6 8M6-8C4-2 0 2-5 4" ${s}/>`,
  foil: `<path d="M-7 7L6-6M3-6l4 4M-4 5l-2-2" ${s}/>`,
  scroll: `<path d="M-6-5h10a2 2 0 0 1 0 4H-6zM-6-1v6h10a2 2 0 0 0 0-4" ${s}/>`,
  star: `<path d="M0-7l2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5z" ${f}/>`,
};

export function portraitSvg(id, name, cfg = {}, size = 96) {
  const color = crestColor(id);
  const h = Math.round((size * 150) / 120);
  const hair = HAIR[cfg.hair] ?? HAIR.short;
  const extras = cfg.extras || [];
  const under = extras.map((e) => UNDER[e] || '').join('');
  const over = extras.map((e) => OVER[e] || '').join('');
  const emblem = EMBLEM[cfg.emblem] || EMBLEM.crest;
  const k = id.replace(/[^a-z0-9-]/g, '');
  return `<svg class="portrait" viewBox="0 0 120 150" width="${size}" height="${h}" role="img" aria-label="${String(name).replace(/"/g, '&quot;')}"><defs><radialGradient id="pb-${k}" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset=".75" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="#0d090f"/></radialGradient><linearGradient id="pg-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a8"/><stop offset=".5" stop-color="#c9a45c"/><stop offset="1" stop-color="#7a5a2a"/></linearGradient><clipPath id="pc-${k}"><ellipse cx="60" cy="70" rx="48" ry="60"/></clipPath></defs><ellipse cx="60" cy="70" rx="48" ry="60" fill="url(#pb-${k})"/><g clip-path="url(#pc-${k})"><path d="M14 152C18 116 38 106 60 106C82 106 102 116 106 152Z" fill="${INK}"/>${under}<rect x="52" y="86" width="16" height="24" rx="6" fill="${INK}"/><ellipse cx="60" cy="66" rx="19" ry="23" fill="${INK}"/>${hair}${over}</g><ellipse cx="60" cy="70" rx="51" ry="63" fill="none" stroke="url(#pg-${k})" stroke-width="5"/><ellipse cx="60" cy="70" rx="46" ry="58" fill="none" stroke="${GOLD}" stroke-opacity=".35" stroke-width="1"/><g transform="translate(60 134)"><circle r="12.5" fill="url(#pg-${k})" stroke="#3a2a12" stroke-width="1.2"/>${emblem}</g></svg>`;
}

export const portrait = (id, name, cfg, size) => raw(portraitSvg(id, name, cfg, size));
