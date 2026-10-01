#!/usr/bin/env node
// TEMPORARY landing site for GitHub Pages: one page that links to a
// read-only preview of every branch. Run by .github/workflows/pages.yml on
// main (the only branch GitHub lets deploy Pages).
//
// For each branch it checks the branch out, runs that branch's own
// scripts/build-static.mjs if it has one, and files the output under
// branches/<branch-name>/. Branches without the preview builder are still
// listed, with links to their code.
//
// To remove later: delete .github/workflows/pages.yml and .github/landing/.
//
//   node .github/landing/build.mjs [output-dir]     (default: _site)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || '_site');
const REPO = process.env.GITHUB_REPOSITORY || 'recameron34-maker/Murder-Party';
const DEFAULT_BRANCH = 'main';
const SKIP = new Set(['HEAD', 'gh-pages']);

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------------------------------------------------------------- branches
const shallow = run('git', ['rev-parse', '--is-shallow-repository']).trim() === 'true';
run('git', ['fetch', '--quiet', '--prune', ...(shallow ? ['--depth=1'] : []), 'origin', '+refs/heads/*:refs/remotes/origin/*']);
const branches = run('git', ['for-each-ref', '--format=%(refname:lstrip=3)%09%(objectname)%09%(committerdate:iso-strict)%09%(subject)', 'refs/remotes/origin'])
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [name, sha, date, subject] = line.split('\t');
    return { name, sha, date, subject, slug: name.replace(/[^A-Za-z0-9._-]+/g, '-') };
  })
  .filter((b) => !SKIP.has(b.name))
  .sort((a, b) => (a.name === DEFAULT_BRANCH ? -1 : b.name === DEFAULT_BRANCH ? 1 : b.date.localeCompare(a.date)));

// ---------------------------------------------------------------- previews
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'branch-previews-'));

for (const b of branches) {
  const dir = path.join(tmp, b.slug);
  run('git', ['worktree', 'add', '--quiet', '--detach', dir, b.sha]);
  try {
    if (fs.existsSync(path.join(dir, 'scripts', 'build-static.mjs'))) {
      run('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund', '--loglevel=error'], dir);
      run(process.execPath, ['scripts/build-static.mjs'], dir);
      const target = path.join(OUT, 'branches', b.slug);
      fs.cpSync(path.join(dir, 'site'), target, { recursive: true });
      addBackLinks(target);
      b.preview = `branches/${b.slug}/`;
      console.log(`✓ ${b.name}: preview built`);
    } else {
      b.note = 'No preview on this branch yet (it predates the preview builder).';
      console.log(`– ${b.name}: no preview builder`);
    }
  } catch (err) {
    const tail = String(err.stderr || err.stdout || err.message).trim().split('\n').slice(-4).join(' ');
    b.note = `Preview build failed: ${tail}`;
    console.log(`✗ ${b.name}: ${tail}`);
  } finally {
    run('git', ['worktree', 'remove', '--force', dir]);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

// Put an "All branches" link next to "Preview home" on every preview page.
function addBackLinks(root) {
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) {
        const html = fs.readFileSync(p, 'utf8');
        const rel = path.relative(path.dirname(p), OUT).split(path.sep).join('/') || '.';
        if (html.includes('Preview home</a>')) {
          fs.writeFileSync(p, html.replace('Preview home</a>', `Preview home</a> · <a href="${rel}/">All branches</a>`));
        }
      }
    }
  };
  walk(root);
}

// ---------------------------------------------------------------- landing page
const gh = `https://github.com/${REPO}`;
const when = (iso) => new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const builtFrom = process.env.GITHUB_SHA ? ` from ${DEFAULT_BRANCH} @ ${process.env.GITHUB_SHA.slice(0, 7)}` : '';

