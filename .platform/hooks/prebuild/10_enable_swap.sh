#!/bin/bash

SWAPFILE="/var/app/ebswapfile"

if [ ! -f "$SWAPFILE" ]; then
  dd if=/dev/zero of="$SWAPFILE" bs=1M count=2048
  chmod 600 "$SWAPFILE"
  mkswap "$SWAPFILE"
fi

swapon "$SWAPFILE" || true

