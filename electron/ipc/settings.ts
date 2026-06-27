import { ipcMain, app, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/db';

export function registerSettingsIPC() {
  ipcMain.handle('settings:backup-db', async () => {
    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db'); 
      
      const result = await dialog.showSaveDialog({
        title: 'Simpan Backup Database',
        defaultPath: path.join(app.getPath('documents'), `bengkel_backup_${new Date().getTime()}.db`),
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      fs.copyFileSync(dbPath, result.filePath);
      
      return { success: true, path: result.filePath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:restore-db', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Pilih File Backup Database',
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const selectedFile = result.filePaths[0];
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

      // Disconnect from Prisma before overwriting the active database
      await prisma.$disconnect();
      
      // Copy the selected backup file over the active database
      fs.copyFileSync(selectedFile, dbPath);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:get-bengkel', async () => {
    let bengkel = await prisma.bengkel.findUnique({ where: { id: 1 } });
    if (!bengkel) {
      bengkel = await prisma.bengkel.create({
        data: {
          id: 1,
          nama: 'BengkelPro Default',
          alamat: 'Jl. Raya Otomotif',
          kota: 'Jakarta',
          telepon: '081234567890',
          jamBuka: '08:00',
          jamTutup: '17:00'
        }
      });
    }
    return bengkel;
  });

  ipcMain.handle('settings:update-bengkel', async (_, data) => {
    return prisma.bengkel.update({
      where: { id: 1 },
      data,
    });
  });
}
