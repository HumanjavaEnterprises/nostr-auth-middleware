import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from './utils/logger.js';
import { NostrAuthMiddleware } from './middleware/nostr-auth.middleware.js';
import { config } from './config/index.js';

const logger = createLogger('Server');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Nostr auth middleware
const nostrAuth = new NostrAuthMiddleware({
  port: config.port,
  nodeEnv: config.nodeEnv,
  corsOrigins: config.corsOrigins,
  nostrRelays: config.nostrRelays ?? [
    'wss://relay.maiqr.app',
    'wss://relay.damus.io',
    'wss://relay.nostr.band'
  ],
  eventTimeoutMs: 5000,
  challengePrefix: 'nostr:auth:',
  supabaseUrl: config.supabaseUrl,
  supabaseKey: config.supabaseKey,
  jwtSecret: config.jwtSecret,
  testMode: config.testMode,
  privateKey: config.privateKey,
  publicKey: config.publicKey,
  keyManagementMode: config.keyManagementMode
});

// Mount Nostr auth routes
app.use('/auth/nostr', nostrAuth.getRouter());

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Nostr Auth Middleware running on port ${PORT}`);
  logger.info(`Connected to Supabase at ${config.supabaseUrl}`);
  logger.info(`Using Nostr relays: ${config.nostrRelays?.join(', ') ?? 'default relays'}`);
});
