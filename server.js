/**
 * UVM FabLab — 3D Printer Scheduler
 * Backend: Express + better-sqlite3
 *
 * Endpoints:
 *   POST   /api/login         — authenticate via users.csv
 *   GET    /api/bookings      — get all bookings
 *   POST   /api/bookings      — create a booking
 *   PUT    /api/bookings/:id  — update a booking (move/resize)
 *   DELETE /api/bookings/:id  — delete a booking
 */

const express   = require('express');
const Database  = require('better-sqlite3');
const fs        = require('fs');
const path      = require('path');
const { parse } = require('csv-parse/sync');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── SQLite setup ───────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'data', 'bookings.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id       TEXT PRIMARY KEY,
    printer  INTEGER NOT NULL,
    owner    TEXT NOT NULL,
    title    TEXT NOT NULL,
    start    TEXT NOT NULL,
    end      TEXT NOT NULL,
    created  TEXT DEFAULT (datetime('now'))
  );
`);

// ── Load users from CSV ────────────────────────────────────────
function loadUsers() {
  const csvPath = path.join(__dirname, 'public', 'users.csv');
  if (!fs.existsSync(csvPath)) return [];
  const raw = fs.readFileSync(csvPath, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

// ── API Routes ─────────────────────────────────────────────────

// Login
app.post('/api/login', (req, res) => {
  const { name, pin } = req.body;
  if (!name || !pin) return res.status(400).json({ error: 'Name and PIN required.' });
  const users = loadUsers();
  const user  = users.find(u =>
    u.name.toLowerCase() === name.toLowerCase() &&
    String(u.pin).trim() === String(pin).trim()
  );
  if (!user) return res.status(401).json({ error: 'Invalid name or PIN.' });
  res.json({ name: user.name, role: user.role.toLowerCase().trim() });
});

// Get all bookings
app.get('/api/bookings', (_req, res) => {
  res.json(db.prepare('SELECT * FROM bookings ORDER BY start').all());
});

// Create booking
app.post('/api/bookings', (req, res) => {
  const { id, printer, owner, title, start, end } = req.body;
  if (!id || printer === undefined || !owner || !start || !end)
    return res.status(400).json({ error: 'Missing fields.' });
  db.prepare('INSERT INTO bookings (id,printer,owner,title,start,end) VALUES (?,?,?,?,?,?)')
    .run(id, printer, owner, title || owner, start, end);
  res.json({ success: true });
});

// Update booking
app.put('/api/bookings/:id', (req, res) => {
  const { start, end } = req.body;
  const r = db.prepare('UPDATE bookings SET start=?,end=? WHERE id=?').run(start, end, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found.' });
  res.json({ success: true });
});

// Delete booking
app.delete('/api/bookings/:id', (req, res) => {
  const r = db.prepare('DELETE FROM bookings WHERE id=?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found.' });
  res.json({ success: true });
});

// Catch-all → SPA
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () =>
  console.log(`✓ FabLab Scheduler → http://localhost:${PORT}`)
);
