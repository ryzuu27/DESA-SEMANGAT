const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Jenis berkas tidak diizinkan. Gunakan PDF, gambar (JPG/PNG), atau dokumen Word/Excel.'));
    }
    cb(null, true);
  },
});

function sanitizeName(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150);
}

router.post('/', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada berkas yang diunggah.' });
    const db = readDb();
    const meta = {
      id: uuid(),
      originalName: sanitizeName(req.file.originalname),
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.session.user.username,
    };
    db.files.push(meta);
    await writeDb(db);
    res.status(201).json(meta);
  });
});

router.get('/:id', (req, res) => {
  const db = readDb();
  const meta = db.files.find((f) => f.id === req.params.id);
  if (!meta) return res.status(404).json({ error: 'Berkas tidak ditemukan.' });
  const filePath = path.join(UPLOAD_DIR, meta.storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Berkas tidak ditemukan di server.' });
  res.setHeader('Content-Type', meta.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${meta.originalName}"`);
  fs.createReadStream(filePath).pipe(res);
});

router.delete('/:id', async (req, res) => {
  const db = readDb();
  const meta = db.files.find((f) => f.id === req.params.id);
  if (meta) {
    const filePath = path.join(UPLOAD_DIR, meta.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.files = db.files.filter((f) => f.id !== req.params.id);
    await writeDb(db);
  }
  res.json({ ok: true });
});

module.exports = router;
