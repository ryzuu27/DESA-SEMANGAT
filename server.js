require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const path = require('path');
const { readDb, writeDb } = require('./db');

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

if (!SESSION_SECRET) {
  console.error(
    '\n[SIPADES] SESSION_SECRET belum diatur. Salin .env.example menjadi .env dan isi SESSION_SECRET dengan teks acak yang panjang, lalu jalankan ulang.\n'
  );
  process.exit(1);
}

async function seedAdminIfNeeded() {
  const db = readDb();
  if (db.users.length > 0) return;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'ubah-password-ini';
  const passwordHash = await bcrypt.hash(password, 12);
  db.users.push({
    id: require('uuid').v4(),
    username,
    nama: 'Administrator',
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);
  console.log(`\n[SIPADES] Akun admin awal dibuat -> username: "${username}"`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`[SIPADES] PERINGATAN: password default "ubah-password-ini" digunakan. Login lalu ganti password lewat menu Pengguna, atau set ADMIN_PASSWORD di .env sebelum menjalankan server pertama kali.\n`);
  }
}

async function main() {
  await seedAdminIfNeeded();

  const app = express();
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
        secure: COOKIE_SECURE, // set COOKIE_SECURE=true in .env when serving over HTTPS
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 jam
      },
    })
  );

  // API routes (each router applies its own requireAuth, except /api/auth)
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/warga', require('./routes/warga'));
  app.use('/api/dokumen', require('./routes/dokumen'));
  app.use('/api/surat', require('./routes/surat'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/log', require('./routes/log'));
  app.use('/api/upload', require('./routes/upload'));

  // Static frontend (login.html is public; index.html checks session itself)
  app.use(express.static(path.join(__dirname, 'public')));

  app.use((req, res) => res.status(404).json({ error: 'Tidak ditemukan.' }));

  app.listen(PORT, () => {
    console.log(`[SIPADES] Server berjalan di http://localhost:${PORT}`);
  });
}

main();

// Di bagian paling bawah server.js:
module.exports = app;