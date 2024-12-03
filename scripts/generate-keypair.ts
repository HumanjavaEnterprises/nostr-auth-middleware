import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex } from '@noble/hashes/utils';
import { getPublicKey } from 'nostr-tools';

// Generate a random private key
const privateKeyBytes = schnorr.utils.randomPrivateKey();
const privateKeyHex = bytesToHex(privateKeyBytes);
const publicKeyHex = getPublicKey(privateKeyBytes);

console.log('Generated Nostr keypair:');
console.log('------------------------');
console.log('Private key:', privateKeyHex);
console.log('Public key:', publicKeyHex);
console.log('\nFor .env file:');
console.log('------------------------');
console.log('SERVER_PRIVATE_KEY=' + privateKeyHex);
console.log('SERVER_PUBLIC_KEY=' + publicKeyHex);
