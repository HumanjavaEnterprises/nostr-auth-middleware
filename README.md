# Nostr Auth Middleware

A focused, security-first authentication middleware for Nostr applications.

## Requirements

- Node.js ≥18.0.0 (Active LTS versions only)
- npm ≥7.0.0

## Installation

```bash
npm install nostr-auth-middleware
```

**Important Security Notice**

This library handles cryptographic keys and authentication tokens that are critical for securing your Nostr application and user data. Any private keys (`nsec`) or authentication tokens must be stored and managed with the utmost security and care.

Developers using this middleware must inform their users about the critical nature of managing private keys and tokens. It is the user's responsibility to securely store and manage these credentials. The library and its authors disclaim any responsibility or liability for lost keys, compromised tokens, or data resulting from mismanagement.

## Usage

### ESM (Recommended)
```javascript
import { NostrAuthMiddleware } from 'nostr-auth-middleware';
```

### CommonJS
```javascript
const { NostrAuthMiddleware } = require('nostr-auth-middleware');
```

### Browser
```html
<script src="dist/browser/nostr-auth-middleware.min.js"></script>
<script>
  const auth = new NostrAuthMiddleware.NostrBrowserAuth();
</script>
```

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
```
+---------------+
|  Client App  |
+-------+-------+
        |
        v
+---------------+
| Nostr Auth    | <-- This Service
|  Service      |     Simple Auth Only
+-------+-------+
        |
        v
+---------------+
| App Platform  | <-- Your Business Logic
|    API        |     User Tiers
+---------------+     Rate Limits
```

## Core Features

- Authentication: NIP-07 Compatible Authentication
- Enrollment: Secure User Enrollment with Nostr
- Validation: Comprehensive Event Validation
- Cryptography: Advanced Cryptographic Operations
- Data Persistence: Supabase Integration for Data Persistence
- Session Management: JWT-based Session Management
- Profile Management: Profile Management & Synchronization
- Logging and Monitoring: Detailed Logging and Monitoring
- Key Management: Automatic Key Management
- Deployment: Environment-Aware Deployment
- Modes: Development & Production Modes
- Directory Management: Automated Directory Management

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
- [TypeScript Guide](docs/typescript.md) - TypeScript declaration patterns and best practices
- [Browser Authentication](docs/browser-authentication.md) - Browser-based authentication flow

### TypeScript Declaration Pattern

For browser-specific TypeScript declarations, we follow a top-level pattern that avoids module augmentation blocks:

```typescript
// Define interfaces and types at top level
interface NostrAuthConfig { ... }
interface NostrEvent { ... }

// Declare classes at top level
declare class NostrAuthClient { ... }

// Global augmentations after type definitions
declare global {
  interface Window {
    NostrAuthMiddleware: typeof NostrAuthClient;
  }
}

// Single export at the end
export = NostrAuthClient;
```

This pattern ensures better IDE support and cleaner type declarations. For more details, see our [TypeScript Guide](docs/typescript.md).

## Browser Authentication

For client-side applications, we provide a lightweight browser-based authentication flow using NIP-07. This implementation works directly with Nostr browser extensions like nos2x or Alby.

### Example Usage

```typescript
// Browser
const auth = new NostrAuthMiddleware.NostrBrowserAuth({
  customKind: 22242,  // Optional: custom event kind
  timeout: 30000      // Optional: timeout in milliseconds
});

// Get user's public key
const publicKey = await auth.getPublicKey();

// Sign a challenge
const challenge = await auth.signChallenge();

// Verify a session
const isValid = await auth.validateSession(session);
```

## Development Mode

Features enabled in development mode:
- Hot-reloading enabled
- Detailed logging
- No root permissions required

## Production Mode

Additional features in production mode:
- Enhanced security checks
- Performance optimizations
- Minimal logging
- Production-ready JWT configuration

## Contributing

Please see our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security issues, please see our [Security Policy](SECURITY.md) and report any vulnerabilities responsibly.
