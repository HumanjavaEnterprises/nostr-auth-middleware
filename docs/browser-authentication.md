# Browser Authentication Guide

The browser authentication module provides a lightweight client-side authentication flow using NIP-07. This implementation is designed for web applications that need to authenticate users through their Nostr browser extensions (like nos2x or Alby).

## Features

- NIP-07 compliant authentication
- Challenge-response based security
- Session management
- TypeScript support
- Configurable event kinds and client names

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
