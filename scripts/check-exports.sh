#!/bin/bash
# Check that all imported functions/constants actually exist
# This catches issues like syncUserSessionPartnerInfo

set -e

echo "🔍 Checking imports match exports..."

# Find all import statements
imports=$(grep -r "import.*from" app/ lib/ --include="*.ts" --include="*.tsx" | \
  grep -o "{[^}]*}" | tr -d '{}' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sort -u)

errors=0

for import in $imports; do
  # Skip default imports and type imports
  if [[ "$import" == *"type "* ]] || [[ "$import" == *" as "* ]]; then
    continue
  fi
  
  # Extract the actual name (remove 'type' prefix if present)
  name=$(echo "$import" | sed 's/^type //' | sed 's/ as .*$//')
  
  # Check if it's exported from the file it's imported from
  # This is a simplified check - in reality we'd need to parse the actual import path
  # For now, we'll just check common patterns
  if ! grep -r "export.*$name" lib/ app/ --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
    # Check if it's a re-export or from node_modules
    if ! grep -r "$name" --include="*.ts" --include="*.tsx" | grep -q "from.*node_modules\|from.*@/"; then
      echo "⚠️  Warning: '$name' might not be exported (or is from external package)"
    fi
  fi
done

echo "✅ Import check complete"

