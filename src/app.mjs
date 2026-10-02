// The whole web app as one fetch-style handler: handle(Request, deps) → Response.
// Runs under Node (scripts/dev.mjs, tests) and Cloudflare Workers (src/worker.mjs).
//
// deps = {
//   content,            compiled content (see content-loader.mjs)
//   store,              { get(key), put(key, value) } async JSON key-value store
//   env,                { SESSION_SECRET, HOST_PASSWORD }
//   now?,               () => Date (tests)
//   ip?,                client IP when not behind Cloudflare
//   files?,             dev only: { readCharacter(id), writeCharacter(id, text) }
// }
import { loadState, updateState } from './lib/state.mjs';
import { rosterHelpers, STATUSES } from './lib/roster.mjs';
import { deliveredTexts } from './lib/texts.mjs';
import {
  signToken,
  verifyToken,
  parseCookies,
  serializeCookie,
  generatePassphrase,
  normalizePassphrase,
  rateLimit,
  recordFailure,
  timingSafeEqual,
} from './lib/auth.mjs';
import { loginPage, guestPage } from './views/guest.mjs';
import * as host from './views/host.mjs';
import { printView } from './views/print.mjs';

const GUEST_COOKIE = 'bw_g';
const HOST_COOKIE = 'bw_h';
const GUEST_MAX_AGE = 60 * 60 * 24 * 30;
const HOST_MAX_AGE = 60 * 60 * 24 * 7;

const SECURITY_HEADERS = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'content-security-policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

function respond(body, { status = 200, type = 'text/html; charset=utf-8', cookies = [], headers = {} } = {}) {
  const h = new Headers({ 'content-type': type, ...SECURITY_HEADERS, ...headers });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(body, { status, headers: h });
}

function redirect(location, cookies = []) {
  const h = new Headers({ location, ...SECURITY_HEADERS });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(null, { status: 303, headers: h });
}

const textResponse = (status, msg) => respond(msg, { status, type: 'text/plain; charset=utf-8' });

export async function handle(request, deps) {
  try {
    return await route(request, deps);
  } catch (err) {
    console.error(err);
    return textResponse(500, 'The house groans. Something went wrong. Tell Reggie.');
  }
}

async function route(request, deps) {
  const { content, store, env = {} } = deps;
  const now = deps.now ? deps.now() : new Date();
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  const secure = url.protocol === 'https:';
  const secret = env.SESSION_SECRET;

  if (path === '/robots.txt') return respond('User-agent: *\nDisallow: /\n', { type: 'text/plain' });
  if (path === '/favicon.ico') return new Response(null, { status: 204 });
  if (!secret || secret.length < 16) return textResponse(500, 'SESSION_SECRET is not configured (needs 16+ characters). See README.');

  if (method === 'POST') {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return textResponse(403, 'Forbidden');
  }
  if (method !== 'GET' && method !== 'POST' && method !== 'HEAD') return textResponse(405, 'Method not allowed');

  const cookies = parseCookies(request.headers.get('cookie'));
  const ip = request.headers.get('cf-connecting-ip') || deps.ip || 'local';

  // ---------------------------------------------------------------- guest
  async function guestSession(state) {
    const p = await verifyToken(secret, cookies[GUEST_COOKIE], now.getTime());
    if (!p || !content.characters[p.c]) return null;
    if (!rosterHelpers(content, state).canLogin(p.c)) return null;
    if ((state.sessionVersion[p.c] || 0) !== p.v) return null;
    return p.c;
  }

  if (path === '/' && method !== 'POST') {
    const state = await loadState(store);
    const charId = await guestSession(state);
    if (!charId) return respond(loginPage({ prefill: normalizePassphrase(url.searchParams.get('p')) }));
    return respond(guestPage(content, state, charId, { now }));
  }

  if (path === '/login' && method === 'POST') {
    const form = await request.formData();
    const phrase = normalizePassphrase(form.get('passphrase'));
    const limit = await rateLimit(store, `guest:${ip}`, { limit: 12, windowMs: 10 * 60000, now: now.getTime() });
    if (limit.blocked) return respond(loginPage({ prefill: phrase, error: 'Too many wrong guesses. The house is suspicious. Try again in a few minutes.' }), { status: 429 });
    const state = await loadState(store);
    const { canLogin } = rosterHelpers(content, state);
    const charId = content.characterOrder.find((id) => canLogin(id) && state.passphrases[id] && timingSafeEqual(state.passphrases[id], phrase));
    if (!charId) {
      await recordFailure(store, `guest:${ip}`, limit.rec);
      return respond(loginPage({ prefill: phrase, error: 'The house does not recognize that passphrase.' }), { status: 401 });
    }
    if (!state.firstLogin[charId]) {
      await updateState(store, (s) => {
        s.firstLogin[charId] = s.firstLogin[charId] || now.toISOString();
      });
    }
    const token = await signToken(secret, { c: charId, v: state.sessionVersion[charId] || 0, exp: now.getTime() + GUEST_MAX_AGE * 1000 });
    return redirect('/', [serializeCookie(GUEST_COOKIE, token, { maxAge: GUEST_MAX_AGE, secure })]);
  }

  if (path === '/logout' && method === 'POST') {
    return redirect('/', [serializeCookie(GUEST_COOKIE, '', { maxAge: 0, secure })]);
  }

  if (path === '/api/updates') {
    const state = await loadState(store);
    const charId = await guestSession(state);
    if (!charId) return respond(JSON.stringify({ error: 'unauthorized' }), { status: 401, type: 'application/json' });
    const texts = deliveredTexts(content, state, charId, now);
    return respond(JSON.stringify({ round: state.liveRound, texts }), { type: 'application/json' });
  }

  // ---------------------------------------------------------------- host
  if (path === '/host' || path.startsWith('/host/')) return hostRoute({ request, deps, url, path, method, now, secure, secret, cookies, ip });

  return respond(loginPage(), { status: 404 });
}

