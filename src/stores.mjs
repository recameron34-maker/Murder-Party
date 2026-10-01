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

// Cloudflare D1 (SQLite). Strongly consistent, so a round unlock is visible
// to every phone on its next poll.
export class D1Store {
  constructor(db) {
    if (!db) throw new Error('D1 binding "DB" is missing. See README → Deploy.');
    this.db = db;
    this.ready = null;
  }
  init() {
    this.ready ??= this.db.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)').run();
    return this.ready;
  }
  async get(key) {
    await this.init();
    const row = await this.db.prepare('SELECT v FROM kv WHERE k = ?').bind(key).first();
    return row ? JSON.parse(row.v) : null;
  }
  async put(key, value) {
    await this.init();
    await this.db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(key, JSON.stringify(value)).run();
  }
}
