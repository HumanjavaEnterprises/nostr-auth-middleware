declare module 'nostr-crypto-utils' {
  export function generateKeyPair(): Promise<{ privateKey: string; publicKey: string }>;
  export function getPublicKey(privateKey: string): Promise<{ hex: string; bytes: Uint8Array }>;
  export function getPublicKeySync(privateKey: string): string;
  export function calculateEventId(event: any): string;
  export function createEvent(event: Partial<any>): any;
  export function signEvent(event: any, privateKey: string): Promise<any>;
  export function finalizeEvent(event: Partial<any>, privateKey: string): Promise<any>;
  export function verifySignature(event: any): Promise<boolean>;
}
