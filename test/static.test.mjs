// The GitHub Pages preview is public: it must never contain passphrases or
// anything that could log someone in to the real site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { WORDS } from '../src/lib/words.mjs';

test('static preview builds, links resolve, and contains no passphrases or login cards', () => {
  execFileSync(process.execPath, ['scripts/build-static.mjs'], { stdio: 'pipe' });
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))));
  walk('site');
  assert.ok(files.length > 200);
  const phrase = new RegExp(`\\b(${WORDS.join('|')})-(${WORDS.join('|')})-(${WORDS.join('|')})\\b`);
  for (const f of files.filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(f, 'utf8');
    assert.ok(!/class="pass"/.test(html), `${f} shows a passphrase`);
    assert.ok(!phrase.test(html.replace(/<style[\s\S]*?<\/style>/g, '')), `${f} contains something shaped like a passphrase`);
    for (const [, href] of html.matchAll(/href="([^"#]+)/g)) {
      if (/^(https?:|data:)/.test(href) || f.endsWith('404.html')) continue;
      let target = path.normalize(path.join(path.dirname(f), href));
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), `${f} links to missing ${href}`);
    }
  }
  assert.ok(!fs.existsSync('site/host/print/passphrases'), 'no login-card page in the preview');
});
