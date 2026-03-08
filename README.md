# Nostr Auth Middleware

A focused, security-first authentication middleware for Nostr applications. Supports both NIP-07 (browser extension) and NIP-46 (remote signer / bunker) authentication flows.

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
import { NostrAuthMiddleware, Nip46SignerMiddleware } from 'nostr-auth-middleware';
```

### CommonJS
```javascript
const { NostrAuthMiddleware, Nip46SignerMiddleware } = require('nostr-auth-middleware');
```

### Browser
```html
<script src="dist/browser/nostr-auth-middleware.min.js"></script>
<script>
  // NIP-07 (browser extension)
  const auth = new NostrAuthMiddleware.NostrBrowserAuth();

  // NIP-46 (remote signer / bunker)
  const nip46 = new NostrAuthMiddleware.Nip46AuthHandler({
    bunkerUri: 'bunker://...?relay=wss://relay.example.com',
    serverUrl: 'https://auth.example.com'
  });
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
+------------------+     +------------------+
| Client App       |     | NIP-46 Bunker    |
| (NIP-07 ext or   |     | (Remote Signer)  |
|  NIP-46 bunker)  |     +--------+---------+
+--------+---------+              |
         |                        |
         v           kind 24133   v
+----------------------------------+
|        Nostr Auth Service        | <-- This Service
|  NIP-07 challenge/verify        |     Simple Auth Only
|  NIP-46 signer middleware        |
+----------------+-----------------+
                 |
                 v
+------------------+
|  App Platform    | <-- Your Business Logic
|      API         |     User Tiers
+------------------+     Rate Limits
```

## Core Features

- **NIP-07 Authentication**: Browser extension auth via `window.nostr` (nos2x, Alby, NostrKey, etc.)
- **NIP-46 Authentication**: Remote signer / bunker auth via encrypted kind 24133 events
- **NIP-46 Signer Middleware**: Express middleware to act as a NIP-46 signer (accept remote signing requests)
- **NIP-46 Client Handler**: Browser-side handler to authenticate via remote signers
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

## JWT Configuration & Usage

### Basic Setup
```javascript
const auth = new NostrAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,  // Required in production
  expiresIn: '24h'                    // Optional, defaults to '24h'
});
```

### Environment-Specific Behavior
- **Production**: JWT_SECRET is required. The middleware will throw an error if not provided
- **Development**: A default development-only secret is used if JWT_SECRET is not provided (not secure for production use)

### JWT Operations

#### Token Generation
```javascript
// Generate a JWT token with minimal claims
const token = await auth.generateToken({ pubkey });

// The generated token includes:
// - pubkey (npub)
// - iat (issued at timestamp)
// - exp (expiration timestamp)
```

#### Token Verification
```javascript
// Verify a JWT token
const isValid = await auth.verifyToken(token);
if (isValid) {
  // Token is valid, proceed with authentication
}
```

### Browser Compatibility

The middleware is fully compatible with modern browsers and works seamlessly with build tools like Vite, Webpack, and Rollup. When using in a browser environment:

1. **Import the Package**
```javascript
import { NostrAuthMiddleware } from 'nostr-auth-middleware';
```

2. **Initialize with Environment Variables**
```javascript
const auth = new NostrAuthMiddleware({
  jwtSecret: import.meta.env.VITE_JWT_SECRET,  // For Vite
  // or
  jwtSecret: process.env.REACT_APP_JWT_SECRET  // For Create React App
});
```

3. **Handle Browser-Specific Features**
- Automatically detects and uses browser's localStorage for session management
- Compatible with browser-based Nostr extensions (nos2x, Alby)
- Handles browser-specific cryptographic operations

### Security Best Practices

1. **JWT Secret Management**
   - Use a strong, unique secret for JWT signing
   - Never expose the JWT secret in client-side code
   - Rotate secrets periodically in production

2. **Token Storage**
   - Store tokens securely using browser's localStorage or sessionStorage
   - Clear tokens on logout
   - Implement token refresh mechanisms for long-lived sessions

3. **Environment Variables**
   - Use different JWT secrets for development and production
   - Configure appropriate token expiration times
   - Implement proper error handling for token validation

## Session Management

### Browser Session Verification
```javascript
// Verify if a user's session is still valid
const isValid = await auth.verifySession(userPubkey);
if (isValid) {
  console.log('Session is valid');
} else {
  console.log('Session is invalid or expired');
  // Handle logout
}
```

The session verification:
- Checks if the Nostr extension is still available
- Verifies the public key matches
- Handles disconnection gracefully
- Works in both browser and server environments

### Development Mode
When running in development mode, the middleware provides detailed logging:
```javascript
// Development mode logs
Cached Profile: { /* profile data */ }
Fresh Profile: { /* profile and event data */ }
Profile Cache Hit: { pubkey, cacheAge }
Profile Cache Expired: { pubkey, cacheAge }
Profile Cached: { pubkey, profile }
Profile Cache Cleared: { pubkey }
```

## Documentation

- [Getting Started](docs/getting-started.md) - Quick start guide
- [API Documentation](docs/api.md) - Full API reference (NIP-07 + NIP-46)
- [Authentication Flow](docs/authentication-flow.md) - NIP-07 and NIP-46 flow diagrams
- [Browser Authentication](docs/browser-authentication.md) - Client-side auth (NIP-07 + NIP-46)
- [Security Guide](docs/security.md) - Security best practices and key management
- [TypeScript Guide](docs/typescript.md) - TypeScript declaration patterns and best practices

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

## NIP-46 Remote Signer Authentication

For applications that authenticate users via NIP-46 bunkers (remote signers like NostrKey), instead of directly through browser extensions.

### Client Side (Browser)

```typescript
import { Nip46AuthHandler } from 'nostr-auth-middleware/browser';

const auth = new Nip46AuthHandler({
  bunkerUri: 'bunker://<remote-pubkey>?relay=wss://relay.example.com&secret=...',
  serverUrl: 'https://auth.example.com',
});

// Provide your own relay transport
auth.setTransport({
  sendEvent: async (event) => { /* publish to relay */ },
  subscribe: (filter, onEvent) => { /* subscribe and call onEvent */ return () => {}; },
});

await auth.connect();
const result = await auth.authenticate();
// result: { pubkey, signedEvent, sessionInfo, timestamp }
```

### Server Side (Express Signer Middleware)

```typescript
import { Nip46SignerMiddleware, createNip46Signer } from 'nostr-auth-middleware';

const signer = createNip46Signer(
  {
    signerSecretKey: process.env.SIGNER_SECRET_KEY,
    relays: ['wss://relay.example.com'],
    secret: 'optional-connection-secret',
  },
  {
    getPublicKey: () => myPubkey,
    signEvent: (eventJson) => JSON.stringify(signMyEvent(JSON.parse(eventJson))),
  }
);

app.use('/nip46', signer.getRouter());
// Routes: POST /nip46/request, GET /nip46/info, GET /nip46/bunker-uri
```

See the [Authentication Flow Guide](docs/authentication-flow.md) for detailed NIP-46 sequence diagrams.

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

### Dependency Vulnerability Status

We actively monitor and address security vulnerabilities in this codebase. **`npm audit --omit=dev` reports zero vulnerabilities** for this package — there are no known security issues in production dependencies.

Any remaining `npm audit` findings are in development-only tooling (eslint, typescript-eslint, vitest, etc.) and stem from transitive dependencies with no upstream fix available. These are devDependencies that are never included in the published package and pose no risk to consumers of this library. We monitor upstream fixes and update promptly when they become available.
