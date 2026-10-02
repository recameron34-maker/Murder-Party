// The story content itself: consistency with the true timeline and the rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from './helpers.mjs';
import { checkContent } from '../src/lib/check.mjs';

test('the consistency checker finds no errors in the real content', () => {
  const errors = checkContent(content).filter((f) => f.level === 'error');
  assert.deepEqual(errors, []);
});

test('the solution is intact: core facts point at Morgan at the right times', () => {
  const ev = Object.fromEntries(content.timeline.events.map((e) => [e.id, e]));
  assert.equal(ev.murder.at, '9:38 PM');
  assert.deepEqual(ev.murder.who, ['morgan', 'arthur']);
  assert.equal(ev['arthur-texts-morgan'].at, '9:29 PM');
  assert.equal(ev['annie-delivers-drink'].at, '9:31 PM');
  assert.equal(ev.blackout.at, '9:45 PM');
  assert.match(content.clues['bank-statement'].print, /LEGAL\. \$2\.4M\. MIDNIGHT\./);
  assert.ok(!/MORGAN\. MIDNIGHT\. DONE/.test(content.clues['bank-statement'].print));
});

test('core characters carry the solution-critical spoken clues; flex characters carry none', () => {
  for (const c of Object.values(content.clues)) {
    if (!c.critical || !content.characters[c.carrier]) continue;
    assert.notEqual(content.characters[c.carrier].tier, 'flex', c.id);
  }
});

test('the checker catches a flex character wandering into the murder window', () => {
  const broken = structuredClone(content);
  broken.characters.courtney.evening.push({ at: '9:35 PM', where: 'east-corridor', text: 'Lurking.' });
  const errors = checkContent(broken).filter((f) => f.level === 'error');
  assert.ok(errors.some((e) => e.id === 'courtney' && /murder window/.test(e.message)));
});

test('the checker catches undefined characters, bad times, and unbalanced conditionals', () => {
  const broken = structuredClone(content);
  broken.characters.maya.relationships.push({ with: 'nobody-here', text: 'x' });
  broken.characters.maya.evening.push({ at: '25:00 PM', where: 'study', text: 'x' });
  broken.characters.maya.rounds[2].text += '\n[[if:courtney]]\nunclosed\n';
  const msgs = checkContent(broken).filter((f) => f.level === 'error' && f.id === 'maya').map((f) => f.message).join('\n');
  assert.match(msgs, /undefined character "nobody-here"/);
  assert.match(msgs, /unreadable time/);
  assert.match(msgs, /Unbalanced/);
});

test('every flex character has a fallback, a mission and at least two ties', () => {
  for (const id of content.characterOrder.filter((x) => content.characters[x].tier === 'flex')) {
    const c = content.characters[id];
    assert.ok(c.fallback?.trim(), id);
    assert.ok(c.mission?.trim(), id);
    assert.ok(c.relationships.filter((r) => !r.if && content.characters[r.with]).length >= 2, id);
  }
});

test('there are 8 name-flexible spares spanning low, medium and high effort', () => {
  const spares = content.characterOrder.filter((id) => id.startsWith('spare-'));
  assert.equal(spares.length, 8);
  const efforts = new Set(spares.map((id) => content.characters[id].effort));
  assert.deepEqual([...efforts].sort(), ['high', 'low', 'medium']);
});

test('the flat follows Part Two: no bedroom or shut room plays a game room, and every hidden clue has a real home', () => {
  const venue = content.venue;
  const areas = new Map(venue.areas.map((a) => [a.id, a]));
  for (const a of venue.areas) if (/bedroom/i.test(a.name) || a.shut) assert.ok(!a.game, `${a.id} is a bedroom or shut but plays ${a.game}`);
  for (const sp of venue.spots) {
    const a = areas.get(sp.area);
    assert.ok(a && !a.shut && !/bedroom/i.test(a.name), `${sp.game} sits in ${sp.area}`);
  }
  const placed = new Set([...venue.areas.filter((a) => a.game).map((a) => a.game), ...venue.spots.map((sp) => sp.game)]);
  for (const id of content.clueOrder) {
    const c = content.clues[id];
    if (c.kind === 'physical' && c.carrier === 'found') assert.ok(placed.has(c.room), `${id} is hidden in the ${c.room}, which no real room plays`);
  }
});

test('the real hidden door is host-only: never in the guest-safe venue file', () => {
  const secret = content.lore.venue_passage;
  assert.ok(secret, 'lore.yaml has venue_passage');
  const venueText = JSON.stringify(content.venue);
  assert.ok(!venueText.includes(JSON.stringify(secret.line)), 'venue.yaml repeats the passage line');
  assert.ok(!/passage|raven'?s walk|hidden|secret|bookcase|bookshelf/i.test(venueText), 'venue.yaml mentions the passage');
  const [x, y1, , y2] = secret.line;
  for (const [a, b, c, d] of content.venue.openings) {
    const mx = (a + c) / 2;
    const my = (b + d) / 2;
    assert.ok(!(Math.abs(mx - x) < 10 && my > Math.min(y1, y2) - 10 && my < Math.max(y1, y2) + 10), 'an opening is drawn at the hidden door');
  }
});
