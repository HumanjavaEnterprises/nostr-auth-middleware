import { NostrEvent } from './types.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr } from '@noble/curves/secp256k1';
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

// Generate event hash
export function generateEventHash(event: Partial<NostrEvent>): string {
    const serialized = serializeEvent(event);
    const hash = sha256(Buffer.from(serialized));
    return bytesToHex(hash);
}

// Sign an event hash
async function signHash(hash: Uint8Array, privateKey: Uint8Array): Promise<string> {
    const signature = await schnorr.sign(hash, privateKey);
    return bytesToHex(signature);
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

    // Generate event hash
    const id = generateEventHash(unsignedEvent);
    
    // Sign the event hash
    const hash = hexToBytes(id);
    const signature = await schnorr.sign(hash, privateKeyBytes);

    // Create the final event
    const challengeEvent: NostrEvent = {
        ...unsignedEvent,
        id,
        sig: bytesToHex(signature)
    };

    return challengeEvent;
}

export function getPublicKey(privateKey: Uint8Array): string {
    const pubkey = schnorr.getPublicKey(privateKey);
    return bytesToHex(pubkey);
}

export async function verifySignature(signature: string, hash: Uint8Array, publicKey: string): Promise<boolean> {
    try {
        return await schnorr.verify(
            hexToBytes(signature),
            hash,
            hexToBytes(publicKey)
        );
    } catch (error) {
        console.error('Failed to verify signature:', error);
        return false;
    }
}

export async function signNostrEvent(event: NostrEvent, privateKey: Uint8Array): Promise<NostrEvent> {
    const hash = hexToBytes(generateEventHash(event));
    const sig = await signHash(hash, privateKey);
    return { ...event, sig };
}

export function generateKeyPair() {
    const privateKey = schnorr.utils.randomPrivateKey();
    const publicKey = schnorr.getPublicKey(privateKey);
    return {
        privateKey: bytesToHex(privateKey),
        publicKey: bytesToHex(publicKey)
    };
}
