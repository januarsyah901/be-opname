#!/bin/sh

# Jalankan WhatsApp worker di background
echo "Starting WhatsApp Worker..."
node dist/wa-worker.js &

# Jalankan Express server di foreground (exec agar handle signals)
echo "Starting Express Server..."
exec node dist/index.js
