import express, { Router, Request, Response, NextFunction } from 'express';
import { NostrService } from '../services/nostr.service.js';
import { createLogger } from '../utils/logger.js';
import { NostrChallenge, NostrAuthConfig } from '../types/index.js';

const logger = createLogger('NostrAuthMiddleware');

export class NostrAuthMiddleware {
  private readonly router: Router;
  private readonly nostrService: NostrService;

  constructor(private readonly config: NostrAuthConfig) {
    this.router = Router();
    this.nostrService = new NostrService(config);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/challenge', this.handleChallenge.bind(this));
    this.router.post('/verify', this.handleVerify.bind(this));
    this.router.post('/enroll', this.handleEnroll.bind(this));
    this.router.post('/enroll/verify', this.handleVerifyEnrollment.bind(this));
    this.router.get('/profile/:pubkey', this.handleProfileFetch.bind(this));
  }

  private async handleChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pubkey } = req.body;
      if (!pubkey) {
        res.status(400).json({ error: 'Missing pubkey' });
        return;
      }

      logger.info('Creating challenge for pubkey:', pubkey);
      const challenge = await this.nostrService.createChallenge(pubkey);
      logger.info('Challenge created:', challenge);

      // Format response to match test expectations
      res.json({
        event: challenge.event,
        challengeId: challenge.id
      });
    } catch (error) {
      logger.error('Failed to create challenge:', error);
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  }

  private async handleVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { challengeId, signedEvent } = req.body;

      if (!challengeId || !signedEvent) {
        res.status(400).json({ error: 'Missing challengeId or signedEvent' });
        return;
      }

      logger.info('Verifying challenge:', challengeId);
      const result = await this.nostrService.verifyChallenge(challengeId, signedEvent);
      
      if (result.success) {
        res.json({
          success: true,
          token: result.token,
          profile: result.profile
        });
      } else {
        res.status(401).json({ error: 'Invalid signature' });
      }
    } catch (error) {
      logger.error('Failed to verify challenge:', error);
      res.status(500).json({ error: 'Failed to verify challenge' });
    }
  }

  private async handleEnroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pubkey } = req.body;
      if (!pubkey) {
        res.status(400).json({ error: 'Missing pubkey' });
        return;
      }

      logger.info('Starting enrollment for pubkey:', pubkey);
      const enrollment = await this.nostrService.startEnrollment(pubkey);
      logger.info('Enrollment started:', enrollment);

      res.json({ enrollment });
    } catch (error) {
      logger.error('Failed to start enrollment:', error);
      res.status(500).json({ error: 'Failed to start enrollment' });
    }
  }

  private async handleVerifyEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { signedEvent } = req.body;
      if (!signedEvent) {
        res.status(400).json({ error: 'Missing signedEvent' });
        return;
      }

      logger.info('Verifying enrollment:', signedEvent);
      const result = await this.nostrService.verifyEnrollment(signedEvent);
      if (!result.success) {
        res.status(401).json({ error: result.message });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Failed to verify enrollment:', error);
      res.status(500).json({ error: 'Failed to verify enrollment' });
    }
  }

  private async handleProfileFetch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pubkey } = req.params;
      if (!pubkey) {
        res.status(400).json({ error: 'Public key is required' });
        return;
      }

      const profile = await this.nostrService.fetchProfile(pubkey);
      res.json(profile);
    } catch (error) {
      logger.error('Profile fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
