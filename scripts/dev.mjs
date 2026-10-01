#!/usr/bin/env node
// Local server: guest pages + host panel + YAML editor, reading content/ live.
//
//   npm run dev                     http://localhost:8787 (this computer only)
//   npm run dev -- --lan            also reachable from phones on your Wi-Fi
//   npm run dev -- --port 3000
//
// Secrets come from environment variables or a .dev.vars file:
//   HOST_PASSWORD=...   (default "blackwood" unless --lan, which requires one)
//   SESSION_SECRET=...  (generated and saved in .data/ if missing)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import YAML from 'yaml';
import { loadContent } from '../src/content-loader.mjs';
import { handle } from '../src/app.mjs';
import { FileStore } from '../src/stores-node.mjs';

const args = process.argv.slice(2);
const lan = args.includes('--lan');
const port = Number(args[args.indexOf('--port') + 1]) || Number(process.env.PORT) || 8787;

function readDevVars() {
  try {
    return Object.fromEntries(
      fs.readFileSync('.dev.vars', 'utf8').split('\n').filter((l) => /^\s*[A-Z_]+\s*=/.test(l)).map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
    );
  } catch {
    return {};
  }
}

const env = { ...readDevVars(), ...process.env };
fs.mkdirSync('.data', { recursive: true });
if (!env.SESSION_SECRET) {
  const f = '.data/dev-session-secret';
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString('hex'));
  env.SESSION_SECRET = fs.readFileSync(f, 'utf8').trim();
}
if (!env.HOST_PASSWORD) {
  if (lan) {
    console.error('With --lan, set a real HOST_PASSWORD (in .dev.vars or the environment) so guests on your Wi-Fi can\'t open the host panel.');
    process.exit(1);
  }
  env.HOST_PASSWORD = 'blackwood';
}

const store = new FileStore('.data/state.json');

const files = {
  async readCharacter(id) {
    return fs.readFileSync(path.resolve(loadContent().characters[id]._file), 'utf8');
  },
  async writeCharacter(id, text) {
    const parsed = YAML.parse(text);
    if (!parsed || parsed.id !== id) throw new Error(`The file must still have "id: ${id}".`);
    fs.writeFileSync(path.resolve(loadContent().characters[id]._file), text.replace(/\r\n/g, '\n'));
  },
};

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const url = `http://${req.headers.host || `localhost:${port}`}${req.url}`;
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
    let content;
    try {
      content = loadContent();
    } catch (err) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`Content error:\n\n${err.message}`);
      return;
    }
    const response = await handle(request, { content, store, env, files, ip: req.socket.remoteAddress });
    const headers = {};
    response.headers.forEach((v, k) => {
      if (k !== 'set-cookie') headers[k] = v;
    });
    const setCookies = response.headers.getSetCookie?.() || [];
    if (setCookies.length) headers['set-cookie'] = setCookies;
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`\n  Blackwood Manor is open.\n`);
  console.log(`  Guests:  http://localhost:${port}/`);
  console.log(`  Host:    http://localhost:${port}/host   (password: ${env.HOST_PASSWORD === 'blackwood' ? 'blackwood' : 'from HOST_PASSWORD'})`);
  if (lan) {
    for (const addrs of Object.values(os.networkInterfaces())) {
      for (const a of addrs || []) if (a.family === 'IPv4' && !a.internal) console.log(`  On Wi-Fi: http://${a.address}:${port}/`);
    }
  }
  console.log(`\n  State is saved in .data/state.json. Edit content/ and refresh.\n`);
});
