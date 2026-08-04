const express = require('express');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

router.put('/', async (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  db.log.unshift({ text: 'Memperbarui pengaturan data desa', ts: Date.now(), by: req.session.user.username });
  db.log = db.log.slice(0, 50);
  await writeDb(db);
  res.json(db.settings);
});

module.exports = router;
