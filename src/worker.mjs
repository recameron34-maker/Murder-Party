// Cloudflare Workers entry point. dist/content.json is produced by
// `npm run build` and bundled into the Worker script: it lives server-side
// and is never served to browsers. Only handle() decides what anyone sees.
import content from '../dist/content.json';
import { handle } from './app.mjs';
import { D1Store } from './stores.mjs';

export default {
  async fetch(request, env) {
    return handle(request, { content, store: new D1Store(env.DB), env });
  },
};
