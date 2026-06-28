import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

export const logPath = isDev 
  ? path.join(process.cwd(), 'app.log')
  : path.join(app.getPath('userData'), 'app.log');

export const logger = {
  info: (message: string, ...optionalParams: any[]) => {
    const text = `[INFO] ${new Date().toISOString()} - ${message} ${optionalParams.map(p => typeof p === 'object' ? JSON.stringify(p) : p).join(' ')}\n`;
    fs.appendFileSync(logPath, text);
    console.log(message, ...optionalParams);
  },
  error: (message: string, ...optionalParams: any[]) => {
    const text = `[ERROR] ${new Date().toISOString()} - ${message} ${optionalParams.map(p => typeof p === 'object' ? JSON.stringify(p, Object.getOwnPropertyNames(p)) : p).join(' ')}\n`;
    fs.appendFileSync(logPath, text);
    console.error(message, ...optionalParams);
  }
};
