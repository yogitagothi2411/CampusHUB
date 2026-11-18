const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
module.exports = function openDatabase(filename, schema) {
  const full = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), filename);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const db = new Database(full);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  return db;
};
