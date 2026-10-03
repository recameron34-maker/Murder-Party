#!/usr/bin/env node
// Builds the pages you SEND to guests before the party, when you tell them
// who they're playing: one self-contained web page per cast guest (their
// invitation, sketch, character, story, connections, evening, secrets, and
// the castle), at an unguessable address. No login, no server, nothing that
// talks back.
//
//   npm run guests [-- --base https://your-site.netlify.app]
//
//   guest-pages/
//     upload/<slug>/index.html   one per guest: send them the link (or the file)
//     upload/index.html          a closed door, so the folder lists nothing
//     upload/robots.txt          keeps search engines out
//     HOST-links.html            who gets which link. HOST ONLY: never upload it
//     slugs.json                 keeps every link the same between builds
//
// guest-pages/ is git-ignored: the slugs are as secret as passphrases.
// NEVER put these pages on the GitHub Pages preview (that site is
// spoiler-full and its home page lists everything). Host the upload folder
// somewhere of its own (drag it onto https://app.netlify.com/drop), or email
// each guest their own index.html.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadContent } from '../src/content-loader.mjs';
import { defaultState } from '../src/lib/state.mjs';
import { rosterHelpers } from '../src/lib/roster.mjs';
import { guestPage } from '../src/views/guest.mjs';
import { page } from '../src/views/layout.mjs';
import { html, raw, toString } from '../src/lib/html.mjs';
import { HOST_CSS } from '../src/views/styles.mjs';
import { sketch } from '../src/views/sketches.mjs';

export function buildGuestPages(out = path.resolve('guest-pages'), { base = '', content = loadContent(), now = new Date() } = {}) {
  const state = defaultState();
  const { roster, canLogin } = rosterHelpers(content, state);
  const ids = content.characterOrder.filter(canLogin);

  // Stable, unguessable slugs: reuse the ones already handed out.
  const slugFile = path.join(out, 'slugs.json');
  const slugs = fs.existsSync(slugFile) ? JSON.parse(fs.readFileSync(slugFile, 'utf8')) : {};
  for (const id of ids) if (!slugs[id]) slugs[id] = crypto.randomBytes(9).toString('base64url');

  const upload = path.join(out, 'upload');
  fs.rmSync(upload, { recursive: true, force: true });
  fs.mkdirSync(upload, { recursive: true });
  for (const id of ids) {
    const dir = path.join(upload, slugs[id]);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), guestPage(content, state, id, { standalone: true, now }));
  }
  fs.writeFileSync(path.join(upload, 'index.html'), page({ title: 'Cameron Castle', css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d090f;color:#ad9f8b;font:18px Georgia,serif;text-align:center}', body: html`<p>Cameron Castle is not receiving visitors.</p>` }));
  fs.writeFileSync(path.join(upload, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  fs.writeFileSync(slugFile, JSON.stringify(slugs, null, 2) + '\n');

  // The host's list: who gets which link, and a message to send with it.
  const link = (id) => (base ? `${base.replace(/\/$/, '')}/${slugs[id]}/` : `${slugs[id]}/index.html`);
  const rows = ids.map((id) => {
    const c = content.characters[id];
    const player = roster[id]?.player || '';
    const msg = `${player ? `${player.split(' ')[0]}, you` : 'You'} are invited to the Midnight Supper at Cameron Castle. Here is who you'll be: ${link(id)} (for your eyes only; read it all before the party).`;
    return html`<tr><td>${sketch(id, c.name, content.portraits?.[id], { size: 54, ghost: false })}</td><td><b>${player || '—'}</b><br><span class="small muted">${roster[id]?.status}</span></td><td>${c.name}<br><span class="small muted">${c.public_role}</span></td><td><a href="upload/${slugs[id]}/index.html">${link(id)}</a></td><td><textarea readonly rows="4" style="min-height:0;min-width:260px;font-size:12px">${msg}</textarea></td></tr>`;
  });
  const hostPage = page({
    title: 'Guest pages: who gets which link (HOST ONLY)',
    css: HOST_CSS,
    body: html`<main class="wrap" style="max-width:1100px">
<h1>Guest pages</h1>
<p><b>Host only. Never upload this file.</b> One page per cast guest: their invitation, sketch and character. Each page holds only that guest's secrets.</p>
<ol>
  <li>Upload the <code>upload</code> folder somewhere of its own (drag it onto <a href="https://app.netlify.com/drop">app.netlify.com/drop</a>). Not the GitHub Pages preview: that one is full of spoilers.</li>
  <li>${base ? 'Send each guest their link below.' : raw('Rebuild with <code>npm run guests -- --base https://your-site.netlify.app</code> to get full links, then send each guest theirs.')} Or attach their <code>index.html</code> to an email; it opens in any browser.</li>
  <li>Keep <code>slugs.json</code>. Rebuilding with it keeps every link the same after you edit a character.</li>
</ol>
<div class="chart-scroll"><table><tr><th></th><th>Player</th><th>Character</th><th>Their page</th><th>Message to send</th></tr>${rows}</table></div>
</main>`,
  });
  fs.writeFileSync(path.join(out, 'HOST-links.html'), hostPage);
  return { ids, slugs, upload, hostFile: path.join(out, 'HOST-links.html') };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const i = process.argv.indexOf('--base');
  const base = i > 0 ? process.argv[i + 1] || '' : '';
  const r = buildGuestPages(path.resolve('guest-pages'), { base });
  console.log(`Built ${r.ids.length} guest pages in guest-pages/upload (who gets which link: guest-pages/HOST-links.html).`);
}
