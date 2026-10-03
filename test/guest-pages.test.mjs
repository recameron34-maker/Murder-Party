// The pages sent to guests before the party: one self-contained page each,
// only that guest's secrets, no way back to the host material.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildGuestPages } from '../scripts/build-guest-pages.mjs';
import { content, pageText } from './helpers.mjs';

const chars = content.characters;
const snip = (s) => String(s).replace(/\*\*|\*|_/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

test('each sent page holds only its own guest, and nothing links back to the host', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'guest-pages-'));
  const { ids, slugs, upload, hostFile } = buildGuestPages(out, { base: 'https://example.test', content });
  assert.ok(ids.length > 10);
  assert.ok(!hostFile.startsWith(upload), 'the host link list is outside the upload folder');
  const index = fs.readFileSync(path.join(upload, 'index.html'), 'utf8');
  for (const id of ids) {
    assert.ok(!index.includes(slugs[id]), 'the upload index lists no pages');
    assert.ok(!index.includes(chars[id].name), 'the upload index names nobody');
  }
  for (const id of ids) {
    const html = fs.readFileSync(path.join(upload, slugs[id], 'index.html'), 'utf8');
    const text = pageText(html);
    assert.ok(text.includes(snip(chars[id].secret).slice(0, 40)), `${id}'s page has their own secret`);
    for (const other of ids) {
      if (other === id) continue;
      const s = snip(chars[other].secret).slice(0, 40);
      if (s.length > 30 && !snip(JSON.stringify(chars[id])).includes(s)) assert.ok(!text.includes(s), `${id}'s page contains ${other}'s secret`);
      assert.ok(!html.includes(slugs[other]), `${id}'s page links to ${other}'s page`);
    }
    assert.ok(!/href="\/host|\/api\/updates|action="\/logout|<form/.test(html), `${id}'s page talks to the server`);
    assert.ok(!/<script[^>]+src=/.test(html), `${id}'s page loads no external script`);
  }
  // Rebuilding keeps every link.
  const again = buildGuestPages(out, { content });
  for (const id of ids) assert.equal(again.slugs[id], slugs[id]);
});
