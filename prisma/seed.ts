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
    },
  });

  console.log('Seeding completed successfully. Only admin user was created.');

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
