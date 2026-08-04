const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { readDb } = require('../db');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }
  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Gagal membuat sesi.' });
    req.session.user = { id: user.id, username: user.username, nama: user.nama || user.username };
    res.json({ user: req.session.user });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ error: 'Tidak ada sesi aktif.' });
});

module.exports = router;
