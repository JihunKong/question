// Try to load modules gracefully
let express, cors, helmet;
try {
  express = require('express');
} catch (e) {
  console.error('Express not found:', e.message);
  process.exit(1);
}

try {
  cors = require('cors');
} catch (e) {
  console.warn('CORS not found, continuing without CORS');
  cors = null;
}

try {
  helmet = require('helmet');
} catch (e) {
  console.warn('Helmet not found, continuing without helmet');
  helmet = null;
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware (if available)
if (helmet) {
  app.use(helmet());
  console.log('✓ Helmet security middleware loaded');
}

if (cors) {
  app.use(cors());
  console.log('✓ CORS middleware loaded');
}

// Body parsing
app.use(express.json());

// Simple health check that always works
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    railway: process.env.RAILWAY_ENVIRONMENT ? 'true' : 'false'
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Question Exchange API - Railway Simple Version',
    version: '1.0.0',
    health: '/health',
    status: 'running'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ API server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`✓ Health check: http://0.0.0.0:${PORT}/health`);
  
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('✓ Running on Railway platform');
    console.log('✓ Server is ready to accept connections');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});