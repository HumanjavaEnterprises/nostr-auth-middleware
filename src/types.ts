/**
 * Core type definitions for Nostr authentication
 */

/**
 * Base Nostr event interface
 */
export interface NostrEvent {
  id?: string;
  pubkey?: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}

/**
 * Public key details interface
 */
export interface PublicKeyDetails {
  key: string;
  algorithm: string;
  format: string;
}

/**
 * Type for JWT expiration time format
 * @example
 * const expiresIn: JWTExpiresIn = '24h'; // 24 hours
 * const expiresIn: JWTExpiresIn = '30m'; // 30 minutes
 * const expiresIn: JWTExpiresIn = '7d';  // 7 days
 */
export type JWTExpiresIn = `${number}h` | `${number}m` | `${number}s` | `${number}d`;

/**
 * Configuration interface for Nostr authentication middleware
 */
export interface NostrAuthConfig {
  // Required properties
  jwtSecret: string;
  jwtExpiresIn: JWTExpiresIn;
  eventTimeoutMs: number;
  keyManagementMode: 'development' | 'production';

  // Optional properties with defaults
  port?: number;
  nodeEnv?: string;
  corsOrigin?: string;
  corsCredentials?: boolean;
  challengePrefix?: string;
  testMode?: boolean;
  logLevel?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  privateKey?: string;
  publicKey?: string | PublicKeyDetails;
  customKind?: number;
  jwtExpiry?: number;
  challengeTemplate?: string;
  timeout?: number;
}

/**
 * Challenge interface for Nostr authentication
 */
export interface NostrChallenge {
  id: string;
  pubkey: string;
  challenge: string;
  event?: NostrEvent;
  created_at: number;
  expires_at: number;
}

/**
 * Profile interface for Nostr users
 */
export interface NostrProfile {
  id: string;
  pubkey: string;
  name?: string;
  about?: string;
  picture?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Enrollment interface for Nostr users
 */
export interface NostrEnrollment {
  id: string;
  pubkey: string;
  profile: NostrProfile;
  challenge?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: number;
  updated_at: number;
}

/**
 * Result interface for verification operations
 */
export interface VerificationResult {
  success: boolean;
  error?: string;
  pubkey?: string;
  data?: Record<string, unknown>;
}
