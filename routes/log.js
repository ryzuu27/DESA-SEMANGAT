const express = require('express');
const { readDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const db = readDb();
  res.json(db.log.slice(0, 20));
});

module.exports = router;
