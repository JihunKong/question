#!/bin/bash
# Build script for API service

echo "Installing dependencies..."
npm install

echo "Building packages..."
npm run build -w @question-exchange/database
npm run build -w @question-exchange/shared
npm run build -w @question-exchange/api

echo "Build completed successfully"