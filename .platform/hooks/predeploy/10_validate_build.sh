#!/bin/bash
# Validate that the code can build BEFORE attempting to build on the server
# This catches errors early and prevents broken deployments

set -e

cd /var/app/staging

echo "🔍 Validating code before build..."

# Check for TypeScript errors
echo "📝 Type checking..."
if ! npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.log; then
  echo "❌ TypeScript errors found. Build aborted."
  cat /tmp/tsc-errors.log
  exit 1
fi

# Check for linting errors
echo "🧹 Linting..."
if ! npm run lint 2>&1 | tee /tmp/lint-errors.log; then
  echo "⚠️  Linting warnings found (non-blocking)"
fi

# Check for obvious duplicate code patterns
echo "🔍 Checking for duplicate code..."
if grep -r "export async function\|export function" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | \
   awk '{print $3}' | sort | uniq -d | grep -q .; then
  echo "⚠️  Warning: Potential duplicate function definitions found"
fi

echo "✅ Code validation passed. Proceeding with build..."

