#!/bin/bash

echo "Testing Railway startup locally..."

# Build the project
echo "Building project..."
npm run build:sequential

# Test the startup script
echo "Testing api-start.js..."
node api-start.js