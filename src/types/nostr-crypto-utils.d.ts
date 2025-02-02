declare module 'nostr-crypto-utils' {
  export function generateKeyPair(): { privateKey: string; publicKey: string };
  export function getPublicKey(privateKey: string): Promise<string>;
  export function calculateEventId(event: any): string;
  export function signEvent(event: any, privateKey: string): Promise<any>;
  export function verifySignature(event: any): Promise<boolean>;
}
