import { jest } from '@jest/globals';
import { NostrAuthMiddleware } from '../middleware/nostr-auth.middleware';
import { NostrService } from '../services/nostr.service';
import { Request, Response } from 'express';
import { NostrAuthConfig, NostrChallenge, VerificationResult } from '../types';
import { NostrEvent } from '../utils/types.js';

// Create mock functions with explicit types
const mockCreateChallenge = jest.fn() as jest.MockedFunction<(pubkey: string) => Promise<NostrChallenge>>;
const mockVerifyChallenge = jest.fn() as jest.MockedFunction<(challengeId: string, signedEvent: NostrEvent) => Promise<VerificationResult>>;
const mockFetchProfile = jest.fn() as jest.MockedFunction<(pubkey: string) => Promise<any>>;
const mockStartEnrollment = jest.fn() as jest.MockedFunction<(pubkey: string) => Promise<any>>;
const mockVerifyEnrollment = jest.fn() as jest.MockedFunction<(signedEvent: NostrEvent) => Promise<any>>;

// Mock the NostrService module
jest.mock('../services/nostr.service', () => {
  return {
    NostrService: jest.fn().mockImplementation(() => ({
      createChallenge: mockCreateChallenge,
      verifyChallenge: mockVerifyChallenge,
      fetchProfile: mockFetchProfile,
      startEnrollment: mockStartEnrollment,
      verifyEnrollment: mockVerifyEnrollment
    }))
  };
});

