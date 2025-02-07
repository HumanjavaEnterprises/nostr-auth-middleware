# Nostr Auth Middleware

A focused, security-first authentication middleware for Nostr applications.

**Important Security Notice**

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

### Usage

```javascript
import { NostrBrowserAuth } from '@humanjavaenterprises/nostr-auth-middleware';

// Create an instance with optional configuration
const auth = new NostrBrowserAuth({
  customKind: 22242, // Optional: custom event kind for authentication
  clientName: 'my-app' // Optional: client name for challenge generation
});

// Authenticate user
try {
  const result = await auth.authenticate();
  console.log('Authenticated:', result.pubkey);
  
  // Store the session
  localStorage.setItem('nostrSession', JSON.stringify({
    pubkey: result.pubkey,
    timestamp: result.timestamp
  }));
} catch (error) {
  console.error('Authentication failed:', error);
}

// Validate session
const session = JSON.parse(localStorage.getItem('nostrSession'));
const isValid = await auth.validateSession(session);
```

The browser authentication flow:
1. Requests read permission to get the user's public key
2. Creates a unique challenge
3. Requests write permission to sign the challenge
4. Returns the signed event and session information

This provides a secure authentication method that:
- Proves ownership of the private key through signature
- Uses unique challenges to prevent replay attacks
- Includes timestamps for additional security
- Uses a custom event kind for authentication

## Quick Start Guide

Add Nostr authentication to your web app in minutes!

### 1. Installation

```bash
npm install @humanjavaenterprises/nostr-auth-middleware
```

### 2. Client-Side Setup (React Example)

```typescript
import { NostrBrowserAuth } from '@humanjavaenterprises/nostr-auth-middleware/browser';

function LoginButton() {
  const auth = new NostrBrowserAuth();
  
  const handleLogin = async () => {
    try {
      // Check if Nostr extension is available
      if (!window.nostr) {
        alert('Please install a Nostr extension (like nos2x or Alby)');
        return;
      }

      // Get user's public key (requires read permission)
      const pubkey = await window.nostr.getPublicKey();
      
      // Create authentication challenge
      const { challenge, timestamp } = await auth.createChallenge();
      
      // Request signature (requires write permission)
      const event = await auth.signChallenge(challenge, pubkey, timestamp);
      
      // Send to your backend
      const response = await fetch('/api/auth/nostr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });
      
      const { token } = await response.json();
      
      // Store JWT token
      localStorage.setItem('auth_token', token);
      
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button onClick={handleLogin}>
      Login with Nostr
    </button>
  );
}
```

### 3. Server-Side Setup (Express Example)

```typescript
import express from 'express';
import { NostrAuthMiddleware } from '@humanjavaenterprises/nostr-auth-middleware';

const app = express();
app.use(express.json());

// Initialize middleware with your JWT secret
const nostrAuth = new NostrAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key'
});

// Login endpoint
app.post('/api/auth/nostr', async (req, res) => {
  try {
    const { event } = req.body;
    
    // Validate the Nostr event and generate JWT
    const token = await nostrAuth.authenticate(event);
    
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Protected route example
app.get('/api/protected', nostrAuth.requireAuth(), (req, res) => {
  // req.user.npub contains the user's public key
  res.json({ message: `Hello ${req.user.npub}!` });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 4. That's it! 

Your app now has:
- :zap: One-click Nostr login
- :lock: Secure challenge-response authentication
- :key: Proper permission handling
- :shield: JWT-based session management

### Advanced Features

For more advanced use cases, you can:

1. **Customize the Challenge Format**
```typescript
const auth = new NostrBrowserAuth({
  clientName: 'my-app',  // Custom prefix for challenges
  customKind: 22242      // Custom event kind
});
```

2. **Add Rate Limiting**
```typescript
const nostrAuth = new NostrAuthMiddleware({
  jwtSecret: 'your-secret-key',
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                   // limit each IP to 100 requests per windowMs
  }
});
```

3. **Custom JWT Configuration**
```typescript
const nostrAuth = new NostrAuthMiddleware({
  jwtSecret: 'your-secret-key',
  jwtOptions: {
    expiresIn: '7d',          // Token expires in 7 days
    issuer: 'my-app'          // Custom issuer
  }
});
```

For more detailed examples and configuration options, see our [documentation](/docs).

## Testing

The middleware includes comprehensive test coverage for all core functionality:

- Challenge Generation & Verification
- Profile Fetching
- Enrollment & Verification
- Error Handling
- Router Integration

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
