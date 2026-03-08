/**
 * @fileoverview Browser-specific TypeScript declarations for the Nostr Auth Middleware.
 * This file provides type definitions for browser-based implementations and global augmentations.
 * @packageDocumentation
 */

/**
 * Configuration options for the Nostr Auth Client
 * @interface NostrAuthConfig
 */
interface NostrAuthConfig {
  /** Mode for key management operations. Affects how keys are stored and managed */
  keyManagementMode: 'development' | 'production';
  /** Optional port number for the auth service */
  port?: number;
  /** Optional node environment setting */
  nodeEnv?: string;
  /** Optional CORS origin setting */
  corsOrigin?: string;
  /** Optional CORS credentials setting */
  corsCredentials?: boolean;
  /** Optional timeout in milliseconds for Nostr events */
  eventTimeoutMs?: number;
}

/**
 * Represents a Nostr event structure
 * @interface NostrEvent
 */
interface NostrEvent {
  /** Unique identifier of the event */
  id: string;
  /** Public key of the event creator */
  pubkey: string;
  /** Unix timestamp when the event was created */
  created_at: number;
  /** Event kind number as defined in NIPs */
  kind: number;
  /** Array of tags associated with the event */
  tags: string[][];
  /** Event content */
  content: string;
  /** Cryptographic signature of the event */
  sig: string;
}

/**
 * Represents a challenge issued by the auth service
 * @interface NostrChallenge
 */
interface NostrChallenge {
  /** Unique identifier for the challenge */
  id: string;
  /** The challenge string to be signed */
  challenge: string;
  /** Unix timestamp when the challenge was created */
  created_at: number;
  /** Unix timestamp when the challenge expires */
  expires_at: number;
  /** Public key associated with the challenge */
  pubkey: string;
}

/**
 * Client class for handling Nostr authentication
 * @class NostrAuthClient
 */
declare class NostrAuthClient {
  /**
   * Creates a new NostrAuthClient instance
   * @param {NostrAuthConfig} config - Configuration options for the client
   */
  constructor(config: NostrAuthConfig);

  /**
   * Requests a new challenge from the auth service
   * @returns {Promise<NostrChallenge>} A promise that resolves to the challenge
   */
  requestChallenge(): Promise<NostrChallenge>;

  /**
   * Verifies a signed challenge event
   * @param {NostrEvent} event - The signed event containing the challenge
   * @returns {Promise<boolean>} A promise that resolves to true if verification succeeds
   */
  verifyChallenge(event: NostrEvent): Promise<boolean>;

  /**
   * Enrolls a new user with the auth service
   * @param {NostrEvent} event - The enrollment event
   * @returns {Promise<boolean>} A promise that resolves to true if enrollment succeeds
   */
  enroll(event: NostrEvent): Promise<boolean>;
}

/**
 * Configuration for NIP-46 remote signer authentication
 * @interface Nip46AuthConfig
 */
interface Nip46AuthConfig {
  /** bunker:// URI (extracts remotePubkey, relays, secret) */
  bunkerUri?: string;
  /** Remote signer's public key (hex) — alternative to bunkerUri */
  remotePubkey?: string;
  /** Relay URLs for NIP-46 communication */
  relays?: string[];
  /** Connection secret */
  secret?: string;
  /** Custom kind for challenge events (default: 22242) */
  customKind?: number;
  /** Timeout in ms for remote signer responses (default: 30000) */
  timeout?: number;
  /** Server URL for challenge/verify endpoints */
  serverUrl?: string;
  /** Requested permissions (comma-separated) */
  permissions?: string;
}

/**
 * Result of NIP-46 authentication
 * @interface Nip46AuthResult
 */
interface Nip46AuthResult {
  /** Authenticated user's public key (hex) */
  pubkey: string;
  /** The signed challenge event */
  signedEvent: NostrEvent;
  /** Session info */
  sessionInfo: { clientPubkey: string; remotePubkey: string };
  /** Timestamp of authentication */
  timestamp: number;
}

/**
 * A signed kind 24133 Nostr event used for NIP-46 communication
 * @interface SignedNostrEvent
 */
interface SignedNostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/**
 * Transport interface for NIP-46 relay communication.
 * Consumer provides relay I/O — the handler doesn't own WebSocket connections.
 * @interface Nip46Transport
 */
interface Nip46Transport {
  /** Publish a signed kind 24133 event to relays */
  sendEvent(event: SignedNostrEvent): Promise<void>;
  /** Subscribe to kind 24133 events matching the filter. Returns a cleanup function. */
  subscribe(
    filter: { kinds: number[]; '#p': string[]; since?: number },
    onEvent: (event: SignedNostrEvent) => void
  ): () => void;
}

/**
 * Client for NIP-46 remote signer authentication.
 * Authenticates via a bunker instead of window.nostr (NIP-07).
 * @class Nip46AuthHandler
 */
declare class Nip46AuthHandler {
  /**
   * Creates a new Nip46AuthHandler instance
   * @param {Nip46AuthConfig} config - Configuration (bunkerUri or remotePubkey+relays required)
   */
  constructor(config: Nip46AuthConfig);

  /**
   * Set the transport for relay communication
   * @param {Nip46Transport} transport - Transport implementation
   */
  setTransport(transport: Nip46Transport): void;

  /**
   * Connect to the remote signer
   * @param {Nip46Transport} [transport] - Optional transport (alternative to setTransport)
   * @returns {Promise<void>}
   */
  connect(transport?: Nip46Transport): Promise<void>;

  /**
   * Full authentication flow via the remote signer
   * @returns {Promise<Nip46AuthResult>}
   */
  authenticate(): Promise<Nip46AuthResult>;

  /**
   * Validate session by pinging the remote signer
   * @returns {Promise<boolean>}
   */
  validateSession(): Promise<boolean>;

  /**
   * Get current session info
   * @returns {{ clientPubkey: string; remotePubkey: string } | null}
   */
  getSessionInfo(): { clientPubkey: string; remotePubkey: string } | null;

  /**
   * Destroy the session and clean up
   */
  destroy(): void;
}

/**
 * Global augmentation to add Nostr Auth Middleware to the Window interface
 */
declare global {
  interface Window {
    /** Global access to the NostrAuthMiddleware client */
    NostrAuthMiddleware: typeof NostrAuthClient;
  }
}

export = NostrAuthClient;
