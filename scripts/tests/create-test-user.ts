import * as nostrTools from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import { randomBytes } from '@noble/hashes/utils';

function createTestUser() {
  // Generate a new private key (32 random bytes)
  const privateKeyBytes = new Uint8Array(randomBytes(32));
  const sk = bytesToHex(privateKeyBytes);
  const pk = nostrTools.getPublicKey(privateKeyBytes);
  
  // Convert to bech32 format
  const nsec = nostrTools.nip19.nsecEncode(privateKeyBytes);
  const npub = nostrTools.nip19.npubEncode(pk);
  
  console.log('\nGenerated test user credentials:');
  console.log('--------------------------------');
  console.log('Public Key (npub):', npub);
  console.log('Private Key (nsec):', nsec);
  console.log('--------------------------------\n');
  
  return { sk, pk, nsec, npub };
}

createTestUser();
