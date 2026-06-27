import { app, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron';
import path from 'path';
import { prisma } from './lib/db';
import { registerWorkOrderIPC } from './ipc/work-order';

import { registerKasirIPC } from './ipc/kasir';
import { registerInventoryIPC } from './ipc/inventory';
import { registerCustomersIPC } from './ipc/customers';
import { registerReportsIPC } from './ipc/reports';
import { registerSettingsIPC } from './ipc/settings';
import { registerMigrationIPC } from './ipc/migration';

// @ts-ignore
globalThis.__dirname = import.meta.dirname;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // Packaged build
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    // If you want to minimize to tray instead of closing:
    // event.preventDefault();
    // mainWindow?.hide();
  });
}

app.whenReady().then(async () => {
  await createWindow();

  // Register shortcut
  globalShortcut.register('CommandOrControl+Shift+B', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Sample IPC handler registration
ipcMain.handle('ping', () => 'pong');

// Register module IPCs
registerWorkOrderIPC();
registerKasirIPC();
registerInventoryIPC();
registerCustomersIPC();
registerReportsIPC();
registerSettingsIPC();
registerMigrationIPC();

// Graceful exit for Prisma
app.on('will-quit', async () => {
  await prisma.$disconnect();
});
