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
  trustedProxies?: string[];
  allowedIPs?: string[];
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
}

export interface NostrAuthConfig extends SecurityConfig {
  port?: number;
  nodeEnv?: string;
  corsOrigins?: string | string[];
  nostrRelays?: string[];
  privateKey?: string;
  publicKey?: string;
  keyManagementMode?: 'development' | 'production';
  supabaseUrl?: string;
  supabaseKey?: string;
  jwtSecret?: string;
  jwtExpiresIn?: string;
  testMode?: boolean;
  eventTimeoutMs?: number;
  challengePrefix?: string;
}
