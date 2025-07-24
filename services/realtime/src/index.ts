import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { setupAuth } from './utils/auth';
import { questionHandler } from './handlers/questionHandler';
import { collaborationHandler } from './handlers/collaborationHandler';

dotenv.config();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
});

// Redis adapter setup for horizontal scaling
const setupRedisAdapter = async () => {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Redis adapter connected');
  } catch (error) {
    logger.error('Redis adapter connection failed:', error);
    // Continue without Redis in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Middleware
io.use(setupAuth);

// Connection handler
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.data.userId}`);

  // Set up handlers
  questionHandler(io, socket);
  collaborationHandler(io, socket);

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.data.userId}`);
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error('Socket error:', {
      userId: socket.data.userId,
      error: error.message,
    });
  });
});

// Start server
const PORT = process.env.PORT || 3002;

const start = async () => {
  await setupRedisAdapter();
  
  httpServer.listen(PORT, () => {
    logger.info(`Realtime server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});