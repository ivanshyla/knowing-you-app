#!/bin/bash

set -euo pipefail

cd /var/app/staging

echo "[postdeploy] Running Next.js production build..."
npm run build

