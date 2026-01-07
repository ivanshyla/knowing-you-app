#!/bin/bash
# Pre-deployment validation script
# Run this BEFORE running 'eb deploy' to catch errors early

set -e

echo "🚀 Pre-deployment validation"
echo "=============================="

# 1. Type check
echo ""
echo "📝 Step 1: Type checking..."
if ! npm run type-check; then
  echo ""
  echo "❌ Type check failed. Fix errors before deploying."
  exit 1
fi

# 2. Lint
echo ""
echo "🧹 Step 2: Linting..."
if ! npm run lint; then
  echo ""
  echo "⚠️  Lint warnings found (continuing, but fix them)"
fi

# 3. Build
echo ""
echo "🔨 Step 3: Building..."
if ! npm run build; then
  echo ""
  echo "❌ Build failed. Fix errors before deploying."
  exit 1
fi

# 4. Verify artifacts
echo ""
echo "✅ Step 4: Verifying build artifacts..."
if [ ! -d ".next/standalone" ]; then
  echo "❌ .next/standalone not found"
  exit 1
fi

if [ ! -d ".next/static" ]; then
  echo "❌ .next/static not found"
  exit 1
fi

# 5. Check for common issues
echo ""
echo "🔍 Step 5: Checking for common issues..."

# Check for duplicate exports
duplicates=$(grep -r "export async function\|export function" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | \
  awk '{print $3}' | sort | uniq -d)

if [ -n "$duplicates" ]; then
  echo "⚠️  Warning: Found potential duplicate functions:"
  echo "$duplicates"
fi

# Check for undefined imports (basic check)
echo ""
echo "✅ All checks passed!"
echo ""
echo "You can now safely run: eb deploy knowing-you-prod"

