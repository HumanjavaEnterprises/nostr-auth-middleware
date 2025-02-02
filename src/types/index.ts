/**
 * @fileoverview Core type definitions for Nostr authentication middleware
 * Exports interfaces for challenges, enrollments, profiles, and configuration
 * @module nostr-types
 */

import { NostrEvent } from '../interfaces/nostr.interface.js';

export { NostrEvent };

/**
 * Interface representing a Nostr authentication challenge
 * @interface NostrChallenge
 */
export interface NostrChallenge {
  /** Unique identifier for the challenge */
  id: string;
  /** Public key of the user being challenged */
  pubkey: string;
  /** Challenge string to be signed */
  challenge: string;
  /** Associated Nostr event */
  event: NostrEvent;
  /** Unix timestamp when the challenge was created */
  created_at: number;
  /** Unix timestamp when the challenge expires */
  expires_at: number;
}

/**
 * Interface representing a user's enrollment status
 * @interface NostrEnrollment
 */
export interface NostrEnrollment {
  /** Public key of the enrolled user */
  pubkey: string;
  /** Associated Nostr event that triggered enrollment */
  event: NostrEvent;
  /** Unix timestamp when the enrollment was created */
  createdAt: number;
  /** Unix timestamp when the enrollment expires */
  expiresAt: number;
  /** ISO timestamp when the user was enrolled */
  enrolled_at: string;
}

/**
 * Interface representing a user's Nostr profile with enrollment data
 * @interface NostrProfile
 * @extends {import('../models/nostr-profile').NostrProfile}
 */
export interface NostrProfile {
  /** Public key of the profile owner */
  pubkey: string;
  /** Display name of the user */
  name?: string;
  /** User's bio or description */
  about?: string;
  /** URL to the user's profile picture */
  picture?: string;
  /** ISO timestamp when the user was enrolled */
  enrolled_at?: string;
}

/**
 * Interface representing the result of a verification operation
 * @interface VerificationResult
 */
export interface VerificationResult {
  /** Whether the verification was successful */
  success: boolean;
  /** Error message if verification failed */
  error?: string;
  /** Additional message about the verification */
  message?: string;
  /** User's profile if verification succeeded */
  profile?: NostrProfile;
  /** JWT token if verification succeeded */
  token?: string;
  /** Public key of the verified user */
  pubkey?: string;
}

/**
 * Interface for security-related configuration
 * @interface SecurityConfig
 */
export interface SecurityConfig {
  /** List of valid API keys */
  apiKeys?: string[];
  /** List of trusted proxy IPs or boolean to trust all proxies */
  trustedProxies?: string[] | boolean;
  /** List of allowed IP addresses */
  allowedIPs?: string[];
  /** Rate limit window in milliseconds */
  rateLimitWindowMs?: number;
  /** Maximum requests allowed within the rate limit window */
  rateLimitMaxRequests?: number;
}

/**
 * Interface for Nostr authentication configuration
 * @interface NostrAuthConfig
 * @extends SecurityConfig
 */
export interface NostrAuthConfig extends SecurityConfig {
  /** Server port number */
  port: number;
  /** Node environment (development/production) */
  nodeEnv?: string;
  /** CORS allowed origins */
  corsOrigins?: string[] | "*";
  
  /** List of Nostr relay URLs */
  nostrRelays?: string[];
  /** Server's private key for signing */
  privateKey?: string;
  /** Server's public key */
  publicKey?: string;
  /** Key management mode for different environments */
  keyManagementMode: 'development' | 'production';
  /** Timeout for Nostr events in milliseconds */
  eventTimeoutMs?: number;
  /** Prefix for challenge strings */
  challengePrefix?: string;
  
  /** Supabase URL for key management */
  supabaseUrl?: string;
  /** Supabase API key */
  supabaseKey?: string;
  
  /** Secret for JWT signing */
  jwtSecret?: string;
  /** JWT expiration time */
  jwtExpiresIn?: string;
  /** Enable test mode */
  testMode?: boolean;
}

/**
 * Interface combining Nostr auth config with security config
 * @interface NostrConfig
 * @extends NostrAuthConfig
 */
export interface NostrConfig extends NostrAuthConfig {
  /** Additional security configuration */
  security?: SecurityConfig;
}
