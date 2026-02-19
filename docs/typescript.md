# TypeScript Guide

## Declaration Pattern

For browser-specific TypeScript declarations, this project follows a top-level pattern that avoids module augmentation blocks:

```typescript
// Define interfaces and types at top level
interface NostrAuthConfig {
  jwtSecret: string;
  expiresIn?: string;
}

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Declare classes at top level
declare class NostrAuthClient {
  constructor(config: NostrAuthConfig);
  getPublicKey(): Promise<string>;
  signChallenge(): Promise<NostrEvent>;
  validateSession(session: unknown): Promise<boolean>;
}

// Global augmentations after type definitions
declare global {
  interface Window {
    NostrAuthMiddleware: typeof NostrAuthClient;
  }
}

// Single export at the end
export = NostrAuthClient;
```

This pattern ensures better IDE support and cleaner type declarations.

## Type Imports

```typescript
import type {
  NostrAuthMiddleware,
  NostrAuthOptions,
  NostrBrowserAuth,
} from 'nostr-auth-middleware';
```

## Strict Mode

This project is built with TypeScript strict mode enabled. All parameters and return values have explicit types.

## NIP-07 Window Type

The library provides type definitions for the `window.nostr` interface used by browser extensions:

```typescript
interface WindowNostr {
  getPublicKey(): Promise<string>;
  signEvent(event: UnsignedEvent): Promise<SignedEvent>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

declare global {
  interface Window {
    nostr?: WindowNostr;
  }
}
```
