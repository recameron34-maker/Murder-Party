#!/usr/bin/env node
// Compiles content/ into dist/content.json for the Cloudflare Worker.
// Refuses to build if the consistency checker finds errors.
import fs from 'node:fs';
import { loadContent } from '../src/content-loader.mjs';
import { checkContent } from '../src/lib/check.mjs';

const content = loadContent();
const errors = checkContent(content).filter((f) => f.level === 'error');
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e.area}: ${e.message}`);
  console.error(`\n${errors.length} consistency error(s). Fix them (npm run check) before deploying.`);
  process.exit(1);
}
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/content.json', JSON.stringify(content));
console.log(`Built dist/content.json: ${content.characterOrder.length} characters, ${content.clueOrder.length} clues, ${content.script.length} script segments.`);
