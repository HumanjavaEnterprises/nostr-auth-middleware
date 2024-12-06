import { Request, Response, NextFunction, Router } from 'express';
import { NostrService } from '../services/nostr.service';
import { NostrEvent, NostrConfig } from '../types/index.js';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger('NostrAuthMiddleware');

export class NostrAuthMiddleware {
  private readonly router: Router;
  private readonly nostrService: NostrService;

  constructor(config: NostrConfig, nostrService?: NostrService) {
    const supabase = createClient(config.supabaseUrl || '', config.supabaseKey || '');
    this.nostrService = nostrService || new NostrService(config);
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post('/challenge/:pubkey', this.handleChallenge.bind(this));
    this.router.post('/verify', this.handleVerification.bind(this));
    this.router.post('/enroll', this.handleEnrollment.bind(this));
    this.router.get('/profile/:pubkey', this.handleProfileFetch.bind(this));
  }

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

  async handleEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { event } = req.body as { event: NostrEvent };
      if (!event) {
        res.status(400).json({ error: 'Missing event' });
        return;
      }

      const profile = await this.nostrService.getProfile(event.pubkey);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const enrollment = await this.nostrService.createEnrollment(event.pubkey, profile);
      res.json({ enrollment });
    } catch (error) {
      logger.error('Error handling enrollment:', { error: error instanceof Error ? error.message : String(error) });
      next(error);
    }
  }

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

      res.json({ profile });
    } catch (error) {
      logger.error('Error fetching profile:', { error: error instanceof Error ? error.message : String(error) });
      next(error);
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
