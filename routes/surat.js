const express = require('express');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SURAT_KODE = {
  pengantar_ktp: '470', domisili: '474', usaha: '510', tidak_mampu: '400.1',
  kelahiran: '474.1', kematian: '474.2', lainnya: '005',
};
const SURAT_LABEL = {
  pengantar_ktp: 'Surat Pengantar KTP', domisili: 'Surat Keterangan Domisili',
  usaha: 'Surat Keterangan Usaha', tidak_mampu: 'Surat Keterangan Tidak Mampu',
  kelahiran: 'Surat Keterangan Kelahiran', kematian: 'Surat Keterangan Kematian',
  lainnya: 'Surat Keterangan',
};

function nextSuratNomor(db, jenis) {
  db.counters.surat += 1;
  const now = new Date();
  const romawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][now.getMonth()];
  return `${SURAT_KODE[jenis] || '000'}/${String(db.counters.surat).padStart(3, '0')}/Ds/${romawi}/${now.getFullYear()}`;
}

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.surat);
});

router.post('/', async (req, res) => {
  const db = readDb();
  const jenis = req.body.jenis;
  const nomorSurat = nextSuratNomor(db, jenis);
  const rec = {
    id: uuid(),
    ...req.body,
    nomorSurat,
    tanggal: req.body.tanggal || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    createdBy: req.session.user.username,
  };
  db.surat.push(rec);
  db.log.unshift({ text: `Menerbitkan ${SURAT_LABEL[jenis] || 'surat'} untuk ${rec.nama}`, ts: Date.now(), by: req.session.user.username });
  db.log = db.log.slice(0, 50);
  await writeDb(db);
  res.status(201).json(rec);
});

router.delete('/:id', async (req, res) => {
  const db = readDb();
  const rec = db.surat.find((s) => s.id === req.params.id);
  db.surat = db.surat.filter((s) => s.id !== req.params.id);
  if (rec) {
    db.log.unshift({ text: `Menghapus riwayat surat: ${rec.nomorSurat}`, ts: Date.now(), by: req.session.user.username });
    db.log = db.log.slice(0, 50);
  }
  await writeDb(db);
  res.json({ ok: true });
});

module.exports = router;
