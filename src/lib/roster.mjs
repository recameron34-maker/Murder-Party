// Effective roster = content/roster.yaml overlaid with changes the host made
// at runtime (stored in game state).
export const LIVE_STATUSES = new Set(['confirmed', 'spare-assigned']);
export const LOGIN_STATUSES = new Set(['confirmed', 'maybe', 'spare-assigned']);
export const STATUSES = ['confirmed', 'maybe', 'declined', 'spare-unassigned', 'spare-assigned'];

export function effectiveRoster(content, state) {
  const base = content.roster?.cast || {};
  const overrides = state?.roster || {};
  const out = {};
  for (const id of content.characterOrder) {
    const b = base[id] || { player: null, status: content.characters[id].tier === 'flex' ? 'spare-unassigned' : 'confirmed' };
    out[id] = { player: b.player ?? null, status: b.status, ...(overrides[id] || {}) };
  }
  return out;
}

export function rosterHelpers(content, state) {
  const roster = effectiveRoster(content, state);
  const isLive = (id) => LIVE_STATUSES.has(roster[id]?.status);
  const canLogin = (id) => LOGIN_STATUSES.has(roster[id]?.status);
  const liveIds = content.characterOrder.filter(isLive);
  return { roster, isLive, canLogin, liveIds, guestCount: liveIds.length };
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

export function numberWords(n) {
  let w;
  if (n < 20) w = ONES[n];
  else if (n < 60) w = TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  else w = String(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}
