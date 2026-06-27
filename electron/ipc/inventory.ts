import { ipcMain } from 'electron';
import { prisma } from '../lib/db';

export function registerInventoryIPC() {
  ipcMain.handle('inventory:list', async () => {
    return prisma.sparepart.findMany({
      orderBy: { nama: 'asc' },
    });
  });

  ipcMain.handle('inventory:add', async (_, data) => {
    return prisma.sparepart.create({
      data,
    });
  });

  ipcMain.handle('inventory:update-stock', async (_, { id, qty, type, keterangan }) => {
    const item = await prisma.sparepart.findUnique({ where: { id } });
    if (!item) throw new Error('Sparepart not found');

    const newStok = type === 'MASUK' ? item.stokSaatIni + qty : item.stokSaatIni - qty;
    
    // Log history
    await prisma.stokMutasi.create({
      data: {
        sparepartId: id,
        type,
        qty,
        qtyBefore: item.stokSaatIni,
        qtyAfter: newStok,
        keterangan: keterangan || '',
        createdById: '1', // Hardcoded for MVP, should be passed from frontend Auth
      },
    });

    return prisma.sparepart.update({
      where: { id },
      data: { stokSaatIni: newStok },
    });
  });

  ipcMain.handle('inventory:update', async (_, { id, data }) => {
    const item = await prisma.sparepart.findUnique({ where: { id } });
    if (!item) throw new Error('Sparepart not found');

    const oldStock = item.stokSaatIni;
    const newStock = typeof data.stokSaatIni === 'number' ? data.stokSaatIni : oldStock;

    // If stock changes, log mutation
    if (oldStock !== newStock) {
      // Get a valid user ID for stock mutation log
      const admin = await prisma.user.findFirst();
      const adminId = admin ? admin.id : '1';

      await prisma.stokMutasi.create({
        data: {
          sparepartId: id,
          type: newStock > oldStock ? 'MASUK' : 'KELUAR',
          qty: Math.abs(newStock - oldStock),
          qtyBefore: oldStock,
          qtyAfter: newStock,
          keterangan: 'Penyesuaian Stok (Edit Barang)',
          createdById: adminId,
        },
      });
    }

    return prisma.sparepart.update({
      where: { id },
      data,
    });
  });
}
