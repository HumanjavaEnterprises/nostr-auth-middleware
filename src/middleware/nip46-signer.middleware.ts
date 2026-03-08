/**
 * Express middleware for NIP-46 remote signing
 * Accepts incoming NIP-46 requests, dispatches to consumer-provided handlers,
 * and returns encrypted responses.
 */

import { Request, Response, NextFunction, Router } from 'express';
import type { Nip46SignerConfig } from '../types.js';
import { createLogger } from '../utils/logger.js';
import {
  unwrapRequest,
  wrapResponse,
  handleSignerRequest,
  createBunkerURI,
  createRequestFilter,
} from 'nostr-crypto-utils/nip46';
import type {
  Nip46SignerHandlers,
  Nip46HandleOptions,
  SignedNostrEvent,
} from 'nostr-crypto-utils/nip46';

// Re-export for consumer convenience
export type { Nip46SignerHandlers };

const logger = createLogger('Nip46SignerMiddleware');

const DEFAULT_SESSION_TIMEOUT_MS = 3600000; // 1 hour

export class Nip46SignerMiddleware {
  private readonly router: Router;
  private readonly config: Required<Pick<Nip46SignerConfig, 'signerSecretKey' | 'signerPubkey' | 'relays' | 'requireAuth' | 'sessionTimeoutMs'>> & { secret?: string };
  private readonly handlers: Nip46SignerHandlers;
  private readonly authenticatedClients = new Set<string>();
  private readonly sessionTimestamps = new Map<string, number>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Nip46SignerConfig, handlers: Nip46SignerHandlers) {
    if (!config.signerSecretKey) {
      throw new Error('signerSecretKey is required');
    }
    if (!config.relays?.length) {
      throw new Error('At least one relay is required');
    }

    // Derive pubkey from secret key if not provided
    let signerPubkey: string = config.signerPubkey || '';
    if (!signerPubkey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getPublicKeySync } = require('nostr-crypto-utils') as { getPublicKeySync: (sk: string) => string };
        signerPubkey = getPublicKeySync(config.signerSecretKey);
      } catch {
        throw new Error('signerPubkey is required when getPublicKeySync is not available');
      }
    }

    this.config = {
      signerSecretKey: config.signerSecretKey,
      signerPubkey,
      relays: config.relays,
      secret: config.secret,
      requireAuth: config.requireAuth !== false,
      sessionTimeoutMs: config.sessionTimeoutMs || DEFAULT_SESSION_TIMEOUT_MS,
    };

    this.handlers = handlers;
    this.router = Router();
    this.setupRoutes();
    this.startCleanup();
  }

  private setupRoutes(): void {
    this.router.post('/request', this.handleRequest.bind(this));
    this.router.get('/info', this.handleInfo.bind(this));
    this.router.get('/bunker-uri', this.handleBunkerUri.bind(this));
  }

  /**
   * Handle incoming NIP-46 request (kind 24133 event)
   */
  async handleRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { event } = req.body as { event: SignedNostrEvent };
      if (!event) {
        res.status(400).json({ error: 'Missing event' });
        return;
      }

      if (event.kind !== 24133) {
        res.status(400).json({ error: 'Expected kind 24133 event' });
        return;
      }

      // Unwrap the encrypted request
      let unwrapped;
      try {
        unwrapped = unwrapRequest(event, this.config.signerSecretKey);
      } catch (err) {
        res.status(400).json({ error: 'Failed to decrypt request' });
        return;
      }

      const { request, clientPubkey, conversationKey } = unwrapped;

      // Build handle options
      const opts: Nip46HandleOptions = {};
      if (this.config.secret) {
        opts.secret = this.config.secret;
      }
      if (this.config.requireAuth) {
        opts.authenticatedClients = this.authenticatedClients;
      }

      // Dispatch to handlers
      const result = await handleSignerRequest(request, clientPubkey, this.handlers, opts);

      // Track newly authenticated clients
      if (result.newlyAuthenticated) {
        this.authenticatedClients.add(result.newlyAuthenticated);
        this.sessionTimestamps.set(result.newlyAuthenticated, Date.now());
      }

      // Update session timestamp for authenticated requests
      if (this.authenticatedClients.has(clientPubkey)) {
        this.sessionTimestamps.set(clientPubkey, Date.now());
      }

      // Wrap response
      const responseEvent = await wrapResponse(
        result.response,
        this.config.signerSecretKey,
        this.config.signerPubkey,
        clientPubkey,
        conversationKey
      );

      res.json({ event: responseEvent });
    } catch (error) {
      logger.error('Error handling NIP-46 request:', { error: error instanceof Error ? error.message : String(error) });
      next(error);
    }
  }

  /**
   * Return signer metadata
   */
  handleInfo(_req: Request, res: Response): void {
    res.json({
      pubkey: this.config.signerPubkey,
      relays: this.config.relays,
      supportedMethods: [
        'connect', 'ping', 'get_public_key', 'sign_event',
        'nip04_encrypt', 'nip04_decrypt',
        'nip44_encrypt', 'nip44_decrypt',
        'get_relays',
      ],
    });
  }

  /**
   * Return bunker:// URI for connecting to this signer
   */
  handleBunkerUri(_req: Request, res: Response): void {
    const uri = createBunkerURI(this.config.signerPubkey, this.config.relays, this.config.secret);
    res.json({ bunkerUri: uri });
  }

  /**
   * Get the request filter for subscribing to incoming NIP-46 events
   */
  getRequestFilter(since?: number): { kinds: number[]; '#p': string[]; since?: number } {
    return createRequestFilter(this.config.signerPubkey, since);
  }

  /**
   * Get the Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.authenticatedClients.clear();
    this.sessionTimestamps.clear();
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [pubkey, timestamp] of this.sessionTimestamps) {
        if (now - timestamp > this.config.sessionTimeoutMs) {
          this.authenticatedClients.delete(pubkey);
          this.sessionTimestamps.delete(pubkey);
        }
      }
    }, 60000); // Check every minute
  }
}
