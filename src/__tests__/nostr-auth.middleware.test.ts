import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { NostrAuthMiddleware } from '../middleware/nostr-auth.middleware.js';
import { NostrService } from '../services/nostr.service.js';
import { NostrEvent, NostrChallenge, VerificationResult, NostrAuthConfig, JWTExpiresIn } from '../types/index.js';

// Mock NostrService
vi.mock('../services/nostr.service.js');

describe('NostrAuthMiddleware', () => {
  let middleware: NostrAuthMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockNostrService: NostrService;

  const testConfig: NostrAuthConfig = {
    jwtSecret: 'test-secret-key',
    jwtExpiresIn: '24h' satisfies JWTExpiresIn,
    eventTimeoutMs: 5000,
    keyManagementMode: 'development' as const,
    port: 3000,
    nodeEnv: 'test',
    corsOrigins: '*',
    supabaseUrl: 'http://localhost:54321',
    supabaseKey: 'test-key',
    testMode: true
  };

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      headers: {}
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();

    // Reset and setup NostrService mock
    vi.clearAllMocks();
    mockNostrService = {
      createChallenge: vi.fn(),
      verifyChallenge: vi.fn(),
      generateToken: vi.fn(),
    } as unknown as NostrService;

    middleware = new NostrAuthMiddleware(testConfig, mockNostrService);
  });

  describe('handleChallenge', () => {
    const mockPubkey = '123abc';
    const mockChallenge: NostrChallenge = {
      id: '123',
      pubkey: mockPubkey,
      challenge: 'test-challenge',
      event: {} as NostrEvent,
      created_at: 1738971465433,
      expires_at: 1738971765433
    };

    beforeEach(() => {
      mockReq.params = { pubkey: mockPubkey };
      (mockNostrService.createChallenge as any).mockResolvedValue(mockChallenge);
    });

    it('should create and return a challenge', async () => {
      await middleware.handleChallenge(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({ challenge: mockChallenge });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      (mockNostrService.createChallenge as any).mockRejectedValue(error);

      await middleware.handleChallenge(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('handleVerification', () => {
    const mockEvent: NostrEvent = {
      id: '1',
      pubkey: '123abc',
      created_at: Math.floor(Date.now() / 1000),
      kind: 22242,
      tags: [],
      content: 'test-challenge',
      sig: '123abc'
    };

    it('should verify challenge and return success', async () => {
      const mockResult: VerificationResult = {
        success: true,
        pubkey: mockEvent.pubkey
      };

      mockReq.body = { event: mockEvent };
      (mockNostrService.verifyChallenge as any).mockResolvedValue(mockResult);
      (mockNostrService.generateToken as any).mockResolvedValue('test-token');

      await middleware.handleVerification(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({ ...mockResult, token: 'test-token' });
    });

    it('should handle verification failure', async () => {
      const mockResult: VerificationResult = {
        success: false,
        error: 'Invalid challenge'
      };

      mockReq.body = { event: mockEvent };
      (mockNostrService.verifyChallenge as any).mockResolvedValue(mockResult);

      await middleware.handleVerification(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockReq.body = { event: mockEvent };
      (mockNostrService.verifyChallenge as any).mockRejectedValue(error);

      await middleware.handleVerification(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
