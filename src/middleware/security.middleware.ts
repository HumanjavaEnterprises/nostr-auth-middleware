import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SecurityMiddleware');

// API Key validation
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  const validApiKeys = process.env.API_KEYS?.split(',') || [];

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

// IP whitelist middleware
export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',').filter(Boolean) || [];
  
  // If no IPs are specified, allow all
  if (allowedIPs.length === 0) {
    return next();
  }

  const clientIP = req.ip;
  if (!clientIP || !allowedIPs.includes(clientIP)) {
    logger.warn(`Blocked request from unauthorized IP: ${clientIP || 'unknown'}`);
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // Default 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Default 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, please try again later' });
  },
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // No Sniff
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Frame Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
};
