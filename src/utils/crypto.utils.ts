import { 
  generateKeyPair as genKeyPair,
  getPublicKey as getNostrPublicKey,
  getEventHash,
  signEvent as signNostrEvent,
  verifySignature as verifyNostrSignature
} from '@humanjavaenterprises/nostr-crypto-utils';
import { hexToBytes } from '@noble/hashes/utils';
import crypto from 'crypto';
import { NostrEvent } from '../utils/types';

// Create a serialized event for hashing
function serializeEvent(event: Partial<NostrEvent>) {
    return JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content
    ]);
}

export function generateKeyPair() {
  return genKeyPair();
}

export function getPublicKey(privateKey: string): string {
  return getNostrPublicKey(privateKey);
}

export async function verifySignature(event: NostrEvent): Promise<boolean> {
  return verifyNostrSignature(event);
}

export function generateEventHash(event: Partial<NostrEvent>): string {
  return getEventHash(event as NostrEvent);
}

export async function signEvent(event: NostrEvent, privateKey: string): Promise<NostrEvent> {
  return signNostrEvent(event, privateKey);
}

export function generateChallenge(pubkey: string): NostrEvent {
  const now = Math.floor(Date.now() / 1000);
  const event: NostrEvent = {
    kind: 22242,
    created_at: now,
    tags: [['challenge', pubkey]],
    content: 'Authentication request',
    pubkey: pubkey,
    id: '',
    sig: ''
  };

  event.id = getEventHash(event);
  event.sig = signNostrEvent(event, pubkey) as unknown as string;

  return event;
}

export async function signChallenge(challenge: string, privateKey: string): Promise<NostrEvent> {
  const now = Math.floor(Date.now() / 1000);
  const event: NostrEvent = {
    kind: 22242,
    created_at: now,
    tags: [['challenge', challenge]],
    content: 'Authentication response',
    pubkey: getPublicKey(privateKey),
    id: '',
    sig: ''
  };

  event.id = getEventHash(event);
  const signedEvent = await signNostrEvent(event, privateKey);
  return signedEvent;
}

export async function generateChallengeServer(serverPrivateKey: string, clientPubkey: string): Promise<NostrEvent> {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomValue = crypto.randomBytes(32).toString('hex');
  const pubkey = getPublicKey(serverPrivateKey);
  
  const event: NostrEvent = {
    kind: 22242,
    created_at: timestamp,
    tags: [
      ['p', clientPubkey],
      ['relay', 'wss://relay.damus.io'],
      ['challenge', randomValue]
    ],
    content: '',
    pubkey,
    id: '',
    sig: ''
  };

  // Generate event hash and sign using our crypto utils
  event.id = generateEventHash(event);
  const signedEvent = await signNostrEvent(event, serverPrivateKey);
  return signedEvent;
}
