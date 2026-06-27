import { ipcMain } from 'electron';
import { prisma } from '../lib/db';

export function registerReportsIPC() {
  ipcMain.handle('reports:dashboard-stats', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendapatanHariIni, spkAktif, pelangganBaruBulanIni] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: today },
          status: 'LUNAS',
        },
      }),
      prisma.workOrder.count({
        where: {
          status: { in: ['ANTRI', 'DIKERJAKAN', 'MENUNGGU_PART'] },
        },
      }),
      prisma.customer.count({
        where: {
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      }),
    ]);

    const recentSPKs = await prisma.workOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        kendaraan: true,
      },
    });

    return {
      pendapatanHariIni: pendapatanHariIni._sum.total || 0,
      spkAktif,
      pelangganBaruBulanIni,
      recentSPKs,
    };
  });

  ipcMain.handle('reports:monthly-revenue', async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'LUNAS',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: Record<string, number> = {};

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthlyData[`${monthNames[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }

    // Aggregate data
    invoices.forEach((inv: any) => {
      const monthKey = `${monthNames[inv.createdAt.getMonth()]} ${inv.createdAt.getFullYear()}`;
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += inv.total;
      }
    });

    return Object.keys(monthlyData).map(key => ({
      name: key,
      total: monthlyData[key]
    }));
  });

  ipcMain.handle('reports:revenue-summary', async () => {
    return prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        workOrder: {
          include: {
            kendaraan: true
          }
        }
      }
    });
  });

  ipcMain.handle('reports:spk-summary', async () => {
    return prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        kendaraan: true,
        mekanik: true,
      }
    });
  });

  ipcMain.handle('reports:inventory-summary', async () => {
    return prisma.sparepart.findMany({
      orderBy: { nama: 'asc' }
    });
  });

  ipcMain.handle('sidebar:counts', async () => {
    const [activeSPKs, unpaidInvoices] = await Promise.all([
      prisma.workOrder.count({
        where: { status: { in: ['ANTRI', 'DIKERJAKAN', 'MENUNGGU_PART'] } }
      }),
      prisma.invoice.count({
        where: { status: { not: 'LUNAS' } }
      })
    ]);

    return {
      workOrders: activeSPKs,
      kasir: unpaidInvoices
    };
  });
}
