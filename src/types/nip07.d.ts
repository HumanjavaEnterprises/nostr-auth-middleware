import { NostrEvent } from './index';

declare global {
  interface Window {
    nostr?: {
      /**
       * Get the user's public key after requesting permission
       * @returns Promise<string> - The user's public key in hex format
       */
      getPublicKey(): Promise<string>;
      
      /**
       * Request signature for an event
       * @param event - Unsigned event to be signed
       * @returns Promise<NostrEvent> - The signed event
       */
      signEvent(event: Partial<NostrEvent>): Promise<NostrEvent>;
      
      /**
       * Get relay list from extension
       * @returns Promise<string[]> - List of relay URLs
       */
      getRelays?(): Promise<string[]>;
      
      /**
       * Encrypt content using NIP-04
       * @param pubkey - Recipient's public key
       * @param content - Content to encrypt
       * @returns Promise<string> - Encrypted content
       */
      nip04?: {
        encrypt(pubkey: string, content: string): Promise<string>;
        decrypt(pubkey: string, content: string): Promise<string>;
      };
    };
  }
}

// This empty export is needed to make this a module
export {};
