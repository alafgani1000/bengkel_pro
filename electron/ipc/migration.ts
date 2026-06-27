import { ipcMain } from 'electron';
import { checkMigrations, runMigrations } from '../lib/migration';

export function registerMigrationIPC() {
  ipcMain.handle('migration:check', async () => {
    try {
      const pending = await checkMigrations();
      return { success: true, pendingMigrations: pending };
    } catch (error: any) {
      console.error('Error checking migrations:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('migration:run', async (event, pendingMigrations: string[]) => {
    try {
      const success = await runMigrations(pendingMigrations);
      return { success };
    } catch (error: any) {
      console.error('Error running migrations:', error);
      return { success: false, error: error.message };
    }
  });
}
