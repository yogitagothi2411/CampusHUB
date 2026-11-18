require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const openDb = require('./db');
const db = openDb('clubs.sqlite', `
  CREATE TABLE IF NOT EXISTS clubs(id TEXT PRIMARY KEY,name TEXT NOT NULL,short_name TEXT,category TEXT,description TEXT,status TEXT DEFAULT 'Active',data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY,name TEXT NOT NULL,status TEXT DEFAULT 'Active',data TEXT NOT NULL);
`);
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname,'..','seed',name),'utf8'));
const clubs = read('clubs.json');
const categories = read('categories.json');
const addClub = db.prepare('INSERT OR IGNORE INTO clubs(id,name,short_name,category,description,status,data) VALUES(?,?,?,?,?,?,?)');
const addCategory = db.prepare('INSERT OR IGNORE INTO categories(id,name,status,data) VALUES(?,?,?,?)');
const result = db.transaction(() => {
  let clubsAdded=0, categoriesAdded=0;
  for (const c of clubs) clubsAdded += addClub.run(c.id,c.name,c.shortName||c.short_name||c.name,c.category||'',c.description||'',c.status||'Active',JSON.stringify(c)).changes;
  for (const c of categories) categoriesAdded += addCategory.run(c.id,c.name||c.title||'General',c.status||'Active',JSON.stringify(c)).changes;
  return {clubsAdded,categoriesAdded,clubTotal:db.prepare('SELECT COUNT(*) n FROM clubs').get().n,categoryTotal:db.prepare('SELECT COUNT(*) n FROM categories').get().n};
})();
console.log(`Catalog seed complete: ${result.clubsAdded} clubs and ${result.categoriesAdded} categories inserted. Totals: ${result.clubTotal} clubs, ${result.categoryTotal} categories.`);
db.close();
