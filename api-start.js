#!/usr/bin/env node

// Railway API startup script
console.log('Starting API service...');
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 'not set');

// Change to the API service directory and start the server
require('./services/api/dist/index.js');