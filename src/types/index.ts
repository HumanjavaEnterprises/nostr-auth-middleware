import { NostrEvent } from '../utils/types.js';

export interface NostrAuthConfig {
  port: number;
  corsOrigins: string[] | "*";
  nostrRelays?: string[];
  nodeEnv?: string;
  privateKey?: string;
  publicKey?: string;
  keyManagementMode?: 'development' | 'production';
  supabaseUrl?: string;
  supabaseKey?: string;
  jwtSecret?: string;
  jwtExpiresIn?: string;
  testMode?: boolean;
  // Optional configs
  eventTimeoutMs?: number;
  challengePrefix?: string;
}

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
