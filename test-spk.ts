import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const data = {
    customerName: 'Test Name',
    customerPhone: '08111111111',
    platNomor: 'B 1234 TEST',
    merk: 'Toyota',
    tipe: 'Avanza',
    keluhan: 'Test keluhan'
  };

  try {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.workOrder.count({
      where: {
        nomorSPK: { startsWith: `SPK-${date}` },
      },
    });
    const nomorSPK = `SPK-${date}-${String(count + 1).padStart(4, '0')}`;

    console.log('SPK Number:', nomorSPK);

    // Handle Customer
    let customer = await prisma.customer.findUnique({ where: { phone: data.customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: data.customerName, phone: data.customerPhone },
      });
    }

    console.log('Customer:', customer.id);

    // Handle Kendaraan
    let kendaraan = await prisma.kendaraan.findUnique({ where: { platNomor: data.platNomor } });
    if (!kendaraan) {
      kendaraan = await prisma.kendaraan.create({
        data: {
          customerId: customer.id,
          platNomor: data.platNomor,
          merek: data.merk,
          model: data.tipe,
          tahun: '',
          warna: '',
          jenisKendaraan: 'MOBIL',
        },
      });
    }

    console.log('Kendaraan:', kendaraan.id);

    // Get a default mechanic (MVP logic)
    let mechanic = await prisma.user.findFirst({ where: { role: 'MEKANIK' } });
    if (!mechanic) {
      mechanic = await prisma.user.findFirst(); // fallback
    }

    console.log('Mechanic:', mechanic?.id);

    const wo = await prisma.workOrder.create({
      data: {
        nomorSPK,
        customerId: customer.id,
        kendaraanId: kendaraan.id,
        mekanikId: mechanic!.id,
        keluhan: data.keluhan,
        status: 'ANTRI',
      },
    });

    console.log('Success:', wo.id);
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
