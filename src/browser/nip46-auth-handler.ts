/**
 * Browser-specific NIP-46 authentication handler
 * Authenticates via a remote NIP-46 signer (bunker) instead of NIP-07 window.nostr
 * Transport-agnostic — consumer provides relay I/O via Nip46Transport interface
 */

import type { NostrEvent, Nip46AuthConfig, Nip46AuthResult } from '../types.js';
import {
  parseBunkerURI,
  createSession,
  getSessionInfo,
  connectRequest,
  getPublicKeyRequest,
  signEventRequest,
  pingRequest,
  wrapEvent,
  unwrapEvent,
  createResponseFilter,
  isResponse,
} from 'nostr-crypto-utils/nip46';
import type {
  Nip46Session,
  Nip46Response,
  SignedNostrEvent,
} from 'nostr-crypto-utils/nip46';

/**
 * Transport interface — consumer provides relay I/O
 * Two methods: send an event to relays, and subscribe to response events
 */
export interface Nip46Transport {
  /** Publish a signed kind 24133 event to relays */
  sendEvent(event: SignedNostrEvent): Promise<void>;
  /** Subscribe to kind 24133 events tagged to our ephemeral pubkey.
   *  Returns a cleanup function. Calls onEvent for each matching event. */
  subscribe(
    filter: { kinds: number[]; '#p': string[]; since?: number },
    onEvent: (event: SignedNostrEvent) => void
  ): () => void;
}

export class Nip46AuthHandler {
  private readonly kind: number;
  private readonly timeout: number;
  private readonly serverUrl: string;
  private readonly permissions?: string;

  private remotePubkey: string;
  private relays: string[];
  private secret?: string;
  private session: Nip46Session | null = null;
  private transport: Nip46Transport | null = null;
  private connected = false;

  constructor(config: Nip46AuthConfig) {
    this.kind = config.customKind || 22242;
    this.timeout = config.timeout || 30000;
    this.serverUrl = config.serverUrl || '';
    this.permissions = config.permissions;

    if (config.bunkerUri) {
      const parsed = parseBunkerURI(config.bunkerUri);
      this.remotePubkey = parsed.remotePubkey;
      this.relays = parsed.relays;
      this.secret = parsed.secret || config.secret;
    } else if (config.remotePubkey && config.relays?.length) {
      this.remotePubkey = config.remotePubkey;
      this.relays = config.relays;
      this.secret = config.secret;
    } else {
      throw new Error('Either bunkerUri or remotePubkey + relays must be provided');
    }
  }

  /**
   * Set the transport for relay communication
   */
  setTransport(transport: Nip46Transport): void {
    this.transport = transport;
  }

  /**
   * Connect to the remote signer — creates session, sends connect request, waits for ack
   */
  async connect(transport?: Nip46Transport): Promise<void> {
    if (transport) {
      this.transport = transport;
    }
    if (!this.transport) {
      throw new Error('Transport is required. Call setTransport() or pass transport to connect().');
    }

    this.session = createSession(this.remotePubkey);
    const request = connectRequest(this.remotePubkey, this.secret, this.permissions);

    const response = await this.sendAndWait(request.id, async () => {
      const event = await wrapEvent(request, this.session!, this.remotePubkey);
      await this.transport!.sendEvent(event);
    });

    if (response.error) {
      throw new Error(`Connect failed: ${response.error}`);
    }

    this.connected = true;
  }