async function hostRoute({ request, deps, url, path, method, now, secure, secret, cookies, ip }) {
  const { content, store, env = {} } = deps;
  const configured = !!env.HOST_PASSWORD;

  if (path === '/host/login') {
    if (method !== 'POST') return respond(host.hostLoginPage({ configured }));
    if (!configured) return respond(host.hostLoginPage({ configured }), { status: 503 });
    const limit = await rateLimit(store, `host:${ip}`, { limit: 8, windowMs: 15 * 60000, now: now.getTime() });
    if (limit.blocked) return respond(host.hostLoginPage({ error: 'Too many attempts. Wait a few minutes.' }), { status: 429 });
    const form = await request.formData();
    if (!timingSafeEqual(String(form.get('password') || ''), env.HOST_PASSWORD)) {
      await recordFailure(store, `host:${ip}`, limit.rec);
      return respond(host.hostLoginPage({ error: 'Wrong password.' }), { status: 401 });
    }
    const token = await signToken(secret, { h: 1, exp: now.getTime() + HOST_MAX_AGE * 1000 });
    return redirect('/host', [serializeCookie(HOST_COOKIE, token, { maxAge: HOST_MAX_AGE, secure })]);
  }
  if (path === '/host/logout' && method === 'POST') return redirect('/host/login', [serializeCookie(HOST_COOKIE, '', { maxAge: 0, secure })]);

  const session = configured ? await verifyToken(secret, cookies[HOST_COOKIE], now.getTime()) : null;
  if (!session?.h) return redirect('/host/login');

  // Make sure every guest who can log in has a passphrase.
  let state = await loadState(store);
  const missing = content.characterOrder.filter((id) => rosterHelpers(content, state).canLogin(id) && !state.passphrases[id]);
  if (missing.length) {
    state = await updateState(store, (s) => {
      const taken = new Set(Object.values(s.passphrases));
      for (const id of missing) {
        s.passphrases[id] = generatePassphrase(taken);
        taken.add(s.passphrases[id]);
      }
    });
  }

  // Redirect back to where the form was, with a flash message.
  const back = (msg, bad = false, to = null) => {
    let target = '/host';
    if (to && to.startsWith('/host')) target = to;
    else {
      try {
        const ref = new URL(request.headers.get('referer') || '', url.origin);
        if (ref.origin === url.origin && ref.pathname.startsWith('/host')) {
          ref.searchParams.delete('ok');
          ref.searchParams.delete('err');
          target = ref.pathname + ref.search;
        }
      } catch {
        // no usable referer
      }
    }
    return redirect(`${target}${target.includes('?') ? '&' : '?'}${bad ? 'err' : 'ok'}=${encodeURIComponent(msg)}`);
  };

  // ---------------------------------------------------------------- actions
  if (method === 'POST') {
    const form = await request.formData();
    const f = (k) => String(form.get(k) ?? '').trim();

    if (path === '/host/round') {
      const n = Number(f('round'));
      if (![0, 1, 2, 3].includes(n)) return back('Unknown round', true);
      await updateState(store, (s) => {
        s.liveRound = n;
        for (let r = 1; r <= 3; r++) {
          if (r <= n && !s.roundUnlockedAt[r]) s.roundUnlockedAt[r] = now.toISOString();
          if (r > n) delete s.roundUnlockedAt[r];
        }
      });
      return back(n ? `Round ${n} is live.` : 'Back to before the Supper.');
    }
    if (path === '/host/roster') {
      const id = f('id');
      const status = f('status');
      if (!content.characters[id] || !STATUSES.includes(status)) return back('Unknown character or status', true);
      await updateState(store, (s) => {
        s.roster[id] = { player: f('player') || null, status };
      });
      return back(`Saved ${content.characters[id].name}.`);
    }
    if (path === '/host/passphrase') {
      const id = f('id');
      if (!content.characters[id]) return back('Unknown character', true);
      await updateState(store, (s) => {
        s.passphrases[id] = generatePassphrase(new Set(Object.values(s.passphrases)));
        s.sessionVersion[id] = (s.sessionVersion[id] || 0) + 1;
      });
      return back(`New passphrase for ${content.characters[id].name}. Their old one (and any logged-in phone) no longer works.`);
    }
    if (path === '/host/cue') {
      const id = f('id');
      const undo = f('undo') === '1';
      await updateState(store, (s) => {
        if (undo) delete s.cueSent[id];
        else s.cueSent[id] = s.cueSent[id] || now.toISOString();
      });
      return back(undo ? 'Unsent.' : 'Sent.', false, f('back') || null);
    }
    if (path === '/host/custom') {
      const to = f('to');
      const body = f('body');
      if (!body || (to !== 'all' && !content.characters[to])) return back('Pick a recipient and write something.', true);
      const id = 'custom-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
      await updateState(store, (s) => {
        s.custom.push({ id, to, from: f('from') || 'Unknown number', body: body.slice(0, 1000), sentAt: now.toISOString() });
      });
      return back('Text sent.');
    }
    if (path === '/host/custom/delete') {
      const id = f('id');
      await updateState(store, (s) => {
        s.custom = s.custom.filter((c) => c.id !== id);
      });
      return back('Unsent.');
    }
    if (path === '/host/prep') {
      const id = f('id');
      await updateState(store, (s) => {
        if (f('done')) s.prepDone[id] = true;
        else delete s.prepDone[id];
      });
      return back('Updated.');
    }
    if (path === '/host/settings') {
      const d = f('partyDate');
      if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return back('Use a date like 2026-10-31', true);
      await updateState(store, (s) => {
        s.partyDate = d || null;
      });
      return back('Saved.');
    }
    const editMatch = /^\/host\/edit\/([a-z0-9-]+)$/.exec(path);
    if (editMatch && deps.files && content.characters[editMatch[1]]) {
      const id = editMatch[1];
      try {
        await deps.files.writeCharacter(id, String(form.get('yaml') ?? ''));
      } catch (err) {
        const ctx = { content, state, now, path, origin: url.origin, canEdit: true, flash: null };
        return respond(host.editPage(ctx, id, String(form.get('yaml') ?? ''), err.message), { status: 400 });
      }
      return redirect(`/host/characters/${id}?ok=${encodeURIComponent('Saved.')}`);
    }
    return textResponse(404, 'Unknown action');
  }

  // ---------------------------------------------------------------- pages
  const flash = url.searchParams.get('ok') ? { msg: url.searchParams.get('ok') } : url.searchParams.get('err') ? { msg: url.searchParams.get('err'), bad: true } : null;
  const ctx = { content, state, now, path, origin: url.origin, canEdit: !!deps.files, flash };

  if (path === '/host') return respond(host.dashboardPage(ctx));
  if (path === '/host/roster') return respond(host.rosterPage(ctx));
  if (path === '/host/texts') return respond(host.textsPage(ctx));
  if (path === '/host/script') {
    const r = url.searchParams.get('round');
    return respond(host.scriptPage(ctx, r == null || r === '' ? null : Number(r)));
  }
  if (path === '/host/timeline') return respond(host.timelinePage(ctx));
  if (path === '/host/evidence') return respond(host.evidencePage(ctx));
  if (path === '/host/characters') return respond(host.charactersPage(ctx));
  if (path === '/host/check') return respond(host.checkPage(ctx));
  if (path === '/host/flex') return respond(host.flexPage(ctx));
  if (path === '/host/print') return respond(host.printIndexPage(ctx));
  if (path === '/host/map') return respond(host.mapPage(ctx));
  if (path === '/host/web') return respond(host.webPage(ctx));
  if (path === '/host/suspicion') return respond(host.suspicionPage(ctx));

  let m;
  if ((m = /^\/host\/characters\/([a-z0-9-]+)$/.exec(path)) && content.characters[m[1]]) return respond(host.characterPage(ctx, m[1]));
  if ((m = /^\/host\/preview\/([a-z0-9-]+)$/.exec(path)) && content.characters[m[1]]) {
    const round = Math.max(0, Math.min(3, Number(url.searchParams.get('round') ?? state.liveRound) || 0));
    return respond(guestPage(content, state, m[1], { round, preview: true, now }));
  }
  if ((m = /^\/host\/print\/([a-z]+)$/.exec(path))) {
    const out = printView(ctx, m[1], url.searchParams);
    if (out) return respond(out);
  }
  if ((m = /^\/host\/edit\/([a-z0-9-]+)$/.exec(path)) && deps.files && content.characters[m[1]]) {
    return respond(host.editPage(ctx, m[1], await deps.files.readCharacter(m[1])));
  }
  return respond(host.hostNotFound(ctx), { status: 404 });
}
