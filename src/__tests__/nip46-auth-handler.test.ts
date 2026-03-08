import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nip46AuthHandler, type Nip46Transport } from '../browser/nip46-auth-handler.js';
import type { Nip46AuthConfig } from '../types.js';

// Mock nostr-crypto-utils/nip46
vi.mock('nostr-crypto-utils/nip46', () => {
  const mockSession = {
    clientSecretKey: 'b'.repeat(64),
    clientPubkey: 'c'.repeat(64),
    remotePubkey: 'a'.repeat(64),
    conversationKey: new Uint8Array(32),
  };

  return {
    parseBunkerURI: vi.fn((_uri: string) => ({
      remotePubkey: 'a'.repeat(64),
      relays: ['wss://relay.example.com'],
      secret: 'test-secret',
    })),
    createSession: vi.fn(() => mockSession),
    getSessionInfo: vi.fn((session: any) => ({
      clientPubkey: session.clientPubkey,
      remotePubkey: session.remotePubkey,
    })),
    connectRequest: vi.fn(() => ({
      id: 'connect-req-id',
      method: 'connect',
      params: ['a'.repeat(64), 'test-secret'],
    })),
    getPublicKeyRequest: vi.fn(() => ({
      id: 'getpk-req-id',
      method: 'get_public_key',
      params: [],
    })),
    signEventRequest: vi.fn((eventJson: string) => ({
      id: 'sign-req-id',
      method: 'sign_event',
      params: [eventJson],
    })),
    pingRequest: vi.fn(() => ({
      id: 'ping-req-id',
      method: 'ping',
      params: [],
    })),
    wrapEvent: vi.fn(async () => ({
      kind: 24133,
      id: 'wrapped-event-id',
      pubkey: 'c'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', 'a'.repeat(64)]],
      content: 'encrypted',
      sig: 'x'.repeat(128),
    })),
    unwrapEvent: vi.fn(),
    createResponseFilter: vi.fn(() => ({
      kinds: [24133],
      '#p': ['c'.repeat(64)],
    })),
    isResponse: vi.fn((payload: any) => 'result' in payload || 'error' in payload),
  };
});

const nip46 = await import('nostr-crypto-utils/nip46');

