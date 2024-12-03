# Deployment Guide

This guide explains how to deploy the Nostr Auth Middleware in both development and production environments.

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Directory Structure](#directory-structure)
5. [Configuration Management](#configuration-management)
6. [Script Reference](#script-reference)
7. [Troubleshooting](#troubleshooting)

## Environment Overview

The middleware supports two deployment environments:

### Development Mode
- Local directory structure
- Auto-generated test keys
- In-memory data storage option
- Hot-reloading enabled
- Detailed logging
- No root permissions required

### Production Mode
- System-level directory structure
- Secure key management via Supabase
- Proper file permissions
- Log rotation and compression
- Automatic backups
- Rate limiting
- IP whitelisting

## Development Deployment

1. **Initial Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/your-org/nostr-auth-middleware.git
   cd nostr-auth-middleware

   # Install dependencies
   npm install

   # Copy environment file
   cp .env.example .env
   ```

2. **Configure Environment**
   ```bash
   # Edit .env file
   NODE_ENV=development
   DOMAIN=nostr-platform.app
   SERVICE_NAME=auth
   TEST_MODE=true
   ```

3. **Start the Service**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh

   # Start in development mode
   ./scripts/startup.sh
   ```

## Production Deployment

1. **System Requirements**
   - Node.js 16 or higher
   - PM2 process manager
   - System user and group for the service
   ```bash
   # Create service user and group
   sudo useradd -r -s /bin/false nostr
   sudo groupadd nostr
   ```

2. **Directory Setup**
   ```bash
   # Create system directories
   sudo mkdir -p /opt/nostr-platform/auth
   sudo mkdir -p /var/log/nostr-platform/auth
   sudo mkdir -p /opt/backups/nostr-platform/auth

   # Set permissions
   sudo chown -R nostr:nostr /opt/nostr-platform/auth
   sudo chown -R nostr:nostr /var/log/nostr-platform/auth
   sudo chown -R nostr:nostr /opt/backups/nostr-platform/auth
   ```

3. **Production Configuration**
   ```bash
   # Edit .env file
   NODE_ENV=production
   DOMAIN=your-domain.com
   SERVICE_NAME=auth
   TEST_MODE=false
   
   # Supabase Configuration
   SUPABASE_PROJECT=your-project
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-key
   
   # Service Configuration
   SERVICE_USER=nostr
   SERVICE_GROUP=nostr
   ```

4. **Start Production Service**
   ```bash
   sudo NODE_ENV=production ./scripts/startup.sh
   ```

## Directory Structure

### Development
```
./
├── logs/           # Local logs
├── backups/        # Local backups
└── dist/           # Compiled code
```

### Production
```
/opt/nostr-platform/auth/  # Service files
├── dist/                  # Compiled code
└── node_modules/          # Dependencies

/var/log/nostr-platform/auth/  # System logs
└── [service-name].log         # Log files

/opt/backups/nostr-platform/auth/  # Backups
└── backup_[timestamp]/            # Dated backups
```

## Configuration Management

### Environment Variables
- Core Configuration
  ```bash
  NODE_ENV=development|production
  DOMAIN=your-domain.com
  SERVICE_NAME=auth
  ```

- Service URLs
  ```bash
  AUTH_SERVICE_URL=http://localhost:3002
  IPFS_SERVICE_URL=http://localhost:3001
  RELAY_SERVICE_URL=http://localhost:3000
  ```

- Security
  ```bash
  SERVER_PRIVATE_KEY=  # Auto-generated
  SERVER_PUBLIC_KEY=   # Auto-generated
  JWT_SECRET=          # Required in production
  ```

### Configuration Files
- `config.sh`: Central configuration management
- `ecosystem.config.cjs`: PM2 process configuration
- `.env`: Environment-specific variables

## Script Reference

### startup.sh
- Checks environment and requirements
- Creates necessary directories
- Manages permissions
- Starts the service with PM2

```bash
# Development
./scripts/startup.sh

# Production
sudo NODE_ENV=production ./scripts/startup.sh
```

### shutdown.sh
- Graceful shutdown
- Log rotation
- Cleanup operations

```bash
# Development
./scripts/shutdown.sh

# Production
sudo ./scripts/shutdown.sh
```

### config.sh
- Environment detection
- Directory structure
- Permissions handling
- Logging utilities

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   Error: EACCES: permission denied
   ```
   - Check if running as correct user
   - Verify directory permissions
   - Use sudo in production mode

2. **Directory Creation Failed**
   ```bash
   Failed to create directory
   ```
   - Verify parent directory permissions
   - Check disk space
   - Ensure correct service user

3. **PM2 Process Issues**
   ```bash
   Error: Process already running
   ```
   - Clean up existing process: `pm2 delete nostr-auth-middleware`
   - Check PM2 logs: `pm2 logs`
   - Verify process status: `pm2 list`

### Environment-Specific Issues

#### Development
- Hot reload not working
- Local directories not created
- Test mode configuration

#### Production
- System directory permissions
- Service user access
- Log rotation
- Backup management

### Logs

1. **Access Logs**
   ```bash
   # Development
   tail -f logs/nostr-auth.log

   # Production
   sudo tail -f /var/log/nostr-platform/auth/nostr-auth.log
   ```

2. **PM2 Logs**
   ```bash
   pm2 logs nostr-auth-middleware
   ```

3. **Compressed Logs**
   ```bash
   # List compressed logs
   ls -l /var/log/nostr-platform/auth/*.gz

   # View compressed log
   zcat /var/log/nostr-platform/auth/nostr-auth.log.1.gz
   ```
