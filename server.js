require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const path = require('path');
const { readDb, writeDb } = require('./db');

const PORT = process.env.PORT || 3000;
// Berikan fallback default jika SESSION_SECRET lupa diisi di Vercel agar tidak crash
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-sipades-super-aman-123';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

const app = express(); // Move app to top scope

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    name: 'sipades.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 jam
    },
  })
);

async function seedAdminIfNeeded() {
  try {
    const db = readDb();
    if (db.users && db.users.length > 0) return;
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'ubah-password-ini';
    const passwordHash = await bcrypt.hash(password, 12);
    
    if (!db.users) db.users = [];
    db.users.push({
      id: require('uuid').v4(),
      username,
      nama: 'Administrator',
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    await writeDb(db);
    console.log(`[SIPADES] Akun admin awal dibuat -> username: "${username}"`);
  } catch (err) {
    console.error('[SIPADES] Gagal seed admin:', err.message);
  }
}

// Jalankan seeder di background
seedAdminIfNeeded();

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/warga', require('./routes/warga'));
app.use('/api/dokumen', require('./routes/dokumen'));
app.use('/api/surat', require('./routes/surat'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/log', require('./routes/log'));
app.use('/api/upload', require('./routes/upload'));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => res.status(404).json({ error: 'Tidak ditemukan.' }));

// Hanya jalankan app.listen jika dijalankan secara lokal
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[SIPADES] Server berjalan di http://localhost:${PORT}`);
  });
}

// Export app untuk Vercel Serverless Function
module.exports = app;