const cards = branches.map((b) => `
<article class="card">
  <div class="head">
    <h2>${esc(b.name)}</h2>
    ${b.name === DEFAULT_BRANCH ? '<span class="pill">default branch</span>' : ''}
  </div>
  <p class="commit"><a href="${gh}/commit/${b.sha}">${b.sha.slice(0, 7)}</a> · ${esc(b.subject)}</p>
  <p class="muted">Last updated ${when(b.date)}</p>
  ${b.note ? `<p class="muted note">${esc(b.note)}</p>` : ''}
  <p class="actions">
    ${b.preview ? `<a class="btn" href="${b.preview}">Open preview →</a>` : ''}
    <a class="btn ghost" href="${gh}/tree/${encodeURI(b.name)}">Code</a>
    ${b.name !== DEFAULT_BRANCH ? `<a class="btn ghost" href="${gh}/compare/${DEFAULT_BRANCH}...${encodeURI(b.name)}">Compare with main</a>` : ''}
  </p>
</article>`).join('\n');

const page = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Blackwood Manor: branch previews</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=EB+Garamond:wght@400;600&display=swap">
<style>
:root{--bg:#0d090f;--panel:#1a131c;--ink:#efe5d3;--muted:#ad9f8b;--gold:#c9a45c;--gold2:#e3c788;--blood:#8f2636;--line:#33263a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg) radial-gradient(ellipse 120% 60% at 50% -10%,#2a1a2c 0%,#130d15 45%,#0d090f 100%) fixed;color:var(--ink);font:17px/1.55 'EB Garamond',Georgia,serif}
main{max-width:860px;margin:0 auto;padding:28px 16px 60px}
h1,h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;line-height:1.15}
h1{font-size:2.2rem;margin:.2em 0}
h2{font-size:1.35rem;margin:0;color:var(--gold2);word-break:break-word}
a{color:var(--gold2)}
.warn{border:1px solid var(--blood);background:rgba(143,38,54,.12);border-radius:12px;padding:10px 14px;margin:14px 0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:14px 0;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pill{border:1px solid var(--gold);color:var(--gold2);border-radius:999px;padding:0 9px;font:600 .75rem/1.6 system-ui,sans-serif}
.commit{margin:.4em 0 .1em}
.muted{color:var(--muted);font-size:.92rem;margin:.2em 0}
.note{font-style:italic}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin:.7em 0 0}
.btn{display:inline-block;text-decoration:none;background:var(--blood);color:#fff;border:1px solid #b23a4b;border-radius:999px;padding:.4em 1em;font-size:.95rem}
.btn.ghost{background:transparent;color:var(--gold2);border-color:var(--gold)}
footer{color:var(--muted);font-size:.85rem;margin-top:30px}
</style></head><body><main>
<h1>Blackwood Manor: branch previews</h1>
<p class="muted">Temporary landing page. Every branch of the repo, each with a read-only preview of the host planner and every guest's page. Rebuilt automatically whenever any branch is pushed.</p>
<p class="warn"><b>Spoilers.</b> Anyone with this link can read everything, including the solution. Don't send it to guests. The real party site (passphrase logins, live rounds, phone texts) is separate. See the README.</p>
${cards}
<footer>Built ${when(new Date().toISOString())}${esc(builtFrom)} · ${branches.length} branches · <a href="${gh}">${esc(REPO)}</a><br>
To remove this page later, delete <code>.github/workflows/pages.yml</code> and <code>.github/landing/</code>.</footer>
</main></body></html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), page);
// The 404 page is served at any missing URL, so pin its relative links to the site root.
const base = `/${REPO.split('/')[1]}/`;
fs.writeFileSync(
  path.join(OUT, '404.html'),
  page.replace('<head>', `<head>\n<base href="${base}">`).replace('<h1>Blackwood Manor: branch previews</h1>', '<h1>Not found</h1><p>That page doesn\'t exist. Here are the branches:</p>'),
);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`Landing site: ${branches.length} branches, ${branches.filter((b) => b.preview).length} previews → ${OUT}`);
