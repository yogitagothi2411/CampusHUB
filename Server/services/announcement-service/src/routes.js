const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const openDb = require('./db');
const auth = require('./middleware/auth');

const db = openDb('announcements.sqlite', `CREATE TABLE IF NOT EXISTS announcements(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  author_id TEXT,
  is_published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

const router = express.Router();

// The frontend uses `body`; the database column is `content`. Return both.
const out = (x) => x && { ...x, body: x.content, is_published: !!x.is_published };

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message, details: null } });

const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : fail(res, 403, 'FORBIDDEN', 'Admin required');

// Reads the token if present (does not require it). Used so admins can also see drafts.
function isAdminRequest(req) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return false;
    return jwt.verify(token, process.env.JWT_SECRET || 'local-dev-secret-change-before-deploy').role === 'admin';
  } catch { return false; }
}

// GET /api/v1/announcements?category=&search=
router.get('/api/v1/announcements', (req, res) => {
  const where = [], args = [];
  if (!isAdminRequest(req)) where.push('is_published=1');
  const { category, search } = req.query;
  if (category && category !== 'All') { where.push('category=?'); args.push(category); }
  if (search && String(search).trim()) {
    where.push('(title LIKE ? OR content LIKE ?)');
    const q = `%${String(search).trim()}%`;
    args.push(q, q);
  }
  const sql = 'SELECT * FROM announcements' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY created_at DESC, rowid DESC';
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: db.prepare(sql).all(...args).map(out) });
});

router.get('/api/v1/announcements/:id', (req, res) => {
  const x = db.prepare('SELECT * FROM announcements WHERE id=?').get(req.params.id);
  if (!x || (!x.is_published && !isAdminRequest(req))) return fail(res, 404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  res.json({ success: true, data: out(x) });
});

router.post('/api/v1/announcements', auth, adminOnly, (req, res) => {
  const b = req.body || {};
  const content = b.content ?? b.body;
  if (!b.title || !String(b.title).trim() || !content || !String(content).trim())
    return fail(res, 422, 'VALIDATION_ERROR', 'title and body are required');
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO announcements(id,title,content,category,author_id,is_published) VALUES(?,?,?,?,?,?)')
    .run(id, String(b.title).trim(), String(content).trim(), b.category || 'General', req.user.sub, b.is_published === false ? 0 : 1);
  res.status(201).json({ success: true, data: out(db.prepare('SELECT * FROM announcements WHERE id=?').get(id)) });
});

router.put('/api/v1/announcements/:id', auth, adminOnly, (req, res) => {
  const b = req.body || {};
  const content = b.content ?? b.body;
  const r = db.prepare(`UPDATE announcements SET title=COALESCE(?,title), content=COALESCE(?,content),
    category=COALESCE(?,category), is_published=COALESCE(?,is_published), updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(b.title ?? null, content ?? null, b.category ?? null, b.is_published === undefined ? null : (b.is_published ? 1 : 0), req.params.id);
  if (!r.changes) return fail(res, 404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  res.json({ success: true, data: out(db.prepare('SELECT * FROM announcements WHERE id=?').get(req.params.id)) });
});

router.delete('/api/v1/announcements/:id', auth, adminOnly, (req, res) => {
  const r = db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);
  if (!r.changes) return fail(res, 404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  res.status(204).end();
});

module.exports = router;
