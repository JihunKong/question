const http = require('http');
const url = require('url');

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (path === '/health') {
    const healthData = {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      railway: process.env.RAILWAY_ENVIRONMENT ? 'true' : 'false',
      version: 'ultra-simple'
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(healthData, null, 2));
    return;
  }
  
  // Root endpoint
  if (path === '/' || path === '') {
    const rootData = {
      message: 'Question Exchange API - Ultra Simple Version',
      version: '1.0.0',
      health: '/health',
      status: 'running',
      method: req.method,
      url: req.url
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(rootData, null, 2));
    return;
  }
  
  // 404 for all other routes
  const notFoundData = {
    error: 'Not Found',
    path: path,
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  res.writeHead(404);
  res.end(JSON.stringify(notFoundData, null, 2));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra Simple API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔍 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📍 Root endpoint: http://0.0.0.0:${PORT}/`);
  
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚄 Running on Railway platform');
    console.log('✅ Server is ready to accept connections');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🎯 Ultra Simple Server initialized successfully');