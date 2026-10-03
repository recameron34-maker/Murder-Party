import { loadContent } from '../src/content-loader.mjs';
import { handle } from '../src/app.mjs';
import { MemoryStore } from '../src/stores.mjs';
import { generatePassphrase } from '../src/lib/auth.mjs';
import { rosterHelpers } from '../src/lib/roster.mjs';

export const ORIGIN = 'https://manor.test';
export const content = loadContent();

// A fresh app with every login-able guest given a passphrase.
// phones: override party.phones (true = the phone companion during the party,
// false = paper night). Default: whatever content/party.yaml says.
export async function makeApp({ clock = new Date('2026-10-31T23:00:00Z'), roster = {}, phones } = {}) {
  const c = phones === undefined ? content : { ...content, party: { ...content.party, phones } };
  const store = new MemoryStore();
  const env = { SESSION_SECRET: 'test-secret-that-is-long-enough', HOST_PASSWORD: 'host-pass' };
  const state = { liveRound: 0, roundUnlockedAt: {}, cueSent: {}, custom: [], roster, passphrases: {}, sessionVersion: {}, firstLogin: {}, prepDone: {}, partyDate: null };
  const taken = new Set();
  const { canLogin } = rosterHelpers(content, state);
  for (const id of content.characterOrder) {
    if (!canLogin(id)) continue;
    state.passphrases[id] = generatePassphrase(taken);
    taken.add(state.passphrases[id]);
  }
  await store.put('state', state);
  const app = {
    store,
    env,
    now: clock,
    async fetch(path, { method = 'GET', form, cookie, headers = {} } = {}) {
      const h = new Headers(headers);
      if (cookie) h.set('cookie', cookie);
      let body;
      if (form) {
        body = new URLSearchParams(form).toString();
        h.set('content-type', 'application/x-www-form-urlencoded');
      }
      return handle(new Request(ORIGIN + path, { method, headers: h, body }), { content: c, store, env, now: () => app.now });
    },
    async state() {
      return store.get('state');
    },
    async loginGuest(id) {
      const s = await app.state();
      const res = await app.fetch('/login', { method: 'POST', form: { passphrase: s.passphrases[id] } });
      if (res.status !== 303) throw new Error(`login ${id} failed: ${res.status}`);
      return cookieFrom(res);
    },
    async loginHost() {
      const res = await app.fetch('/host/login', { method: 'POST', form: { password: 'host-pass' } });
      if (res.status !== 303) throw new Error(`host login failed: ${res.status}`);
      return cookieFrom(res);
    },
    async setRound(hostCookie, round) {
      const res = await app.fetch('/host/round', { method: 'POST', form: { round: String(round) }, cookie: hostCookie });
      if (res.status !== 303) throw new Error('setRound failed');
    },
  };
  return app;
}

export function cookieFrom(res) {
  const c = res.headers.get('set-cookie');
  return c ? c.split(';')[0] : '';
}

// Plain-text snippet of a Markdown string, for "must not appear" checks.
export function snippet(md, len = 48) {
  const plain = String(md)
    .replace(/\[\[\/?if[^\]]*\]\]/g, '')
    .replace(/(^|\n)[ \t]*(\d+\.|[-*])[ \t]+/g, '$1')
    .replace(/[*_>`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, len);
}

export function pageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<\/?(strong|em|b|i|a|span|time|code)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');
}
