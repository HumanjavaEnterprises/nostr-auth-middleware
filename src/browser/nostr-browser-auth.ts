/**
 * Browser-specific Nostr authentication implementation
 * Provides a lightweight client-side authentication flow using NIP-07
 */

import type { NostrEvent } from '../types.js';

// NIP-07 type definitions
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: NostrEvent): Promise<NostrEvent>;
      getRelays?(): Promise<{ [url: string]: { read: boolean; write: boolean; } }>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}

export interface NostrBrowserConfig {
  customKind?: number;
  /** Custom challenge message template */
  challengeTemplate?: string;
  /** Timeout in milliseconds for getPublicKey and signEvent operations */
  timeout?: number;
}

export class NostrBrowserAuth {
  private readonly kind: number;
  private readonly timeout: number;
  private readonly challengeTemplate: string;

  constructor(config?: NostrBrowserConfig) {
    this.kind = config?.customKind || 22242;
    this.timeout = config?.timeout || 30000;
    this.challengeTemplate = config?.challengeTemplate || 'Sign this message to authenticate: %challenge%';
  }

  /**
   * Creates a challenge for authentication
   * @returns {Promise<{challenge: string, timestamp: number}>}
   */
  async createChallenge(): Promise<{ challenge: string; timestamp: number }> {
    const challenge = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    const timestamp = Math.floor(Date.now() / 1000);
    return { challenge, timestamp };
  }

  /**
   * Authenticates using NIP-07 window.nostr
   * This will trigger permission requests in the user's Nostr extension
   * @returns {Promise<{pubkey: string, timestamp: number, challenge: string, signedEvent: NostrEvent}>}
   * @throws {Error} When Nostr extension is not found or authentication fails
   */
  async authenticate(): Promise<{
    pubkey: string;
    timestamp: number;
    challenge: string;
    signedEvent: NostrEvent;
  }> {
    if (!window.nostr) {
      throw new Error('Nostr extension not found. Please install a Nostr extension like nos2x or Alby.');
    }

    try {
      // Step 1: Get public key and request read permission
      const pubkey = await window.nostr.getPublicKey();
      
      // Step 2: Create a challenge
      const { challenge, timestamp } = await this.createChallenge();
      
      // Step 3: Request signature permission by asking user to sign the challenge
      const event = {
        kind: this.kind,
        created_at: timestamp,
        content: this.challengeTemplate.replace('%challenge%', challenge),
        tags: [
          ['p', pubkey],
          ['challenge', challenge]
        ]
      } as NostrEvent;

      // This will trigger the extension's permission popup
      const signedEvent = await window.nostr.signEvent(event);
      
      return {
        pubkey,
        timestamp: Date.now(),
        challenge,
        signedEvent
      };
    } catch (error) {
      console.error('Nostr authentication failed:', error);
      throw error;
    }
  }

  /**
   * Validates a session by checking if the current public key matches
   * @param {object} session - Session object containing pubkey
   * @returns {Promise<boolean>}
   */
  async validateSession(session: { pubkey: string }): Promise<boolean> {
    if (!window.nostr || !session?.pubkey) {
      return false;
    }
    
    try {
      const currentPubkey = await window.nostr.getPublicKey();
      return currentPubkey === session.pubkey;
    } catch {
      return false;
    }
  }
}
