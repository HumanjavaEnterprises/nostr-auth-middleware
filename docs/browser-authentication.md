# Browser Authentication Guide

The browser authentication module provides lightweight client-side authentication flows for web applications. Two protocols are supported:

- **NIP-07** (`NostrBrowserAuth`) — authenticates via browser extensions like nos2x, Alby, or NostrKey
- **NIP-46** (`Nip46AuthHandler`) — authenticates via remote signers (bunkers) over relays

## Features

- NIP-07 compliant authentication via `window.nostr`
- NIP-46 remote signer authentication via kind 24133 events
- Transport-agnostic NIP-46 — you provide relay I/O
- Challenge-response based security
- Session management
- TypeScript support
- Configurable event kinds and timeouts

## Installation

```bash
npm install @humanjavaenterprises/nostr-auth-middleware
```

## Basic Usage

```javascript
import { NostrBrowserAuth } from '@humanjavaenterprises/nostr-auth-middleware';

const auth = new NostrBrowserAuth();

// Authenticate user
async function login() {
  try {
    const result = await auth.authenticate();
    console.log('Authenticated as:', result.pubkey);
    return result;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

## Configuration

The `NostrBrowserAuth` constructor accepts an optional configuration object:

```javascript
const auth = new NostrBrowserAuth({
  customKind: 22242,     // Custom event kind for authentication (default: 22242)
  clientName: 'my-app'   // Client name for challenge generation (default: 'nostr-auth')
});
```

## Authentication Flow

1. **Public Key Request**
   - Calls `window.nostr.getPublicKey()`
   - Triggers the extension's permission popup for read access
   - Returns the user's public key

2. **Challenge Creation**
   - Generates a unique challenge string
   - Includes timestamp and client name
   - Prevents replay attacks

3. **Challenge Signing**
   - Creates a Nostr event with the challenge
   - Requests the user to sign it via their extension
   - Triggers the extension's permission popup for write access

4. **Session Management**
   - Returns authentication result with pubkey and signed event
   - Provides session validation method

## Session Management

```javascript
// Store session after authentication
const session = {
  pubkey: result.pubkey,
  timestamp: result.timestamp
};
localStorage.setItem('nostrSession', JSON.stringify(session));

// Validate session later
const isValid = await auth.validateSession(session);
```

## Error Handling

The authentication process may throw errors in these cases:
- Nostr extension not found
- User denied permissions
- Network errors
- Invalid signatures

Example error handling:

```javascript
try {
  await auth.authenticate();
} catch (error) {
  if (error.message.includes('extension not found')) {
    // Prompt user to install a Nostr extension
  } else if (error.message.includes('denied')) {
    // Handle permission denial
  } else {
    // Handle other errors
  }
}
```

## Security Considerations

1. **Challenge Uniqueness**
   - Each authentication attempt uses a unique challenge
   - Includes timestamps to prevent replay attacks
   - Uses client-specific prefixes

2. **Permission Scoping**
   - Read permission: Only requests public key access
   - Write permission: Only requests event signing for authentication
   - No additional permissions requested

3. **Session Validation**
   - Validates current public key matches session
   - Checks for extension availability
   - Safe error handling

## TypeScript Support

The module includes full TypeScript definitions:

```typescript
interface NostrBrowserConfig {
  customKind?: number;
  clientName?: string;
}

interface AuthResult {
  pubkey: string;
  timestamp: number;
  challenge: string;
  signedEvent: NostrEvent;
}
```

## Examples

### Complete Authentication Flow

```javascript
import { NostrBrowserAuth } from '@humanjavaenterprises/nostr-auth-middleware';

class AuthService {
  constructor() {
    this.auth = new NostrBrowserAuth({
      clientName: 'my-app'
    });
    this.currentUser = null;
  }

