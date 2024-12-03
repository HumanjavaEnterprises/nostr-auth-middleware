import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from './utils/logger.js';
import { NostrAuthMiddleware } from './middleware/nostr-auth.middleware.js';
import { validateApiKey, ipWhitelist, rateLimiter, securityHeaders } from './middleware/security.middleware.js';
import { config } from './config/index.js';

const logger = createLogger('Server');
const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy if behind a reverse proxy
app.set('trust proxy', config.security?.trustedProxies || false);

// Security Middleware
app.use(helmet());
app.use(securityHeaders);
app.use(ipWhitelist);
app.use(rateLimiter);

// CORS configuration
app.use(cors({
  origin: config.corsOrigins || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Health check endpoint (no API key required)
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

// Mount Nostr auth routes with API key validation
app.use('/auth/nostr', validateApiKey, nostrAuth.getRouter());

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
