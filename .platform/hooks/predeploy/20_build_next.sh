#!/bin/bash

set -euo pipefail

cd /var/app/staging

echo "[predeploy] Building Next.js app for production..."
npm run build

