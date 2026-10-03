// Spoiler safety: what a logged-in guest can see.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content, makeApp, snippet, pageText } from './helpers.mjs';
import { rosterHelpers } from '../src/lib/roster.mjs';

const chars = content.characters;
const loginIds = content.characterOrder.filter((id) => rosterHelpers(content, {}).canLogin(id));

// Distinctive private strings per character: secret, each round, host notes.
function privateSnippets(id) {
  const c = chars[id];
  const out = [
    ['secret', snippet(c.secret)],
    ['round 1', snippet(c.rounds[1].text)],
    ['round 2', snippet(c.rounds[2].text)],
    ['round 3', snippet(c.rounds[3].text)],
    ['backstory', snippet(c.backstory)],
  ];
  if (c.host_notes) out.push(['host notes', snippet(c.host_notes)]);
  if (c.fallback) out.push(['fallback', snippet(c.fallback)]);
  return out;
}

test('every guest page, at every round, contains only that guest\'s own unlocked content', async () => {
  const app = await makeApp({ phones: true });
  const hostCookie = await app.loginHost();
  const cookies = {};
  for (const id of loginIds) cookies[id] = await app.loginGuest(id);

  for (const round of [0, 1, 2, 3]) {
    await app.setRound(hostCookie, round);
    for (const id of loginIds) {
      const res = await app.fetch('/', { cookie: cookies[id] });
      assert.equal(res.status, 200);
      const text = pageText(await res.text());
      assert.ok(text.includes(chars[id].name.replace(/"/g, '"')), `${id} sees own name`);

      // Own locked rounds must not be in the payload yet.
      for (const n of [1, 2, 3]) {
        const s = snippet(chars[id].rounds[n].text);
        assert.equal(text.includes(s), n <= round, `${id} round ${n} visibility at live round ${round}`);
      }
      // Mission only from Round One.
      assert.equal(text.includes(snippet(chars[id].mission)), round >= 1, `${id} mission at round ${round}`);
      // Never host-only material.
      if (chars[id].host_notes) assert.ok(!text.includes(snippet(chars[id].host_notes)), `${id} host notes leaked`);
      if (chars[id].fallback) assert.ok(!text.includes(snippet(chars[id].fallback)), `${id} fallback leaked`);

      // Nobody else's private content.
      for (const other of content.characterOrder) {
        if (other === id) continue;
        for (const [label, s] of privateSnippets(other)) {
          assert.ok(!text.includes(s), `${id}'s page (round ${round}) contains ${other}'s ${label}: "${s}"`);
        }
      }
    }
  }
});

test('only Morgan\'s page says who the killer is', async () => {
  const app = await makeApp();
  const hostCookie = await app.loginHost();
  await app.setRound(hostCookie, 3);
  for (const id of loginIds) {
    const text = pageText(await (await app.fetch('/', { cookie: await app.loginGuest(id) })).text());
    const says = /You killed Arthur|You may accept Blackmail Cash and lie/i.test(text);
    assert.equal(says, id === 'morgan', `${id}`);
  }
});

test('pages carry no data bundles: no external scripts, no JSON, identical script for everyone', async () => {
  const app = await makeApp();
  const scripts = new Set();
  for (const id of ['morgan', 'maya', 'kevin', 'albie']) {
    const html = await (await app.fetch('/', { cookie: await app.loginGuest(id) })).text();
    assert.ok(!/<script[^>]+src=/i.test(html), 'no external scripts');
    assert.ok(!/application\/json|__DATA__|"characters"\s*:/.test(html), 'no embedded data');
    scripts.add(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  }
  assert.equal(scripts.size, 1, 'every guest gets byte-identical client code');
});

for (const [label, roster] of [
  ['maybes not cast', {}],
  ['maybes cast', { savanah: { player: 'Savanah', status: 'confirmed' }, courtney: { player: 'Courtney', status: 'confirmed' } }],
]) test(`Morgan's page has exactly the same structure as everyone else's and isn't a length outlier (${label})`, async () => {
  const app = await makeApp({ roster });
  const hostCookie = await app.loginHost();
  await app.setRound(hostCookie, 3);
  const shape = (html) => [...html.replace(/<svg[\s\S]*?<\/svg>/g, '<svg>').matchAll(/<(h[1-4]|section|nav|details|meta|title)\b[^>]*>/g)].map((m) => m[0].replace(/>[^<]*$/, '').replace(/content="[^"]*"|id="(?!character|envelopes|phone|manor)[^"]*"/g, '')).join('|');
  const headings = (html) => [...html.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).join(' / ');
  const pages = {};
  for (const id of content.characterOrder.filter((x) => chars[x].tier !== 'flex')) {
    pages[id] = await (await app.fetch('/', { cookie: await app.loginGuest(id) })).text();
  }
  const ref = headings(pages.morgan);
  for (const [id, html] of Object.entries(pages)) {
    assert.equal(headings(html), ref, `${id} headings differ from Morgan's`);
    assert.equal(shape(html), shape(pages.morgan), `${id} structure differs from Morgan's`);
  }
  const sizes = Object.values(pages).map((h) => pageText(h).length).sort((a, b) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)];
  const morgan = pageText(pages.morgan).length;
  assert.ok(morgan < sizes[sizes.length - 1], 'Morgan must not have the longest page');
  assert.ok(Math.abs(morgan - median) / median < 0.3, `Morgan's page (${morgan}) is within 30% of the median (${median})`);
});

test('updates API returns only your own delivered texts, on schedule', async () => {
  const app = await makeApp({ phones: true });
  const hostCookie = await app.loginHost();
  const maya = await app.loginGuest('maya');
  const kevin = await app.loginGuest('kevin');
  const get = async (cookie) => (await app.fetch('/api/updates', { cookie })).json();

  let d = await get(maya);
  assert.deepEqual(d.texts.map((t) => t.id).sort(), ['all-welcome', 'maya-arthur-history', 'maya-kevin-history']);
  assert.equal(d.round, 0);

  const t0 = app.now;
  await app.setRound(hostCookie, 1);
  app.now = new Date(t0.getTime() + 2 * 60000); // Round One + 2 min
  d = await get(maya);
  assert.deepEqual(d.texts.map((t) => t.id).sort(), ['all-road', 'all-welcome', 'maya-arthur-history', 'maya-kevin-history']);
  app.now = new Date(t0.getTime() + 4 * 60000); // + 4 min: Kevin's text (after: 3)
  d = await get(maya);
  assert.ok(d.texts.some((t) => t.id === 'maya-kevin-r1'));
  assert.ok(!d.texts.some((t) => t.id.startsWith('kevin-')), 'no other guests\' texts');
  assert.ok(!d.texts.some((t) => t.id === 'maya-unknown-r2'), 'round 2 text not before round 2');

  const k = await get(kevin);
  assert.ok(!k.texts.some((t) => t.id.startsWith('maya-')));
  assert.ok(k.texts.some((t) => t.id === 'kevin-arthur-history'));
});

test('cue texts and host texts reach only their recipient', async () => {
  const app = await makeApp({ phones: true });
  const hostCookie = await app.loginHost();
  const malik = await app.loginGuest('malik');
  const lindsey = await app.loginGuest('lindsey');
  let d = await (await app.fetch('/api/updates', { cookie: malik })).json();
  assert.ok(!d.texts.some((t) => t.id === 'malik-scheduled-r3'));
  await app.fetch('/host/cue', { method: 'POST', form: { id: 'malik-scheduled-r3' }, cookie: hostCookie });
  d = await (await app.fetch('/api/updates', { cookie: malik })).json();
  assert.ok(d.texts.some((t) => t.id === 'malik-scheduled-r3'));
  await app.fetch('/host/custom', { method: 'POST', form: { to: 'malik', from: 'The Raven', body: 'Only for Malik' }, cookie: hostCookie });
  d = await (await app.fetch('/api/updates', { cookie: malik })).json();
  assert.ok(d.texts.some((t) => t.body === 'Only for Malik'));
  const l = await (await app.fetch('/api/updates', { cookie: lindsey })).json();
  assert.ok(!l.texts.some((t) => t.body === 'Only for Malik' || t.id === 'malik-scheduled-r3'));
});

test('flex lines appear on other pages only while that flex character is cast', async () => {
  const app = await makeApp({ phones: true });
  const hostCookie = await app.loginHost();
  await app.setRound(hostCookie, 2);
  const molly = await app.loginGuest('molly');
  const line = 'Whatever she did with it, she put it back';
  let text = pageText(await (await app.fetch('/', { cookie: molly })).text());
  assert.ok(!text.includes(line), 'Courtney is only a maybe: line hidden');
  assert.ok(!text.includes('"Lady" Courtney asked you'), 'conditional relationship hidden');
  await app.fetch('/host/roster', { method: 'POST', form: { id: 'courtney', player: 'Courtney', status: 'confirmed' }, cookie: hostCookie });
  text = pageText(await (await app.fetch('/', { cookie: molly })).text());
  assert.ok(text.includes(line), 'Courtney confirmed: line shown');
});

test('unassigned spares and declined maybes cannot log in; assigned spares can', async () => {
  const app = await makeApp();
  const hostCookie = await app.loginHost();
  const s = await app.state();
  assert.equal(s.passphrases['spare-rook'], undefined, 'no passphrase for unassigned spares');
  // Even if a passphrase existed, an unassigned spare can't log in.
  s.passphrases['spare-rook'] = 'raven-raven-test';
  await app.store.put('state', s);
  let res = await app.fetch('/login', { method: 'POST', form: { passphrase: 'raven-raven-test' } });
  assert.equal(res.status, 401);
  await app.fetch('/host/roster', { method: 'POST', form: { id: 'spare-rook', player: 'Late Guest', status: 'spare-assigned' }, cookie: hostCookie });
  res = await app.fetch('/login', { method: 'POST', form: { passphrase: 'raven-raven-test' } });
  assert.equal(res.status, 303);
  // Declining a maybe kills their session.
  const savanah = await app.loginGuest('savanah');
  await app.fetch('/host/roster', { method: 'POST', form: { id: 'savanah', player: 'Savanah', status: 'declined' }, cookie: hostCookie });
  const page = await (await app.fetch('/', { cookie: savanah })).text();
  assert.ok(page.includes('Speak your passphrase'), 'declined guest is logged out');
});

test('the guest house plan shows rooms only: no passage, evidence pins, whereabouts or murder zones', async () => {
  const app = await makeApp();
  const hostCookie = await app.loginHost();
  await app.setRound(hostCookie, 3);
  for (const id of ['morgan', 'joji', 'tim', 'alma']) {
    const html = await (await app.fetch('/', { cookie: await app.loginGuest(id) })).text();
    const maps = [...html.matchAll(/<svg class="venue-map[\s\S]*?<\/svg>/g)].map((m) => m[0]);
    assert.equal(maps.length, 2, `${id} page has a plan of the flat (wide and tall)`);
    for (const map of maps) assert.ok(!/Raven'?s Walk|passage|bookcase|bookshelf|v-pin|v-secret|v-story|data-case|#ff5c74|m-secret|m-pin|m-dots|#c0495a/i.test(map), `${id}'s plan leaks the passage or host markup`);
    assert.ok(!/class="manor-map"/.test(html), `${id}'s page carries the story map (it shows the study and library back to back)`);
    assert.ok(!/murder-zone|escape-zone|mapdata|webgraph|heatmap/.test(html), `${id}'s page carries host-only visuals`);
  }
});

const allStrings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(allStrings) : []);

test('each guest sees only their own whereabouts, and other characters only by public role', async () => {
  const app = await makeApp();
  const hostCookie = await app.loginHost();
  await app.setRound(hostCookie, 3);
  const { liveIds } = rosterHelpers(content, (await app.state()));
  for (const id of loginIds) {
    const html = await (await app.fetch('/', { cookie: await app.loginGuest(id) })).text();
    const text = pageText(html);
    // Phrases this guest legitimately knows too (e.g. a line Maya overhears) are skipped.
    const own = snippet(allStrings(chars[id]).join(' '), Infinity);
    for (const other of content.characterOrder) {
      if (other === id) continue;
      for (const e of chars[other].evening || []) {
        const s = snippet(e.text, 40);
        if (s.length >= 30 && !own.includes(s)) assert.ok(!text.includes(s), `${id}'s page contains ${other}'s whereabouts: "${s}"`);
      }
    }
    // The guest list: live characters only, each by public role.
    const list = html.match(/<ul class="guest-list">([\s\S]*?)<\/ul>/)[1];
    const listed = [...list.matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
    assert.deepEqual([...listed].sort(), liveIds.map((x) => chars[x].name).sort(), `${id}'s guest list is exactly the live cast`);
    const listText = pageText(list);
    for (const other of liveIds) {
      const c = chars[other];
      if (!c.public_role.includes(c.role) && other !== id) assert.ok(!listText.includes(c.role), `${id}'s guest list shows ${other}'s private role`);
    }
  }
});
