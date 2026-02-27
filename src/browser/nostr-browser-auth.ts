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
  /** Server URL for fetching challenges (e.g., 'https://auth.example.com') */
  serverUrl?: string;
}

export class NostrBrowserAuth {
  private readonly kind: number;
  private readonly timeout: number;
  private readonly challengeTemplate: string;
  private readonly serverUrl: string;

  constructor(config?: NostrBrowserConfig) {
    this.kind = config?.customKind || 22242;
    this.timeout = config?.timeout || 30000;
    this.challengeTemplate = config?.challengeTemplate || 'Sign this message to authenticate: %challenge%';
    this.serverUrl = config?.serverUrl || '';
  }

  /**
   * Fetches a challenge from the server for authentication
   * @param {string} pubkey - The public key to request a challenge for
   * @returns {Promise<{challenge: string, timestamp: number}>}
   * @throws {Error} When the server URL is not configured or the request fails
   */
  async createChallenge(pubkey: string): Promise<{ challenge: string; timestamp: number }> {
    if (!this.serverUrl) {
      throw new Error('Server URL is required to fetch challenges. Set serverUrl in NostrBrowserConfig.');
    }

    const response = await fetch(`${this.serverUrl}/challenge/${pubkey}`);
    if (!response.ok) {
      throw new Error('Failed to get challenge from server');
    }

    const data = await response.json();
    const timestamp = Math.floor(Date.now() / 1000);
    return { challenge: data.challenge, timestamp };
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
      
      // Step 2: Fetch a challenge from the server
      const { challenge, timestamp } = await this.createChallenge(pubkey);
      
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
