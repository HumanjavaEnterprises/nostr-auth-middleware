import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { randomBytes } from 'crypto';

// We'll use a more direct approach to handle the ESM module
let secp256k1: any = null;
let importPromise: Promise<any> | null = null;

async function getSecp256k1() {
    if (secp256k1) return secp256k1;
    
    if (!importPromise) {
        importPromise = (async () => {
            try {
                const secp = await import('@noble/secp256k1');
                secp256k1 = secp.default || secp;
                return secp256k1;
            } catch (error) {
                console.error('Failed to load secp256k1:', error);
                throw error;
            }
        })();
    }
    
    return importPromise;
}

export async function verifySignature(signature: string, hash: Uint8Array, publicKey: string): Promise<boolean> {
    try {
        const secp = await getSecp256k1();
        return await secp.verify(signature, hash, publicKey);
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

export function generateEventHash(event: any): string {
    const serialized = JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content
    ]);
    const hash = sha256(Uint8Array.from(Buffer.from(serialized)));
    return bytesToHex(hash);
}

export async function signEvent(event: any, privateKey: string): Promise<string> {
    const hash = generateEventHash(event);
    const secp = await getSecp256k1();
    const sig = await secp.sign(hash, privateKey);
    return bytesToHex(sig);
}

export function generateChallenge(): string {
    return randomBytes(32).toString('hex');
}

export async function getPublicKey(privateKey: string): Promise<string> {
    const secp = await getSecp256k1();
    const pubkey = secp.getPublicKey(privateKey, true);
    return bytesToHex(pubkey);
}

export async function generateKeyPair(): Promise<{ privateKey: string, publicKey: string }> {
    const privateKey = randomBytes(32).toString('hex');
    const publicKey = await getPublicKey(privateKey);
    return { privateKey, publicKey };
}

export async function signNostrEvent(event: any, privateKey: string): Promise<any> {
    event.id = generateEventHash(event);
    const signature = await signEvent(event, privateKey);
    event.sig = signature;
    return event;
}
