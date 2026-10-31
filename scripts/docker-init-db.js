/**
 * SubFlow Docker Database Initialization & Migration Helper
 * Safe, idempotent database readiness check and migration runner.
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase() {
  console.log('⏳ Checking PostgreSQL database connectivity...');
  const prisma = new PrismaClient();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1;`;
      console.log('✅ PostgreSQL is ready and accepting queries!');
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Database not ready yet: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        console.error('❌ Could not connect to PostgreSQL within the timeout period.');
        await prisma.$disconnect();
        process.exit(1);
      }
      await sleep(RETRY_INTERVAL_MS);
    }
  }
}

async function runDatabaseInitialization() {
  await waitForDatabase();

  const isProduction = process.env.NODE_ENV === 'production';
  const schemaPath = 'packages/database/prisma/schema.prisma';

  console.log(`🚀 Executing database migration (Environment: ${process.env.NODE_ENV || 'development'})...`);

  try {
    if (isProduction) {
      console.log('📦 Applying production migrations via prisma migrate deploy...');
      execSync(`npx prisma migrate deploy --schema=${schemaPath}`, { stdio: 'inherit' });
    } else {
      console.log('🛠️ Applying development schema push via prisma db push...');
      execSync(`npx prisma db push --schema=${schemaPath} --skip-generate`, { stdio: 'inherit' });
    }

    // Seed default demo data if the database is newly initialized
    const prisma = new PrismaClient();
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Fresh database detected. Seeding initial demo and administrative data...');
        execSync(`npm --workspace=@subflow/database run db:seed`, { stdio: 'inherit' });
        console.log('✅ Initial seed data populated successfully.');
      } else {
        console.log(`ℹ️ Existing database detected with ${userCount} users. Skipping auto-seed to preserve data.`);
      }
    } finally {
      await prisma.$disconnect();
    }

    console.log('🎉 Database initialization and verification completed.');
  } catch (error) {
    console.error('❌ Database migration or seeding failed:', error.message);
    process.exit(1);
  }
}

runDatabaseInitialization();
