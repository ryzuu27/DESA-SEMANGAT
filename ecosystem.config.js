// Konfigurasi PM2 — process manager agar SIPADES tetap berjalan di VPS,
// otomatis restart jika crash, dan otomatis hidup lagi setelah server di-reboot.
//
// Cara pakai (di VPS, di dalam folder proyek ini):
//   npm install -g pm2
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup        <-- jalankan perintah yang ditampilkan, sekali saja, agar aktif otomatis saat boot
//
// Perintah harian yang berguna:
//   pm2 status              -> lihat status server
//   pm2 logs sipades        -> lihat log secara langsung
//   pm2 restart sipades     -> restart manual (mis. setelah update kode)
//   pm2 stop sipades        -> hentikan sementara

module.exports = {
  apps: [
    {
      name: 'sipades',
      script: 'server.js',
      instances: 1, // jangan lebih dari 1 tanpa session store bersama (lihat catatan di DEPLOY.md)
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
