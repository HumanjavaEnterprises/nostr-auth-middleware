# Nostr Auth & Enrollment Middleware

[![License](https://img.shields.io/npm/l/nostr-auth-enroll)](https://github.com/HumanjavaEnterprises/nostr-auth-middleware/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/nostr-auth-enroll)](https://www.npmjs.com/package/nostr-auth-enroll)
[![GitHub issues](https://img.shields.io/github/issues/HumanjavaEnterprises/nostr-auth-middleware)](https://github.com/HumanjavaEnterprises/nostr-auth-middleware/issues)
[![GitHub stars](https://img.shields.io/github/stars/HumanjavaEnterprises/nostr-auth-middleware)](https://github.com/HumanjavaEnterprises/nostr-auth-middleware/stargazers)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/node/v/nostr-auth-enroll)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

A standalone, open-source middleware for handling Nostr authentication and enrollment in web applications. Built with TypeScript and designed for scalability and security.

## Core Philosophy

This middleware is designed as a standalone security service, following the principles outlined in our [Architecture Guide](docs/architecture-guide.md). Key features include:

- 🔒 **Security First**: Open-source security implementation for transparency and auditability
- 🔄 **Service Isolation**: Clear separation from application logic
- 📖 **Transparent Security**: Easily auditable by third parties
- 🛡️ **Protected Integration**: Keep your application logic private while maintaining secure authentication

For a deeper understanding of our architectural approach, see the [Architecture Guide](docs/architecture-guide.md).

## Features

- 🔑 NIP-07 Compatible Authentication
- 📝 Secure User Enrollment with Nostr
- ⚡ Comprehensive Event Validation
- 🔒 Advanced Cryptographic Operations
- 🗄️ Supabase Integration for Data Persistence
- 🎫 JWT-based Session Management
- 🔄 Profile Management & Synchronization
- 📊 Detailed Logging and Monitoring
- 🔐 Automatic Key Management
- 🚀 Environment-Aware Deployment
- 🛠️ Development & Production Modes
- 📁 Automated Directory Management

## Documentation

- [Architecture Guide](docs/architecture-guide.md) - Understanding the service architecture
- [Key Management Guide](docs/key-management.md) - Comprehensive key management documentation
- [Deployment Guide](docs/deployment-guide.md) - Environment-specific deployment instructions
- [Authentication Flow](docs/authentication-flow.md) - Detailed authentication process
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions
- [API Documentation](docs/api.md) - API endpoints and usage
- [Security Guide](docs/security.md) - Security best practices and considerations

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Run `./scripts/startup.sh`

The server will automatically:
- Configure itself based on the environment (development/production)
- Generate server keys if none exist
- Create necessary directories with proper permissions
- Start the service with appropriate settings

## Development Mode

```bash
# Start the service in development mode
NODE_ENV=development ./scripts/startup.sh

# Stop the service
./scripts/shutdown.sh
```

Development mode features:
- Local directory structure
- Auto-generated test keys
- In-memory data storage option
- Hot-reloading enabled
- Detailed logging
- No root permissions required

## Production Mode

```bash
# Start the service in production mode
sudo NODE_ENV=production ./scripts/startup.sh

# Stop the service
sudo ./scripts/shutdown.sh
```

Production mode features:
- System-level directory structure
- Secure key management via Supabase
- Proper file permissions
- Log rotation and compression
- Automatic backups
- Rate limiting
- IP whitelisting

## Configuration

### Environment Variables

```bash
# Core Configuration
NODE_ENV=development                    # development or production
DOMAIN=nostr-platform.app              # your domain
SERVICE_NAME=auth                      # service identifier

# Service URLs (auto-configured in production)
AUTH_SERVICE_URL=http://localhost:3002  # becomes https://auth.your-domain.app
IPFS_SERVICE_URL=http://localhost:3001  # becomes https://ipfs.your-domain.app
RELAY_SERVICE_URL=http://localhost:3000 # becomes https://relay.your-domain.app

# Security Configuration
SERVER_PRIVATE_KEY=                    # auto-generated if not provided
SERVER_PUBLIC_KEY=                     # auto-generated if not provided
JWT_SECRET=your_jwt_secret            # required in production

# Supabase Configuration
SUPABASE_PROJECT=your-project         # project identifier
SUPABASE_URL=your_supabase_url       # required in production
SUPABASE_KEY=your_supabase_key       # required in production

# Service Configuration
SERVICE_USER=nostr                    # service user (production)
SERVICE_GROUP=nostr                   # service group (production)
DEPLOY_DIR=/opt/nostr-platform/auth   # deployment directory (production)
BACKUP_DIR=/opt/backups/nostr         # backup directory (production)
LOG_DIR=/var/log/nostr-platform      # log directory (production)
```

## Scripts

The `scripts` directory contains utilities for managing the service:

- `startup.sh`: Service initialization and startup
  - Environment detection
  - Directory creation
  - Permission setting
  - Service startup

- `shutdown.sh`: Clean service shutdown
  - Process termination
  - Log rotation
  - Cleanup operations

- `config.sh`: Configuration management
  - Environment detection
  - Directory structure
  - Permissions handling
  - Logging utilities

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Security

Security is our top priority. For details about our security practices and how to report security issues, see our [Security Guide](docs/security.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
