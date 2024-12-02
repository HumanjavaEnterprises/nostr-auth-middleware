import { Router, Request, Response, NextFunction } from 'express';
import { NostrService } from '../services/nostr.service';
import { NostrEventValidator } from '../validators/event.validator';
import { NostrAuthConfig, NostrChallenge, VerificationResult } from '../types';
import { createLogger } from '../utils/logger';

export class NostrAuthMiddleware {
  private readonly router: Router;
  private readonly nostrService: NostrService;
  private readonly validator: NostrEventValidator;
  private readonly logger = createLogger('NostrAuthMiddleware');
  private readonly challenges: Map<string, NostrChallenge> = new Map();

  constructor(private readonly config: NostrAuthConfig) {
    this.router = Router();
    this.nostrService = new NostrService(config);
    this.validator = new NostrEventValidator();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/challenge', this.handleChallenge.bind(this));
    this.router.post('/verify', this.handleVerification.bind(this));
    this.router.post('/enroll', this.handleEnrollment.bind(this));
    this.router.post('/enroll/verify', this.handleEnrollmentVerification.bind(this));
    this.router.get('/profile/:pubkey', this.handleProfileFetch.bind(this));
  }

  private async handleChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { pubkey } = req.body;
      if (!pubkey) {
        res.status(400).json({ error: 'Public key is required' });
        return;
      }

      const challenge = await this.nostrService.createChallenge(pubkey);
      this.challenges.set(challenge.id, challenge);

      res.json({ 
        challengeId: challenge.id,
        event: challenge.event 
      });
    } catch (error) {
      this.logger.error('Challenge creation failed:', error);
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  }

  private async handleVerification(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId, signedEvent } = req.body;
      if (!challengeId || !signedEvent) {
        res.status(400).json({ error: 'Challenge ID and signed event are required' });
        return;
      }

      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      const result = await this.nostrService.verifyChallenge(challenge, signedEvent);
      if (result.success) {
        this.challenges.delete(challengeId);
      }

      res.json(result);
    } catch (error) {
      this.logger.error('Verification failed:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }

  private async handleEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const { pubkey } = req.body;
      if (!pubkey) {
        res.status(400).json({ error: 'Public key is required' });
        return;
      }

      const enrollment = await this.nostrService.startEnrollment(pubkey);
      res.json({
        verificationEvent: enrollment.verificationEvent,
        expiresAt: enrollment.expiresAt
      });
    } catch (error) {
      this.logger.error('Enrollment failed:', error);
      res.status(500).json({ error: 'Failed to start enrollment' });
    }
  }

  private async handleEnrollmentVerification(req: Request, res: Response): Promise<void> {
    try {
      const { signedEvent } = req.body;
      if (!signedEvent) {
        res.status(400).json({ error: 'Signed event is required' });
        return;
      }

      const result = await this.nostrService.verifyEnrollment(signedEvent);
      res.json(result);
    } catch (error) {
      this.logger.error('Enrollment verification failed:', error);
      res.status(500).json({ error: 'Enrollment verification failed' });
    }
  }

  private async handleProfileFetch(req: Request, res: Response): Promise<void> {
    try {
      const { pubkey } = req.params;
      if (!pubkey) {
        res.status(400).json({ error: 'Public key is required' });
        return;
      }

      const profile = await this.nostrService.fetchProfile(pubkey);
      res.json(profile);
    } catch (error) {
      this.logger.error('Profile fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
