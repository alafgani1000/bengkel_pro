import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  // 1. AppSettings
  await prisma.appSetting.createMany({
    data: [
      { key: 'ppn_rate', value: '11' },
      { key: 'loyalty_rate', value: '10000' },
      { key: 'reminder_days', value: '30,60,90' },
      { key: 'thermal_printer_name', value: '' },
      { key: 'invoice_printer_name', value: '' },
    ],
  });

  // 2. Bengkel
  await prisma.bengkel.create({
    data: {
      nama: 'BengkelPro Mandiri',
      alamat: 'Jl. Raya Otomotif No. 123',
      kota: 'Jakarta Selatan',
      telepon: '081234567890',
      email: 'info@bengkelpro.com',
      jamBuka: '08:00',
      jamTutup: '17:00',
    },
  });

  // 3. Users (1 Owner, 3 Mekanik, 1 Kasir)
  const owner = await prisma.user.create({
    data: {
      name: 'Admin Owner',
      username: 'admin',
      passwordHash,
      role: 'OWNER',
      pin: '1234',
    },
  });

  const kasir = await prisma.user.create({
    data: {
      name: 'Sari Kasir',
      username: 'sari',
      passwordHash,
      role: 'KASIR',
      pin: '3333',
    },
  });

  const mekanik1 = await prisma.user.create({
    data: { name: 'Budi Mekanik', username: 'budi', passwordHash, role: 'MEKANIK', pin: '1111' },
  });
  const mekanik2 = await prisma.user.create({
    data: { name: 'Andi Mekanik', username: 'andi', passwordHash, role: 'MEKANIK', pin: '2222' },
  });
  const mekanik3 = await prisma.user.create({
    data: { name: 'Citra Mekanik', username: 'citra', passwordHash, role: 'MEKANIK', pin: '4444' },
  });

  const mekaniks = [mekanik1, mekanik2, mekanik3];

  // 4. Spareparts
  const sparepartsData = Array.from({ length: 20 }).map((_, i) => ({
    kode: `SP-${1000 + i}`,
    nama: `Sparepart ${i + 1}`,
    merek: `Merek ${String.fromCharCode(65 + (i % 5))}`,
    kategori: i % 2 === 0 ? 'Oli' : 'Filter',
    stokSaatIni: 10 + i * 2,
    stokMinimum: 5,
    hargaBeli: 50000 + i * 1000,
    hargaJual: 75000 + i * 1500,
    satuan: 'PCS',
    lokasiRak: `Rak ${String.fromCharCode(65 + (i % 3))}-${i % 5}`,
  }));

  for (const sp of sparepartsData) {
    await prisma.sparepart.create({ data: sp });
  }

  // 5. Customers & Vehicles
  const customers = [];
  for (let i = 0; i < 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: `Pelanggan ${i + 1}`,
        phone: `085000000${i.toString().padStart(2, '0')}`,
        address: `Jl. Pelanggan No. ${i + 1}`,
        loyaltyPoints: Math.floor(Math.random() * 500),
      },
    });

    const kendaraan = await prisma.kendaraan.create({
      data: {
        customerId: customer.id,
        platNomor: `B ${1000 + i} XYZ`,
        merek: i % 2 === 0 ? 'Toyota' : 'Honda',
        model: i % 2 === 0 ? 'Avanza' : 'Beat',
        tahun: `201${i % 10}`,
        warna: 'Hitam',
        jenisKendaraan: i % 2 === 0 ? 'MOBIL' : 'MOTOR',
        lastOdometerKm: 15000 + i * 1000,
      },
    });

    customers.push({ customer, kendaraan });
  }

  // 6. Work Orders
  const statuses = ['ANTRI', 'DIKERJAKAN', 'SELESAI', 'DIAMBIL', 'BATAL'];
  
  for (let i = 0; i < 5; i++) {
    const { customer, kendaraan } = customers[i];
    const spk = await prisma.workOrder.create({
      data: {
        nomorSPK: `SPK-20260610-${1000 + i}`,
        kendaraanId: kendaraan.id,
        customerId: customer.id,
        mekanikId: mekaniks[i % 3].id,
        status: statuses[i],
        keluhan: 'Servis rutin dan ganti oli',
        estimasiBiaya: 250000,
        totalBiaya: statuses[i] === 'SELESAI' || statuses[i] === 'DIAMBIL' ? 250000 : 0,
        startedAt: statuses[i] !== 'ANTRI' && statuses[i] !== 'BATAL' ? new Date() : null,
        completedAt: statuses[i] === 'SELESAI' || statuses[i] === 'DIAMBIL' ? new Date() : null,
        pickedUpAt: statuses[i] === 'DIAMBIL' ? new Date() : null,
      },
    });

    // Add items for completed ones
    if (statuses[i] === 'SELESAI' || statuses[i] === 'DIAMBIL') {
      await prisma.workOrderItem.create({
        data: {
          workOrderId: spk.id,
          type: 'JASA',
          nama: 'Jasa Servis Rutin',
          qty: 1,
          hargaSatuan: 100000,
          subtotal: 100000,
        },
      });
      await prisma.workOrderItem.create({
        data: {
          workOrderId: spk.id,
          type: 'SPAREPART',
          nama: 'Oli Mesin',
          qty: 2,
          hargaSatuan: 75000,
          subtotal: 150000,
        },
      });
      
      // Auto invoice if DIAMBIL
      if (statuses[i] === 'DIAMBIL') {
        await prisma.invoice.create({
          data: {
            nomorInvoice: `INV-20260610-${1000 + i}`,
            workOrderId: spk.id,
            customerId: customer.id,
            subtotal: 250000,
            pajak: 27500, // 11%
            total: 277500,
            status: 'LUNAS',
            metodeBayar: 'TUNAI',
            nominalDibayar: 280000,
            kembalian: 2500,
            paidAt: new Date(),
          }
        });
      }
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
