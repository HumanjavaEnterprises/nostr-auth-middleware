#!/bin/bash

echo "🚀 Starting Nostr Auth Middleware (Test Mode)..."

# Build the project
echo "Building TypeScript..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Clean up any existing process
pm2 delete nostr-auth-middleware 2>/dev/null || true

# Start with ecosystem config
NODE_ENV=development TEST_MODE=true pm2 start ecosystem.config.js

# Show PM2 status
echo "📊 PM2 Status:"
pm2 list

echo "✨ Done! Run './scripts/test-auth.sh' to test the endpoints"
