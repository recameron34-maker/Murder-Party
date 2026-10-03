// Character sketches: pen-and-ink head-and-shoulders drawings on a scrap of
// paper, for guest pages (the cover, the guest list) and host pages.
//
// Drawn from content/portraits.yaml (hair + extras), which is PUBLIC: every
// guest sees every sketch on the guest list, so nothing here may hint at a
// secret. Faces vary by a seed made from the character id (proportions,
// brows, nose, mouth, head tilt), never by anything about the real player.
// Every sketch has the same structure, Morgan's included.
import { raw } from '../lib/html.mjs';

const INK = '#3a2719';
const PAPER = '#f4e9d2';
const PAPER2 = '#e8d8b6';

function seeded(str) {
  let a = 2166136261;
  for (const ch of String(str)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (v) => Math.round(v * 10) / 10;

export function sketchSvg(id, name, cfg = {}, { size = 180, ghost = true } = {}) {
  const rnd = seeded(id);
  const r = (a, b) => a + (b - a) * rnd();
  const pid = String(id).replace(/[^a-z0-9-]/gi, '');
  const hair = cfg.hair || 'short';
  const extras = new Set(cfg.extras || []);

  // A stroke, drawn twice: once firmly, once faintly and a hair off, like a
  // quick pen sketch.
  // (The <svg> sets fill none, ink stroke and round caps once, so each
  // stroke only carries its shape: a sketch is a few kilobytes.)
  const L = (d, w = 1.3, o = 1) => {
    let s = `<path d="${d}" stroke-width="${n(w)}"${o < 1 ? ` stroke-opacity="${n(o)}"` : ''}/>`;
    if (ghost) s += `<path d="${d}" stroke-width="${n(w * 0.55)}" stroke-opacity="${n(o * 0.4)}" transform="translate(${n(r(-1, 1))} ${n(r(-0.8, 0.8))})"/>`;
    return s;
  };
  const F = (d, fill, o = 1) => `<path d="${d}" fill="${fill}"${o < 1 ? ` fill-opacity="${n(o)}"` : ''} stroke="none"/>`;
  const H = `url(#h-${pid})`;
  const X = `url(#x-${pid})`;

  // Proportions.
  const cx = 100;
  const hw = r(28.5, 36);
  const jawX = hw * r(0.74, 0.94);
  const jawY = r(132, 140);
  const chinY = r(155, 162);
  const eyeY = r(103, 108);
  const browY = eyeY - r(10, 13);
  const noseY = r(124, 128);
  const mouthY = noseY + r(12, 15);
  const tilt = r(-4, 4);
  const tone = rnd(); // hair: dark (cross-hatched) or light (sparse)
  const sw = r(78, 92); // shoulder width
  const part = rnd() > 0.5 ? 1 : -1; // which side the hair parts
  const lipFull = r(5.5, 11);
  const eyeTilt = r(-1.6, 1.6);
  const marks = rnd(); // smile lines, a beauty mark, a cheekbone

  const out = [];
  const head = [];
  // Faint pencil construction lines, like a real sketch.
  out.push(`<ellipse cx="${n(cx + r(-2, 2))}" cy="${n(102 + r(-2, 2))}" rx="${n(hw + r(2, 5))}" ry="${n((chinY - 46) / 2 + r(2, 5))}" fill="none" stroke="${INK}" stroke-width=".45" stroke-opacity=".18"/>`);
  out.push(`<path d="M${n(cx + r(-1, 1))} 50L${n(cx + r(-2, 2))} ${n(chinY + 8)}M${n(cx - hw - 6)} ${n(eyeY)}L${n(cx + hw + 6)} ${n(eyeY + r(-1, 1))}" stroke="${INK}" stroke-width=".4" stroke-opacity=".14" fill="none"/>`);

  // ---- behind everything: a veil, the back of long hair
  if (hair === 'veil') {
    const v = `M${n(cx - hw - 6)} 70C${n(cx - hw - 20)} 120 ${n(cx - hw - 30)} 180 ${n(cx - hw - 42)} 250L${n(cx + hw + 42)} 250C${n(cx + hw + 30)} 180 ${n(cx + hw + 20)} 120 ${n(cx + hw + 6)} 70C${n(cx + hw)} 34 ${n(cx - hw)} 34 ${n(cx - hw - 6)} 70Z`;
    out.push(F(v, `url(#lace-${pid})`, 0.9), L(v, 0.9, 0.55));
  }
  if (hair === 'long') {
    const back = `M${cx} 40C${n(cx - hw - 10)} 40 ${n(cx - hw - 14)} 72 ${n(cx - hw - 12)} 112C${n(cx - hw - 14)} 152 ${n(cx - hw - 22)} 184 ${n(cx - hw - 28)} 216L${n(cx + hw + 28)} 216C${n(cx + hw + 22)} 184 ${n(cx + hw + 14)} 152 ${n(cx + hw + 12)} 112C${n(cx + hw + 14)} 72 ${n(cx + hw + 10)} 40 ${cx} 40Z`;
    out.push(F(back, tone > 0.5 ? X : H, 0.85), L(back, 1.2, 0.85));
    for (let i = 0; i < 7; i++) {
      const x = cx - hw - 6 - i * 2.5 + r(-1, 1);
      out.push(L(`M${n(x + 8)} ${n(80 + i * 6)}Q${n(x - 4)} ${n(150 + i * 4)} ${n(x - 10 - i)} ${n(206 + i)}`, 0.7, 0.6));
      const y = cx + hw + 6 + i * 2.5 + r(-1, 1);
      out.push(L(`M${n(y - 8)} ${n(80 + i * 6)}Q${n(y + 4)} ${n(150 + i * 4)} ${n(y + 10 + i)} ${n(206 + i)}`, 0.7, 0.6));
    }
  }

  // ---- shoulders, clothing (under the head)
  const shL = `M${cx - 17} 184C${n(cx - 40)} 188 ${n(cx - sw * 0.8)} 192 ${n(cx - sw)} 214L${n(cx - sw - 5)} 250`;
  const shR = `M${cx + 17} 184C${n(cx + 40)} 188 ${n(cx + sw * 0.8)} 192 ${n(cx + sw)} 214L${n(cx + sw + 5)} 250`;
  out.push(F(`${shL}L${n(cx + sw + 5)} 250L${n(cx + sw)} 214C${n(cx + sw * 0.8)} 192 ${n(cx + 40)} 188 ${cx + 17} 184Z`, PAPER));
  out.push(L(shL, 1.5), L(shR, 1.5));
  // shading that follows the shoulders: heavier on the left, light from the right
  out.push(F(`${shL}L${n(cx - sw + 12)} 250L${n(cx - sw + 9)} 222C${n(cx - sw * 0.7)} 204 ${n(cx - 40)} 199 ${cx - 20} 196Z`, X, 0.55));
  out.push(F(`M${cx + 20} 190C${n(cx + 44)} 194 ${n(cx + sw * 0.8)} 198 ${n(cx + sw - 4)} 220L${n(cx + sw - 1)} 250L${n(cx + sw + 5)} 250L${n(cx + sw)} 214C${n(cx + sw * 0.8)} 192 ${n(cx + 40)} 188 ${cx + 17} 184Z`, H, 0.5));

  if (extras.has('lapels')) {
    out.push(L(`M${cx - 18} 186L${cx - 32} 214L${cx - 6} 250`, 1.4), L(`M${cx + 18} 186L${cx + 32} 214L${cx + 6} 250`, 1.4));
    out.push(L(`M${cx - 10} 189L${cx} 226L${cx + 10} 189`, 1));
    out.push(F(`M${cx - 18} 186L${cx - 32} 214L${cx - 6} 250L${cx - 60} 250L${cx - 66} 212Z`, X, 0.55));
    out.push(L(`M${cx - 2} 238h0M${cx - 2} 246h0`, 2.4));
  } else if (extras.has('rollneck')) {
    out.push(F(`M${cx - 19} 170Q${cx} 177 ${cx + 19} 170L${cx + 21} 194Q${cx} 201 ${cx - 21} 194Z`, PAPER));
    out.push(L(`M${cx - 19} 170Q${cx} 177 ${cx + 19} 170`, 1.2), L(`M${cx - 21} 194Q${cx} 201 ${cx + 21} 194`, 1.3), L(`M${cx - 19} 170L${cx - 21} 194M${cx + 19} 170L${cx + 21} 194`, 1.2));
    for (let i = -15; i <= 15; i += 5) out.push(L(`M${cx + i} ${n(174 + Math.abs(i) * 0.05)}L${n(cx + i * 1.06)} ${n(196 - Math.abs(i) * 0.05)}`, 0.6, 0.55));
  } else {
    out.push(L(`M${cx - 34} 192Q${cx} ${n(r(218, 226))} ${cx + 34} 192`, 1.1, 0.9));
  }
  if (extras.has('collar')) out.push(L(`M${cx - 17} 181L${cx - 6} 198L${cx} 188L${cx + 6} 198L${cx + 17} 181`, 1.3));
  if (extras.has('stole')) {
    let d = `M${n(cx - sw - 2)} 222`;
    for (let x = cx - sw; x <= cx + sw; x += 9) d += `Q${n(x + 4.5)} ${n(194 + Math.abs(x - cx) * 0.18 - 9)} ${n(x + 9)} ${n(196 + Math.abs(x + 9 - cx) * 0.2)}`;
    out.push(F(`${d}L${n(cx + sw)} 236Q${cx} 214 ${n(cx - sw)} 236Z`, H, 0.7), L(d, 1.1), L(`M${n(cx - sw)} 236Q${cx} 214 ${n(cx + sw)} 236`, 1));
  }
  if (extras.has('scarf')) {
    out.push(F(`M${cx - 16} 184C${cx - 22} 208 ${cx - 12} 230 ${cx - 20} 250L${cx - 6} 250C${cx - 2} 230 ${cx - 8} 206 ${cx - 2} 190Z`, H, 0.7));
    out.push(L(`M${cx - 16} 184C${cx - 22} 208 ${cx - 12} 230 ${cx - 20} 250`, 1.1), L(`M${cx - 2} 190C${cx - 8} 206 ${cx - 2} 230 ${cx - 6} 250`, 1.1));
    out.push(L(`M${cx + 16} 184C${cx + 24} 204 ${cx + 18} 224 ${cx + 26} 246`, 1.1), L(`M${cx - 16} 184Q${cx} 196 ${cx + 16} 184`, 1.2));
  }
  if (extras.has('sash')) {
    out.push(F(`M${n(cx - sw + 8)} 206L${n(cx + 40)} 250L${n(cx + 62)} 250L${n(cx - sw + 18)} 196Z`, X, 0.55), L(`M${n(cx - sw + 8)} 206L${cx + 40} 250M${n(cx - sw + 18)} 196L${cx + 62} 250`, 1.2));
  }

  // ---- neck
  out.push(F(`M${cx - 15} ${n(chinY - 16)}L${cx + 15} ${n(chinY - 16)}L${cx + 17} 186L${cx - 17} 186Z`, PAPER));
  out.push(L(`M${cx - 15} ${n(chinY - 14)}C${cx - 15} ${n(chinY + 6)} ${cx - 16} 178 ${cx - 18} 186`, 1.3));
  out.push(L(`M${cx + 15} ${n(chinY - 14)}C${cx + 15} ${n(chinY + 6)} ${cx + 16} 178 ${cx + 18} 186`, 1.3));
  out.push(F(`M${cx - 15} ${n(chinY - 4)}Q${cx} ${n(chinY + 12)} ${cx + 15} ${n(chinY - 4)}L${cx + 15} ${n(chinY + 8)}Q${cx} ${n(chinY + 18)} ${cx - 15} ${n(chinY + 8)}Z`, H, 0.9));

  // ---- the head (tilted a touch)
  const face = `M${n(cx - hw)} 92C${n(cx - hw)} ${n(jawY - 6)} ${n(cx - jawX)} ${n(jawY + 4)} ${n(cx - jawX * 0.5)} ${n(chinY - 6)}Q${cx} ${n(chinY + 2)} ${n(cx + jawX * 0.5)} ${n(chinY - 6)}C${n(cx + jawX)} ${n(jawY + 4)} ${n(cx + hw)} ${n(jawY - 6)} ${n(cx + hw)} 92C${n(cx + hw + 2)} 50 ${n(cx - hw - 2)} 50 ${n(cx - hw)} 92Z`;
  head.push(F(face, PAPER));
  // ears
  head.push(L(`M${n(cx - hw)} 100C${n(cx - hw - 8)} 97 ${n(cx - hw - 8)} 118 ${n(cx - hw + 1)} 121`, 1.2), L(`M${n(cx - hw - 3)} 105Q${n(cx - hw - 5)} 110 ${n(cx - hw - 2)} 114`, 0.7, 0.6));
  head.push(L(`M${n(cx + hw)} 100C${n(cx + hw + 8)} 97 ${n(cx + hw + 8)} 118 ${n(cx + hw - 1)} 121`, 1.2), L(`M${n(cx + hw + 3)} 105Q${n(cx + hw + 5)} 110 ${n(cx + hw + 2)} 114`, 0.7, 0.6));
  // jaw and chin
  head.push(L(`M${n(cx - hw)} 92C${n(cx - hw)} ${n(jawY - 6)} ${n(cx - jawX)} ${n(jawY + 4)} ${n(cx - jawX * 0.5)} ${n(chinY - 6)}Q${cx} ${n(chinY + 2)} ${n(cx + jawX * 0.5)} ${n(chinY - 6)}C${n(cx + jawX)} ${n(jawY + 4)} ${n(cx + hw)} ${n(jawY - 6)} ${n(cx + hw)} 92`, 1.5));
  // shading: the left cheek, the eye socket, under the lip
  head.push(F(`M${n(cx - hw + 1)} 94C${n(cx - hw + 1)} ${n(jawY - 6)} ${n(cx - jawX + 1)} ${n(jawY + 4)} ${n(cx - jawX * 0.5)} ${n(chinY - 7)}L${n(cx - jawX * 0.5 + 9)} ${n(chinY - 13)}C${n(cx - hw + 17)} ${n(jawY)} ${n(cx - hw + 12)} 114 ${n(cx - hw + 10)} 94Z`, H, 0.95));
  head.push(F(`M${n(cx - 26)} ${n(browY + 4)}Q${cx - 15} ${n(browY + 1)} ${cx - 5} ${n(browY + 6)}Q${cx - 6} ${n(eyeY - 3)} ${cx - 8} ${n(eyeY - 5)}Q${cx - 16} ${n(eyeY - 9)} ${cx - 24} ${n(eyeY - 3)}Z`, H, 0.6));
  head.push(F(`M${cx - 7} ${n(mouthY + 6)}Q${cx} ${n(mouthY + 12)} ${cx + 7} ${n(mouthY + 6)}Q${cx} ${n(mouthY + 9)} ${cx - 7} ${n(mouthY + 6)}Z`, H, 0.8));
  head.push(L(`M${n(cx - hw + 7)} 124Q${n(cx - hw + 10)} 132 ${n(cx - hw + 15)} 135`, 0.8, 0.45));

  // eyes
  const ex = r(14, 16.5);
  const ew = r(8, 10);
  const eh = r(4, 6);
  const lash = rnd() > 0.5;
  for (const side of [-1, 1]) {
    const x = cx + side * ex;
    const y = eyeY;
    head.push(L(`M${n(x - side * ew)} ${n(y + 0.5)}Q${n(x)} ${n(y - eh - 1)} ${n(x + side * ew)} ${n(y - 1 - eyeTilt)}`, 1.7));
    head.push(L(`M${n(x - side * (ew - 2))} ${n(y + 1.2)}Q${n(x)} ${n(y + eh * 0.65)} ${n(x + side * (ew - 1.5))} ${n(y)}`, 0.8, 0.65));
    head.push(`<circle cx="${n(x + side * 0.4)}" cy="${n(y - 0.8)}" r="3.1" fill="${INK}" fill-opacity=".85"/><circle cx="${n(x + side * 0.4 + 1)}" cy="${n(y - 1.8)}" r=".9" fill="${PAPER}"/>`);
    head.push(L(`M${n(x - side * 4)} ${n(y - eh - 3)}Q${n(x + side * 2)} ${n(y - eh - 4.5)} ${n(x + side * 7)} ${n(y - eh - 2)}`, 0.6, 0.45));
    if (lash) head.push(L(`M${n(x + side * ew)} ${n(y - 1)}l${n(side * 3)} -2.5M${n(x + side * (ew - 3))} ${n(y - 3)}l${n(side * 2)} -3`, 0.8, 0.8));
  }
  // brows
  const arch = r(-4.5, -1);
  const bw = r(1.7, 2.6);
  for (const side of [-1, 1]) {
    const x = cx + side * ex;
    head.push(L(`M${n(x - side * 11)} ${n(browY + 2.5)}Q${n(x - side * 1)} ${n(browY + arch - 1)} ${n(x + side * 10)} ${n(browY + 0.5)}`, bw));
  }
  // nose
  const nv = Math.floor(rnd() * 3);
  if (nv === 0) head.push(L(`M${cx - 2} ${n(eyeY + 2)}C${cx - 4} ${n(eyeY + 12)} ${cx - 7} ${n(noseY - 4)} ${cx - 4} ${n(noseY)}`, 1.1));
  else if (nv === 1) head.push(L(`M${cx - 1} ${n(eyeY + 3)}L${cx - 5} ${n(noseY - 2)}Q${cx - 6} ${n(noseY)} ${cx - 3} ${n(noseY)}`, 1.1));
  else head.push(L(`M${cx - 3} ${n(noseY - 9)}Q${cx - 6} ${n(noseY - 3)} ${cx - 4} ${n(noseY)}`, 1));
  head.push(L(`M${cx - 8} ${n(noseY - 1)}Q${cx - 3} ${n(noseY + 4)} ${cx + 1} ${n(noseY + 1)}Q${cx + 5} ${n(noseY + 3)} ${cx + 8} ${n(noseY - 1)}`, 1, 0.85));
  head.push(F(`M${cx + 1} ${n(eyeY + 4)}Q${cx + 3} ${n(noseY - 6)} ${cx + 6} ${n(noseY - 3)}L${cx + 2} ${n(noseY - 3)}Z`, H, 0.5));
  // mouth
  const mw = r(9, 12.5);
  const smile = r(-1, 2.6);
  head.push(L(`M${n(cx - mw)} ${n(mouthY)}Q${n(cx - mw / 2)} ${n(mouthY - 3)} ${cx} ${n(mouthY - 1.4)}Q${n(cx + mw / 2)} ${n(mouthY - 3)} ${n(cx + mw)} ${n(mouthY)}`, 0.9, 0.75));
  head.push(L(`M${n(cx - mw)} ${n(mouthY)}Q${cx} ${n(mouthY + 2 + smile)} ${n(cx + mw)} ${n(mouthY - smile * 0.3)}`, 1.5));
  head.push(L(`M${n(cx - mw * 0.65)} ${n(mouthY + 3)}Q${cx} ${n(mouthY + lipFull)} ${n(cx + mw * 0.65)} ${n(mouthY + 3)}`, 0.9, 0.6));
  head.push(F(`M${n(cx - mw * 0.5)} ${n(mouthY + 3)}Q${cx} ${n(mouthY + lipFull - 1)} ${n(cx + mw * 0.5)} ${n(mouthY + 3)}Q${cx} ${n(mouthY + 5)} ${n(cx - mw * 0.5)} ${n(mouthY + 3)}Z`, H, 0.6));
  if (marks > 0.62) head.push(L(`M${n(cx - mw - 4)} ${n(mouthY - 8)}Q${n(cx - mw - 7)} ${n(mouthY - 1)} ${n(cx - mw - 3)} ${n(mouthY + 4)}M${n(cx + mw + 4)} ${n(mouthY - 8)}Q${n(cx + mw + 7)} ${n(mouthY - 1)} ${n(cx + mw + 3)} ${n(mouthY + 4)}`, 0.7, 0.4));
  if (marks < 0.09) head.push(`<circle cx="${n(cx + mw + 6)}" cy="${n(mouthY - 9)}" r="1.1" fill="${INK}" fill-opacity=".8"/>`);
  if (marks > 0.3 && marks < 0.62) head.push(L(`M${n(cx + hw - 6)} 116Q${n(cx + hw - 9)} 126 ${n(cx + hw - 15)} 131`, 0.7, 0.4));

  // ---- hair (in front of the head)
  const hairline = `M${n(cx - hw + 2)} 88C${n(cx - hw + 6)} 72 ${n(cx - 12)} 66 ${cx} 66C${n(cx + 14)} 66 ${n(cx + hw - 6)} 72 ${n(cx + hw - 2)} 86`;
  const cap = (top = 40, side = 100) => `M${n(cx - hw - 3)} ${side}C${n(cx - hw - 7)} 58 ${n(cx - hw + 6)} ${top} ${cx} ${top}C${n(cx + hw - 6)} ${top} ${n(cx + hw + 7)} 58 ${n(cx + hw + 3)} ${side}C${n(cx + hw - 1)} 84 ${n(cx + hw - 6)} 72 ${n(cx + 12)} 66C${cx} 64 ${n(cx - 14)} 66 ${n(cx - hw + 5)} 76C${n(cx - hw + 1)} 82 ${n(cx - hw - 1)} 90 ${n(cx - hw - 3)} ${side}Z`;
  const fillTone = tone > 0.5 ? X : H;
  // A swept cut: volume on top, a parting, the fringe sweeping across.
  const px = cx + part * hw * 0.38;
  const swept = (top = 36, side = 98) => `M${n(cx - hw - 3)} ${side}C${n(cx - hw - 8)} 70 ${n(cx - hw - 2)} ${top + 6} ${n(cx - 6)} ${top}C${n(cx + hw * 0.6)} ${top - 3} ${n(cx + hw + 9)} ${top + 14} ${n(cx + hw + 3)} ${side}C${n(cx + hw + 1)} 86 ${n(cx + hw - 3)} 76 ${n(px + part * 6)} 64C${n(px)} 70 ${n(cx - part * 10)} 72 ${n(cx - part * hw * 0.85)} 80C${n(cx - hw + 1)} 84 ${n(cx - hw - 1)} 90 ${n(cx - hw - 3)} ${side}Z`;
  const sweepStrands = (count, top = 36) => {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const sx = px + r(-2, 2);
      const ex2 = cx - part * (hw * (0.2 + t * 0.75));
      const ey2 = 70 + t * 12 + r(-2, 2);
      head.push(L(`M${n(sx)} ${n(top + 8 + t * 6)}Q${n((sx + ex2) / 2 + r(-4, 4))} ${n(top + 4 + t * 10)} ${n(ex2)} ${n(ey2)}`, 0.75, 0.6));
    }
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      head.push(L(`M${n(px + part * 3)} ${n(top + 6)}Q${n(cx + part * (hw * 0.7 + t * 4))} ${n(top + 10 + t * 8)} ${n(cx + part * (hw + 1 - t * 2))} ${n(80 + t * 12)}`, 0.7, 0.5));
    }
    head.push(L(`M${n(px)} ${n(top + 4)}L${n(px + part * 4)} 64`, 0.9, 0.7));
  };
  const strands = (count, fromY, toY) => {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x0 = cx - hw + 4 + t * (hw * 2 - 8);
      head.push(L(`M${n(x0)} ${n(fromY + Math.abs(t - 0.5) * 18)}Q${n(x0 + (t - 0.5) * 10)} ${n((fromY + toY) / 2)} ${n(x0 + (t - 0.5) * 22)} ${n(toY + Math.abs(t - 0.5) * 10)}`, 0.7, 0.55));
    }
  };
  if (hair === 'none') {
    head.push(L(`M${n(cx - hw)} 92C${n(cx - hw - 2)} 50 ${n(cx + hw + 2)} 50 ${n(cx + hw)} 92`, 1.4), F(`M${n(cx - hw + 2)} 88C${n(cx - hw)} 60 ${n(cx - 6)} 52 ${n(cx - 4)} 54C${n(cx - hw + 10)} 62 ${n(cx - hw + 8)} 76 ${n(cx - hw + 8)} 88Z`, H, 0.6));
  } else if (hair === 'short') {
    head.push(F(swept(36, 98), PAPER), F(swept(36, 98), fillTone, 0.7), L(swept(36, 98), 1.3));
    sweepStrands(8, 36);
  } else if (hair === 'cap' || hair === 'beret') {
    head.push(F(cap(46, 98), fillTone, 0.9), L(cap(46, 98), 1.3));
    strands(9, 70, 46);
  } else if (hair === 'slick' || hair === 'bun' || hair === 'veil') {
    head.push(F(cap(40, 96), PAPER), F(cap(40, 96), fillTone, 0.8), L(cap(40, 96), 1.3));
    for (let i = 0; i < 7; i++) head.push(L(`M${n(px + part * i * 2)} ${n(46 + i)}Q${n(cx - part * (hw * 0.5 - i))} ${n(52 + i * 3)} ${n(cx - part * (hw + 1))} ${n(84 + i * 2)}`, 0.8, 0.55));
    head.push(`<g stroke="${PAPER}">${L(`M${n(px - part * 8)} 52Q${n(cx - part * 10)} 50 ${n(cx - part * (hw - 4))} 64`, 2.4, 0.5)}</g>`);
    if (hair === 'bun') {
      head.push(`<circle cx="${cx}" cy="34" r="12.5" fill="${PAPER}"/>`, `<circle cx="${cx}" cy="34" r="12.5" fill="${fillTone}" fill-opacity=".8"/>`);
      head.push(L(`M${cx - 12} 34a12 12 0 1 0 24 0a12 12 0 1 0 -24 0`, 1.3), L(`M${cx - 6} 33q6 -8 11 2q-3 6 -8 1`, 0.8, 0.7));
    }
  } else if (hair === 'long') {
    head.push(F(cap(40, 104), fillTone, 0.85), L(cap(40, 104), 1.3));
    head.push(L(`M${cx + 3} 42Q${cx} 54 ${cx + 2} 66`, 0.9, 0.7));
    strands(8, 66, 46);
  } else if (hair === 'curls') {
    const mass = `M${n(cx - hw - 12)} 112C${n(cx - hw - 22)} 70 ${n(cx - hw)} 28 ${cx} 28C${n(cx + hw)} 28 ${n(cx + hw + 22)} 70 ${n(cx + hw + 12)} 112C${n(cx + hw + 2)} 96 ${n(cx + hw - 4)} 80 ${n(cx + 10)} 70C${cx} 68 ${n(cx - 12)} 70 ${n(cx - hw + 4)} 80C${n(cx - hw - 2)} 92 ${n(cx - hw - 6)} 100 ${n(cx - hw - 12)} 112Z`;
    head.push(F(mass, PAPER), F(mass, fillTone, 0.55));
    for (const [ring, k, rad] of [[0, 17, hw + 8], [1, 12, hw - 2]]) {
      for (let i = 0; i < k; i++) {
        const a = Math.PI * (0.98 + (i / (k - 1)) * 1.04);
        const x = cx + Math.cos(a) * rad;
        const y = (ring ? 80 : 86) + Math.sin(a) * (ring ? 34 : 50);
        const rr = r(5, 7.5) - ring;
        head.push(L(`M${n(x - rr)} ${n(y)}a${n(rr)} ${n(rr)} 0 1 1 ${n(rr * 2)} 0a${n(rr * 0.8)} ${n(rr * 0.8)} 0 1 1 ${n(-rr * 1.4)} 0`, 0.95, 0.8));
      }
    }
  }
  if (hair === 'veil') {
    head.push(L(`M${n(cx - hw - 6)} 72Q${cx} 48 ${n(cx + hw + 6)} 72`, 1, 0.7));
    let sc = `M${n(cx - hw - 4)} 74`;
    for (let i = 0; i < 8; i++) sc += `q${n((hw * 2 + 8) / 16)} 4 ${n((hw * 2 + 8) / 8)} 0`;
    head.push(L(sc, 0.8, 0.6));
  }
  if (hair === 'cap') {
    head.push(F(`M${n(cx - hw - 4)} 70C${n(cx - hw - 4)} 46 ${n(cx + hw + 4)} 44 ${n(cx + hw + 4)} 68Z`, X, 0.75));
    head.push(L(`M${n(cx - hw - 4)} 70C${n(cx - hw - 4)} 46 ${n(cx + hw + 4)} 44 ${n(cx + hw + 4)} 68`, 1.4));
    head.push(F(`M${n(cx - hw - 3)} 68L${n(cx + hw + 3)} 66L${n(cx + hw + 3)} 76L${n(cx - hw - 3)} 78Z`, PAPER), L(`M${n(cx - hw - 3)} 68L${n(cx + hw + 3)} 66L${n(cx + hw + 3)} 76L${n(cx - hw - 3)} 78Z`, 1.3));
    head.push(F(`M${n(cx - hw + 2)} 78Q${cx} 94 ${n(cx + hw - 2)} 77Z`, X, 0.9), L(`M${n(cx - hw + 2)} 78Q${cx} 94 ${n(cx + hw - 2)} 77`, 1.4));
    head.push(L(`M${cx - 4} 70h8`, 2.2));
  }
  if (hair === 'beret') {
    head.push(`<ellipse cx="${cx + 8}" cy="50" rx="${n(hw + 14)}" ry="13" transform="rotate(-9 ${cx + 8} 50)" fill="${PAPER}"/>`);
    head.push(`<ellipse cx="${cx + 8}" cy="50" rx="${n(hw + 14)}" ry="13" transform="rotate(-9 ${cx + 8} 50)" fill="${X}" fill-opacity=".7" stroke="${INK}" stroke-width="1.3"/>`);
    head.push(L(`M${cx + 10} 38q2 -6 5 -6`, 1.4));
  }

  // ---- headwear and eyewear
  if (extras.has('tiara')) {
    head.push(L(`M${cx - 23} 64L${cx - 17} 52L${cx - 10} 61L${cx} 45L${cx + 10} 61L${cx + 17} 52L${cx + 23} 64`, 1.4));
    head.push(`<circle cx="${cx}" cy="49" r="2.4" fill="${PAPER}" stroke="${INK}" stroke-width="1"/><circle cx="${cx - 17}" cy="55" r="1.5" fill="${INK}"/><circle cx="${cx + 17}" cy="55" r="1.5" fill="${INK}"/>`);
  }
  if (extras.has('headlamp')) {
    head.push(L(`M${n(cx - hw - 2)} 82Q${cx} 70 ${n(cx + hw + 2)} 82`, 2.2));
    head.push(`<rect x="${cx - 7}" y="68" width="14" height="10" rx="3" fill="${PAPER}" stroke="${INK}" stroke-width="1.3"/><circle cx="${cx}" cy="73" r="2.6" fill="none" stroke="${INK}" stroke-width="1"/>`);
    head.push(L(`M${cx - 4} 66l-6 -14M${cx} 66v-16M${cx + 4} 66l6 -14`, 0.7, 0.45));
  }
  if (extras.has('glasses')) {
    for (const side of [-1, 1]) head.push(L(`M${n(cx + side * ex - 10)} ${n(eyeY - 1)}a10 9 0 1 0 20 0a10 9 0 1 0 -20 0`, 1.2));
    head.push(L(`M${n(cx - ex + 10)} ${n(eyeY - 2)}Q${cx} ${n(eyeY - 6)} ${n(cx + ex - 10)} ${n(eyeY - 2)}`, 1.1));
    head.push(L(`M${n(cx - ex - 10)} ${n(eyeY - 2)}L${n(cx - hw)} ${n(eyeY - 4)}M${n(cx + ex + 10)} ${n(eyeY - 2)}L${n(cx + hw)} ${n(eyeY - 4)}`, 1));
  }
  if (extras.has('sunglasses')) {
    for (const side of [-1, 1]) {
      const d = `M${n(cx + side * ex - 11)} ${n(eyeY - 4)}Q${n(cx + side * ex)} ${n(eyeY - 7)} ${n(cx + side * ex + 11)} ${n(eyeY - 4)}Q${n(cx + side * ex + 10)} ${n(eyeY + 8)} ${n(cx + side * ex)} ${n(eyeY + 8)}Q${n(cx + side * ex - 10)} ${n(eyeY + 8)} ${n(cx + side * ex - 11)} ${n(eyeY - 4)}Z`;
      head.push(F(d, INK, 0.82), L(d, 1.2), `<g stroke="${PAPER}">${L(`M${n(cx + side * ex - 5)} ${n(eyeY - 1)}l5 -3`, 0.8, 0.5)}</g>`);
    }
    head.push(L(`M${n(cx - ex + 11)} ${n(eyeY - 3)}Q${cx} ${n(eyeY - 7)} ${n(cx + ex - 11)} ${n(eyeY - 3)}`, 1.2));
  }

  out.push(`<g transform="rotate(${n(tilt)} ${cx} 120)">${head.join('')}</g>`);

  // ---- things worn at the throat (over everything)
  if (extras.has('pearls')) {
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = cx - 26 + 52 * t;
      const y = 190 + 13 * Math.sin(Math.PI * t);
      out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="2.3" fill="${PAPER}" stroke="${INK}" stroke-width=".9"/>`);
    }
  }
  if (extras.has('necklace')) {
    out.push(L(`M${cx - 22} 188L${cx} 212L${cx + 22} 188`, 0.9, 0.85));
    out.push(`<path d="M${cx} 212l-5 6 5 9 5-9z" fill="${INK}" fill-opacity=".85" stroke="${INK}" stroke-width=".8"/>`);
  }
  if (extras.has('bowtie')) out.push(F(`M${cx} 190L${cx - 12} 183L${cx - 12} 197ZM${cx} 190L${cx + 12} 183L${cx + 12} 197Z`, X, 0.9), L(`M${cx} 190L${cx - 12} 183L${cx - 12} 197ZM${cx} 190L${cx + 12} 183L${cx + 12} 197Z`, 1.2), `<circle cx="${cx}" cy="190" r="2.6" fill="${INK}"/>`);
  if (extras.has('cravat')) out.push(F(`M${cx - 10} 184Q${cx} 178 ${cx + 10} 184Q${cx + 12} 194 ${cx} 196Q${cx - 12} 194 ${cx - 10} 184Z`, PAPER), L(`M${cx - 10} 184Q${cx} 178 ${cx + 10} 184Q${cx + 12} 194 ${cx} 196Q${cx - 12} 194 ${cx - 10} 184Z`, 1.1), L(`M${cx - 5} 196L${cx} 222L${cx + 5} 196`, 1.1), L(`M${cx - 4} 186q4 5 8 0`, 0.7, 0.6));
  if (extras.has('rose')) {
    const rx = cx - 42;
    const ry = 224;
    out.push(`<circle cx="${rx}" cy="${ry}" r="7" fill="${PAPER}"/>`, L(`M${rx - 6} ${ry}a6 6 0 1 1 12 0a6 6 0 1 1 -12 0M${rx - 3} ${ry - 1}q3 -4 6 0q-2 4 -5 1`, 1), L(`M${rx + 5} ${ry + 5}l7 8M${rx + 8} ${ry + 9}q5 -2 6 3`, 1, 0.8));
  }

  const defs = `<defs>
<pattern id="h-${pid}" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="3.4" stroke="${INK}" stroke-width=".75" stroke-opacity=".55"/></pattern>
<pattern id="x-${pid}" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V3.2M0 1.6H3.2" stroke="${INK}" stroke-width=".7" stroke-opacity=".6"/></pattern>
<pattern id="lace-${pid}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.1" fill="none" stroke="${INK}" stroke-width=".5" stroke-opacity=".5"/><circle cx="0" cy="0" r=".6" fill="${INK}" fill-opacity=".35"/></pattern>
<radialGradient id="p-${pid}" cx="50%" cy="42%" r="70%"><stop offset="60%" stop-color="${PAPER}"/><stop offset="100%" stop-color="${PAPER2}"/></radialGradient>
</defs>`;
  const label = name ? `<title>${String(name).replace(/[<&>"]/g, '')}</title>` : '';
  return `<svg class="sketch" viewBox="0 0 200 250" width="${size}" height="${Math.round((size * 250) / 200)}" role="img" aria-label="A sketch of ${String(name || '').replace(/[<&>"]/g, '')}">${label}${defs}<rect x="1" y="1" width="198" height="248" rx="3" fill="url(#p-${pid})"/><g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" transform="translate(100 112) scale(1.13) translate(-100 -104)">${out.join('')}</g></svg>`;
}

export function sketch(id, name, cfg, opts) {
  return raw(sketchSvg(id, name, cfg, opts));
}
