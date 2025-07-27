import { Router } from 'express';
import { prisma } from '@question-exchange/database';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'api',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});