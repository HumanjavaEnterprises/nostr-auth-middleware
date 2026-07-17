/**
 * End-to-end integration tests for the challenge/verify flow.
 *
 * These tests use REAL nostr-crypto-utils (no vi.mock of NostrService or the
 * crypto layer) and drive the exact event-construction/signing that the bundled
 * NostrBrowserAuth (NIP-07) and Nip46AuthHandler clients perform. They exercise
 * BOTH storage branches: the default in-memory store and a stubbed Supabase
 * client. This is the coverage that was missing and that hid the account-takeover
 * bug: the previous middleware tests fully mocked NostrService and never ran a
 * real signature through verifyChallenge.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  generateKeyPair,
  getPublicKeySync,
  finalizeEvent,
} from 'nostr-crypto-utils';
import { NostrService } from '../services/nostr.service.js';
import type { NostrEvent, NostrAuthConfig, JWTExpiresIn } from '../types.js';

const baseConfig: NostrAuthConfig = {
  jwtSecret: 'integration-test-secret',
  jwtExpiresIn: '1h' as JWTExpiresIn,
  eventTimeoutMs: 300000,
  keyManagementMode: 'development',
  challengePrefix: 'nostr:auth:',
};

/** Generate a signer keypair; returns { priv, pub } with pub as 64-hex string. */
async function makeKeys(): Promise<{ priv: string; pub: string }> {
  const kp = await generateKeyPair();
  const priv = kp.privateKey;
  const pub = getPublicKeySync(priv);
  return { priv, pub };
}

/**
 * Builds and signs a challenge event exactly as the bundled clients do:
 * kind 22242, content = 'Sign this message to authenticate: <challenge>',
 * tags = [['p', pubkey], ['challenge', challenge]].
 */
async function signChallengeEvent(
  priv: string,
  pubkey: string,
  challenge: string,
  overrides: Partial<NostrEvent> = {}
): Promise<NostrEvent> {
  const unsigned: NostrEvent = {
    kind: 22242,
    created_at: Math.floor(Date.now() / 1000),
    content: `Sign this message to authenticate: ${challenge}`,
    tags: [
      ['p', pubkey],
      ['challenge', challenge],
    ],
    ...overrides,
  };
  const signed = await finalizeEvent(unsigned, priv);
  return signed as unknown as NostrEvent;
}

/**
 * Minimal in-memory fake of the Supabase query-builder surface used by
 * NostrService (from/insert/delete/select/eq/order/limit/maybeSingle).
 */
function makeFakeSupabase() {
  let rows: Record<string, unknown>[] = [];

  function builder() {
    const state: { op: string | null; filters: [string, unknown][]; values: Record<string, unknown>[] | null } = {
      op: null,
      filters: [],
      values: null,
    };

    const match = (row: Record<string, unknown>) =>
      state.filters.every(([c, v]) => row[c] === v);

    const exec = async (single: boolean) => {
      if (state.op === 'insert') {
        rows.push(...(state.values ?? []).map((v) => ({ ...v })));
        return { data: state.values, error: null };
      }
      if (state.op === 'delete') {
        rows = rows.filter((r) => !match(r));
        return { data: null, error: null };
      }
      if (state.op === 'select') {
        const res = rows.filter(match);
        if (single) return { data: res[0] ?? null, error: null };
        return { data: res, error: null };
      }
      return { data: null, error: null };
    };

    const api: Record<string, unknown> = {
      insert(vals: Record<string, unknown>[]) { state.op = 'insert'; state.values = vals; return api; },
      delete() { state.op = 'delete'; return api; },
      select() { state.op = 'select'; return api; },
      eq(col: string, val: unknown) { state.filters.push([col, val]); return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle() { return exec(true); },
      single() { return exec(true); },
      then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
        return exec(false).then(resolve, reject);
      },
    };
    return api;
  }

  return {
    client: { from: () => builder() },
    rowCount: () => rows.length,
  };
}

/** Constructs a service that uses a stubbed Supabase client. */
function makeSupabaseService() {
  const service = new NostrService(baseConfig);
  const fake = makeFakeSupabase();
  // Inject the fake store; the constructor only wires supabase when url+key given.
  (service as unknown as { supabase: unknown }).supabase = fake.client;
  return { service, fake };
}

const services: NostrService[] = [];
function track(s: NostrService): NostrService {
  services.push(s);
  return s;
}

afterEach(() => {
  while (services.length) services.pop()?.destroy();
});

