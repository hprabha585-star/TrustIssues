// Minimal file-backed JSON store.
// Chosen deliberately over SQLite/Postgres: Hostinger shared/Business Node
// hosting cannot reliably compile native addons (better-sqlite3 etc), and
// a hackathon demo doesn't need concurrent-write guarantees. Swap this out
// for Postgres/Mongo later without touching the routes — just reimplement
// the same read()/write() contract.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'store');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function read(collection) {
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, 'utf-8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function write(collection, data) {
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2));
}

function insert(collection, record) {
  const data = read(collection);
  const withId = { id: record.id || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...record };
  data.push(withId);
  write(collection, data);
  return withId;
}

function replaceAll(collection, records) {
  write(collection, records);
  return records;
}

function update(collection, id, patch) {
  const data = read(collection);
  const idx = data.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...patch };
  write(collection, data);
  return data[idx];
}

module.exports = { read, write, insert, replaceAll, update, DATA_DIR };
