# Nostr Auth Middleware

A focused, security-first authentication middleware for Nostr applications.

⚠️ **Important Security Notice**

This library handles cryptographic keys and authentication tokens that are critical for securing your Nostr application and user data. Any private keys (`nsec`) or authentication tokens must be stored and managed with the utmost security and care.

Developers using this middleware must inform their users about the critical nature of managing private keys and tokens. It is the user's responsibility to securely store and manage these credentials. The library and its authors disclaim any responsibility or liability for lost keys, compromised tokens, or data resulting from mismanagement.

## Project Philosophy

This middleware follows key principles that promote security, auditability, and simplicity:

### 1. Single Responsibility
- **Authentication Only**: Handles only Nostr key-based authentication
- **No Business Logic**: Business rules, user tiers, and application logic belong in your API layer
- **Simple JWT**: Issues basic JWTs with minimal claims (npub, timestamp)

### 2. Security First
- **Open Source**: Fully auditable security-critical code
- **Transparent**: Clear, readable implementation
- **Focused Scope**: Does one thing well - Nostr authentication

### 3. Integration Ready
```plaintext
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nostr Auth     │ ◄── This Service
│   Service       │     Simple Auth Only
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App Platform   │ ◄── Your Business Logic
│     API         │     User Tiers
└─────────────────┘     Rate Limits
```

## Core Features

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
- [Getting Started](docs/getting-started.md) - Quick start guide
- [Authentication Flow](docs/authentication-flow.md) - Detailed authentication process
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions
- [API Documentation](docs/api.md) - API endpoints and usage
- [Security Guide](docs/security.md) - Security best practices and considerations
- [Automated Tests](docs/automated-tests.md) - Comprehensive test suite documentation

## Testing

The middleware includes comprehensive test coverage for all core functionality:

- ✅ Challenge Generation & Verification
- ✅ Profile Fetching
- ✅ Enrollment & Verification
- ✅ Error Handling
- ✅ Router Integration

Current test coverage: 94.8%

For detailed information about the test suite, please see our [Automated Tests Documentation](docs/automated-tests.md).

To run the tests:

```bash
npm test
```

For live testing with actual Nostr relays:

```bash
npm run test:live
```

For testing authentication flow:

```bash
npm run test:auth
```

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