  async login() {
    try {
      const result = await this.auth.authenticate();
      this.currentUser = {
        pubkey: result.pubkey,
        timestamp: result.timestamp
      };
      this.saveSession();
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async validateAndRestoreSession() {
    const savedSession = localStorage.getItem('nostrSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const isValid = await this.auth.validateSession(session);
        if (isValid) {
          this.currentUser = session;
          return true;
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      }
    }
    return false;
  }

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem('nostrSession', JSON.stringify(this.currentUser));
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('nostrSession');
  }
}
```

### Vue.js Integration Example

```javascript
// auth.js
import { NostrBrowserAuth } from '@humanjavaenterprises/nostr-auth-middleware';

export const auth = new NostrBrowserAuth({
  clientName: 'vue-app'
});

// App.vue
<template>
  <div>
    <button v-if="!isAuthenticated" @click="login">Login with Nostr</button>
    <div v-else>
      <p>Welcome, {{ pubkey }}</p>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script>
import { auth } from './auth';

export default {
  data() {
    return {
      isAuthenticated: false,
      pubkey: null
    }
  },
  methods: {
    async login() {
      try {
        const result = await auth.authenticate();
        this.pubkey = result.pubkey;
        this.isAuthenticated = true;
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    logout() {
      this.isAuthenticated = false;
      this.pubkey = null;
    }
  }
}
</script>
```

---

## NIP-46 Remote Signer Authentication

For apps that authenticate users via NIP-46 bunkers (remote signers) instead of browser extensions. This is useful when:

- The user's keys are managed by a separate app (e.g., NostrKey browser plugin acting as a bunker)
- You need to support mobile or cross-device authentication
- The signing app runs in a different context than the web app

### Installation

```bash
npm install nostr-auth-middleware
```

### Basic Usage

```typescript
import { Nip46AuthHandler } from 'nostr-auth-middleware/browser';

const auth = new Nip46AuthHandler({
  bunkerUri: 'bunker://<remote-pubkey>?relay=wss://relay.example.com&secret=mysecret',
  serverUrl: 'https://auth.example.com',
});
```

### Transport Interface

NIP-46 requires relay communication. You provide the transport — the handler doesn't own any WebSocket connections. This keeps it compatible with any relay library.

```typescript
interface Nip46Transport {
  /** Publish a signed kind 24133 event to relays */
  sendEvent(event: SignedNostrEvent): Promise<void>;
  /** Subscribe to events matching a filter. Returns a cleanup function. */
  subscribe(
    filter: { kinds: number[]; '#p': string[]; since?: number },
    onEvent: (event: SignedNostrEvent) => void
  ): () => void;
}
```

Example with a hypothetical relay library:

```typescript
auth.setTransport({
  sendEvent: async (event) => {
    await pool.publish(['wss://relay.example.com'], event);
  },
  subscribe: (filter, onEvent) => {
    const sub = pool.subscribe(['wss://relay.example.com'], [filter]);
    sub.on('event', onEvent);
    return () => sub.close();
  },
});
```

### Configuration

```typescript
const auth = new Nip46AuthHandler({
  // Option 1: bunker:// URI (recommended)
  bunkerUri: 'bunker://<hex-pubkey>?relay=wss://relay.example.com&secret=...',

  // Option 2: direct config
  remotePubkey: '<hex-pubkey>',
  relays: ['wss://relay.example.com'],
  secret: 'connection-secret',

  // Common options
  serverUrl: 'https://auth.example.com',  // Required for authenticate()
  timeout: 30000,       // Remote signer response timeout (ms)
  customKind: 22242,    // Event kind for challenge events
  permissions: 'sign_event,get_public_key',  // Requested permissions
});
```

### Authentication Flow

1. **Connect** — Creates an ephemeral keypair, sends a `connect` request to the bunker, waits for `ack`
2. **Get Public Key** — Asks the bunker for the user's identity pubkey
3. **Fetch Challenge** — Requests a challenge from your auth server
4. **Sign Challenge** — Asks the bunker to sign the challenge event
5. **Verify** — Submits the signed event to your auth server for JWT

```typescript
// Full flow
auth.setTransport(myTransport);
await auth.connect();
const result = await auth.authenticate();
// result: { pubkey, signedEvent, sessionInfo, timestamp }
```

### Session Management

```typescript
// Check if the remote signer is still reachable
const isAlive = await auth.validateSession();

// Get session info
const info = auth.getSessionInfo();
// { clientPubkey: '...', remotePubkey: '...' } or null

// Clean up
auth.destroy();
```

### Error Handling

```typescript
try {
  await auth.connect(transport);
  const result = await auth.authenticate();
} catch (error) {
  if (error.message.includes('timed out')) {
    // Remote signer didn't respond within timeout
  } else if (error.message.includes('Connect failed')) {
    // Bunker rejected the connection (bad secret, etc.)
  } else if (error.message.includes('Transport is required')) {
    // Forgot to set transport before connecting
  } else if (error.message.includes('Not connected')) {
    // Called authenticate() before connect()
  }
}
```

### Choosing Between NIP-07 and NIP-46

| | NIP-07 (`NostrBrowserAuth`) | NIP-46 (`Nip46AuthHandler`) |
|---|---|---|
| **How it works** | Calls `window.nostr` directly | Sends encrypted messages via relays |
| **User experience** | Extension popup for each action | Approve in remote signer app |
| **Key location** | In the browser extension | In the bunker (can be anywhere) |
| **Cross-device** | No — same browser only | Yes — any device with relay access |
| **Transport** | None needed | You provide relay I/O |
| **Best for** | Simple web apps | Apps needing remote/mobile signing |

### React Example with NIP-46

```typescript
import { Nip46AuthHandler } from 'nostr-auth-middleware/browser';
import { useState } from 'react';

function BunkerLogin({ bunkerUri, serverUrl, transport }) {
  const [pubkey, setPubkey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function login() {
    setLoading(true);
    setError(null);
    try {
      const auth = new Nip46AuthHandler({ bunkerUri, serverUrl });
      auth.setTransport(transport);
      await auth.connect();
      const result = await auth.authenticate();
      setPubkey(result.pubkey);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (pubkey) return <p>Authenticated: {pubkey.slice(0, 12)}...</p>;

  return (
    <div>
      <button onClick={login} disabled={loading}>
        {loading ? 'Connecting to bunker...' : 'Login with NIP-46'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```