describe('Nip46AuthHandler', () => {
  let handler: Nip46AuthHandler;
  let mockTransport: Nip46Transport;

  const bunkerConfig: Nip46AuthConfig = {
    bunkerUri: `bunker://${'a'.repeat(64)}?relay=wss://relay.example.com&secret=test-secret`,
    serverUrl: 'https://auth.example.com',
    timeout: 5000,
  };

  const directConfig: Nip46AuthConfig = {
    remotePubkey: 'a'.repeat(64),
    relays: ['wss://relay.example.com'],
    secret: 'test-secret',
    serverUrl: 'https://auth.example.com',
    timeout: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockTransport = {
      sendEvent: vi.fn(async () => {}),
      subscribe: vi.fn((_filter, _onEvent) => {
        // Will be controlled per-test
        return () => {};
      }),
    };
  });

  describe('constructor', () => {
    it('should construct with bunkerUri', () => {
      handler = new Nip46AuthHandler(bunkerConfig);
      expect(nip46.parseBunkerURI).toHaveBeenCalledWith(bunkerConfig.bunkerUri);
    });

    it('should construct with direct config', () => {
      handler = new Nip46AuthHandler(directConfig);
      expect(handler).toBeDefined();
    });

    it('should throw if neither bunkerUri nor remotePubkey+relays', () => {
      expect(() => {
        new Nip46AuthHandler({ serverUrl: 'https://auth.example.com' });
      }).toThrow('Either bunkerUri or remotePubkey + relays must be provided');
    });

    it('should throw if remotePubkey without relays', () => {
      expect(() => {
        new Nip46AuthHandler({ remotePubkey: 'a'.repeat(64) });
      }).toThrow('Either bunkerUri or remotePubkey + relays must be provided');
    });
  });

  describe('connect', () => {
    it('should create session and send connect request', async () => {
      handler = new Nip46AuthHandler(bunkerConfig);

      // Mock transport to deliver ack response immediately
      (mockTransport.subscribe as any).mockImplementation((filter: any, onEvent: any) => {
        // Simulate receiving a response event
        setTimeout(() => {
          (nip46.unwrapEvent as any).mockReturnValue({
            id: 'connect-req-id',
            result: 'ack',
          });
          onEvent({
            kind: 24133,
            id: 'resp-id',
            pubkey: 'a'.repeat(64),
            created_at: Math.floor(Date.now() / 1000),
            tags: [['p', 'c'.repeat(64)]],
            content: 'encrypted',
            sig: 'y'.repeat(128),
          });
        }, 10);
        return () => {};
      });

      await handler.connect(mockTransport);

      expect(nip46.createSession).toHaveBeenCalled();
      expect(nip46.connectRequest).toHaveBeenCalled();
      expect(nip46.wrapEvent).toHaveBeenCalled();
      expect(mockTransport.sendEvent).toHaveBeenCalled();
    });

    it('should throw if no transport provided', async () => {
      handler = new Nip46AuthHandler(bunkerConfig);

      await expect(handler.connect()).rejects.toThrow('Transport is required');
    });

    it('should throw if connect response has error', async () => {
      handler = new Nip46AuthHandler(bunkerConfig);

      (mockTransport.subscribe as any).mockImplementation((filter: any, onEvent: any) => {
        setTimeout(() => {
          (nip46.unwrapEvent as any).mockReturnValue({
            id: 'connect-req-id',
            error: 'invalid secret',
          });
          onEvent({
            kind: 24133, id: 'resp-id', pubkey: 'a'.repeat(64),
            created_at: 0, tags: [], content: 'enc', sig: 'x',
          });
        }, 10);
        return () => {};
      });

      await expect(handler.connect(mockTransport)).rejects.toThrow('Connect failed: invalid secret');
    });

    it('should timeout if no response', async () => {
      handler = new Nip46AuthHandler({ ...bunkerConfig, timeout: 100 });

      (mockTransport.subscribe as any).mockImplementation(() => () => {});

      await expect(handler.connect(mockTransport)).rejects.toThrow('timed out');
    });
  });

  describe('validateSession', () => {
    it('should return false when not connected', async () => {
      handler = new Nip46AuthHandler(bunkerConfig);
      const valid = await handler.validateSession();
      expect(valid).toBe(false);
    });

    it('should return true on pong response', async () => {
      handler = new Nip46AuthHandler(bunkerConfig);

      // First, connect
      (mockTransport.subscribe as any).mockImplementation((filter: any, onEvent: any) => {
        setTimeout(() => {
          (nip46.unwrapEvent as any).mockReturnValue({
            id: 'connect-req-id',
            result: 'ack',
          });
          onEvent({
            kind: 24133, id: 'resp-id', pubkey: 'a'.repeat(64),
            created_at: 0, tags: [], content: 'enc', sig: 'x',
          });
        }, 10);
        return () => {};
      });

      await handler.connect(mockTransport);

      // Now set up transport for ping
      (mockTransport.subscribe as any).mockImplementation((filter: any, onEvent: any) => {
        setTimeout(() => {
          (nip46.unwrapEvent as any).mockReturnValue({
            id: 'ping-req-id',
            result: 'pong',
          });
          onEvent({
            kind: 24133, id: 'resp-id', pubkey: 'a'.repeat(64),
            created_at: 0, tags: [], content: 'enc', sig: 'x',
          });
        }, 10);
        return () => {};
      });

      const valid = await handler.validateSession();
      expect(valid).toBe(true);
    });
  });

  describe('getSessionInfo', () => {
    it('should return null when no session', () => {
      handler = new Nip46AuthHandler(bunkerConfig);
      expect(handler.getSessionInfo()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clear session state', () => {
      handler = new Nip46AuthHandler(bunkerConfig);
      handler.destroy();
      expect(handler.getSessionInfo()).toBeNull();
    });
  });
});
