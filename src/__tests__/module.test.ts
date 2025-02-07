import { expect, describe, it } from 'vitest';
import { NostrAuthMiddleware, createNostrAuth } from '../index.js';
import type { NostrAuthConfig } from '../types.js';

describe('Module exports', () => {
  it('should export NostrAuthMiddleware class', () => {
    expect(NostrAuthMiddleware).toBeDefined();
    expect(typeof NostrAuthMiddleware).toBe('function');
  });

  it('should export createNostrAuth factory function', () => {
    expect(createNostrAuth).toBeDefined();
    expect(typeof createNostrAuth).toBe('function');
  });

  it('should create a valid middleware instance', () => {
    const config: Partial<NostrAuthConfig> = {
      jwtSecret: 'test-secret-key',
      jwtExpiresIn: '24h' as const,
      eventTimeoutMs: 5000,
      keyManagementMode: 'development' as const
    };

    const middleware = createNostrAuth(config as NostrAuthConfig);
    expect(middleware).toBeInstanceOf(NostrAuthMiddleware);
    expect(middleware.getRouter).toBeDefined();
    expect(typeof middleware.getRouter).toBe('function');
  });
});
