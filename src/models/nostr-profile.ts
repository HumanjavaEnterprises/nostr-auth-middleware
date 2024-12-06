export interface NostrProfile {
  pubkey: string;
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  created_at: number;
  updated_at: number;
}
