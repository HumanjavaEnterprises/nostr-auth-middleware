import { NostrEvent } from '../utils/types.js';

export interface NostrChallenge {
  id: string;
  event: NostrEvent;
  expiresAt: number;
}

export interface NostrEnrollment {
  pubkey: string;
  event: NostrEvent;
  createdAt: number;
  expiresAt: number;
  enrolled_at: string;
}

export interface NostrProfile {
  pubkey: string;
  name?: string;
  about?: string;
  picture?: string;
  enrolled_at?: string;
}

export interface VerificationResult {
  success: boolean;
  message?: string;
  profile?: NostrProfile;
  token?: string;
}

export interface SecurityConfig {
  apiKeys?: string[];
  trustedProxies?: string[] | boolean;
  allowedIPs?: string[];
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
}

export interface NostrAuthConfig extends SecurityConfig {
  // Server config
  port: number;
  nodeEnv?: string;
  corsOrigins: string[] | "*";
  // Nostr config
  nostrRelays?: string[];
  privateKey?: string;
  publicKey?: string;
  keyManagementMode?: 'development' | 'production';
  // Supabase config
  supabaseUrl?: string;
  supabaseKey?: string;
  // Auth config
  jwtSecret?: string;
  jwtExpiresIn?: string;
  testMode?: boolean;
  // Optional configs
  eventTimeoutMs?: number;
  challengePrefix?: string;
}

export interface NostrConfig extends NostrAuthConfig {
  security?: SecurityConfig;
}
