import { ipcMain } from 'electron';
import { prisma } from '../lib/db';

export function registerCustomersIPC() {
  ipcMain.handle('customers:list', async () => {
    return prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        kendaraans: true,
      },
    });
  });

  ipcMain.handle('customers:add', async (_, data) => {
    return prisma.customer.create({
      data,
    });
  });

  ipcMain.handle('customers:update', async (_, { id, ...data }) => {
    return prisma.customer.update({
      where: { id },
      data,
    });
  });
}
