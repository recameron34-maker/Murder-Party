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
  assert.deepEqual(ev.murder.who, ['morgan', 'douglas']);
  assert.equal(ev['douglas-texts-morgan'].at, '9:29 PM');
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

test('the flat follows Part Two: nothing hidden in bedrooms or shut rooms, and every hidden clue has a real home', () => {
  const venue = content.venue;
  const areas = new Map(venue.areas.map((a) => [a.id, a]));
  for (const a of venue.areas) if (a.shut) assert.ok(!a.game, `${a.id} is shut but plays ${a.game}`);
  for (const sp of venue.spots) {
    const a = areas.get(sp.area);
    assert.ok(a && !a.shut, `${sp.game} sits in ${sp.area}`);
  }
  const homeOf = (room) => venue.spots.find((sp) => sp.game === room)?.area || venue.areas.find((a) => a.game === room)?.id;
  for (const id of content.clueOrder) {
    const c = content.clues[id];
    if (c.kind !== 'physical' || c.carrier !== 'found') continue;
    const home = areas.get(homeOf(c.room));
    assert.ok(home, `${id} is hidden in the ${c.room}, which no real room plays`);
    assert.ok(!/bedroom/i.test(home.name), `${id} is hidden in a bedroom (${home.id})`);
  }
});

test('the case map can place everyone: every room in anyone\'s evening is drawn on the flat', () => {
  const venue = content.venue;
  const drawn = new Set([...Object.keys(venue.stage || {}), ...venue.areas.flatMap((a) => [a.game, a.story]).filter(Boolean), ...venue.spots.map((sp) => sp.game)]);
  for (const id of content.characterOrder) for (const e of content.characters[id].evening || []) assert.ok(drawn.has(e.where), `${id} at ${e.at} is in the ${e.where}, which the flat doesn't draw`);
  // The study's only ordinary door opens into the room playing the East Corridor.
  assert.equal(venue.areas.find((a) => a.id === 'family-room').game, 'east-corridor');
  assert.equal(venue.areas.find((a) => a.game === 'study').id, 'room');
  assert.equal(venue.areas.find((a) => a.game === 'library').id, 'landing');
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

test('real couples: the checker flags romance between a coupled character and anyone else', () => {
  const copy = structuredClone(content);
  copy.characters.kevin.relationships.push({ with: 'morgan', text: 'Your Cannes fling. You think it is still on.' });
  const errors = checkContent(copy).filter((f) => f.level === 'error' && /real couple/.test(f.message));
  assert.ok(errors.length >= 1, 'a fling for Kevin is flagged');
  const clean = checkContent(content).filter((f) => /real couple/.test(f.message));
  assert.equal(clean.length, 0, 'the real content is clean');
  // The partners themselves may be as romantic as they like.
  assert.ok(content.characters.maya.relationships.some((r) => r.with === 'kevin'));
  assert.ok(content.characters.kevin.relationships.some((r) => r.with === 'maya'));
});

test('portraits: everyone has one, emblems are public-safe, and every portrait has the same shape', async () => {
  const { portraitSvg } = await import('../src/views/portraits.mjs');
  for (const id of content.characterOrder) assert.ok(content.portraits[id], `${id} has a portrait`);
  const copy = structuredClone(content);
  copy.portraits['spare-hollis'] = { hair: 'short', emblem: 'magnifier' };
  assert.ok(checkContent(copy).some((f) => f.level === 'error' && /gives the game away/.test(f.message)), 'a telling emblem is refused');
  // Same element skeleton for everyone (only the detail inside the head/hair/extras groups varies).
  const skeleton = (svg) => svg.replace(/<g clip-path[\s\S]*?<\/g>/, '<g/>').replace(/<g transform="translate\(60 134\)">[\s\S]*?<\/g>/, '<g/>').replace(/"[^"]*"/g, '""');
  const ref = skeleton(portraitSvg('annie', 'Annie', content.portraits.annie));
  for (const id of content.characterOrder) assert.equal(skeleton(portraitSvg(id, 'X', content.portraits[id])), ref, `${id}'s portrait has a different shape`);
});
