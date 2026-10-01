// Runtime game state, stored as one JSON document under the key "state".
export function defaultState() {
  return {
    liveRound: 0,
    roundUnlockedAt: {}, // { "1": ISO string }
    cueSent: {}, // { textId: ISO string }
    custom: [], // [{ id, to, from, body, sentAt }]
    roster: {}, // { characterId: { player, status } } overrides
    passphrases: {}, // { characterId: "velvet-crow-candle" }
    sessionVersion: {}, // { characterId: n } bump to log a guest out everywhere
    firstLogin: {}, // { characterId: ISO string }
    prepDone: {}, // { clueId: true } evidence prep checklist
    partyDate: null, // overrides party.yaml date when set in the host panel
  };
}

export async function loadState(store) {
  const saved = (await store.get('state')) || {};
  return { ...defaultState(), ...saved };
}

export async function updateState(store, fn) {
  const state = await loadState(store);
  const result = await fn(state);
  await store.put('state', state);
  return result ?? state;
}
