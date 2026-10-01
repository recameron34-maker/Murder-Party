// Server-side authentication: HMAC-signed cookies, passphrases, rate limits.
// Uses only Web Crypto, so it runs in Node 20+ and Cloudflare Workers.
import { WORDS } from './words.mjs';

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlText(text) {
  return b64url(enc.encode(text));
}

function fromB64urlText(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export function timingSafeEqual(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function signToken(secret, payload) {
  const body = b64urlText(JSON.stringify(payload));
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifyToken(secret, token, now = Date.now()) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!timingSafeEqual(sig, await hmac(secret, body))) return null;
  try {
    const payload = JSON.parse(fromB64urlText(body));
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function serializeCookie(name, value, { maxAge, secure }) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function generatePassphrase(taken = new Set()) {
  for (;;) {
    const r = crypto.getRandomValues(new Uint32Array(3));
    const phrase = Array.from(r, (n) => WORDS[n % WORDS.length]).join('-');
    if (!taken.has(phrase) && new Set(phrase.split('-')).size === 3) return phrase;
  }
}

export function normalizePassphrase(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Simple fixed-window limiter stored in the same key-value store.
export async function rateLimit(store, key, { limit, windowMs, now = Date.now() }) {
  const rec = (await store.get(`rl:${key}`)) || { count: 0, reset: now + windowMs };
  if (rec.reset < now) {
    rec.count = 0;
    rec.reset = now + windowMs;
  }
  return { blocked: rec.count >= limit, rec };
}

export async function recordFailure(store, key, rec) {
  rec.count += 1;
  await store.put(`rl:${key}`, rec);
}
