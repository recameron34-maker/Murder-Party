// Which phone texts has a character received by now?
import { addDays, zonedToUtc } from './time.mjs';

export function textTriggerTime(text, state, party) {
  const t = text.trigger || {};
  if (t.history) return { at: null, history: true };
  if (t.round != null) {
    const unlocked = state.roundUnlockedAt?.[String(t.round)];
    if (!unlocked || state.liveRound < t.round) return null;
    return { at: new Date(new Date(unlocked).getTime() + (t.after || 0) * 60000) };
  }
  if (t.cue) {
    const sent = state.cueSent?.[text.id];
    return sent ? { at: new Date(sent) } : null;
  }
  if (t.time) {
    const date = state.partyDate || party?.date;
    if (!date) return null;
    return { at: zonedToUtc(addDays(String(date), t.day || 0), t.time, party.timezone || 'UTC') };
  }
  return null;
}

// All texts addressed to this character (own + global), with delivery info.
export function textsFor(content, charId) {
  const own = (content.characters[charId]?.texts || []).map((t) => ({ ...t, scope: 'own' }));
  const global = (content.globalTexts || []).map((t) => ({ ...t, scope: 'all' }));
  return [...own, ...global];
}

export function deliveredTexts(content, state, charId, now = new Date()) {
  const out = [];
  for (const t of textsFor(content, charId)) {
    const when = textTriggerTime(t, state, content.party);
    if (!when) continue;
    if (when.at && when.at.getTime() > now.getTime()) continue;
    out.push({ id: t.id, from: t.from, body: t.body, stamp: t.stamp || null, at: when.at ? when.at.toISOString() : null, history: !!when.history });
  }
  for (const c of state.custom || []) {
    if (c.to === 'all' || c.to === charId) out.push({ id: c.id, from: c.from, body: c.body, stamp: null, at: c.sentAt, history: false });
  }
  return out.sort((a, b) => {
    if (a.history !== b.history) return a.history ? -1 : 1;
    if (a.history) return 0;
    return a.at.localeCompare(b.at);
  });
}

// Host view: every scheduled text with its status.
export function textSchedule(content, state, liveIds, now = new Date()) {
  const rows = [];
  const add = (t, to) => {
    const when = textTriggerTime(t, state, content.party);
    let status = 'pending';
    if (when?.history) status = 'history';
    else if (when?.at) status = when.at.getTime() <= now.getTime() ? 'delivered' : 'scheduled';
    rows.push({ ...t, to, status, at: when?.at ? when.at.toISOString() : null });
  };
  for (const id of liveIds) for (const t of content.characters[id].texts || []) add(t, id);
  for (const t of content.globalTexts || []) add(t, 'all');
  return rows;
}
