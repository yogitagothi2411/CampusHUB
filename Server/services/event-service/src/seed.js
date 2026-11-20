require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const openDb = require('./db');
const seedPath = path.join(__dirname, '..', 'seed', 'events.json');
const schema = `CREATE TABLE IF NOT EXISTS events(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'General',
  venue TEXT, description TEXT, date_time TEXT, status TEXT NOT NULL DEFAULT 'Upcoming',
  capacity INTEGER, owner_id TEXT, organizer TEXT, club_id TEXT, image TEXT,
  tags TEXT DEFAULT '[]', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);`;
const db = openDb('events.sqlite', schema);
const rows = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const insert = db.prepare(`INSERT OR IGNORE INTO events
  (id,name,category,venue,description,date_time,status,capacity,owner_id,organizer,club_id,image,tags)
  VALUES (@id,@name,@category,@venue,@description,@date_time,@status,@capacity,@owner_id,@organizer,@club_id,@image,@tags)`);
const repairDate = db.prepare(`UPDATE events SET date_time=@date_time
  WHERE id=@id AND (date_time IS NULL OR date_time='')`);
const tx = db.transaction(() => {
  let inserted = 0, repaired = 0;
  for (const e of rows) {
    const date = e.date || '';
    const timeMatch = (e.time || '10:00 AM').match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/i);
    const time = timeMatch ? timeMatch[1] : '10:00 AM';
    const parsed = new Date(`${date} ${time}`);
    const date_time = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    const record = {
      id: e.id || `seed-event-${Math.random().toString(36).slice(2)}`,
      name: e.name || e.title || 'Campus Event', category: e.category || 'General',
      venue: e.venue || '', description: e.description || '', date_time,
      status: e.status || 'Upcoming', capacity: e.registrationLimit || e.capacity || null,
      owner_id: e.owner_id || 'demo-organizer', organizer: e.organizer || 'Campus Organizer',
      club_id: e.clubId || e.club_id || null, image: e.image || null,
      tags: JSON.stringify(e.tags || [])
    };
    const result = insert.run(record);
    if (result.changes) inserted++;
    else if (date_time) repaired += repairDate.run({id:record.id,date_time}).changes;
  }
  return {inserted,repaired,total:db.prepare('SELECT COUNT(*) AS n FROM events').get().n};
});
const result = tx();
console.log(`Event seed complete: ${result.inserted} inserted, ${result.repaired} date fields repaired, ${result.total} total events.`);
db.close();
