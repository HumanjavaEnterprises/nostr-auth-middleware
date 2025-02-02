/**
 * @fileoverview Domain and service URL utilities for the Nostr platform
 * Provides functions for managing service URLs across different environments
 * @module domain-utils
 */

import { createLogger } from './logger.js';

const logger = createLogger('DomainUtils');

/**
 * Interface for service URLs across the platform
 * @interface ServiceUrls
 */
export interface ServiceUrls {
  /** Authentication service URL */
  auth: string;
  /** IPFS service URL */
  ipfs: string;
  /** Nostr relay service URL */
  relay: string;
  /** Magic link service URL */
  magiclink: string;
  /** Wallet service URL */
  wallet: string;
}

/**
 * Gets the base domain for the environment
 * @returns {string} Base domain (e.g., 'nostr-platform.app')
 * @example
 * const domain = getBaseDomain(); // Returns 'nostr-platform.app' or value from DOMAIN env var
 */
export function getBaseDomain(): string {
  return process.env.DOMAIN || 'nostr-platform.app';
}

/**
 * Gets the current service name
 * @returns {string} Current service name (defaults to 'auth')
 * @example
 * const service = getCurrentService(); // Returns 'auth' or value from SERVICE_NAME env var
 */
export function getCurrentService(): string {
  return process.env.SERVICE_NAME || 'auth';
}

/**
 * Gets the full domain for a service in the current environment
 * @param {string} service - Service name (e.g., 'auth', 'ipfs')
 * @returns {string} Full service domain
 * @example
 * const domain = getServiceDomain('auth'); // Returns 'auth.nostr-platform.app'
 */
export function getServiceDomain(service: string): string {
  const baseDomain = getBaseDomain();
  return `${service}.${baseDomain}`;
}

/**
 * Gets the URL for a service in the current environment
 * @param {string} service - Service name (e.g., 'auth', 'ipfs')
 * @returns {string} Full service URL with protocol
 * @description
 * In development:
 * - Uses environment variables (e.g., AUTH_SERVICE_URL)
 * - Falls back to localhost:3002 if not configured
 * 
 * In production:
 * - Constructs HTTPS URLs using service domains
 * @example
 * // Development
 * const devUrl = getServiceUrl('auth'); // Returns value from AUTH_SERVICE_URL or 'http://localhost:3002'
 * 
 * // Production
 * const prodUrl = getServiceUrl('auth'); // Returns 'https://auth.nostr-platform.app'
 */
export function getServiceUrl(service: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, use the explicitly configured URLs
    const envKey = `${service.toUpperCase()}_SERVICE_URL`;
    const devUrl = process.env[envKey];
    if (!devUrl) {
      logger.warn(`No development URL configured for service: ${service}`);
      return `http://localhost:3002`; // Default fallback
    }
    return devUrl;
  }
  
  // In production, construct the URL from the domain
  const serviceDomain = getServiceDomain(service);
  return `https://${serviceDomain}`;
}

/**
 * Gets all service URLs for the current environment
 * @returns {ServiceUrls} Object containing URLs for all services
 * @example
 * const urls = getAllServiceUrls();
 * console.log(urls.auth); // Auth service URL
 * console.log(urls.ipfs); // IPFS service URL
 */
export function getAllServiceUrls(): ServiceUrls {
  return {
    auth: getServiceUrl('auth'),
    ipfs: getServiceUrl('ipfs'),
    relay: getServiceUrl('relay'),
    magiclink: getServiceUrl('magiclink'),
    wallet: getServiceUrl('wallet')
  };
}

/**
 * Gets CORS origins for all services
 * @returns {string[]} Array of allowed CORS origins
 * @description
 * In development:
 * - Returns configured origins from CORS_ORIGINS env var
 * 
 * In production:
 * - Combines configured origins with all service domains
 * - Deduplicates the list
 * @example
 * const origins = getServiceCorsOrigins();
 * // Development: ['http://localhost:3000']
 * // Production: ['https://auth.nostr-platform.app', 'https://ipfs.nostr-platform.app', ...]
 */
export function getServiceCorsOrigins(): string[] {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const configuredOrigins = process.env.CORS_ORIGINS?.split(',') || [];
  
  if (isDevelopment) {
    return configuredOrigins;
  }
  
  // In production, include all service domains
  const serviceUrls = getAllServiceUrls();
  const serviceDomains = Object.values(serviceUrls);
  
  // Combine configured origins with service domains
  return [...new Set([...configuredOrigins, ...serviceDomains])];
}
