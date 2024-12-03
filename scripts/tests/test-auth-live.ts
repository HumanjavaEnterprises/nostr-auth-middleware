import axios from 'axios';
import { getPublicKey, getEventHash, finalizeEvent } from 'nostr-tools';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr } from '@noble/curves/secp256k1';

// Define NostrEvent type to avoid conflict with DOM Event
interface NostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey: string;
  id: string;
  sig: string;
}

// Generate a test key pair
const privKeyBytes = schnorr.utils.randomPrivateKey();
const TEST_PRIVKEY = bytesToHex(privKeyBytes);
const TEST_PUBKEY = getPublicKey(hexToBytes(TEST_PRIVKEY));

const BASE_URL = 'http://localhost:3002'; // Update if your server is on a different port

async function signEvent(event: NostrEvent, privateKey: Uint8Array): Promise<string> {
  try {
    // Sign with our private key
    const signedEvent = finalizeEvent(event, privateKey);
    return signedEvent.sig;
  } catch (error) {
    console.error('Failed to sign event:', error);
    throw error;
  }
}

async function testEndpoint(url: string, options: any): Promise<any> {
  try {
    console.log('Making request to:', url);
    console.log('With options:', JSON.stringify(options, null, 2));
    const response = await axios(url, options);
    return response.data;
  } catch (error: any) {
    console.error('Test failed:', {
      endpoint: url,
      status: error.response?.status,
      data: error.response?.data,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

async function testAuthFlow() {
  try {
    // 1. Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('Health check response:', healthResponse.data);

    // 2. Request challenge
    console.log('\n2. Requesting challenge...');
    const challengeResponse = await testEndpoint(`${BASE_URL}/auth/nostr/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { pubkey: TEST_PUBKEY }
    });

    console.log('Challenge received:', JSON.stringify(challengeResponse, null, 2));

    // Sign the challenge event with our private key
    const challengeEvent = challengeResponse.event;
    console.log('\nChallenge event:', JSON.stringify(challengeEvent, null, 2));

    const eventToSign: NostrEvent = {
      kind: 22242,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', challengeEvent.tags.find((tag: string[]) => tag[0] === 'p')?.[1] || ''],  // Server's pubkey
        ['challenge', challengeResponse.challengeId]
      ],
      content: `nostr:auth:${challengeResponse.challengeId}`,
      pubkey: TEST_PUBKEY,
      id: '',
      sig: ''
    };
  
    let finalizedEvent: NostrEvent; // Initialize the variable
    try {
      const privateKeyBytes = hexToBytes(TEST_PRIVKEY);
      finalizedEvent = finalizeEvent(eventToSign, privateKeyBytes);
      console.log('\nSigned response event:', JSON.stringify(finalizedEvent, null, 2));
    } catch (error) {
      console.error('Failed to sign event:', error);
      process.exit(1);
    }

    // Verify the challenge
    console.log('\n3. Verifying signature...');
    const verifyRequest = {
      challengeId: challengeResponse.challengeId,
      signedEvent: finalizedEvent
    };
    console.log('\nSending verification request:', JSON.stringify(verifyRequest, null, 2));

    const verifyResponse = await axios.post(`${BASE_URL}/auth/nostr/verify`, verifyRequest, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Verification response:', JSON.stringify(verifyResponse.data, null, 2));
  } catch (error: any) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testAuthFlow();
