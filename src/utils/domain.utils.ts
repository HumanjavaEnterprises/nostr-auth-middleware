import { createLogger } from './logger.js';

const logger = createLogger('DomainUtils');

export interface ServiceUrls {
  auth: string;
  ipfs: string;
  relay: string;
  magiclink: string;
  wallet: string;
}

/**
 * Get the base domain for the environment
 */
export function getBaseDomain(): string {
  return process.env.DOMAIN || 'nostr-platform.app';
}

/**
 * Get the current service name
 */
export function getCurrentService(): string {
  return process.env.SERVICE_NAME || 'auth';
}

/**
 * Get the full domain for a service in the current environment
 */
export function getServiceDomain(service: string): string {
  const baseDomain = getBaseDomain();
  return `${service}.${baseDomain}`;
}

/**
 * Get the URL for a service in the current environment
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
 * Get all service URLs for the current environment
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
 * Get CORS origins for all services
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
