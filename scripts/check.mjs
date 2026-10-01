#!/usr/bin/env node
// Runs the consistency checker over content/ and prints the findings.
import { loadContent } from '../src/content-loader.mjs';
import { checkContent } from '../src/lib/check.mjs';

const findings = checkContent(loadContent());
const verbose = process.argv.includes('--all');
const counts = { error: 0, warn: 0, info: 0 };
for (const f of findings) {
  counts[f.level]++;
  if (f.level !== 'info' || verbose) console.log(`${f.level.toUpperCase().padEnd(5)} ${f.area.padEnd(28)} ${f.message}`);
}
console.log(`\n${counts.error} errors, ${counts.warn} warnings, ${counts.info} notes${counts.info && !verbose ? ' (--all to show notes)' : ''}.`);
process.exit(counts.error ? 1 : 0);
