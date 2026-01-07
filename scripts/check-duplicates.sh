#!/bin/bash
# Check for duplicate code blocks in files
# This helps catch accidental duplications

set -e

echo "🔍 Checking for duplicate code blocks..."

# Check for duplicate function definitions
duplicates=$(grep -r "export async function\|export function" app/ lib/ --include="*.ts" --include="*.tsx" | \
  awk '{print $3}' | sort | uniq -d)

if [ -n "$duplicates" ]; then
  echo "❌ Found duplicate function definitions:"
  echo "$duplicates"
  exit 1
fi

# Check for suspicious duplicate blocks (same line repeated 3+ times)
find app/ lib/ -name "*.ts" -o -name "*.tsx" | while read file; do
  # Look for lines that appear 3+ times in a row
  if grep -Pzo '(?s)(.{50,})\1{2,}' "$file" > /dev/null 2>&1; then
    echo "⚠️  Potential duplicate code in: $file"
  fi
done

echo "✅ No obvious duplicates found"

