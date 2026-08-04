const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.warga);
});

router.post('/', async (req, res) => {
  const db = readDb();
  const rec = { id: uuid(), ...req.body, createdAt: new Date().toISOString() };
  db.warga.push(rec);
  db.log.unshift({ text: `Menambahkan data warga: ${rec.nama}`, ts: Date.now(), by: req.session.user.username });
  db.log = db.log.slice(0, 50);
  await writeDb(db);
  res.status(201).json(rec);
});

router.put('/:id', async (req, res) => {
  const db = readDb();
  const idx = db.warga.findIndex((w) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Data warga tidak ditemukan.' });
  db.warga[idx] = { ...db.warga[idx], ...req.body, id: req.params.id };
  db.log.unshift({ text: `Memperbarui data warga: ${db.warga[idx].nama}`, ts: Date.now(), by: req.session.user.username });
  db.log = db.log.slice(0, 50);
  await writeDb(db);
  res.json(db.warga[idx]);
});

router.delete('/:id', async (req, res) => {
  const db = readDb();
  const rec = db.warga.find((w) => w.id === req.params.id);
  db.warga = db.warga.filter((w) => w.id !== req.params.id);
  if (rec) {
    db.log.unshift({ text: `Menghapus data warga: ${rec.nama}`, ts: Date.now(), by: req.session.user.username });
    db.log = db.log.slice(0, 50);
  }
  await writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
