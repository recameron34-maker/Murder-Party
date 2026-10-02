// Node-only: reads content/ (YAML + Markdown) into one plain object.
// The dev server calls this on every request; `npm run build` writes the
// result to dist/content.json, which the Cloudflare Worker bundles
// server-side. It is never served to browsers.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const TIER_ORDER = { core: 0, supporting: 1, flex: 2 };

function readYaml(file) {
  try {
    return YAML.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file}: ${err.message}`);
  }
}

function parseFrontmatter(text, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${file}: missing --- frontmatter ---`);
  try {
    return { meta: YAML.parse(m[1]) || {}, body: m[2].trim() };
  } catch (err) {
    throw new Error(`${file}: ${err.message}`);
  }
}

export function loadContent(root = path.resolve('content')) {
  const rel = (f) => path.relative(path.dirname(root), f).split(path.sep).join('/');
  const party = readYaml(path.join(root, 'party.yaml'));
  const roster = readYaml(path.join(root, 'roster.yaml'));
  const guestCommon = readYaml(path.join(root, 'guest-common.yaml'));
  const lore = readYaml(path.join(root, 'lore.yaml'));
  const timeline = readYaml(path.join(root, 'timeline.yaml'));
  const hints = readYaml(path.join(root, 'hints.yaml')).hints || [];
  const globalTexts = (readYaml(path.join(root, 'texts.yaml')) || {}).texts || [];
  const suspicion = readYaml(path.join(root, 'suspicion.yaml')) || { stages: [], suspects: [] };
  const venue = readYaml(path.join(root, 'venue.yaml')) || { areas: [], spots: [], openings: [], entrances: [] };

  const characters = {};
  const charDir = path.join(root, 'characters');
  for (const f of fs.readdirSync(charDir).filter((f) => f.endsWith('.yaml')).sort()) {
    const file = path.join(charDir, f);
    const c = readYaml(file);
    c._file = rel(file);
    characters[c.id] = c;
  }
  const rosterOrder = Object.keys(roster.cast || {});
  const characterOrder = Object.keys(characters).sort((a, b) => {
    const ta = TIER_ORDER[characters[a].tier] ?? 9;
    const tb = TIER_ORDER[characters[b].tier] ?? 9;
    if (ta !== tb) return ta - tb;
    const ra = rosterOrder.indexOf(a);
    const rb = rosterOrder.indexOf(b);
    return (ra < 0 ? 999 : ra) - (rb < 0 ? 999 : rb) || a.localeCompare(b);
  });

  const clues = {};
  const clueDir = path.join(root, 'clues');
  for (const f of fs.readdirSync(clueDir).filter((f) => f.endsWith('.yaml')).sort()) {
    const file = path.join(clueDir, f);
    const data = readYaml(file);
    if (Array.isArray(data.spoken)) {
      for (const s of data.spoken) clues[s.id] = { kind: 'spoken', ...s, _file: rel(file) };
    } else {
      clues[data.id] = { ...data, _file: rel(file) };
    }
  }
  const clueOrder = Object.keys(clues).sort((a, b) => {
    const ca = clues[a];
    const cb = clues[b];
    return (ca.round ?? 0) - (cb.round ?? 0) || (ca.kind === 'spoken') - (cb.kind === 'spoken');
  });

  const script = [];
  const scriptDir = path.join(root, 'script');
  for (const f of fs.readdirSync(scriptDir).filter((f) => f.endsWith('.md')).sort()) {
    const file = path.join(scriptDir, f);
    const { meta, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'), file);
    script.push({
      slug: f.replace(/\.md$/, ''),
      title: meta.title || f,
      round: meta.round ?? 0,
      kind: meta.kind || 'speech',
      changes: meta.changes || null,
      clues: meta.clues || [],
      send_texts: meta.send_texts || [],
      body,
      _file: rel(file),
    });
  }

  // Display names for everyone who can be referenced: characters, NPCs, host.
  const names = { arthur: 'Arthur Blackwood', reggie: `Reggie (${party.host_name || 'your host'})` };
  for (const n of lore.npcs || []) names[n.id] = n.name;
  for (const id of characterOrder) names[id] = characters[id].name;

  return {
    party,
    roster,
    guestCommon,
    lore,
    timeline,
    hints,
    globalTexts,
    suspicion,
    venue,
    characters,
    characterOrder,
    clues,
    clueOrder,
    script,
    names,
  };
}
