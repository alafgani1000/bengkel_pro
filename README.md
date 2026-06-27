# Bengkel Pro Desktop 🛠️🚘

Aplikasi Desktop Manajemen Bengkel komprehensif siap pakai yang dirancang khusus untuk berjalan **offline** di sistem operasi Windows, macOS, dan Linux. Aplikasi ini tidak membutuhkan koneksi internet maupun biaya berlangganan.

## Fitur Utama

Aplikasi ini mencakup modul-modul berikut untuk mempermudah operasional bengkel secara menyeluruh:
- **Dashboard & Laporan (Excel Export)**: Ringkasan harian pendapatan, jumlah servis, valuasi aset stok inventori, serta grafik kinerja dengan dukungan **Export data ke Excel (.xlsx)**.
- **Work Order (SPK)**: Papan antrean servis berbasis status (Kanban Board) yang intuitif. Memiliki integrasi otomatis pemotongan stok sparepart dan tagihan kasir.
- **Kasir & Invoice**: Antarmuka Point of Sale (POS) yang terintegrasi. Mendukung diskon, PPN, dan 5 metode pembayaran (Tunai, Transfer, QRIS, Cicilan, dll). Dilengkapi fitur **Cetak Struk Thermal / Simpan PDF** khusus.
- **Inventori Sparepart**: Manajemen mutasi stok suku cadang, peringatan batas stok minimum, dan audit penyesuaian stok.
- **CRM & Pelanggan**: Pencatatan data historis pelanggan dan riwayat servis kendaraan.
- **Pengaturan & Keamanan**: Pengaturan profil bengkel, mode gelap/terang, dan kemudahan **Backup & Restore Database** bebas lokasi (bisa langsung ke Flashdisk).
- **Panduan Terintegrasi**: Tersedia menu buku panduan interaktif langsung di dalam aplikasi untuk memandu staff baru.

## Teknologi yang Digunakan

Aplikasi ini dibangun dengan *stack* modern untuk performa maksimal:
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, `shadcn/ui`
- **Backend & Desktop**: Electron
- **Database**: SQLite (via Prisma ORM)
- **Komponen Spesifik**: `lucide-react` untuk ikonografi premium, `xlsx` untuk ekspor laporan, dan IPC Handler custom untuk komunikasi OS lokal.

## Prasyarat

Pastikan perangkat Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (disarankan v20.x atau terbaru)
- npm (tergabung dengan Node.js)

## Cara Menggunakan (Mode Pengembangan)

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Generate Database (Prisma)**
   Secara otomatis Prisma akan membuat file database lokal (SQLite).
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Aplikasi Electron akan terbuka secara otomatis dan menampilkan antarmuka aplikasi.

## Pembuatan File Executable (Build Production)

Untuk mengemas aplikasi menjadi file installer yang siap dipasang (misalnya `.exe` untuk Windows), jalankan perintah:

```bash
npm run build
```

Hasil akhir *installer* akan tersedia di dalam direktori `release/` atau `dist/`.

## Keamanan & Arsitektur

Bengkel Pro menggunakan pola IPC (Inter-Process Communication) yang ketat di mana `nodeIntegration` dimatikan dan `contextIsolation` diaktifkan pada layer rendering Electron. Semua komunikasi ke *database* dilakukan secara asinkron (melalui *context bridge*) ke *Main Process* sehingga aplikasi dijamin aman dari injeksi skrip berbahaya.

---
Dikembangkan sebagai solusi perangkat lunak mandiri (offline-first) untuk digitalisasi manajemen operasional bengkel yang modern, cepat, dan efisien.
