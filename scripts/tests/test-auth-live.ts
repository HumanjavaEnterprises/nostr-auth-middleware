import axios from 'axios';
import { getPublicKey, getEventHash, finalizeEvent } from 'nostr-tools';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr } from '@noble/curves/secp256k1';
import * as fs from 'fs';
import * as path from 'path';

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

interface TestConfig {
  baseUrl: string;
  deployDir: string;
  logDir: string;
  backupDir: string;
  isProduction: boolean;
}

// Environment-specific configuration
const getConfig = (): TestConfig => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  
  return {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    deployDir: isProduction ? '/opt/nostr-platform/auth' : './local',
    logDir: isProduction ? '/var/log/nostr-platform/auth' : './logs',
    backupDir: isProduction ? '/opt/backups/nostr-platform/auth' : './backups',
    isProduction
  };
};

// Generate a test key pair
const privKeyBytes = schnorr.utils.randomPrivateKey();
const TEST_PRIVKEY = bytesToHex(privKeyBytes);
const TEST_PUBKEY = getPublicKey(hexToBytes(TEST_PRIVKEY));

async function signEvent(event: NostrEvent, privateKey: Uint8Array): Promise<string> {
  try {
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

async function testEnvironmentSetup(config: TestConfig) {
  console.log(`Testing environment setup for ${config.isProduction ? 'production' : 'development'} mode...`);
  
  // Test directory structure
  const dirs = [config.deployDir, config.logDir, config.backupDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory not found: ${dir}`);
    }
    console.log(`✓ Directory exists: ${dir}`);
  }
  
  // Test permissions
  if (config.isProduction) {
    // Production-specific checks
    try {
      fs.accessSync(config.deployDir, fs.constants.R_OK | fs.constants.W_OK);
      console.log('✓ Production directory permissions are correct');
    } catch (error) {
      throw new Error('Production directory permissions are incorrect');
    }
  }
  
  // Test configuration
  const configFile = path.join(config.deployDir, 'config.json');
  if (!fs.existsSync(configFile)) {
    throw new Error('Configuration file not found');
  }
  console.log('✓ Configuration file exists');
  
  console.log('Environment setup tests passed');
}

async function testKeyManagement(config: TestConfig) {
  console.log(`Testing key management for ${config.isProduction ? 'production' : 'development'} mode...`);
  
  if (config.isProduction) {
    // Test Supabase key access
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Supabase credentials not configured');
    }
    console.log('✓ Supabase credentials configured');
  } else {
    // Test local key files
    const keyFiles = ['private.key', 'public.key'];
    for (const file of keyFiles) {
      const keyPath = path.join(config.deployDir, 'keys', file);
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Key file not found: ${file}`);
      }
    }
    console.log('✓ Local key files exist');
  }
  
  console.log('Key management tests passed');
}

async function testAuthFlow(config: TestConfig) {
  console.log('Testing authentication flow...');
  
  // Test challenge request
  const challengeResponse = await testEndpoint(`${config.baseUrl}/auth/nostr/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { pubkey: TEST_PUBKEY }
  });
  
  if (!challengeResponse.challengeId) {
    throw new Error('Challenge request failed');
  }
  console.log('✓ Challenge request successful');
  
  // Create and sign verification event
  const event: NostrEvent = {
    kind: 22242,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['challenge', challengeResponse.challengeId]],
    content: `nostr:auth:${challengeResponse.challengeId}`,
    pubkey: TEST_PUBKEY,
    id: '',
    sig: ''
  };
  
  event.id = getEventHash(event);
  event.sig = await signEvent(event, hexToBytes(TEST_PRIVKEY));
  
  // Test verification
  const verifyResponse = await testEndpoint(`${config.baseUrl}/auth/nostr/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {
      challengeId: challengeResponse.challengeId,
      signedEvent: event
    }
  });
  
  if (!verifyResponse.success || !verifyResponse.token) {
    throw new Error('Verification failed');
  }
  console.log('✓ Verification successful');
  
  console.log('Authentication flow tests passed');
}

async function runTests() {
  try {
    const config = getConfig();
    console.log(`Running tests in ${config.isProduction ? 'production' : 'development'} mode`);
    
    await testEnvironmentSetup(config);
    await testKeyManagement(config);
    await testAuthFlow(config);
    
    console.log('\nAll tests passed successfully! 🎉');
  } catch (error) {
    console.error('\nTest suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
