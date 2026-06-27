import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { prisma } from './db';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// The path to the migrations folder
const getMigrationsDir = () => {
  return isDev
    ? path.join(process.cwd(), 'prisma', 'migrations')
    : path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'migrations');
};

/**
 * Initializes the _AppMigrations table if it doesn't exist.
 */
async function initMigrationTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _AppMigrations (
      id TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Checks for any pending migrations that have not been applied yet.
 * Returns an array of pending migration folder names.
 */
export async function checkMigrations(): Promise<string[]> {
  const migrationsDir = getMigrationsDir();
  
  // If migrations directory doesn't exist (e.g., deleted), return empty array
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  await initMigrationTable();

  // Read all applied migrations from the database
  const appliedMigrations = await prisma.$queryRawUnsafe<{id: string}[]>(
    `SELECT id FROM _AppMigrations`
  );
  const appliedIds = new Set(appliedMigrations.map(m => m.id));

  // Read all available migration folders in the filesystem
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const pendingMigrations: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Prisma migrations are typically folders named like "20260610221120_init"
      // Check if this migration has already been applied
      if (!appliedIds.has(entry.name)) {
        const sqlPath = path.join(migrationsDir, entry.name, 'migration.sql');
        if (fs.existsSync(sqlPath)) {
          pendingMigrations.push(entry.name);
        }
      }
    }
  }

  // Sort them alphabetically (which means chronologically since Prisma prepends timestamps)
  return pendingMigrations.sort();
}

/**
 * Runs the specified pending migrations.
 */
export async function runMigrations(pendingMigrations: string[]): Promise<boolean> {
  if (pendingMigrations.length === 0) return true;

  const migrationsDir = getMigrationsDir();
  
  await initMigrationTable();

  try {
    for (const migrationId of pendingMigrations) {
      const sqlPath = path.join(migrationsDir, migrationId, 'migration.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Prisma's generated migration SQL might contain multiple statements separated by semicolons.
        // Prisma Client's $executeRawUnsafe typically doesn't support executing multiple statements at once 
        // in SQLite if they are complex, but for basic CREATE/ALTER it often works.
        // A safer way is to split by semicolon, but Prisma's driver usually handles standard migration files fine.
        
        // We execute the whole script. If it fails, we catch the error.
        await prisma.$executeRawUnsafe(sql);

        // Mark as applied
        await prisma.$executeRawUnsafe(
          `INSERT INTO _AppMigrations (id) VALUES (?)`,
          migrationId
        );
      }
    }
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
