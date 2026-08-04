# SIPADES — Sistem Administrasi & Arsip Desa (dengan Login & Unggah Berkas)

Versi ini menambahkan **backend** sungguhan di atas versi awal: login wajib untuk mengakses data,
setiap staf punya akun sendiri, dan dokumen bisa dilampiri **berkas digital** (PDF/foto/Word/Excel)
yang tersimpan aman di server — bukan lagi hanya di penyimpanan browser.

## Apa yang berubah dari versi sebelumnya

- **Login wajib.** Semua data (warga, arsip, surat) hanya bisa diakses setelah masuk dengan username & password. Password disimpan terenkripsi (hash bcrypt), tidak pernah dalam bentuk teks biasa.
- **Data tersimpan di server**, bukan di browser masing-masing orang. Semua staf yang login melihat data yang sama.
- **Unggah berkas.** Saat mengarsipkan dokumen, Anda bisa melampirkan file asli (PDF, foto, Word, Excel — maks. 15MB). Berkas hanya bisa diunduh oleh pengguna yang sudah login.
- **Manajemen pengguna.** Admin bisa menambah/menghapus akun staf dari menu Pengaturan.
- **Batas percobaan login** untuk mencegah tebak-tebak password otomatis.

## Yang perlu Anda pahami sebelum memakainya

Ini adalah **kode sumber aplikasi**, bukan situs yang sudah online. Untuk benar-benar bisa diakses
oleh staf desa dari komputer/HP mereka, aplikasi ini perlu **dijalankan di sebuah server** —
bisa komputer/PC kantor desa yang menyala terus, VPS murah (Hostinger, DigitalOcean, dsb.), atau
layanan hosting yang mendukung Node.js. Instruksi di bawah mencakup cara menjalankannya secara
lokal untuk dicoba, dan catatan untuk deployment yang lebih permanen.

## Menjalankan di komputer Anda (uji coba)

Prasyarat: [Node.js](https://nodejs.org) versi 18 ke atas sudah terpasang.

```bash
cd sipades-backend
npm install
cp .env.example .env
```

Buka file `.env`, lalu isi:

1. `SESSION_SECRET` — teks acak yang panjang. Bisa dibuat dengan menjalankan:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Salin hasilnya ke `.env`.
2. `ADMIN_PASSWORD` — password awal untuk akun admin pertama. **Wajib diisi**, jangan dibiarkan kosong.

Lalu jalankan:

```bash
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
npm start
```

Buka `http://localhost:3000` di browser, lalu masuk dengan:
- Username: `admin` (atau sesuai `ADMIN_USERNAME` di `.env`)
- Password: sesuai `ADMIN_PASSWORD` yang Anda isi

Setelah masuk, segera buat akun pribadi untuk setiap staf lewat menu **Pengaturan → Pengguna Sistem**,
supaya tidak semua orang memakai akun admin yang sama.

## Struktur data

- `data/db.json` — seluruh data (warga, arsip, surat, pengguna, pengaturan) tersimpan di sini sebagai
  satu berkas JSON. **Cadangkan (backup) berkas ini secara rutin**, misalnya salin ke flashdisk atau
  Google Drive setiap minggu.
- `uploads/` — berkas dokumen yang diunggah warga/staf disimpan di sini dengan nama acak agar tidak
  bisa ditebak. Ikut cadangkan folder ini bersama `data/db.json`.

## Menjalankan secara permanen (agar bisa diakses staf lain)

Beberapa opsi, dari yang paling sederhana:

1. **Komputer kantor desa yang menyala terus**, terhubung ke jaringan WiFi kantor. Staf lain
   mengakses lewat alamat IP komputer tersebut (mis. `http://192.168.1.10:3000`) dari perangkat
   yang terhubung ke WiFi yang sama. Cocok untuk penggunaan internal kantor desa saja.
2. **VPS / hosting dengan dukungan Node.js**, jika ingin bisa diakses dari luar kantor lewat internet.
   Setelah itu:
   - Pasang domain dan sertifikat HTTPS (mis. lewat [Let's Encrypt](https://letsencrypt.org) atau
     reverse proxy seperti Caddy/Nginx).
   - Set `COOKIE_SECURE=true` di `.env` setelah HTTPS aktif.
   - Gunakan process manager seperti [`pm2`](https://pm2.keymetrics.io) agar server otomatis
     hidup kembali jika komputer restart: `npm install -g pm2 && pm2 start server.js --name sipades`.

Untuk kedua opsi ini, sebaiknya minta bantuan seseorang yang familiar dengan pengaturan server,
karena menyangkut keamanan jaringan kantor/data warga.

## Catatan keamanan

- Password di-hash dengan bcrypt (tidak bisa "dibaca ulang" walau berkas data bocor).
- Sesi login otomatis berakhir setelah 8 jam tidak aktif.
- Percobaan login dibatasi 10 kali per 15 menit per alamat IP.
- Jenis berkas yang bisa diunggah dibatasi (PDF, gambar, Word, Excel) dan ukuran maksimum 15MB,
  untuk mencegah penyalahgunaan penyimpanan server.
- Ganti `SESSION_SECRET` dan password admin default sebelum benar-benar dipakai — jangan memakai
  nilai contoh di `.env.example`.
- Ini adalah aplikasi untuk kalangan internal kantor desa. Untuk kebutuhan yang menyimpan data
  kependudukan dalam skala besar atau terhubung ke sistem pemerintah lain, pertimbangkan audit
  keamanan tambahan atau konsultasi dengan penyedia layanan pemerintahan digital resmi.

## Struktur folder

```
sipades-backend/
├── server.js           # Entry point aplikasi
├── db.js                # Penyimpanan data berbasis berkas JSON
├── middleware/auth.js    # Pemeriksa status login
├── routes/               # Endpoint API (auth, warga, dokumen, surat, upload, users, settings, log)
├── public/
│   ├── login.html        # Halaman login
│   └── index.html        # Aplikasi utama (dasbor, warga, arsip, surat, pengaturan)
├── uploads/               # Berkas dokumen yang diunggah (dibuat otomatis)
├── data/db.json           # Basis data (dibuat otomatis saat pertama dijalankan)
└── .env                    # Konfigurasi rahasia (buat dari .env.example)
```
