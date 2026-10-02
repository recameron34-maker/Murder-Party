// Consistency checker. Pure function over the content (plus runtime state for
// the roster). Returns findings: { level: 'error' | 'warn' | 'info', area, id, message }.
import { parseClock, interval, overlaps, formatClock } from './time.mjs';
import { listConditionals } from './markdown.mjs';
import { effectiveRoster } from './roster.mjs';

export const GUEST_FIELDS = ['name', 'role', 'tagline', 'costume', 'intro', 'backstory', 'relationships', 'evening', 'knows', 'secret', 'blackmail', 'instructions', 'mission', 'rounds', 'texts'];
const TIERS = new Set(['core', 'supporting', 'flex']);
const CLUE_KINDS = new Set(['physical', 'prop', 'spoken', 'announcement']);

// Every string a guest could see on their own page.
export function guestStrings(c) {
  const out = [c.name, c.role, c.tagline, c.costume, c.intro, c.backstory, c.secret, c.mission];
  for (const r of c.relationships || []) out.push(r.text);
  for (const e of c.evening || []) out.push(e.text);
  out.push(...(c.knows || []), ...(c.blackmail || []), ...(c.instructions || []));
  for (const n of [1, 2, 3]) {
    const r = c.rounds?.[n];
    if (r) out.push(r.text, ...(r.reveal || []));
  }
  for (const t of c.texts || []) out.push(t.from, t.body);
  return out.filter((s) => typeof s === 'string');
}

export function wordCount(c) {
  return guestStrings(c).join(' ').split(/\s+/).filter(Boolean).length;
}

function stripConditionals(text) {
  return String(text).replace(/^[ \t]*\[\[if:[a-z0-9-]+\]\][\s\S]*?^[ \t]*\[\[\/if\]\][ \t]*$/gm, '');
}