describe('NostrService challenge/verify — in-memory store', () => {
  it('(a) happy path: a correctly signed challenge event verifies', async () => {
    const service = track(new NostrService(baseConfig));
    const { priv, pub } = await makeKeys();

    const challenge = await service.createChallenge(pub);
    const event = await signChallengeEvent(priv, pub, challenge);

    const result = await service.verifyChallenge(event);
    expect(result.success).toBe(true);
    expect(result.pubkey).toBe(pub);
  });

  it('(b) account-takeover rejected: a valid signature over an UNRELATED event fails', async () => {
    const service = track(new NostrService(baseConfig));
    const { priv, pub } = await makeKeys();

    const challenge = await service.createChallenge(pub);

    // Wrong kind (a kind-1 note the victim signed elsewhere), even carrying the challenge tag.
    const kind1 = await signChallengeEvent(priv, pub, challenge, { kind: 1 });
    expect((await service.verifyChallenge(kind1)).success).toBe(false);

    // No challenge tag at all.
    const noTag = await signChallengeEvent(priv, pub, challenge, { tags: [['p', pub]] });
    expect((await service.verifyChallenge(noTag)).success).toBe(false);

    // Right kind + a challenge tag, but a DIFFERENT (unissued) challenge value.
    const otherChallenge = 'nostr:auth: ' + 'ff'.repeat(32);
    const wrongChallenge = await signChallengeEvent(priv, pub, otherChallenge);
    const wrongResult = await service.verifyChallenge(wrongChallenge);
    expect(wrongResult.success).toBe(false);
    expect(wrongResult.error).toBe('Challenge not found');
  });

  it('(c) challenges are unique random nonces, never the pubkey', async () => {
    const service = track(new NostrService(baseConfig));
    const { pub } = await makeKeys();

    const c1 = await service.createChallenge(pub);
    const c2 = await service.createChallenge(pub);

    expect(c1).not.toBe(c2);
    expect(c1).not.toContain(pub);
    expect(c2).not.toContain(pub);
    // 32-byte hex nonce embedded in the prefixed challenge string.
    expect(c1).toMatch(/[0-9a-f]{64}/);
    expect(c2).toMatch(/[0-9a-f]{64}/);
  });

  it('(d) replayed challenge is rejected (single-use)', async () => {
    const service = track(new NostrService(baseConfig));
    const { priv, pub } = await makeKeys();

    const challenge = await service.createChallenge(pub);
    const event = await signChallengeEvent(priv, pub, challenge);

    expect((await service.verifyChallenge(event)).success).toBe(true);
    const replay = await service.verifyChallenge(event);
    expect(replay.success).toBe(false);
    expect(replay.error).toBe('Challenge not found');
  });

  it('rejects a tampered signature', async () => {
    const service = track(new NostrService(baseConfig));
    const { priv, pub } = await makeKeys();
    const challenge = await service.createChallenge(pub);
    const event = await signChallengeEvent(priv, pub, challenge);
    const tampered = { ...event, sig: 'a'.repeat(128) };
    expect((await service.verifyChallenge(tampered)).success).toBe(false);
  });
});

describe('NostrService challenge/verify — stubbed Supabase store', () => {
  it('(a) happy path: a correctly signed challenge event verifies', async () => {
    const { service } = makeSupabaseService();
    track(service);
    const { priv, pub } = await makeKeys();

    const challenge = await service.createChallenge(pub);
    const event = await signChallengeEvent(priv, pub, challenge);

    const result = await service.verifyChallenge(event);
    expect(result.success).toBe(true);
    expect(result.pubkey).toBe(pub);
  });

  it('(b) account-takeover rejected: unrelated signed event does not authenticate', async () => {
    const { service } = makeSupabaseService();
    track(service);
    const { priv, pub } = await makeKeys();

    // Attacker requests a challenge for the victim pubkey...
    await service.createChallenge(pub);

    // ...then submits an unrelated kind-1 note the victim signed (the classic takeover).
    const kind1 = await signChallengeEvent(priv, pub, 'anything', { kind: 1 });
    expect((await service.verifyChallenge(kind1)).success).toBe(false);

    // A valid kind-22242 event bound to a DIFFERENT, unissued challenge is rejected.
    const otherChallenge = 'nostr:auth: ' + 'ab'.repeat(32);
    const wrong = await signChallengeEvent(priv, pub, otherChallenge);
    expect((await service.verifyChallenge(wrong)).success).toBe(false);
  });

  it('(d) replayed challenge is rejected (single-use)', async () => {
    const { service } = makeSupabaseService();
    track(service);
    const { priv, pub } = await makeKeys();

    const challenge = await service.createChallenge(pub);
    const event = await signChallengeEvent(priv, pub, challenge);

    expect((await service.verifyChallenge(event)).success).toBe(true);
    expect((await service.verifyChallenge(event)).success).toBe(false);
  });

  it('does not lock out after a second challenge request (no .single() failure)', async () => {
    const { service, fake } = makeSupabaseService();
    track(service);
    const { priv, pub } = await makeKeys();

    // Two challenge requests before verifying (reload / double-click).
    await service.createChallenge(pub);
    const challenge2 = await service.createChallenge(pub);
    // Prior rows are cleared, so exactly one live challenge remains.
    expect(fake.rowCount()).toBe(1);

    const event = await signChallengeEvent(priv, pub, challenge2);
    expect((await service.verifyChallenge(event)).success).toBe(true);
  });
});
