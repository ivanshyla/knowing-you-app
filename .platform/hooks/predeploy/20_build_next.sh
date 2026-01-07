#!/bin/bash
set -e
cd /var/app/staging

echo "🔨 Building Next.js standalone..."

# Build with error output
if ! npm run build 2>&1 | tee /tmp/build-output.log; then
  echo "❌ Build failed. Last 50 lines of output:"
  tail -50 /tmp/build-output.log
  exit 1
fi

# Verify build artifacts exist
if [ ! -d ".next/standalone" ]; then
  echo "❌ Build failed: .next/standalone directory not found"
  exit 1
fi

if [ ! -d ".next/static" ]; then
  echo "❌ Build failed: .next/static directory not found"
  exit 1
fi

echo "✅ Build complete. Artifacts verified."

