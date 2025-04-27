/**
 * Lead Generation Service Types
 * Core types and interfaces for the multi-API lead generation system
 */

export interface LeadSource {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  priority: number; // Higher number = higher priority
  apiKeyEnvVar: string;
  hasValidConfig: boolean;
}

export interface LeadSearchFilters {
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  jobLevel?: string;
  domain?: string;
  name?: string;
  email?: string;
}

/**
 * Result metadata for search results
 */
export interface LeadSearchMetadata {
  total?: number;
  remaining?: number;
  query?: any;
  filtersCovered: string[];
  error?: string;
  usageLimitReached?: boolean;
}

export interface LeadSearchResults {
  sourceId: string;
  sourceName: string;
  leads: any[];
  metadata: LeadSearchMetadata;
}

export interface LeadEnrichmentResult {
  sourceId: string;
  sourceName: string;
  originalLead: any;
  enrichedData: any;
  confidence: number; // 0-1 score of match confidence
  fieldsEnriched: string[];
}

/**
 * Interface for all lead generation services (PDL, Hunter, etc.)
 */
export interface LeadGenerationService {
  // Service identification
  id: string;
  name: string;
  description: string;
  
  // Service capabilities
  supportsSearch: boolean;
  supportsEnrichment: boolean;
  supportsVerification: boolean;
  
  // Supported filters list
  supportedFilters: string[];
  
  // Core methods
  search(filters: LeadSearchFilters): Promise<LeadSearchResults>;
  enrich?(lead: any): Promise<LeadEnrichmentResult>;
  verify?(email: string): Promise<{
    isValid: boolean;
    score: number;
    status: string;
    details?: any;
  }>;
  
  // Email finder method (Hunter specific)
  findEmail?(firstName: string, lastName: string, domain: string): Promise<{
    email: string;
    score: number;
    status: string;
    verified: boolean;
  }>;
  
  // Service management
  isConfigured(): Promise<boolean>;
  getStatus(): Promise<{
    available: boolean;
    quotaRemaining?: number;
    error?: string;
  }>;
}
