import { prisma } from '@question-exchange/database';
import { logger } from './logger';
import { execSync } from 'child_process';
import path from 'path';

export async function initializeDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set, skipping database initialization');
    return;
  }

  try {
    // Test database connection
    logger.info('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');

    // In production on Railway, migrations should be handled separately
    // This is just for local development
    if (process.env.NODE_ENV !== 'production' && process.env.RUN_MIGRATIONS === 'true') {
      logger.info('Running database migrations...');
      const schemaPath = path.join(__dirname, '../../../packages/database/prisma/schema.prisma');
      execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
        stdio: 'inherit',
        env: process.env
      });
      logger.info('Migrations completed successfully');
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
    if (process.env.NODE_ENV === 'production') {
      // In production, let the service start anyway
      // Railway will restart if health checks fail
      logger.warn('Continuing despite database initialization failure');
    } else {
      throw error;
    }
  }
}