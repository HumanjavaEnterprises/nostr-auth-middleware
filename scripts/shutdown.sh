#!/bin/bash

echo "🛑 Shutting down Nostr Auth Middleware..."

# Stop PM2 process
echo "Stopping PM2 process..."
pm2 stop nostr-auth-middleware

# Remove PM2 process from list
echo "Cleaning up PM2..."
pm2 delete nostr-auth-middleware

# Save PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Compress any uncompressed rotated logs
echo "Compressing any uncompressed rotated logs..."
find logs -name "*.log.*" ! -name "*.gz" -exec gzip {} \;

# Clean up old logs (older than 15 days)
echo "Cleaning up old logs..."
find logs -name "*.gz" -mtime +15 -exec rm {} \;

echo "✅ Shutdown complete!"
echo "To start the service again, run: ./scripts/startup.sh"
