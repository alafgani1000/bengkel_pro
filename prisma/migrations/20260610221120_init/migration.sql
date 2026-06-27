-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "pin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bengkel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "email" TEXT,
    "logoPath" TEXT,
    "nomorRekening" TEXT,
    "namaBankRekening" TEXT,
    "jamBuka" TEXT NOT NULL,
    "jamTutup" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kendaraans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "platNomor" TEXT NOT NULL,
    "merek" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tahun" TEXT NOT NULL,
    "warna" TEXT NOT NULL,
    "jenisKendaraan" TEXT NOT NULL,
    "lastOdometerKm" INTEGER,
    "catatanKhusus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kendaraans_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorSPK" TEXT NOT NULL,
    "kendaraanId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "mekanikId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keluhan" TEXT NOT NULL,
    "estimasiBiaya" REAL NOT NULL DEFAULT 0,
    "totalBiaya" REAL NOT NULL DEFAULT 0,
    "fotoMasukPaths" TEXT NOT NULL DEFAULT '[]',
    "fotoKeluarPaths" TEXT NOT NULL DEFAULT '[]',
    "catatanMekanik" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "pickedUpAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_orders_kendaraanId_fkey" FOREIGN KEY ("kendaraanId") REFERENCES "kendaraans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_orders_mekanikId_fkey" FOREIGN KEY ("mekanikId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "hargaSatuan" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "sparepartId" TEXT,
    CONSTRAINT "work_order_items_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_order_items_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "spareparts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "spareparts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "merek" TEXT,
    "kategori" TEXT NOT NULL,
    "stokSaatIni" INTEGER NOT NULL DEFAULT 0,
    "stokMinimum" INTEGER NOT NULL DEFAULT 0,
    "hargaBeli" REAL NOT NULL DEFAULT 0,
    "hargaJual" REAL NOT NULL DEFAULT 0,
    "satuan" TEXT NOT NULL,
    "lokasiRak" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorInvoice" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "diskon" REAL NOT NULL DEFAULT 0,
    "pajak" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "metodeBayar" TEXT,
    "nominalDibayar" REAL NOT NULL DEFAULT 0,
    "kembalian" REAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stok_mutasis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sparepartId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "qtyBefore" INTEGER NOT NULL,
    "qtyAfter" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stok_mutasis_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "spareparts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stok_mutasis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "kendaraanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tanggalTarget" DATETIME NOT NULL,
    "pesan" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminders_kendaraanId_fkey" FOREIGN KEY ("kendaraanId") REFERENCES "kendaraans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "backup_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "isSuccess" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "kendaraans_platNomor_key" ON "kendaraans"("platNomor");

-- CreateIndex
CREATE INDEX "kendaraans_platNomor_idx" ON "kendaraans"("platNomor");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_nomorSPK_key" ON "work_orders"("nomorSPK");

-- CreateIndex
CREATE INDEX "work_orders_nomorSPK_idx" ON "work_orders"("nomorSPK");

-- CreateIndex
CREATE UNIQUE INDEX "spareparts_kode_key" ON "spareparts"("kode");

-- CreateIndex
CREATE INDEX "spareparts_kode_idx" ON "spareparts"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_nomorInvoice_key" ON "invoices"("nomorInvoice");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workOrderId_key" ON "invoices"("workOrderId");

-- CreateIndex
CREATE INDEX "invoices_nomorInvoice_idx" ON "invoices"("nomorInvoice");
