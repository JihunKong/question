#!/usr/bin/env node

// Railway startup script with gradual feature enablement
console.log('Railway startup script initializing...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Railway:', process.env.RAILWAY_ENVIRONMENT || 'local');

// Check if we have DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL not set - starting ultra simple server');
  require('./railway-ultra-simple.js');
} else {
  console.log('DATABASE_URL found - attempting to start full API server');
  
  try {
    // Try to start the full API server
    require('./services/api/dist/index.js');
  } catch (error) {
    console.error('Failed to start full API server:', error.message);
    console.log('Falling back to ultra simple server');
    require('./railway-ultra-simple.js');
  }
}