describe('NostrAuthMiddleware', () => {
  let middleware: NostrAuthMiddleware;
  let mockConfig: NostrAuthConfig;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config with minimal required fields
    mockConfig = {
      port: 3000,
      corsOrigins: '*',
      nostrRelays: ['wss://relay.example.com'],
      testMode: true
    };

    // Setup mock request/response
    mockReq = {
      body: {},
      headers: {},
      params: {}
    };

    // Setup mock response with proper types
    const mockStatus = jest.fn().mockReturnThis();
    const mockJson = jest.fn().mockReturnThis();
    mockRes = {
      status: mockStatus as unknown as Response['status'],
      json: mockJson as unknown as Response['json']
    };
    mockNext = jest.fn();

    // Create middleware instance
    middleware = new NostrAuthMiddleware(mockConfig);
  });

  describe('Challenge Generation', () => {
    it('should return 400 if pubkey is missing', async () => {
      mockReq.body = {};

      await (middleware as any).handleChallenge(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing pubkey'
      });
    });

    it('should generate a challenge successfully', async () => {
      const mockChallenge: NostrChallenge = {
        id: 'test-id',
        event: {
          id: 'test-event-id',
          pubkey: 'test-pubkey',
          created_at: Math.floor(Date.now() / 1000),
          kind: 22242,
          tags: [],
          content: '',
          sig: 'test-sig'
        },
        expiresAt: Math.floor(Date.now() / 1000) + 300
      };

      mockReq.body = { pubkey: 'test-pubkey' };
      mockCreateChallenge.mockResolvedValueOnce(mockChallenge);

      await (middleware as any).handleChallenge(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockCreateChallenge).toHaveBeenCalledWith('test-pubkey');
      expect(mockRes.json).toHaveBeenCalledWith({
        event: mockChallenge.event,
        challengeId: mockChallenge.id
      });
    });

    it('should handle errors during challenge generation', async () => {
      mockReq.body = { pubkey: 'test-pubkey' };
      mockCreateChallenge.mockRejectedValueOnce(new Error('Test error'));

      await (middleware as any).handleChallenge(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockCreateChallenge).toHaveBeenCalledWith('test-pubkey');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create challenge'
      });
    });
  });

  describe('Challenge Verification', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {};

      await (middleware as any).handleVerify(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing challengeId or signedEvent'
      });
    });

    it('should verify a challenge successfully', async () => {
      const mockSignedEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242,
        tags: [],
        content: '',
        sig: 'test-sig'
      };

      const mockResult: VerificationResult = {
        success: true,
        token: 'test-token',
        profile: {
          pubkey: 'test-pubkey',
          name: 'Test User'
        }
      };

      mockReq.body = {
        challengeId: 'test-id',
        signedEvent: mockSignedEvent
      };

      mockVerifyChallenge.mockResolvedValueOnce(mockResult);

      await (middleware as any).handleVerify(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockVerifyChallenge).toHaveBeenCalledWith('test-id', mockSignedEvent);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        token: mockResult.token,
        profile: mockResult.profile
      });
    });

    it('should return 401 for invalid signature', async () => {
      const mockSignedEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242,
        tags: [],
        content: '',
        sig: 'invalid-sig'
      };

      mockReq.body = {
        challengeId: 'test-id',
        signedEvent: mockSignedEvent
      };

      mockVerifyChallenge.mockResolvedValueOnce({ success: false });

      await (middleware as any).handleVerify(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockVerifyChallenge).toHaveBeenCalledWith('test-id', mockSignedEvent);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid signature'
      });
    });

    it('should handle verification errors gracefully', async () => {
      const mockSignedEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242,
        tags: [],
        content: '',
        sig: 'test-sig'
      };

      mockReq.body = {
        challengeId: 'test-id',
        signedEvent: mockSignedEvent
      };

      mockVerifyChallenge.mockRejectedValueOnce(new Error('Verification error'));

      await (middleware as any).handleVerify(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockVerifyChallenge).toHaveBeenCalledWith('test-id', mockSignedEvent);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to verify challenge'
      });
    });
  });

  describe('Profile Fetching', () => {
    it('should fetch profile successfully', async () => {
      const mockProfile = {
        pubkey: 'test-pubkey',
        name: 'Test User',
        about: 'Test Bio',
        picture: 'https://example.com/pic.jpg'
      };

      mockReq.params = { pubkey: 'test-pubkey' };
      mockFetchProfile.mockResolvedValueOnce(mockProfile);

      await (middleware as any).handleProfileFetch(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockFetchProfile).toHaveBeenCalledWith('test-pubkey');
      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });

    it('should return 400 if pubkey is missing', async () => {
      mockReq.params = {};

      await (middleware as any).handleProfileFetch(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Public key is required'
      });
    });

    it('should handle profile fetch errors gracefully', async () => {
      mockReq.params = { pubkey: 'test-pubkey' };
      mockFetchProfile.mockRejectedValueOnce(new Error('Profile fetch error'));

      await (middleware as any).handleProfileFetch(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockFetchProfile).toHaveBeenCalledWith('test-pubkey');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch profile'
      });
    });
  });

  describe('Enrollment', () => {
    it('should start enrollment successfully', async () => {
      const mockEnrollment = {
        id: 'test-enrollment-id',
        pubkey: 'test-pubkey',
        status: 'pending'
      };

      mockReq.body = { pubkey: 'test-pubkey' };
      mockStartEnrollment.mockResolvedValueOnce(mockEnrollment);

      await (middleware as any).handleEnroll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockStartEnrollment).toHaveBeenCalledWith('test-pubkey');
      expect(mockRes.json).toHaveBeenCalledWith({ enrollment: mockEnrollment });
    });

    it('should return 400 if pubkey is missing for enrollment', async () => {
      mockReq.body = {};

      await (middleware as any).handleEnroll(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing pubkey'
      });
    });

    it('should verify enrollment successfully', async () => {
      const mockSignedEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242,
        tags: [],
        content: '',
        sig: 'test-sig'
      };

      const mockResult = {
        success: true,
        message: 'Enrollment verified'
      };

      mockReq.body = { signedEvent: mockSignedEvent };
      mockVerifyEnrollment.mockResolvedValueOnce(mockResult);

      await (middleware as any).handleVerifyEnrollment(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockVerifyEnrollment).toHaveBeenCalledWith(mockSignedEvent);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if signedEvent is missing for enrollment verification', async () => {
      mockReq.body = {};

      await (middleware as any).handleVerifyEnrollment(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing signedEvent'
      });
    });

    it('should return 401 for invalid enrollment verification', async () => {
      const mockSignedEvent: NostrEvent = {
        id: 'test-event-id',
        pubkey: 'test-pubkey',
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242,
        tags: [],
        content: '',
        sig: 'invalid-sig'
      };

      mockReq.body = { signedEvent: mockSignedEvent };
      mockVerifyEnrollment.mockResolvedValueOnce({
        success: false,
        message: 'Invalid enrollment'
      });

      await (middleware as any).handleVerifyEnrollment(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockVerifyEnrollment).toHaveBeenCalledWith(mockSignedEvent);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid enrollment'
      });
    });
  });

  describe('Router', () => {
    it('should return a router instance', () => {
      const router = middleware.getRouter();
      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
      expect(router.get).toBeDefined();
      expect(router.post).toBeDefined();
    });
  });
});
