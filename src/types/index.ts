import { NostrEvent } from '../interfaces/nostr.interface.js';

export { NostrEvent };

export interface NostrChallenge {
  id: string;
  pubkey: string;
  challenge: string;
  event: NostrEvent;
  created_at: number;
  expires_at: number;
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
  error?: string;
  message?: string;
  profile?: NostrProfile;
  token?: string;
  pubkey?: string;
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
  corsOrigins?: string[] | "*";
  
  // Nostr config
  nostrRelays?: string[];
  privateKey?: string;
  publicKey?: string;
  keyManagementMode: 'development' | 'production';
  eventTimeoutMs?: number;
  challengePrefix?: string;
  
  // Supabase config
  supabaseUrl?: string;
  supabaseKey?: string;
  
  // Auth config
  jwtSecret?: string;
  jwtExpiresIn?: string;
  testMode?: boolean;
}

export interface NostrConfig extends NostrAuthConfig {
  security?: SecurityConfig;
}
