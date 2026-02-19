# API Reference

## NostrAuthMiddleware

The main class for Nostr authentication.

### Constructor

```typescript
new NostrAuthMiddleware(options: NostrAuthOptions)
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `jwtSecret` | `string` | — | Secret for JWT signing (required in production) |
| `expiresIn` | `string` | `'24h'` | JWT token expiration time |

### Methods

#### `generateToken(payload)`

Generates a JWT token with minimal claims.

```typescript
const token = await auth.generateToken({ pubkey: 'npub1...' });
```

**Returns:** `Promise<string>` — The signed JWT token containing `pubkey`, `iat`, and `exp` claims.

#### `verifyToken(token)`

Verifies a JWT token.

```typescript
const isValid = await auth.verifyToken(token);
```

**Returns:** `Promise<boolean>`

#### `verifySession(pubkey)`

Verifies if a user's session is still valid.

```typescript
const isValid = await auth.verifySession(userPubkey);
```

**Returns:** `Promise<boolean>`

#### `authenticate()`

Returns Express middleware that authenticates requests using Nostr.

```typescript
app.get('/protected', auth.authenticate(), handler);
```

## NostrBrowserAuth

Lightweight browser-based authentication using NIP-07.

### Constructor

```typescript
new NostrBrowserAuth(options?: BrowserAuthOptions)
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customKind` | `number` | `22242` | Custom event kind for auth |
| `timeout` | `number` | `30000` | Timeout in milliseconds |

### Methods

#### `getPublicKey()`

Gets the user's public key from their Nostr extension.

```typescript
const publicKey = await auth.getPublicKey();
```

#### `signChallenge()`

Signs an authentication challenge.

```typescript
const challenge = await auth.signChallenge();
```

#### `validateSession(session)`

Validates an existing session.

```typescript
const isValid = await auth.validateSession(session);
```
