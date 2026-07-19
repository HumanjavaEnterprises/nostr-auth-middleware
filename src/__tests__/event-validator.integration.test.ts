/**
 * Unit tests for the core validators and crypto helpers, running against REAL
 * nostr-crypto-utils (no mocks). These directly exercise the primitives that the
 * middleware tests previously mocked away.
 */

import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  getPublicKeySync,
  finalizeEvent,
} from 'nostr-crypto-utils';
import {
  validateEvent,
  validateChallengeEvent,
  getChallengeTagValue,
} from '../validators/event.validator.js';
import { generateChallenge, generateEventHash } from '../utils/crypto.utils.js';
import type { NostrEvent } from '../types.js';

async function keys() {
  const kp = await generateKeyPair();
  return { priv: kp.privateKey, pub: getPublicKeySync(kp.privateKey) };
}

describe('validateEvent', () => {
  it('accepts a validly-signed event whose content is empty (NIP-01 legal)', async () => {
    const { priv } = await keys();
    const signed = (await finalizeEvent(
      { kind: 22242, created_at: Math.floor(Date.now() / 1000), content: '', tags: [['challenge', 'x']] },
      priv
    )) as unknown as NostrEvent;

    const result = await validateEvent(signed);
    expect(result.success).toBe(true);
  });

  it('rejects an event with a malformed signature', async () => {
    const { priv, pub } = await keys();
    const signed = (await finalizeEvent(
      { kind: 22242, created_at: Math.floor(Date.now() / 1000), content: 'hi', tags: [] },
      priv
    )) as unknown as NostrEvent;
    const bad = { ...signed, pubkey: pub, sig: 'z'.repeat(128) };
    expect((await validateEvent(bad)).success).toBe(false);
  });
});

describe('validateChallengeEvent', () => {
  it('passes for a real kind-22242 event with a challenge tag and matching id/sig', async () => {
    const { priv } = await keys();
    const signed = (await finalizeEvent(
      { kind: 22242, created_at: Math.floor(Date.now() / 1000), content: 'auth', tags: [['challenge', 'nonce123']] },
      priv
    )) as unknown as NostrEvent;

    // Sanity: generateEventHash now resolves to the real id (async, awaited).
    expect(await generateEventHash(signed)).toBe(signed.id);
    expect(await validateChallengeEvent(signed)).toBe(true);
    expect(getChallengeTagValue(signed)).toBe('nonce123');
  });

  it('fails for the wrong kind', async () => {
    const { priv } = await keys();
    const signed = (await finalizeEvent(
      { kind: 1, created_at: Math.floor(Date.now() / 1000), content: 'note', tags: [['challenge', 'n']] },
      priv
    )) as unknown as NostrEvent;
    expect(await validateChallengeEvent(signed)).toBe(false);
  });

  it('fails when the event id has been tampered (hash mismatch)', async () => {
    const { priv } = await keys();
    const signed = (await finalizeEvent(
      { kind: 22242, created_at: Math.floor(Date.now() / 1000), content: 'auth', tags: [['challenge', 'n']] },
      priv
    )) as unknown as NostrEvent;
    const tampered = { ...signed, id: 'deadbeef'.repeat(8) };
    expect(await validateChallengeEvent(tampered)).toBe(false);
  });
});

describe('generateChallenge', () => {
  it('produces a random 64-hex nonce (not the pubkey) carried in the challenge tag', async () => {
    const { priv, pub } = await keys();
    const a = await generateChallenge(priv, pub);
    const b = await generateChallenge(priv, pub);

    expect(a.challenge).toMatch(/^[0-9a-f]{64}$/);
    expect(a.challenge).not.toBe(b.challenge);
    expect(a.challenge).not.toBe(pub);
    // The nonce is bound in the ['challenge', ...] tag; pubkey in a separate ['p', ...] tag.
    expect(getChallengeTagValue(a.event)).toBe(a.challenge);
    expect(a.event.tags).toContainEqual(['p', pub]);
    expect(await validateChallengeEvent(a.event)).toBe(true);
  });
});
