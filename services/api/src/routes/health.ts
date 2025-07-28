import { Router } from 'express';
import { prisma } from '@question-exchange/database';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let databaseStatus = 'unknown';
  let httpStatus = 200;
  const startTime = Date.now();
  
  // Quick response for Railway health checks
  if (process.uptime() < 30) {
    // Service just started, respond immediately
    return res.status(httpStatus).json({
      status: 'warming-up',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Service is starting up'
    });
  }
  
  try {
    // Check database connection only if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database check timeout')), 5000)
      );
      
      const dbCheckPromise = prisma.$queryRaw`SELECT 1`;
      
      await Promise.race([dbCheckPromise, timeoutPromise]);
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
  
  const responseTime = Date.now() - startTime;
  
  return res.status(httpStatus).json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    port: process.env.PORT || 3001,
    responseTime: `${responseTime}ms`,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  });
});