import { describe, it, expect } from 'vitest';
import { NostrAuthMiddleware, createNostrAuth } from '../index';

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
    const config = {
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      privateKey: 'test-private-key',
      port: 3000,
      keyManagementMode: 'development' as const
    };

    const middleware = createNostrAuth(config);
    expect(middleware).toBeInstanceOf(NostrAuthMiddleware);
    expect(middleware.getRouter()).toBeDefined();
  });
});
