/**
 * @fileoverview Express middleware for handling Nostr authentication
 * Provides endpoints for challenge-response authentication, verification, and user enrollment
 */

import { Request, Response, NextFunction, Router } from 'express';
import { NostrService } from '../services/nostr.service.js';
import type { NostrEvent, NostrAuthConfig, JWTExpiresIn } from '../types.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('NostrAuthMiddleware');

const DEFAULT_CONFIG: Required<Pick<NostrAuthConfig, 'keyManagementMode' | 'eventTimeoutMs' | 'jwtExpiresIn' | 'port'>> = {
  keyManagementMode: 'development',
  eventTimeoutMs: 300000, // 5 minutes
  jwtExpiresIn: '1h' as JWTExpiresIn,
  port: 3000 // Default port
};

/**
 * Express middleware class for handling Nostr authentication flows
 * @class NostrAuthMiddleware
 * @description Provides endpoints for challenge-response authentication, verification, and user enrollment
 * using the Nostr protocol
 */
export class NostrAuthMiddleware {
  private readonly router: Router;
  private readonly nostrService: NostrService;

  /**
   * Creates a new NostrAuthMiddleware instance
   * @param {Partial<NostrAuthConfig>} config - Configuration options for the middleware
   * @param {NostrService} [nostrService] - Optional NostrService instance for testing
   */
  constructor(config: Partial<NostrAuthConfig>, nostrService?: NostrService) {
    if (!config.jwtSecret) {
      throw new Error('JWT secret is required');
    }

    // Ensure required properties are present with defaults
    const fullConfig: NostrAuthConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      jwtSecret: config.jwtSecret,
      port: config.port || DEFAULT_CONFIG.port,
      eventTimeoutMs: config.eventTimeoutMs || DEFAULT_CONFIG.eventTimeoutMs,
      jwtExpiresIn: config.jwtExpiresIn || DEFAULT_CONFIG.jwtExpiresIn,
      keyManagementMode: config.keyManagementMode || DEFAULT_CONFIG.keyManagementMode
    };
    
    this.nostrService = nostrService || new NostrService(fullConfig);
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Sets up the Express routes for the middleware
   * @private
   */
  private setupRoutes() {
    this.router.post('/challenge/:pubkey', this.handleChallenge.bind(this));
    this.router.post('/verify', this.handleVerification.bind(this));
    this.router.get('/profile/:pubkey', this.handleProfileFetch.bind(this));
  }

  /**
   * Handles challenge creation requests
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  async handleChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pubkey } = req.params;
      if (!pubkey) {
        res.status(400).json({ error: 'Missing pubkey' });
        return;
      }

      const challenge = await this.nostrService.createChallenge(pubkey);
      res.json({ challenge });
    } catch (error) {
      logger.error('Error handling challenge:', { error: error instanceof Error ? error.message : String(error) });
      next(error);
    }
  }

  /**
   * Handles verification of signed challenges
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  async handleVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { event } = req.body as { event: NostrEvent };
      if (!event) {
        res.status(400).json({ error: 'Missing event' });
        return;
      }

      const result = await this.nostrService.verifyChallenge(event);
      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      // Generate JWT token if verification successful
      if (result.pubkey) {
        const token = await this.nostrService.generateToken(result.pubkey);
        res.json({ ...result, token });
      } else {
        res.json(result);
      }
    } catch (error) {
      logger.error('Error handling verification:', { error: error instanceof Error ? error.message : String(error) });
      next(error);
    }
  }

  /**
   * Handles profile fetching requests
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  async handleProfileFetch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pubkey } = req.params;
      if (!pubkey) {
        res.status(400).json({ error: 'Missing pubkey' });
        return;
      }

      const profile = await this.nostrService.getProfile(pubkey);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      logger.error('Error fetching profile:', { error: error instanceof Error ? error.message : String(error) });
      next(error);
    }
  }

  /**
   * Gets the Express router instance
   * @returns {Router} Express router
   */
  getRouter(): Router {
    return this.router;
  }
}
