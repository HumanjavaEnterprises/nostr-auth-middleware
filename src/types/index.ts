import { Event } from 'nostr-tools';

export interface NostrAuthConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string | string[];
  nostrRelays: string[];
  // Make these optional for test mode
  supabaseUrl?: string;
  supabaseKey?: string;
  jwtSecret?: string;
  testMode?: boolean;
  // Optional configs
  eventTimeoutMs?: number;
  challengePrefix?: string;
  privateKey?: string;  // Server's private key for signing events
}

export interface NostrChallenge {
  id: string;
  event: Event;
  expiresAt: number;
}

export interface NostrEnrollment {
  pubkey: string;
  verificationEvent: Event;
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

export interface NostrEvent extends Event {
  kind: number;
  created_at: number;
  content: string;
  tags: string[][];
  pubkey: string;
  id: string;
  sig: string;
}
