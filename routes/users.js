const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function publicUser(u) {
  return { id: u.id, username: u.username, nama: u.nama || u.username, createdAt: u.createdAt };
}

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.users.map(publicUser));
});

router.post('/', async (req, res) => {
  const { username, password, nama } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password minimal 8 karakter.' });
  }
  const db = readDb();
  if (db.users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
    return res.status(409).json({ error: 'Username sudah digunakan.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = { id: uuid(), username, nama: nama || username, passwordHash, createdAt: new Date().toISOString() };
  db.users.push(user);
  await writeDb(db);
  res.status(201).json(publicUser(user));
});

router.delete('/:id', async (req, res) => {
  const db = readDb();
  if (db.users.length <= 1) {
    return res.status(400).json({ error: 'Tidak bisa menghapus satu-satunya akun yang tersisa.' });
  }
  if (req.session.user.id === req.params.id) {
    return res.status(400).json({ error: 'Tidak bisa menghapus akun yang sedang digunakan.' });
  }
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== req.params.id);
  if (db.users.length === before) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  await writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
