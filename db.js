const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const DEFAULTS = {
  users: [],
  warga: [],
  dokumen: [],
  surat: [],
  files: [],
  settings: {
    namaDesa: 'Desa Sukamaju Makmur',
    kecamatan: 'Kecamatan Cikembang',
    kabupaten: 'Kabupaten Sukalarasan',
    provinsi: 'Jawa Barat',
    alamat: 'Jl. Raya Desa No. 1, Kode Pos 40XXX',
    namaKades: 'H. Sutrisno Wijaya',
    jabatan: 'Kepala Desa',
  },
  counters: { arsip: 0, surat: 0 },
  log: [],
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULTS, null, 2));
  }
}

// Very small write queue so concurrent requests don't clobber each other.
let writeChain = Promise.resolve();

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return { ...DEFAULTS, ...parsed };
}

function writeDb(data) {
  writeChain = writeChain.then(() => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  });
  return writeChain;
}

module.exports = { readDb, writeDb, DATA_DIR };
