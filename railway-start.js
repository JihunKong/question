#!/usr/bin/env node

// Railway-specific startup script
console.log('[Railway Start] Starting API service...');
console.log('[Railway Start] Working directory:', process.cwd());
console.log('[Railway Start] Node version:', process.version);
console.log('[Railway Start] Environment:', process.env.NODE_ENV || 'production');
console.log('[Railway Start] Port:', process.env.PORT || '3001');
console.log('[Railway Start] Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Change to API directory and start the service
process.chdir('services/api');
console.log('[Railway Start] Changed to API directory:', process.cwd());

// Start the compiled API service
require('./dist/index.js');