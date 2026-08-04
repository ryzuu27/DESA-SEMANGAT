const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function nextArsipNomor(db) {
  db.counters.arsip += 1;
  const now = new Date();
  return `${String(db.counters.arsip).padStart(3, '0')}/ARS/Ds/${now.getFullYear()}`;
}

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.dokumen);
});

router.post('/', async (req, res) => {
  const db = readDb();
  const nomor = req.body.nomor && req.body.nomor.trim() ? req.body.nomor.trim() : nextArsipNomor(db);
  const rec = { id: uuid(), ...req.body, nomor, createdAt: new Date().toISOString() };
  db.dokumen.push(rec);
  db.log.unshift({ text: `Mengarsipkan dokumen: ${rec.judul}`, ts: Date.now(), by: req.session.user.username });
  db.log = db.log.slice(0, 50);
  await writeDb(db);
  res.status(201).json(rec);
});

router.put('/:id', async (req, res) => {
  const db = readDb();
  const idx = db.dokumen.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
  db.dokumen[idx] = { ...db.dokumen[idx], ...req.body, id: req.params.id };
  db.log.unshift({ text: `Memperbarui dokumen: ${db.dokumen[idx].judul}`, ts: Date.now(), by: req.session.user.username });
  db.log = db.log.slice(0, 50);
  await writeDb(db);
  res.json(db.dokumen[idx]);
});

router.delete('/:id', async (req, res) => {
  const db = readDb();
  const rec = db.dokumen.find((d) => d.id === req.params.id);
  db.dokumen = db.dokumen.filter((d) => d.id !== req.params.id);
  if (rec) {
    db.log.unshift({ text: `Menghapus dokumen arsip: ${rec.judul}`, ts: Date.now(), by: req.session.user.username });
    db.log = db.log.slice(0, 50);
  }
  await writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
