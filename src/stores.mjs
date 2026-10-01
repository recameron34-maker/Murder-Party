// Key-value stores for game state. Values are JSON-serializable.
export class MemoryStore {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    return this.map.has(key) ? structuredClone(this.map.get(key)) : null;
  }
  async put(key, value) {
    this.map.set(key, structuredClone(value));
  }
}
