// Node-only JSON file store for local development (`npm run dev`).
import fs from 'node:fs';
import path from 'node:path';

export class FileStore {
  constructor(file) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  read() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      return {};
    }
  }
  async get(key) {
    return this.read()[key] ?? null;
  }
  async put(key, value) {
    const all = this.read();
    all[key] = value;
    fs.writeFileSync(this.file + '.tmp', JSON.stringify(all, null, 2));
    fs.renameSync(this.file + '.tmp', this.file);
  }
}
