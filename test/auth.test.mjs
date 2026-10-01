// Authentication and access control.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, cookieFrom, ORIGIN } from './helpers.mjs';

const HOST_PAGES = ['/host', '/host/roster', '/host/texts', '/host/script', '/host/timeline', '/host/evidence', '/host/characters', '/host/characters/morgan', '/host/preview/morgan', '/host/check', '/host/flex', '/host/print', '/host/print/cards', '/host/print/passphrases'];

test('host pages require the host password, and a guest session is not enough', async () => {
  const app = await makeApp();
  const guest = await app.loginGuest('maya');
  for (const p of HOST_PAGES) {
    for (const cookie of [undefined, guest, 'bw_h=forged.signature']) {
      const res = await app.fetch(p, { cookie });
      assert.equal(res.status, 303, `${p} with ${cookie}`);
      assert.equal(res.headers.get('location'), '/host/login');
    }
  }
  const host = await app.loginHost();
  for (const p of HOST_PAGES) assert.equal((await app.fetch(p, { cookie: host })).status, 200, p);
});

test('host actions are rejected without a host session', async () => {
  const app = await makeApp();
  const guest = await app.loginGuest('maya');
  const res = await app.fetch('/host/round', { method: 'POST', form: { round: '3' }, cookie: guest });
  assert.equal(res.status, 303);
  assert.equal((await app.state()).liveRound, 0);
});

test('wrong passwords fail and are rate-limited', async () => {
  const app = await makeApp();
  for (let i = 0; i < 8; i++) assert.equal((await app.fetch('/host/login', { method: 'POST', form: { password: 'nope' } })).status, 401);
  assert.equal((await app.fetch('/host/login', { method: 'POST', form: { password: 'host-pass' } })).status, 429, 'locked out after 8 failures');
  for (let i = 0; i < 12; i++) assert.equal((await app.fetch('/login', { method: 'POST', form: { passphrase: 'not-a-real-phrase' } })).status, 401);
  assert.equal((await app.fetch('/login', { method: 'POST', form: { passphrase: 'still-wrong-phrase' } })).status, 429);
});

test('tampered or foreign guest cookies are rejected', async () => {
  const app = await makeApp();
  const maya = await app.loginGuest('maya');
  const [name, value] = maya.split('=');
  const [body, sig] = decodeURIComponent(value).split('.');
  const forged = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  forged.c = 'morgan';
  const forgedBody = btoa(JSON.stringify(forged)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await app.fetch('/', { cookie: `${name}=${forgedBody}.${sig}` });
  assert.ok((await res.text()).includes('Speak your passphrase'));
  const other = await makeApp();
  other.env.SESSION_SECRET = 'a-completely-different-secret-value';
  assert.ok((await (await other.fetch('/', { cookie: maya })).text()).includes('Speak your passphrase'));
});

test('a new passphrase logs the old session out', async () => {
  const app = await makeApp();
  const host = await app.loginHost();
  const maya = await app.loginGuest('maya');
  assert.ok((await (await app.fetch('/', { cookie: maya })).text()).includes('Maya Rose'));
  await app.fetch('/host/passphrase', { method: 'POST', form: { id: 'maya' }, cookie: host });
  assert.ok((await (await app.fetch('/', { cookie: maya })).text()).includes('Speak your passphrase'));
  assert.ok((await (await app.fetch('/', { cookie: await app.loginGuest('maya') })).text()).includes('Maya Rose'));
});

test('cross-origin form posts are refused', async () => {
  const app = await makeApp();
  const host = await app.loginHost();
  const res = await app.fetch('/host/round', { method: 'POST', form: { round: '3' }, cookie: host, headers: { origin: 'https://evil.example' } });
  assert.equal(res.status, 403);
  const ok = await app.fetch('/host/round', { method: 'POST', form: { round: '1' }, cookie: host, headers: { origin: ORIGIN } });
  assert.equal(ok.status, 303);
});

test('cookies are HttpOnly, SameSite and Secure over https; pages are no-store and noindex', async () => {
  const app = await makeApp();
  const s = await app.state();
  const res = await app.fetch('/login', { method: 'POST', form: { passphrase: s.passphrases.maya } });
  const c = res.headers.get('set-cookie');
  assert.match(c, /HttpOnly/);
  assert.match(c, /SameSite=Lax/);
  assert.match(c, /Secure/);
  const page = await app.fetch('/', { cookie: cookieFrom(res) });
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.match(page.headers.get('x-robots-tag'), /noindex/);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});

test('host text bodies are escaped on guest pages', async () => {
  const app = await makeApp();
  const host = await app.loginHost();
  const maya = await app.loginGuest('maya');
  await app.fetch('/host/custom', { method: 'POST', form: { to: 'maya', from: '<b>x</b>', body: '<img src=x onerror=alert(1)>' }, cookie: host });
  const html = await (await app.fetch('/', { cookie: maya })).text();
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});
