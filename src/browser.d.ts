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
 * Global augmentation to add Nostr Auth Middleware to the Window interface
 */
declare global {
  interface Window {
    /** Global access to the NostrAuthMiddleware client */
    NostrAuthMiddleware: typeof NostrAuthClient;
  }
}

export = NostrAuthClient;
