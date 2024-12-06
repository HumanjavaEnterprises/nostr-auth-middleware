import { NostrEvent } from './types';
import { 
  generateKeyPair as generateNostrKeyPair,
  getPublicKey as getNostrPublicKey,
  signEvent,
  verifySignature as verifyNostrSignature,
  generateEventHash as generateNostrEventHash
} from '@humanjavaenterprises/nostr-crypto-utils';
import { hexToBytes } from '@noble/hashes/utils';
import crypto from 'crypto';

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
  return generateNostrKeyPair();
}

export function getPublicKey(privateKey: Uint8Array): string {
  return getNostrPublicKey(privateKey);
}

export async function verifySignature(signature: string, hash: Uint8Array, publicKey: string): Promise<boolean> {
  return verifyNostrSignature(signature, hash, publicKey);
}

export async function signNostrEvent(event: NostrEvent, privateKey: Uint8Array): Promise<NostrEvent> {
  return signEvent(event, privateKey);
}

export function generateEventHash(event: NostrEvent): string {
  return generateNostrEventHash(event);
}

export async function generateChallenge(serverPrivateKey: string, clientPubkey: string): Promise<NostrEvent> {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomValue = crypto.randomBytes(32).toString('hex');
  const privateKeyBytes = hexToBytes(serverPrivateKey);
  const pubkey = getPublicKey(privateKeyBytes);
  
  const unsignedEvent = {
    kind: 22242,
    created_at: timestamp,
    tags: [
      ['p', clientPubkey],
      ['relay', 'wss://relay.damus.io'],
      ['challenge', randomValue]
    ],
    content: '',
    pubkey
  };

  // Generate event hash and sign using our crypto utils
  const id = generateEventHash(unsignedEvent);
  const signedEvent = await signNostrEvent(unsignedEvent, privateKeyBytes);

  return {
    ...unsignedEvent,
    id,
    sig: signedEvent.sig
  };
}
