export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface PublicKeyDetails {
  // Add properties for PublicKeyDetails type
}

export interface NostrAuthConfig {
  keyManagementMode: 'development' | 'production';
  port?: number;
  nodeEnv?: string;
  corsOrigin?: string;
  corsCredentials?: boolean;
  eventTimeoutMs?: number;
  challengePrefix?: string;
  testMode?: boolean;
  logLevel?: string;
  jwtSecret?: string;
  jwtExpiresIn?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  privateKey?: string;
  publicKey?: string | PublicKeyDetails;
}

export interface NostrChallenge {
  id: string;
  challenge: string;
  created_at: number;
  expires_at: number;
  pubkey: string;
}

export interface NostrProfile {
  id: string;
  pubkey: string;
  name?: string;
  about?: string;
  picture?: string;
  created_at: number;
  updated_at: number;
}

export interface NostrEnrollment {
  id: string;
  pubkey: string;
  profile: NostrProfile;
  challenge?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: number;
  updated_at: number;
}

export interface VerificationResult {
  success: boolean;
  error?: string;
  pubkey?: string;
  data?: any;
}
