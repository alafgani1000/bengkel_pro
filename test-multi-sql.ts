import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS _Test1 (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS _Test2 (id TEXT PRIMARY KEY);
    `);
    console.log("SUCCESS! Prisma supports multiple statements.");
  } catch (e) {
    console.error("FAILED! Prisma does NOT support multiple statements:", e);
  } finally {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS _Test1; DROP TABLE IF EXISTS _Test2;`).catch(()=>"");
    await prisma.$disconnect();
  }
}
main();
