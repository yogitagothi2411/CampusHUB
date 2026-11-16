const fs = require('node:fs');
const path = require('node:path');

let Database;
try {
  Database = require('better-sqlite3');
} catch {
  const { DatabaseSync } = require('node:sqlite');
  Database = class BetterSqliteSyncAdapter {
    constructor(filepath, options = {}) {
      this._db = new DatabaseSync(filepath, options);
    }
    pragma(sql) {
      try { return this._db.exec(`PRAGMA ${sql};`); } catch { return null; }
    }
    exec(sql) {
      return this._db.exec(sql);
    }
    prepare(sql) {
      const stmt = this._db.prepare(sql);
      stmt.setAllowBareNamedParameters(true);
      return stmt;
    }
    transaction(fn) {
      const db = this._db;
      return (...args) => {
        db.exec('BEGIN');
        try {
          const result = fn(...args);
          db.exec('COMMIT');
          return result;
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      };
    }
    close() {
      return this._db.close();
    }
  };
}

module.exports = function openDatabase(filename, schema) {
  const full = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'), filename);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const db = new Database(full);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  return db;
};
