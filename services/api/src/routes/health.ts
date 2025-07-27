import { Router } from 'express';
import { prisma } from '@question-exchange/database';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let databaseStatus = 'unknown';
  let httpStatus = 200;
  
  try {
    // Check database connection only if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } else {
      databaseStatus = 'no-database-url';
    }
  } catch (error) {
    databaseStatus = 'connection-failed';
    // Don't fail health check just because DB is down
    // Railway needs to know the service is running
    console.error('Database health check failed:', error);
  }
  
  res.status(httpStatus).json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    port: process.env.PORT || 3001,
  });
});