  /**
   * Full authentication flow:
   * 1. Fetch challenge from server
   * 2. Ask remote signer to sign the challenge event
   * 3. Submit signed event to server for JWT
   */
  async authenticate(): Promise<Nip46AuthResult> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected. Call connect() first.');
    }

    // Step 1: Get remote signer's pubkey (this is the user's identity)
    const pubkeyRequest = getPublicKeyRequest();

    const pubkeyResponse = await this.sendAndWait(pubkeyRequest.id, async () => {
      const event = await wrapEvent(pubkeyRequest, this.session!, this.remotePubkey);
      await this.transport!.sendEvent(event);
    });

    if (pubkeyResponse.error || !pubkeyResponse.result) {
      throw new Error(`Failed to get public key: ${pubkeyResponse.error || 'no result'}`);
    }

    const pubkey = pubkeyResponse.result;

    // Step 2: Fetch challenge from server
    if (!this.serverUrl) {
      throw new Error('Server URL is required for authentication. Set serverUrl in config.');
    }

    const challengeRes = await fetch(`${this.serverUrl}/challenge/${pubkey}`);
    if (!challengeRes.ok) {
      throw new Error('Failed to get challenge from server');
    }
    const { challenge } = await challengeRes.json();

    // Step 3: Build challenge event and ask remote signer to sign it
    const timestamp = Math.floor(Date.now() / 1000);
    const unsignedEvent: NostrEvent = {
      kind: this.kind,
      created_at: timestamp,
      content: `Sign this message to authenticate: ${challenge}`,
      tags: [
        ['p', pubkey],
        ['challenge', challenge],
      ],
    };

    const signRequest = signEventRequest(JSON.stringify(unsignedEvent));
    const signResponse = await this.sendAndWait(signRequest.id, async () => {
      const event = await wrapEvent(signRequest, this.session!, this.remotePubkey);
      await this.transport!.sendEvent(event);
    });

    if (signResponse.error || !signResponse.result) {
      throw new Error(`Failed to sign event: ${signResponse.error || 'no result'}`);
    }

    const signedEvent = JSON.parse(signResponse.result) as NostrEvent;

    // Step 4: Submit to server for verification
    const verifyRes = await fetch(`${this.serverUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: signedEvent }),
    });

    if (!verifyRes.ok) {
      throw new Error('Server verification failed');
    }

    return {
      pubkey,
      signedEvent,
      sessionInfo: getSessionInfo(this.session),
      timestamp: Date.now(),
    };
  }

  /**
   * Validate session by pinging the remote signer
   */
  async validateSession(): Promise<boolean> {
    if (!this.session || !this.connected || !this.transport) {
      return false;
    }

    try {
      const request = pingRequest();
      const response = await this.sendAndWait(request.id, async () => {
        const event = await wrapEvent(request, this.session!, this.remotePubkey);
        await this.transport!.sendEvent(event);
      });
      return response.result === 'pong';
    } catch {
      return false;
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo(): { clientPubkey: string; remotePubkey: string } | null {
    if (!this.session) return null;
    return getSessionInfo(this.session);
  }

  /**
   * Destroy the session and clean up
   */
  destroy(): void {
    this.session = null;
    this.transport = null;
    this.connected = false;
  }

  /**
   * Send a wrapped event and wait for the matching response
   */
  private async sendAndWait(
    requestId: string,
    send: () => Promise<void>
  ): Promise<Nip46Response> {
    if (!this.session || !this.transport) {
      throw new Error('Session or transport not available');
    }

    return new Promise<Nip46Response>((resolve, reject) => {
      const filter = createResponseFilter(this.session!.clientPubkey);
      let cleanup: (() => void) | null = null;

      const timer = setTimeout(() => {
        cleanup?.();
        reject(new Error(`NIP-46 request timed out after ${this.timeout}ms`));
      }, this.timeout);

      cleanup = this.transport!.subscribe(filter, (event: SignedNostrEvent) => {
        try {
          const payload = unwrapEvent(event, this.session!);
          if (isResponse(payload) && payload.id === requestId) {
            clearTimeout(timer);
            cleanup?.();
            resolve(payload);
          }
        } catch {
          // Ignore events we can't decrypt (not for us)
        }
      });

      send().catch((err) => {
        clearTimeout(timer);
        cleanup?.();
        reject(err);
      });
    });
  }
}
