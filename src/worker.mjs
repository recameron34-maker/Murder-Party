// Cloudflare Workers entry point. dist/content.json is produced by
// `npm run build` and bundled into the Worker script: it lives server-side
// and is never served to browsers. Only handle() decides what anyone sees.
import { DurableObject } from 'cloudflare:workers';
import content from '../dist/content.json';
import { handle } from './app.mjs';

// All live game state (round, passphrases, sent texts, roster changes) lives
// in one Durable Object. Cloudflare creates it automatically on first deploy,
// and it's strongly consistent: a round unlock is visible on the next poll.
export class GameState extends DurableObject {
  async get(key) {
    return (await this.ctx.storage.get(key)) ?? null;
  }
  async put(key, value) {
    await this.ctx.storage.put(key, value);
  }
}

export default {
  async fetch(request, env) {
    const house = env.GAME.get(env.GAME.idFromName('blackwood-manor'));
    const store = { get: (k) => house.get(k), put: (k, v) => house.put(k, v) };
    return handle(request, { content, store, env });
  },
};
