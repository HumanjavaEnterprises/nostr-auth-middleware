# Getting Started

## Prerequisites

- Node.js >= 18.0.0
- npm >= 7.0.0

## Installation

```bash
npm install nostr-auth-middleware
```

## Basic Setup

### ESM (Recommended)

```typescript
import { NostrAuthMiddleware } from 'nostr-auth-middleware';

const auth = new NostrAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,
  expiresIn: '24h',
});
```

### CommonJS

```javascript
const { NostrAuthMiddleware } = require('nostr-auth-middleware');

const auth = new NostrAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,
  expiresIn: '24h',
});
```

## Express Integration

```typescript
import express from 'express';
import { NostrAuthMiddleware } from 'nostr-auth-middleware';

const app = express();
app.use(express.json());

const auth = new NostrAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,
});

// Protect routes with Nostr authentication
app.get('/protected', auth.authenticate(), (req, res) => {
  res.json({ message: 'Authenticated!', pubkey: req.pubkey });
});

app.listen(3000);
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Production | Secret key for signing JWTs |
| `NODE_ENV` | No | Set to `production` for production mode |

In development mode, a default secret is used if `JWT_SECRET` is not provided. **Never use the default secret in production.**

## NIP-46 Setup (Remote Signer)

If your users authenticate via NIP-46 bunkers instead of browser extensions:

### Client Side (Browser)

```typescript
import { Nip46AuthHandler } from 'nostr-auth-middleware/browser';

const auth = new Nip46AuthHandler({
  bunkerUri: 'bunker://<pubkey>?relay=wss://relay.example.com',
  serverUrl: 'https://auth.example.com',
});

// You provide the relay transport
auth.setTransport({
  sendEvent: async (event) => { /* publish to relay */ },
  subscribe: (filter, onEvent) => { /* subscribe */ return () => {}; },
});

await auth.connect();
const result = await auth.authenticate();
```

### Server Side (Express Signer)

```typescript
import express from 'express';
import { createNip46Signer } from 'nostr-auth-middleware';

const app = express();
app.use(express.json());

const signer = createNip46Signer(
  {
    signerSecretKey: process.env.SIGNER_SECRET_KEY,
    relays: ['wss://relay.example.com'],
  },
  {
    getPublicKey: () => process.env.SIGNER_PUBLIC_KEY,
    signEvent: (eventJson) => { /* sign and return */ },
  }
);

app.use('/nip46', signer.getRouter());
app.listen(3000);
```

## Next Steps

- [API Documentation](api.md) — Full API reference (NIP-07 + NIP-46)
- [Authentication Flow](authentication-flow.md) — Sequence diagrams for both protocols
- [Browser Authentication](browser-authentication.md) — Client-side auth guide
- [Security Guide](security.md) — Key management and security best practices
- [TypeScript Guide](typescript.md) — TypeScript patterns and declarations
