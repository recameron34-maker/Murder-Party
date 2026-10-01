// Which flex content is live vs. falling back, given the current roster.
import { listConditionals } from './markdown.mjs';
import { rosterHelpers } from './roster.mjs';

export function flexCoverage(content, state) {
  const { roster, isLive } = rosterHelpers(content, state);
  const chars = content.characters;
  const flex = content.characterOrder
    .filter((id) => chars[id].tier === 'flex')
    .map((id) => ({ id, name: chars[id].name, status: roster[id].status, player: roster[id].player, live: isLive(id), fallback: chars[id].fallback, effort: chars[id].effort || null }));

  const blocks = [];
  for (const owner of content.characterOrder) {
    const c = chars[owner];
    const fields = [
      [0, 'backstory', c.backstory],
      [0, 'secret', c.secret],
      [1, 'Round One', c.rounds?.[1]?.text],
      [2, 'Round Two', c.rounds?.[2]?.text],
      [3, 'Round Three', c.rounds?.[3]?.text],
    ];
    for (const [round, field, text] of fields) {
      for (const b of listConditionals(text)) blocks.push({ round, owner, ownerLive: isLive(owner), field, flexId: b.id, live: isLive(b.id), text: b.text });
    }
    for (const r of c.relationships || []) {
      if (r.if) blocks.push({ round: 0, owner, ownerLive: isLive(owner), field: 'relationship', flexId: r.if, live: isLive(r.if), text: r.text });
    }
  }
  const events = (content.timeline.events || []).filter((e) => e.flex).map((e) => ({ ...e, live: isLive(e.flex) }));
  return { flex, blocks, events };
}
