# 🤖 BOT NS Store — Telegram Bot Digiflazz

Bot Telegram personal untuk transaksi produk digital otomatis menggunakan API Digiflazz.

> ⚠️ Bot ini **hanya untuk penggunaan pribadi** (owner). Tidak memerlukan payment gateway, deposit, atau database member.

## 📋 Fitur

- ✅ Cek saldo Digiflazz
- ✅ Daftar produk dengan navigasi kategori → brand
- ✅ Pencarian produk berdasarkan nama/SKU/brand
- ✅ Detail produk berdasarkan kode SKU
- ✅ Pembelian produk dengan alur percakapan
- ✅ Deteksi otomatis game (Zone ID)
- ✅ Inline keyboard & tombol menu
- ✅ Pagination daftar produk
- ✅ Cache produk (30 menit)
- ✅ Proteksi owner (hanya Telegram ID tertentu)
- ✅ Pesan dalam Bahasa Indonesia
- ✅ Error handling lengkap

---

## 🚀 Panduan Instalasi

### Prasyarat

- [Node.js](https://nodejs.org/) versi 16 atau lebih baru
- npm (sudah termasuk di Node.js)
- Akun [Digiflazz](https://digiflazz.com) (sudah aktif & ada saldo)
- Bot Telegram (dibuat via [@BotFather](https://t.me/BotFather))

### 1. Clone / Download Project

```bash
# Jika menggunakan Git:
git clone <repository-url>
cd BOT-NS-Store

# Atau download dan extract ZIP, lalu masuk ke foldernya
```

### 2. Install Dependency

```bash
npm install
```

Ini akan menginstall:
- `telegraf` — Framework bot Telegram
- `axios` — HTTP client
- `dotenv` — Loader environment variable
- `md5` — Hashing untuk signature Digiflazz

### 3. Setup Environment (.env)

```bash
# Salin template
cp .env.example .env

# Edit file .env
nano .env    # Linux/Mac
notepad .env # Windows
```

Isi semua konfigurasi:

```env
BOT_TOKEN=1234567890:ABCDefGHIjklMNOpqrsTUVwxyz
DIGI_USERNAME=username_digiflazz_kamu
DIGI_API_KEY=api_key_digiflazz_kamu
OWNER_ID=123456789
DIGI_TESTING=false
```

### 4. Jalankan Bot

```bash
# Mode development (auto-restart saat file berubah)
npm run dev

# Mode production
npm start
```

Jika berhasil, akan muncul:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 BOT NS STORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Owner IDs: 123456789
🧪 Testing Mode: NONAKTIF
👤 Digiflazz User: username_kamu
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Bot berhasil dijalankan!
📡 Menunggu pesan...
```

---

## 📱 Cara Mendapatkan Telegram User ID

Ada beberapa cara:

### Cara 1: Menggunakan @userinfobot
1. Buka Telegram
2. Cari `@userinfobot`
3. Klik **Start**
4. Bot akan langsung mengirimkan ID kamu

### Cara 2: Menggunakan @RawDataBot
1. Buka Telegram
2. Cari `@RawDataBot`
3. Klik **Start**
4. Lihat bagian `"id"` pada response

### Cara 3: Via bot ini
1. Set `OWNER_ID` ke angka sembarang dulu (misal: `0`)
2. Jalankan bot
3. Kirim pesan ke bot
4. Di terminal akan muncul: `⛔ Akses ditolak untuk user ID: XXXXXX`
5. Salin angka `XXXXXX` itu ke `OWNER_ID` di `.env`
6. Restart bot

---

## 🔑 Cara Mendapatkan Credentials

### Telegram Bot Token
1. Buka [@BotFather](https://t.me/BotFather) di Telegram
2. Ketik `/newbot`
3. Ikuti instruksi (masukkan nama bot dan username)
4. Salin token yang diberikan ke `BOT_TOKEN`

### Digiflazz API Key
1. Login ke [digiflazz.com](https://digiflazz.com)
2. Buka menu **Atur Koneksi → API**
3. Salin `Username` ke `DIGI_USERNAME`
4. Salin `API Key (Production)` ke `DIGI_API_KEY`
5. **Penting:** Whitelist IP server kamu di panel Digiflazz

---

## 📋 Daftar Perintah Bot

| Perintah | Fungsi |
|---|---|
| `/start` | Menu utama & info bot |
| `/balance` | Cek saldo Digiflazz |
| `/product` | Daftar produk (kategori → brand → produk) |
| `/search <nama>` | Cari produk berdasarkan nama |
| `/sku <kode>` | Detail produk berdasarkan SKU |
| `/buy` | Mulai proses pembelian |

### Alur Pembelian (`/buy`):
1. Bot meminta **kode SKU** produk
2. Bot memvalidasi SKU dan menampilkan detail
3. Bot meminta **Nomor Tujuan / Customer ID**
4. Jika produk game → Bot meminta **Zone ID**
5. Bot menampilkan **konfirmasi** (produk, harga, tujuan)
6. Klik **✅ Ya, Beli!** untuk eksekusi
7. Bot menampilkan **hasil transaksi** + SN (jika ada)

---

## 🖥️ Deploy ke VPS

### 1. Persiapan VPS (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node -v
npm -v
```

### 2. Upload Project ke VPS

```bash
# Via Git
cd /home/user
git clone <repository-url>
cd BOT-NS-Store

# Atau via SCP dari local
scp -r ./BOT-NS-Store user@ip-vps:/home/user/
```

### 3. Install Dependency

```bash
cd /home/user/BOT-NS-Store
npm install --production
```

### 4. Setup .env

```bash
cp .env.example .env
nano .env
# Isi semua konfigurasi
```

### 5. Whitelist IP VPS

1. Login ke [digiflazz.com](https://digiflazz.com)
2. Buka **Atur Koneksi → API**
3. Tambahkan IP VPS kamu ke whitelist

---

## 🔄 Menjalankan Bot 24/7 dengan PM2

### Install PM2

```bash
sudo npm install -g pm2
```

### Jalankan Bot

```bash
# Start dengan konfigurasi PM2
pm2 start ecosystem.config.js

# Atau start langsung
pm2 start src/index.js --name "bot-ns-store"
```

### Perintah PM2 Berguna

```bash
# Lihat status bot
pm2 status

# Lihat log bot
pm2 logs bot-ns-store

# Restart bot
pm2 restart bot-ns-store

# Stop bot
pm2 stop bot-ns-store

# Hapus dari PM2
pm2 delete bot-ns-store

# Auto-start saat VPS reboot
pm2 startup
pm2 save
```

### Monitoring

```bash
# Dashboard monitoring
pm2 monit

# Info detail
pm2 show bot-ns-store
```

---

## 📁 Struktur Project

```
BOT NS Store/
├── .env                        # Konfigurasi (JANGAN di-commit!)
├── .env.example                # Template .env
├── .gitignore
├── package.json
├── ecosystem.config.js         # Konfigurasi PM2
├── README.md
└── src/
    ├── index.js                # Entry point
    ├── config.js               # Loader konfigurasi
    ├── api/
    │   └── digiflazz.js        # Digiflazz API client
    ├── bot/
    │   ├── middleware.js        # Owner protection
    │   ├── commands/
    │   │   ├── start.js        # /start
    │   │   ├── balance.js      # /balance
    │   │   ├── product.js      # /product
    │   │   ├── search.js       # /search
    │   │   ├── sku.js          # /sku
    │   │   └── buy.js          # /buy
    │   └── scenes/
    │       └── buyScene.js     # Alur pembelian multi-step
    └── utils/
        ├── cache.js            # In-memory cache
        └── formatter.js        # Format pesan
```

---

## ⚠️ Catatan Penting

1. **Transaksi REAL** — Jika `DIGI_TESTING=false`, transaksi akan **langsung memotong saldo** Digiflazz kamu.
2. **Testing Mode** — Set `DIGI_TESTING=true` untuk testing tanpa memotong saldo.
3. **Whitelist IP** — Pastikan IP server kamu sudah di-whitelist di Digiflazz.
4. **Owner Only** — Hanya Telegram ID di `OWNER_ID` yang bisa menggunakan bot.
5. **Jangan share `.env`** — File ini berisi kredensial sensitif.
6. **Cache** — Daftar harga di-cache 30 menit. Gunakan tombol "🔄 Refresh Cache" untuk update manual.

---

## 🛠️ Troubleshooting

### Bot tidak merespons
- Pastikan `BOT_TOKEN` benar
- Pastikan bot sudah di-start (`/start` di @BotFather)
- Cek log error: `pm2 logs bot-ns-store`

### Akses ditolak
- Pastikan `OWNER_ID` berisi Telegram User ID kamu (angka)
- Lihat log terminal untuk mengetahui ID yang terblokir

### Gagal cek saldo / transaksi
- Pastikan `DIGI_USERNAME` dan `DIGI_API_KEY` benar
- Pastikan IP server sudah di-whitelist di Digiflazz
- Pastikan akun Digiflazz aktif dan ada saldo

### SKU tidak ditemukan
- Gunakan `/search` untuk mencari produk yang tersedia
- Gunakan `/product` untuk browse semua produk
- Klik "🔄 Refresh Cache" untuk update daftar harga

---

## 📄 Lisensi

MIT License — Dibuat untuk penggunaan pribadi.
