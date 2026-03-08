# API Reference

This middleware supports two authentication protocols:
- **NIP-07** — Browser extension auth via `window.nostr` (existing)
- **NIP-46** — Remote signer / bunker auth via encrypted kind 24133 events (new in v0.5.0)

---

## NostrAuthMiddleware

The main class for NIP-07 Nostr authentication.

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

---

## Nip46SignerMiddleware

Express middleware that acts as a NIP-46 remote signer. Accepts incoming NIP-46 requests (kind 24133 events), dispatches them to consumer-provided handlers, and returns encrypted responses.

### Constructor

```typescript
new Nip46SignerMiddleware(config: Nip46SignerConfig, handlers: Nip46SignerHandlers)
```

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `signerSecretKey` | `string` | — | Signer's private key (hex). **Required.** |
| `signerPubkey` | `string` | derived | Signer's public key. Derived from secret key if omitted. |
| `relays` | `string[]` | — | Relay URLs for communication. **Required.** |
| `secret` | `string` | — | Expected connection secret for bunker:// URIs |
| `requireAuth` | `boolean` | `true` | Require connect handshake before other methods |
| `sessionTimeoutMs` | `number` | `3600000` | Session timeout (1 hour default) |

#### Handlers

```typescript
interface Nip46SignerHandlers {
  getPublicKey: () => string | Promise<string>;
  signEvent: (eventJson: string) => string | Promise<string>;
  nip04Encrypt?: (pubkey: string, plaintext: string) => string | Promise<string>;
  nip04Decrypt?: (pubkey: string, ciphertext: string) => string | Promise<string>;
  nip44Encrypt?: (pubkey: string, plaintext: string) => string | Promise<string>;
  nip44Decrypt?: (pubkey: string, ciphertext: string) => string | Promise<string>;
  getRelays?: () => string | Promise<string>;
}
```

### Routes

#### `POST /request`

Receives a kind 24133 event, decrypts the NIP-46 request, dispatches to the appropriate handler, and returns the encrypted response.

**Request body:** `{ event: SignedNostrEvent }`
**Response:** `{ event: SignedNostrEvent }` (encrypted NIP-46 response)

#### `GET /info`

Returns signer metadata.

**Response:**
```json
{
  "pubkey": "abc123...",
  "relays": ["wss://relay.example.com"],
  "supportedMethods": ["connect", "ping", "get_public_key", "sign_event", ...]
}
```

#### `GET /bunker-uri`

Returns a bunker:// URI for connecting to this signer.

**Response:** `{ "bunkerUri": "bunker://abc123...?relay=wss://..." }`

### Methods

#### `getRouter()`

Returns the Express router.

```typescript
app.use('/nip46', signer.getRouter());
```

#### `getRequestFilter(since?)`

Returns a Nostr filter for subscribing to incoming NIP-46 events.

```typescript
const filter = signer.getRequestFilter();
// { kinds: [24133], '#p': ['<signer-pubkey>'] }
```

#### `destroy()`

Cleans up the session cleanup interval and clears all tracked sessions.

### Factory Function

```typescript
import { createNip46Signer } from 'nostr-auth-middleware';

const signer = createNip46Signer(config, handlers);
app.use('/nip46', signer.getRouter());
```

---

## Nip46AuthHandler

Browser-side handler for authenticating via a NIP-46 remote signer (bunker). Transport-agnostic — you provide relay I/O via the `Nip46Transport` interface.

### Constructor

```typescript
new Nip46AuthHandler(config: Nip46AuthConfig)
```

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bunkerUri` | `string` | — | bunker:// URI (extracts remotePubkey, relays, secret) |
| `remotePubkey` | `string` | — | Remote signer's pubkey (alternative to bunkerUri) |
| `relays` | `string[]` | — | Relay URLs (required if not using bunkerUri) |
| `secret` | `string` | — | Connection secret |
| `customKind` | `number` | `22242` | Event kind for challenge events |
| `timeout` | `number` | `30000` | Timeout for remote signer responses (ms) |
| `serverUrl` | `string` | — | Server URL for challenge/verify endpoints |
| `permissions` | `string` | — | Requested permissions (comma-separated) |

### Transport Interface

You must provide a transport for relay communication:

```typescript
interface Nip46Transport {
  sendEvent(event: SignedNostrEvent): Promise<void>;
  subscribe(
    filter: { kinds: number[]; '#p': string[]; since?: number },
    onEvent: (event: SignedNostrEvent) => void
  ): () => void;  // returns cleanup function
}
```

### Methods

#### `connect(transport?)`

Connects to the remote signer. Creates an ephemeral session, sends a connect request, and waits for acknowledgment.

```typescript
await auth.connect(myTransport);
```

#### `setTransport(transport)`

Sets the transport without connecting.

```typescript
auth.setTransport(myTransport);
```

#### `authenticate()`

Full authentication flow: gets pubkey from remote signer, fetches challenge from server, asks signer to sign it, submits to server for verification.

```typescript
const result = await auth.authenticate();
// { pubkey, signedEvent, sessionInfo: { clientPubkey, remotePubkey }, timestamp }
```

**Returns:** `Promise<Nip46AuthResult>`

#### `validateSession()`

Pings the remote signer to check if the session is still alive.

```typescript
const isValid = await auth.validateSession();
```

**Returns:** `Promise<boolean>`

#### `getSessionInfo()`

Returns current session info or null if not connected.

```typescript
const info = auth.getSessionInfo();
// { clientPubkey, remotePubkey } or null
```

#### `destroy()`

Destroys the session and cleans up.

```typescript
auth.destroy();
```
