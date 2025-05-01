/**
 * Utility functions for managing API tokens and authentication
 * This centralizes token management for external APIs
 */

/**
 * Get a token for the specified API service
 * @param service The API service name (e.g., 'coresignal', 'pdl')
 * @returns The token or null if not available
 */
export function getApiToken(service: string): string | null {
  switch (service.toLowerCase()) {
    case 'coresignal':
      return process.env.CORESIGNAL_API_KEY || null;
    case 'pdl':
      return process.env.PDL_API_KEY || null;
    case 'hunter':
      return process.env.HUNTER_API_KEY || null;
    default:
      console.warn(`No token configuration for service: ${service}`);
      return null;
  }
}

/**
 * Format a token according to the authentication scheme required by the API
 * @param token The raw token
 * @param authScheme The authentication scheme (e.g., 'bearer', 'basic')
 * @returns The formatted token
 */
export function formatToken(token: string | null, authScheme: 'bearer' | 'basic' | 'api-key' = 'bearer'): string | null {
  if (!token) return null;
  
  switch (authScheme) {
    case 'bearer':
      return `Bearer ${token}`;
    case 'basic':
      return `Basic ${token}`;
    case 'api-key':
      return token;
    default:
      return token;
  }
}

/**
 * Get authentication headers for an API request
 * @param service The API service name
 * @param additionalHeaders Any additional headers to include
 * @returns Headers object for the API request
 */
export function getAuthHeaders(service: string, additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getApiToken(service);
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  if (!token) {
    console.warn(`No token available for service: ${service}`);
    return headers;
  }
  
  switch (service.toLowerCase()) {
    case 'coresignal':
      headers['Authorization'] = formatToken(token, 'bearer') as string;
      break;
    case 'pdl':
      headers['X-Api-Key'] = token;
      break;
    case 'hunter':
      // Hunter.io uses API key as a query parameter, not a header
      break;
    default:
      console.warn(`No header configuration for service: ${service}`);
  }
  
  return headers;
}