export function checkContent(content, state = {}) {
  const findings = [];
  const add = (level, area, id, message) => findings.push({ level, area, id, message });
  const chars = content.characters;
  const ids = new Set(Object.keys(chars));
  const known = new Set(Object.keys(content.names));
  const flexIds = new Set([...ids].filter((id) => chars[id].tier === 'flex'));
  const rooms = content.lore.rooms || {};
  const roster = effectiveRoster(content, state);
  const allTextIds = new Map();

  // ------------------------------------------------------------ characters
  for (const id of content.characterOrder) {
    const c = chars[id];
    const where = `characters/${id}`;
    if (!TIERS.has(c.tier)) add('error', where, id, `Unknown tier "${c.tier}"`);
    if (!content.roster?.cast?.[id]) add('warn', where, id, 'Not listed in roster.yaml');
    for (const field of GUEST_FIELDS) {
      const v = c[field];
      const empty = v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
      if (empty) add('error', where, id, `Missing guest field "${field}" (every page must have the same sections)`);
    }
    for (const n of [1, 2, 3]) {
      const r = c.rounds?.[n];
      if (!r?.text) add('error', where, id, `Round ${n} envelope has no text`);
      if (!r?.reveal?.length) add('error', where, id, `Round ${n} envelope has no "reveal" items`);
    }
    if (!c.mission?.trim()) add('error', where, id, 'Missing secret mission');
    if (!c.public_role?.trim()) add('error', where, id, 'Missing public_role (shown on every guest list)');
    else if (/keyhole|killer|murder|secret|undercover|fake|gatecrash|treasure/i.test(c.public_role)) add('warn', where, id, `public_role "${c.public_role}" may give away a secret; it appears on every guest's page`);

    for (const rel of c.relationships || []) {
      if (!known.has(rel.with)) add('error', where, id, `Relationship refers to undefined character "${rel.with}"`);
      if (rel.if && !flexIds.has(rel.if)) add('error', where, id, `Relationship condition "${rel.if}" is not a flex character`);
    }

    // Conditional blocks must reference flex characters and be balanced.
    for (const s of guestStrings(c)) {
      const opens = (s.match(/\[\[if:/g) || []).length;
      const closes = (s.match(/\[\[\/if\]\]/g) || []).length;
      if (opens !== closes) add('error', where, id, 'Unbalanced [[if:…]] / [[/if]] block');
      for (const blk of listConditionals(s)) {
        if (!flexIds.has(blk.id)) add('error', where, id, `[[if:${blk.id}]] refers to a character that isn't flex`);
      }
    }

    // Whereabouts.
    for (const e of c.evening || []) {
      if (parseClock(e.at) == null) add('error', where, id, `Evening entry has unreadable time "${e.at}"`);
      if (e.until && parseClock(e.until) == null) add('error', where, id, `Evening entry has unreadable time "${e.until}"`);
      const iv = interval(e);
      if (iv && iv[1] < iv[0]) add('error', where, id, `Evening entry ends (${e.until}) before it starts (${e.at})`);
      if (!rooms[e.where]) add('error', where, id, `Evening entry uses unknown room "${e.where}"`);
    }

    // Texts.
    for (const t of c.texts || []) checkText(t, where, id);

    // Tier rules.
    if (c.tier === 'flex') {
      if (!c.fallback?.trim()) add('error', where, id, 'Flex character has no fallback');
      const ties = (c.relationships || []).filter((r) => !r.if && ids.has(r.with) && !flexIds.has(r.with));
      if (ties.length < 2) add('error', where, id, `Flex character needs at least two ties to existing characters (has ${ties.length})`);
    }
    if (c.tier === 'core' && roster[id]?.status !== 'confirmed') {
      add('error', 'roster', id, `Core character ${c.name} is "${roster[id]?.status}"; core characters must be cast`);
    }

    // Unconditional mentions of flex characters from non-flex pages.
    if (c.tier !== 'flex') {
      const conditionalRels = new Set((c.relationships || []).filter((r) => r.if).map((r) => r.text));
      for (const s of guestStrings(c).filter((x) => !conditionalRels.has(x))) {
        const body = stripConditionals(s);
        for (const fid of flexIds) {
          const first = chars[fid].name.replace(/^(Lady|Dr\.|Professor)\s+/, '').split(/[\s,"]/)[0];
          if (first.length > 2 && new RegExp(`\\b${first}\\b`).test(body)) {
            add('warn', where, id, `Mentions flex character ${chars[fid].name} outside an [[if:${fid}]] block`);
          }
        }
      }
    }
  }

  function checkText(t, where, owner) {
    if (!t.id) return add('error', where, owner, 'Text without an id');
    if (allTextIds.has(t.id)) add('error', where, owner, `Duplicate text id "${t.id}" (also in ${allTextIds.get(t.id)})`);
    allTextIds.set(t.id, where);
    if (!t.from || !t.body) add('error', where, owner, `Text "${t.id}" needs from and body`);
    const tr = t.trigger || {};
    const kinds = ['history', 'round', 'cue', 'time'].filter((k) => tr[k] != null);
    if (kinds.length !== 1) add('error', where, owner, `Text "${t.id}" needs exactly one trigger (history, round, cue or day/time)`);
    if (tr.round != null && ![1, 2, 3].includes(tr.round)) add('error', where, owner, `Text "${t.id}" triggers on unknown round ${tr.round}`);
    if (tr.time != null && !/^\d{1,2}:\d{2}$/.test(tr.time)) add('error', where, owner, `Text "${t.id}" has bad time "${tr.time}" (use 24h HH:MM)`);
  }
  for (const t of content.globalTexts || []) checkText(t, 'texts.yaml', 'all');

  // ------------------------------------------------------------ solution window
  const sw = content.timeline.solution_window || {};
  if (sw.killer && !ids.has(sw.killer)) add('error', 'timeline.yaml', 'solution_window', `killer "${sw.killer}" is not a character`);
  for (const [zoneName, zone] of Object.entries(sw)) {
    if (!zone || typeof zone !== 'object') continue;
    const win = [parseClock(zone.from), parseClock(zone.to)];
    for (const id of content.characterOrder) {
      for (const e of chars[id].evening || []) {
        const iv = interval(e);
        if (!iv || !zone.rooms.includes(e.where) || !overlaps(iv, win)) continue;
        const allowed = zone.allowed?.[id];
        const label = `${e.at}${e.until ? '–' + e.until : ''} in ${e.where}`;
        if (!allowed) {
          add('error', `characters/${id}`, id, `${chars[id].tier === 'flex' ? 'Flex character' : 'Character'} is in the ${zoneName.replace('_', ' ')} during the murder window (${label}). Not in the true timeline.`);
          continue;
        }
        const [a, b] = allowed.map(parseClock);
        const lo = Math.max(iv[0], win[0]);
        const hi = Math.min(iv[1], win[1]);
        if (lo < a || hi > b) add('error', `characters/${id}`, id, `In the ${zoneName.replace('_', ' ')} ${label}, but the true timeline only allows ${allowed.join('–')}`);
      }
    }
  }

  // ------------------------------------------------------------ timeline
  const clueIds = new Set(Object.keys(content.clues));
  const eventIds = new Set();
  for (const ev of content.timeline.events || []) {
    const where = 'timeline.yaml';
    if (eventIds.has(ev.id)) add('error', where, ev.id, 'Duplicate event id');
    eventIds.add(ev.id);
    if (ev.at && parseClock(ev.at) == null) add('error', where, ev.id, `Unreadable time "${ev.at}"`);
    if (ev.until && parseClock(ev.until) == null) add('error', where, ev.id, `Unreadable time "${ev.until}"`);
    if (ev.where && !rooms[ev.where]) add('error', where, ev.id, `Unknown room "${ev.where}"`);
    for (const w of ev.who || []) if (!known.has(w)) add('error', where, ev.id, `Event refers to undefined character "${w}"`);
    if (ev.flex && !flexIds.has(ev.flex)) add('error', where, ev.id, `flex: "${ev.flex}" is not a flex character`);
    for (const l of ev.learned || []) {
      if (!(l.via === 'host' || ids.has(l.via) || clueIds.has(l.via))) add('error', where, ev.id, `"learned via ${l.via}" is not a character, clue or host`);
      if (l.via && ids.has(l.via) && flexIds.has(l.via) && ev.critical) add('error', where, ev.id, 'Critical fact is learned only via a flex character');
    }
  }

  // ------------------------------------------------------------ clues
  for (const id of content.clueOrder) {
    const cl = content.clues[id];
    const where = cl._file || 'clues';
    if (!CLUE_KINDS.has(cl.kind)) add('error', where, id, `Unknown clue kind "${cl.kind}"`);
    if (![1, 2, 3].includes(cl.round)) add('error', where, id, `Clue round must be 1, 2 or 3 (got ${cl.round})`);
    const carrier = cl.carrier;
    if (!(carrier === 'host' || carrier === 'found' || ids.has(carrier))) add('error', where, id, `Carrier "${carrier}" is undefined`);
    if (ids.has(carrier)) {
      const tier = chars[carrier].tier;
      if (cl.critical && tier === 'flex') add('error', where, id, `Solution-critical clue carried by flex character ${carrier}`);
      if (cl.critical && tier === 'supporting') add(cl.fallback ? 'info' : 'warn', where, id, `Solution-critical clue carried by supporting character ${carrier}${cl.fallback ? ' (has a fallback)' : ' (should be core, or add a fallback)'}`);
      if (!['confirmed', 'spare-assigned'].includes(roster[carrier]?.status) && !cl.fallback) add('warn', where, id, `Carrier ${carrier} isn't cast and the clue has no fallback`);
    }
    for (const r of cl.refs || []) if (!known.has(r)) add('error', where, id, `Refers to undefined character "${r}"`);
    for (const p of cl.points_to || []) if (!known.has(p)) add('error', where, id, `points_to undefined character "${p}"`);
    for (const t of cl.times || []) if (parseClock(t) == null) add('error', where, id, `Unreadable time "${t}"`);
    if (cl.kind === 'physical' && !cl.hide) add('warn', where, id, 'Physical clue has no hiding spot');
    if ((cl.kind === 'physical' || cl.kind === 'prop') && !cl.print) add('warn', where, id, 'Physical clue has no printed text');
  }

  // ------------------------------------------------------------ script
  const cueTexts = new Set();
  for (const id of content.characterOrder) for (const t of chars[id].texts || []) if (t.trigger?.cue) cueTexts.add(t.id);
  for (const t of content.globalTexts || []) if (t.trigger?.cue) cueTexts.add(t.id);
  const firedInScript = new Set();
  for (const seg of content.script) {
    for (const t of seg.send_texts) {
      if (!allTextIds.has(t)) add('error', seg._file, seg.slug, `send_texts refers to unknown text "${t}"`);
      else if (!cueTexts.has(t)) add('warn', seg._file, seg.slug, `send_texts "${t}" is not a cue-triggered text`);
      firedInScript.add(t);
    }
    for (const cl of seg.clues) if (!clueIds.has(cl)) add('error', seg._file, seg.slug, `Refers to unknown clue "${cl}"`);
  }
  for (const t of cueTexts) if (!firedInScript.has(t)) add('info', 'texts', t, 'Cue text is not linked from any run-of-show segment (send it from the Texts page)');

  // ------------------------------------------------------------ times mentioned in text
  const knownTimes = new Set();
  const addTime = (s) => {
    const m = parseClock(s);
    if (m != null) knownTimes.add(m);
  };
  for (const ev of content.timeline.events || []) {
    addTime(ev.at);
    if (ev.until) {
      for (let m = parseClock(ev.at); m <= parseClock(ev.until); m++) knownTimes.add(m);
    }
  }
  for (const id of ids) for (const e of chars[id].evening || []) {
    addTime(e.at);
    if (e.until) addTime(e.until);
  }
  for (const cl of Object.values(content.clues)) for (const t of cl.times || []) addTime(t);
  for (const id of content.characterOrder) {
    for (const s of guestStrings(chars[id])) {
      for (const m of s.matchAll(/\b(\d{1,2}):(\d{2})(\s*[AaPp]\.?[Mm]\.?)?/g)) {
        const h = Number(m[1]);
        if (h < 8 || h > 11) continue; // only check the evening's crucial hours
        const mins = parseClock(`${h}:${m[2]} ${m[3] && /a/i.test(m[3]) ? 'AM' : 'PM'}`);
        if (mins != null && !knownTimes.has(mins)) {
          add('warn', `characters/${id}`, id, `Mentions ${formatClock(mins)}, which isn't on the true timeline, any evening entry, or a clue`);
        }
      }
    }
  }

  // ------------------------------------------------------------ Morgan parity
  const nonFlex = content.characterOrder.filter((id) => chars[id].tier !== 'flex');
  const counts = nonFlex.map((id) => wordCount(chars[id])).sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)];
  for (const id of nonFlex) {
    const wc = wordCount(chars[id]);
    if (Math.abs(wc - median) / median > 0.3) add(id === 'morgan' ? 'error' : 'warn', `characters/${id}`, id, `Page length ${wc} words is far from the median ${median} (page lengths must not single anyone out)`);
  }
  if (chars.morgan) {
    const m = chars.morgan;
    if (wordCount(m) === counts[counts.length - 1]) add('error', 'characters/morgan', 'morgan', "Morgan's page is the longest in the cast; trim it");
    for (const field of ['instructions', 'blackmail', 'texts']) {
      const others = nonFlex.filter((id) => id !== 'morgan').map((id) => (chars[id][field] || []).length);
      const len = (m[field] || []).length;
      if (len > Math.max(...others) || len < Math.min(...others)) add('error', 'characters/morgan', 'morgan', `Morgan has ${len} ${field}; everyone else has ${Math.min(...others)}–${Math.max(...others)}`);
    }
  }

  // ------------------------------------------------------------ roster
  for (const id of content.characterOrder) {
    const r = roster[id];
    if (r.status === 'maybe') add('info', 'roster', id, `${chars[id].name} (${r.player}) is a maybe; their [[if]] lines stay off until confirmed`);
    if (r.status === 'spare-assigned' && !r.player) add('warn', 'roster', id, `${chars[id].name} is spare-assigned but has no player name`);
  }

  // ------------------------------------------------------------ public lore (shown on every guest page)
  const gc = content.guestCommon || {};
  for (const [room, text] of Object.entries(gc.rooms || {})) {
    if (!rooms[room]) add('error', 'guest-common.yaml', room, `Room "${room}" isn't in lore.yaml`);
    if (/passage|raven'?s walk|hidden door|secret door|bookcase/i.test(text)) add('error', 'guest-common.yaml', room, 'Public room description hints at the hidden passage');
  }
  const famIds = new Set((gc.family_tree || []).map((f) => f.id));
  for (const f of gc.family_tree || []) if (f.parent && !famIds.has(f.parent)) add('error', 'guest-common.yaml', f.id, `Family tree parent "${f.parent}" is missing`);
  for (const id of content.clueOrder) {
    const cl = content.clues[id];
    if (cl.room && !rooms[cl.room]) add('error', cl._file || 'clues', id, `Unknown room "${cl.room}"`);
    if (cl.kind === 'physical' && !cl.room) add('warn', cl._file || 'clues', id, 'Physical clue has no room (it won\'t show on the host map)');
  }
  // ------------------------------------------------------------ the venue (Ross's flat; also shown to guests)
  const venue = content.venue || {};
  const areaById = new Map();
  for (const a of venue.areas || []) {
    if (areaById.has(a.id)) add('error', 'venue.yaml', a.id, 'Duplicate area id');
    areaById.set(a.id, a);
    if (!Array.isArray(a.shape) || a.shape.length < 3) add('error', 'venue.yaml', a.id, 'Area needs a shape of at least three points');
    if (a.game && !rooms[a.game]) add('error', 'venue.yaml', a.id, `Unknown manor room "${a.game}"`);
    if (a.game && a.shut) add('error', 'venue.yaml', a.id, 'A shut room cannot also be a game room');
  }
  for (const sp of venue.spots || []) {
    if (!rooms[sp.game]) add('error', 'venue.yaml', sp.game, `Unknown manor room "${sp.game}"`);
    const a = areaById.get(sp.area);
    if (!a) add('error', 'venue.yaml', sp.game, `Spot is in unknown area "${sp.area}"`);
    else if (a.shut) add('error', 'venue.yaml', sp.game, `Spot is in a shut room (${sp.area})`);
  }
  for (const text of [venue.name, ...(venue.areas || []).flatMap((a) => [a.name, a.note]), ...(venue.spots || []).map((sp) => sp.label), ...(venue.entrances || []).map((e) => e.label)]) {
    if (text && /passage|raven'?s walk|hidden door|secret door|bookcase/i.test(text)) add('error', 'venue.yaml', 'text', `Guest-visible venue text hints at the hidden passage: "${text}"`);
  }
  if ((venue.areas || []).length) {
    const placed = new Set([...(venue.areas || []).filter((a) => a.game).map((a) => a.game), ...(venue.spots || []).map((sp) => sp.game)]);
    for (const id of content.clueOrder) {
      const cl = content.clues[id];
      if (cl.kind === 'physical' && cl.carrier === 'found' && cl.room && !placed.has(cl.room)) add('error', cl._file || 'clues', id, `Hidden in the ${cl.room}, but no real room plays the ${cl.room} (venue.yaml)`);
    }
    for (const id of ['study', 'library']) if (!placed.has(id)) add('error', 'venue.yaml', id, `No real room plays the ${id}`);
  }
  for (const id of Object.keys(content.lore.venue_setup || {})) if (!areaById.has(id)) add('error', 'lore.yaml', id, `venue_setup refers to unknown venue area "${id}"`);
  const secret = content.lore.venue_passage;
  if (secret) {
    const [sx1, sy1, sx2, sy2] = secret.line || [];
    const near = (x, y, x1, y1, x2, y2) => x >= Math.min(x1, x2) - 8 && x <= Math.max(x1, x2) + 8 && y >= Math.min(y1, y2) - 8 && y <= Math.max(y1, y2) + 8;
    for (const o of venue.openings || []) {
      if (near((o[0] + o[2]) / 2, (o[1] + o[3]) / 2, sx1, sy1, sx2, sy2)) add('error', 'venue.yaml', 'openings', 'An opening is drawn where the hidden door is: guests would see the passage');
    }
  }

  for (const sus of content.suspicion?.suspects || []) {
    if (!ids.has(sus.id)) add('error', 'suspicion.yaml', sus.id, `Unknown character "${sus.id}"`);
    if ((sus.levels || []).length !== (content.suspicion.stages || []).length) add('error', 'suspicion.yaml', sus.id, 'Needs one level per stage');
  }

  // ------------------------------------------------------------ hints
  for (const h of content.hints) if (![1, 2, 3].includes(h.from_round)) add('error', 'hints.yaml', h.id, 'from_round must be 1, 2 or 3');

  const order = { error: 0, warn: 1, info: 2 };
  return findings.sort((a, b) => order[a.level] - order[b.level]);
}
