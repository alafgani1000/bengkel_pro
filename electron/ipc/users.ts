import { ipcMain } from 'electron';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import bcrypt from 'bcryptjs';

export function registerUsersIPC() {
  ipcMain.handle('users:list', async () => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          pin: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          // passwordHash is explicitly excluded for security
        }
      });
      return users;
    } catch (error: any) {
      logger.error('users:list ERROR:', error);
      throw error;
    }
  });

  ipcMain.handle('users:create', async (_, data) => {
    try {
      logger.info('Creating user:', data.username);
      
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username }
      });

      if (existingUser) {
        throw new Error(`Username ${data.username} sudah digunakan.`);
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          name: data.name,
          username: data.username,
          passwordHash,
          role: data.role,
          pin: data.pin || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
        }
      });
      
      return user;
    } catch (error: any) {
      logger.error('users:create ERROR:', error);
      throw error;
    }
  });

  ipcMain.handle('users:update', async (_, { id, data }) => {
    try {
      logger.info('Updating user:', id);

      if (data.username) {
        const existingUser = await prisma.user.findUnique({
          where: { username: data.username }
        });

        if (existingUser && existingUser.id !== id) {
          throw new Error(`Username ${data.username} sudah digunakan oleh pengguna lain.`);
        }
      }

      const updateData: any = { ...data };
      
      // Handle password update if provided
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
        delete updateData.password;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          isActive: true,
          pin: true,
        }
      });

      return user;
    } catch (error: any) {
      logger.error('users:update ERROR:', error);
      throw error;
    }
  });

  ipcMain.handle('users:deactivate', async (_, { id }) => {
    try {
      logger.info('Deactivating user:', id);
      
      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, isActive: true }
      });
      
      return user;
    } catch (error: any) {
      logger.error('users:deactivate ERROR:', error);
      throw error;
    }
  });
}
