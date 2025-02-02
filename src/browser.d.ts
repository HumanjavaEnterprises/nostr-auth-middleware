export {};

interface NostrAuthConfig {
  keyManagementMode: 'development' | 'production';
  port?: number;
  nodeEnv?: string;
  corsOrigin?: string;
  corsCredentials?: boolean;
  eventTimeoutMs?: number;
}

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface NostrChallenge {
  id: string;
  challenge: string;
  created_at: number;
  expires_at: number;
  pubkey: string;
}

declare class NostrAuthClient {
  constructor(config: NostrAuthConfig);
  requestChallenge(): Promise<NostrChallenge>;
  verifyChallenge(event: NostrEvent): Promise<boolean>;
  enroll(event: NostrEvent): Promise<boolean>;
}

declare global {
  interface Window {
    NostrAuthMiddleware: typeof NostrAuthClient;
  }
}

export = NostrAuthClient;
