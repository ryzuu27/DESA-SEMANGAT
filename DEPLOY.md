# Panduan Deploy SIPADES ke VPS

Panduan ini untuk menjalankan SIPADES secara permanen di VPS (Ubuntu/Debian), agar bisa diakses
staf desa dari mana saja lewat internet. Aplikasi ini memakai **file JSON lokal** (`data/db.json`)
sebagai basis data dan folder lokal (`uploads/`) untuk berkas — cocok untuk VPS karena disknya
permanen, **tidak cocok** untuk hosting serverless seperti Vercel (data bisa hilang sewaktu-waktu).

## 1. Siapkan VPS

Rekomendasi minimum: 1 vCPU, 1GB RAM (SIPADES ringan, ini sudah lebih dari cukup untuk skala desa).

```bash
# Login ke VPS via SSH, lalu:
sudo apt update && sudo apt upgrade -y

# Install Node.js LTS (versi 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cek versi
node -v
npm -v
```

## 2. Unggah & pasang proyek

```bash
# Dari komputer Anda, kirim folder proyek ke VPS (ganti user & IP sesuai VPS Anda)
scp -r Administrasi_desa user@ALAMAT-IP-VPS:/home/user/

# Login ke VPS, masuk ke folder proyek
ssh user@ALAMAT-IP-VPS
cd Administrasi_desa

# Pasang dependency
npm install --omit=dev
```

## 3. Atur file `.env`

```bash
cp .env.example .env
nano .env
```

Isi minimal:
```
SESSION_SECRET=<hasil dari perintah di bawah>
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password kuat, WAJIB diganti>
COOKIE_SECURE=false   # ubah ke true SETELAH HTTPS aktif (lihat langkah 5)
```

Buat `SESSION_SECRET` acak:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. Jalankan dengan PM2 (agar tetap hidup & auto-restart)

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# ^ perintah di atas akan menampilkan 1 baris perintah lain — salin & jalankan itu (sekali saja)
```

Cek statusnya:
```bash
pm2 status
pm2 logs sipades
```

Coba akses `http://ALAMAT-IP-VPS:3000` — kalau sudah tampil halaman login, berarti server jalan.

## 5. Pasang domain + HTTPS (opsional tapi sangat disarankan)

1. Arahkan DNS domain/subdomain Anda (A record) ke alamat IP VPS.
2. Pasang Nginx sebagai reverse proxy — pakai contoh di `nginx-sipades.conf.example` (ada instruksi lengkap di dalam file itu).
3. Pasang HTTPS gratis dengan Certbot (juga dijelaskan di file yang sama).
4. Setelah HTTPS aktif, ubah `COOKIE_SECURE=true` di `.env`, lalu `pm2 restart sipades`.

Tanpa langkah ini, aplikasi tetap bisa diakses lewat `http://ALAMAT-IP:3000` — cukup untuk uji coba
atau pemakaian di jaringan kantor, tapi **tidak disarankan untuk internet publik** karena data
login dikirim tanpa enkripsi.

## 6. Backup rutin — WAJIB

Karena basis datanya berupa file, backup-nya juga sederhana:

```bash
# Jalankan dari VPS, atau jadwalkan via cron
tar -czf backup-sipades-$(date +%F).tar.gz data/db.json uploads/
```

Unduh hasilnya secara berkala ke komputer/Google Drive Anda:
```bash
scp user@ALAMAT-IP-VPS:/home/user/Administrasi_desa/backup-sipades-*.tar.gz ./
```

Disarankan buat cron job mingguan supaya tidak lupa:
```bash
crontab -e
# tambahkan baris ini (backup tiap Senin jam 2 pagi):
0 2 * * 1 cd /home/user/Administrasi_desa && tar -czf /home/user/backup-sipades-$(date +\%F).tar.gz data/db.json uploads/
```

## 7. Update kode di kemudian hari

```bash
# Kirim ulang file yang berubah (atau pakai git pull kalau proyeknya di-git)
pm2 restart sipades
```

## Catatan penting

- **Satu instance saja** (`instances: 1` di `ecosystem.config.js`). Sesi login (`express-session`)
  disimpan di memori server — kalau dijalankan lebih dari satu instance sekaligus, user bisa
  ke-logout acak karena request dilempar ke instance yang berbeda. Untuk skala desa, satu instance
  lebih dari cukup.
- File `data/db.json` ditulis ulang setiap ada perubahan data. Jangan edit file ini manual saat
  server sedang jalan, untuk menghindari data bentrok.
- Pastikan folder `data/` dan `uploads/` **tidak** ikut terhapus saat update kode — keduanya berisi
  data asli yang tidak boleh hilang.
