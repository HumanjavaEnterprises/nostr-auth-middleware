import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { Nip46SignerMiddleware } from '../middleware/nip46-signer.middleware.js';
import type { Nip46SignerConfig } from '../types.js';
import type { Nip46SignerHandlers } from 'nostr-crypto-utils/nip46';

// Mock nostr-crypto-utils/nip46
vi.mock('nostr-crypto-utils/nip46', () => ({
  unwrapRequest: vi.fn(),
  wrapResponse: vi.fn(),
  handleSignerRequest: vi.fn(),
  createBunkerURI: vi.fn(),
  createRequestFilter: vi.fn(),
}));

// Mock nostr-crypto-utils (for getPublicKeySync)
vi.mock('nostr-crypto-utils', () => ({
  getPublicKeySync: vi.fn(() => 'a'.repeat(64)),
}));

const { unwrapRequest, wrapResponse, handleSignerRequest, createBunkerURI, createRequestFilter } =
  await import('nostr-crypto-utils/nip46');

describe('Nip46SignerMiddleware', () => {
  let middleware: Nip46SignerMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockHandlers: Nip46SignerHandlers;

  const testConfig: Nip46SignerConfig = {
    signerSecretKey: 'b'.repeat(64),
    signerPubkey: 'a'.repeat(64),
    relays: ['wss://relay.example.com'],
    secret: 'test-secret',
    requireAuth: true,
    sessionTimeoutMs: 60000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      headers: {},
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();

    mockHandlers = {
      getPublicKey: vi.fn(() => 'a'.repeat(64)),
      signEvent: vi.fn(() => '{"signed": true}'),
    };

    middleware = new Nip46SignerMiddleware(testConfig, mockHandlers);
  });

  afterEach(() => {
    middleware.destroy();
  });

  describe('constructor', () => {
    it('should throw if signerSecretKey is missing', () => {
      expect(() => {
        new Nip46SignerMiddleware({ ...testConfig, signerSecretKey: '' }, mockHandlers);
      }).toThrow('signerSecretKey is required');
    });

    it('should throw if relays are missing', () => {
      expect(() => {
        new Nip46SignerMiddleware({ ...testConfig, relays: [] }, mockHandlers);
      }).toThrow('At least one relay is required');
    });

    it('should create a valid middleware with getRouter()', () => {
      expect(middleware.getRouter).toBeDefined();
      expect(typeof middleware.getRouter).toBe('function');
      expect(middleware.getRouter()).toBeDefined();
    });
  });

  describe('handleRequest', () => {
    it('should return 400 if event is missing', async () => {
      mockReq.body = {};

      await middleware.handleRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing event' });
    });

    it('should return 400 if event is not kind 24133', async () => {
      mockReq.body = { event: { kind: 1, id: 'test', pubkey: 'a'.repeat(64), created_at: 0, tags: [], content: '', sig: 'x' } };

      await middleware.handleRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Expected kind 24133 event' });
    });

    it('should return 400 if decryption fails', async () => {
      mockReq.body = { event: { kind: 24133, id: 'test', pubkey: 'a'.repeat(64), created_at: 0, tags: [], content: 'bad', sig: 'x' } };
      (unwrapRequest as any).mockImplementation(() => {
        throw new Error('decrypt failed');
      });

      await middleware.handleRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to decrypt request' });
    });

    it('should handle connect request and track new client', async () => {
      const clientPubkey = 'c'.repeat(64);
      const mockEvent = { kind: 24133, id: 'test', pubkey: clientPubkey, created_at: 0, tags: [], content: 'enc', sig: 'x' };
      const mockConvKey = new Uint8Array(32);

      mockReq.body = { event: mockEvent };

      (unwrapRequest as any).mockReturnValue({
        request: { id: 'req1', method: 'connect', params: ['a'.repeat(64), 'test-secret'] },
        clientPubkey,
        conversationKey: mockConvKey,
      });

      (handleSignerRequest as any).mockResolvedValue({
        response: { id: 'req1', result: 'ack' },
        newlyAuthenticated: clientPubkey,
      });

      const responseEvent = { kind: 24133, id: 'resp1', pubkey: 'a'.repeat(64), created_at: 0, tags: [], content: 'enc', sig: 'y' };
      (wrapResponse as any).mockResolvedValue(responseEvent);

      await middleware.handleRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(unwrapRequest).toHaveBeenCalledWith(mockEvent, testConfig.signerSecretKey);
      expect(handleSignerRequest).toHaveBeenCalled();
      expect(wrapResponse).toHaveBeenCalledWith(
        { id: 'req1', result: 'ack' },
        testConfig.signerSecretKey,
        testConfig.signerPubkey,
        clientPubkey,
        mockConvKey
      );
      expect(mockRes.json).toHaveBeenCalledWith({ event: responseEvent });
    });

    it('should dispatch sign_event to handler after authentication', async () => {
      const clientPubkey = 'c'.repeat(64);
      const mockEvent = { kind: 24133, id: 'test2', pubkey: clientPubkey, created_at: 0, tags: [], content: 'enc', sig: 'x' };
      const mockConvKey = new Uint8Array(32);

      mockReq.body = { event: mockEvent };

      (unwrapRequest as any).mockReturnValue({
        request: { id: 'req2', method: 'sign_event', params: ['{"kind":1}'] },
        clientPubkey,
        conversationKey: mockConvKey,
      });

      (handleSignerRequest as any).mockResolvedValue({
        response: { id: 'req2', result: '{"signed":true}' },
      });

      const responseEvent = { kind: 24133, id: 'resp2', pubkey: 'a'.repeat(64), created_at: 0, tags: [], content: 'enc', sig: 'y' };
      (wrapResponse as any).mockResolvedValue(responseEvent);

      await middleware.handleRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({ event: responseEvent });
    });

    it('should pass errors to next()', async () => {
      const error = new Error('Unexpected error');
      mockReq.body = { event: { kind: 24133, id: 'test', pubkey: 'a'.repeat(64), created_at: 0, tags: [], content: 'enc', sig: 'x' } };

      (unwrapRequest as any).mockReturnValue({
        request: { id: 'req3', method: 'get_public_key', params: [] },
        clientPubkey: 'c'.repeat(64),
        conversationKey: new Uint8Array(32),
      });

      (handleSignerRequest as any).mockRejectedValue(error);

      await middleware.handleRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('handleInfo', () => {
    it('should return signer metadata', () => {
      middleware.handleInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        pubkey: testConfig.signerPubkey,
        relays: testConfig.relays,
        supportedMethods: expect.arrayContaining(['connect', 'sign_event', 'get_public_key']),
      });
    });
  });

  describe('handleBunkerUri', () => {
    it('should return bunker URI', () => {
      (createBunkerURI as any).mockReturnValue('bunker://aaa...?relay=wss://relay.example.com&secret=test-secret');

      middleware.handleBunkerUri(
        mockReq as Request,
        mockRes as Response
      );

      expect(createBunkerURI).toHaveBeenCalledWith(testConfig.signerPubkey, testConfig.relays, testConfig.secret);
      expect(mockRes.json).toHaveBeenCalledWith({
        bunkerUri: expect.stringContaining('bunker://'),
      });
    });
  });

  describe('getRequestFilter', () => {
    it('should return filter for incoming NIP-46 events', () => {
      const mockFilter = { kinds: [24133], '#p': ['a'.repeat(64)] };
      (createRequestFilter as any).mockReturnValue(mockFilter);

      const filter = middleware.getRequestFilter();

      expect(createRequestFilter).toHaveBeenCalledWith(testConfig.signerPubkey, undefined);
      expect(filter).toEqual(mockFilter);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      middleware.destroy();
      // After destroy, the middleware should still have a router but cleared state
      expect(middleware.getRouter()).toBeDefined();
    });
  });
});
