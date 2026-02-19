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

## Next Steps

- [API Documentation](api.md) — Full API reference
- [Security Guide](security.md) — Key management and security best practices
- [TypeScript Guide](typescript.md) — TypeScript patterns and declarations
