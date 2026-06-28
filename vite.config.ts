import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          define: {
            __dirname: 'import.meta.dirname',
            __filename: 'import.meta.filename'
          },
          build: {
            rollupOptions: {
              external: ['@prisma/client', 'prisma', '.prisma/client']
            }
          }
        }
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          define: {
            __dirname: 'import.meta.dirname',
            __filename: 'import.meta.filename'
          },
          build: {
            rollupOptions: {
              external: ['@prisma/client', 'prisma', '.prisma/client']
            }
          }
        }
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
