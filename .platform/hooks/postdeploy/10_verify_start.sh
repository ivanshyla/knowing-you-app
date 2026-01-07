#!/bin/bash
# Verify that the application can start after deployment
set -e
cd /var/app/current

echo "🔍 Verifying application setup..."

# Check if standalone build exists
if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ ERROR: .next/standalone/server.js not found!"
  echo "Current directory: $(pwd)"
  echo "Contents of .next/:"
  ls -la .next/ 2>&1 || echo "No .next directory"
  exit 1
fi

# Check if static files exist
if [ ! -d ".next/static" ]; then
  echo "❌ ERROR: .next/static directory not found!"
  exit 1
fi

# Check if public files exist
if [ ! -d "public" ]; then
  echo "⚠️  WARNING: public directory not found"
fi

echo "✅ Application files verified"

