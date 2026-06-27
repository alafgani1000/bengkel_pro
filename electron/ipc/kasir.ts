import { ipcMain } from 'electron';
import { prisma } from '../lib/db';

export function registerKasirIPC() {
  // Fetch SPK yang belum dibayar / invoice belum lunas
  ipcMain.handle('kasir:list-unpaid', async () => {
    return prisma.invoice.findMany({
      where: {
        status: {
          not: 'LUNAS',
        },
      },
      include: {
        workOrder: {
          include: {
            customer: true,
            kendaraan: true,
            items: true,
          },
        },
      },
    });
  });

  // Fetch riwayat invoice lunas
  ipcMain.handle('kasir:list-paid', async () => {
    return prisma.invoice.findMany({
      where: {
        status: 'LUNAS',
      },
      orderBy: {
        paidAt: 'desc'
      },
      take: 50, // Limit to 50 latest paid invoices
      include: {
        workOrder: {
          include: {
            customer: true,
            kendaraan: true,
            items: true,
          },
        },
      },
    });
  });

  // Proses pembayaran (checkout)
  ipcMain.handle('kasir:pay', async (_, { invoiceId, paymentMethod, diskon, pajak, total, nominalDibayar, kembalian }) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Karena pembayaran bengkel biasanya langsung LUNAS, kita anggap lunas jika nominalDibayar >= total
    const status = nominalDibayar >= total ? 'LUNAS' : 'SEBAGIAN';

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        metodeBayar: paymentMethod,
        diskon,
        pajak,
        total,
        nominalDibayar,
        kembalian,
        paidAt: new Date(),
      },
    });
  });
}
