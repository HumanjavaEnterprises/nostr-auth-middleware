import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NostrAuthMiddleware } from '../middleware/nostr-auth.middleware';
import { NostrService } from '../services/nostr.service';
import { NostrEvent, NostrChallenge, VerificationResult, NostrConfig } from '../types/index.js';
import { Request, Response } from 'express';

describe('NostrAuthMiddleware', () => {
  let middleware: NostrAuthMiddleware;
  let mockNostrService: jest.Mocked<NostrService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: vi.Mock;
  let mockConfig: NostrConfig;

  beforeEach(() => {
    mockNostrService = {
      createChallenge: vi.fn(),
      verifyChallenge: vi.fn(),
      createEnrollment: vi.fn(),
      getProfile: vi.fn(),
      generateToken: vi.fn(),
    } as any;

    mockConfig = {
      port: 3000,
      nodeEnv: 'test',
      corsOrigins: '*',
      keyManagementMode: 'development',
      testMode: true,
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'test-key'
    };

    middleware = new NostrAuthMiddleware(mockConfig, mockNostrService);

    mockReq = {
      body: {},
      headers: {},
      params: {}
    };

    mockRes = {
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };

    mockNext = vi.fn();
  });

  describe('handleChallenge', () => {
    const mockPubkey = '123abc';
    const mockChallenge: NostrChallenge = {
      id: '123',
      pubkey: mockPubkey,
      challenge: 'test-challenge',
      event: {} as NostrEvent,
      created_at: Date.now(),
      expires_at: Date.now() + 300000
    };

    beforeEach(() => {
      mockReq.params = { pubkey: mockPubkey };
      mockNostrService.createChallenge.mockResolvedValue(mockChallenge);
    });

    it('should create and return a challenge', async () => {
      await middleware.handleChallenge(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNostrService.createChallenge).toHaveBeenCalledWith(mockPubkey);
      expect(mockRes.json).toHaveBeenCalledWith({ challenge: mockChallenge });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockNostrService.createChallenge.mockRejectedValue(error);

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

      mockNostrService.verifyChallenge.mockResolvedValue(mockResult);
      mockNostrService.generateToken.mockResolvedValue('test-token');

      await middleware.handleVerification(
        { ...mockReq, body: { event: mockEvent } } as any,
        mockRes as Response,
        mockNext
      );

      expect(mockNostrService.verifyChallenge).toHaveBeenCalledWith(mockEvent);
      expect(mockRes.json).toHaveBeenCalledWith({ ...mockResult, token: 'test-token' });
    });

    it('should handle verification failure', async () => {
      const mockResult: VerificationResult = {
        success: false,
        error: 'Invalid challenge'
      };

      mockNostrService.verifyChallenge.mockResolvedValue(mockResult);

      await middleware.handleVerification(
        { ...mockReq, body: { event: mockEvent } } as any,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockNostrService.verifyChallenge.mockRejectedValue(error);

      await middleware.handleVerification(
        { ...mockReq, body: { event: mockEvent } } as any,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
