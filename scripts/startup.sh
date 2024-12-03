#!/bin/bash

# Change to project root directory
cd "$(dirname "$0")/.." || exit 1

echo "🚀 Starting Nostr Auth Middleware..."

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating one..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# Check for server keys in .env
if ! grep -q "SERVER_PRIVATE_KEY=" .env || ! grep -q "SERVER_PUBLIC_KEY=" .env; then
    echo "⚠️  No server keys found in .env"
    echo "Keys will be auto-generated on first startup"
fi

# Build the project
echo "Building TypeScript..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Clean up any existing process
pm2 delete nostr-auth-middleware 2>/dev/null || true

# Start with ecosystem config
NODE_ENV=${NODE_ENV:-development} TEST_MODE=${TEST_MODE:-true} pm2 start ecosystem.config.cjs

# Show PM2 status
echo "📊 PM2 Status:"
pm2 list

echo "✨ Done! Run './scripts/test-auth.sh' to test the endpoints"
