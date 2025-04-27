import axios from 'axios';
import { 
  LeadGenerationService, 
  LeadSearchFilters, 
  LeadSearchResults,
  LeadEnrichmentResult 
} from '../types';

/**
 * Hunter.io service implementation
 * Specializes in email discovery and verification
 */
export default class HunterService implements LeadGenerationService {
  id = 'hunter';
  name = 'Hunter.io';
  description = 'Email discovery and verification service';
  
  // Capabilities
  supportsSearch = true;
  supportsEnrichment = false;
  supportsVerification = true;
  
  // Supported filters
  supportedFilters = [
    'domain',
    'company',
    'name'
  ];
  
  /**
   * Search for leads using Hunter API
   */
  async search(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      const apiKey = process.env.HUNTER_API_KEY;
      if (!apiKey) {
        throw new Error('Hunter API key is missing');
      }

      // Hunter primarily searches by domain
      let domain = filters.domain;
      
      // If domain is not provided but company is, we can try to infer the domain
      if (!domain && filters.company && filters.company !== 'any') {
        try {
          // Transform company name to likely domain
          // E.g., "Google" -> "google.com"
          domain = filters.company.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim() + '.com';
        } catch (e) {
          console.error('Error inferring domain from company name:', e);
        }
      }
      
      if (!domain) {
        // Instead of throwing an error, return an empty result set
        console.log('No domain provided for Hunter search, returning empty results');
        return {
          sourceId: this.id,
          sourceName: this.name,
          leads: [],
          metadata: {
            total: 0,
            query: { error: 'Domain is required' },
            filtersCovered: []
          }
        };
      }
      
      console.log(`Searching Hunter.io for domain: ${domain}`);
      
      // Call Hunter domain search API with proper parameters
      const response = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: {
          domain,
          api_key: apiKey,
          limit: 25
        }
      });
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Hunter API');
      }
      
      const { data } = response.data;
      console.log(`Hunter.io found ${data.emails?.length || 0} emails for domain ${domain}`);
      
      // Transform Hunter API response to our lead format
      const leads = (data.emails || []).map((email: any) => ({
        first_name: email.first_name || '',
        last_name: email.last_name || '',
        email: email.value || '',
        position: email.position || '',
        twitter: email.twitter || '',
        linkedin_url: email.linkedin || '',
        phone_number: email.phone_number || '',
        company: data.organization?.name || filters.company || '',
        domain: data.domain || '',
        // Add verification data if available
        email_quality: {
          deliverable: email.verification?.status === 'deliverable',
          quality_score: email.confidence?.toString() || '0',
          is_valid_format: email.verification?.status !== 'invalid'
        },
        // Create a minimal company_data object
        company_data: {
          name: data.organization?.name || '',
          industry: data.organization?.industry || '',
          linkedin_url: data.organization?.linkedin || '',
          location: {
            country: data.country || '',
            locality: data.city || ''
          }
        }
      }));
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        leads,
        metadata: {
          total: leads.length,
          query: { domain },
          filtersCovered: this.getFiltersCovered(filters)
        }
      };
      
    } catch (error) {
      console.error('Error searching with Hunter:', error);
      // Return empty results instead of throwing to allow other services to function
      return {
        sourceId: this.id,
        sourceName: this.name,
        leads: [],
        metadata: {
          total: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          filtersCovered: []
        }
      };
    }
  }
  
  /**
   * Verify an email address using Hunter API
   */
  async verify(email: string): Promise<{
    isValid: boolean; 
    score: number; 
    status: string;
    details?: any;
  }> {
    try {
      const apiKey = process.env.HUNTER_API_KEY;
      if (!apiKey) {
        throw new Error('Hunter API key is missing');
      }
      
      console.log(`Verifying email with Hunter.io: ${email}`);
      
      // Call Hunter email verification API
      const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
        params: {
          email,
          api_key: apiKey
        }
      });
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Hunter API');
      }
      
      const { data } = response.data;
      console.log(`Hunter verification result for ${email}: ${data.status}`);
      
      return {
        isValid: data.status === 'deliverable',
        score: data.score || 0,
        status: data.status || 'unknown',
        details: data
      };
      
    } catch (error) {
      console.error('Error verifying email with Hunter:', error);
      return {
        isValid: false,
        score: 0,
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
  
  /**
   * Find email by name and domain (Hunter email finder API)
   */
  async findEmail(firstName: string, lastName: string, domain: string): Promise<{
    email: string;
    score: number;
    status: string;
    verified: boolean;
  }> {
    try {
      const apiKey = process.env.HUNTER_API_KEY;
      if (!apiKey) {
        throw new Error('Hunter API key is missing');
      }
      
      if (!firstName || !lastName || !domain) {
        throw new Error('First name, last name, and domain are required');
      }
      
      console.log(`Finding email with Hunter.io for: ${firstName} ${lastName} at ${domain}`);
      
      try {
        // Call Hunter email finder API
        const response = await axios.get('https://api.hunter.io/v2/email-finder', {
          params: {
            domain,
            first_name: firstName,
            last_name: lastName,
            api_key: apiKey
          }
        });
        
        if (!response.data || !response.data.data) {
          throw new Error('Invalid response from Hunter API');
        }
        
        const { data } = response.data;
        console.log(`Hunter found email for ${firstName} ${lastName}: ${data.email || 'Not found'}`);
        
        return {
          email: data.email || '',
          score: data.score || 0,
          status: data.status || 'unknown',
          verified: data.verification?.status === 'deliverable'
        };
      } catch (error: any) {
        // Handle API permission errors (403)
        if (error.response?.status === 403) {
          console.warn(`Hunter.io API returned 403 Forbidden for ${firstName} ${lastName}. Check your subscription level.`);
          // Return empty result but don't throw, so the app can fall back to local guessing
          return {
            email: '',
            score: 0,
            status: 'api_access_denied',
            verified: false
          };
        }
        
        // Re-throw other errors
        throw error;
      }
    } catch (error) {
      console.error('Error finding email with Hunter:', error);
      return {
        email: '',
        score: 0,
        status: 'error',
        verified: false
      };
    }
  }
  
  /**
   * Check if this service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    return !!process.env.HUNTER_API_KEY;
  }
  
  /**
   * Get current service status
   */
  async getStatus(): Promise<{
    available: boolean;
    quotaRemaining?: number;
    error?: string;
  }> {
    try {
      const apiKey = process.env.HUNTER_API_KEY;
      if (!apiKey) {
        return {
          available: false,
          error: 'Hunter API key is missing'
        };
      }
      
      // Check account information
      const response = await axios.get('https://api.hunter.io/v2/account', {
        params: { api_key: apiKey }
      });
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Hunter API');
      }
      
      const { data } = response.data;
      
      return {
        available: true,
        quotaRemaining: data.calls?.available
      };
      
    } catch (error) {
      console.error('Error checking Hunter status:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error checking Hunter status'
      };
    }
  }
  
  /**
   * Get the filters that are covered by this search
   */
  private getFiltersCovered(filters: LeadSearchFilters): string[] {
    return Object.keys(filters)
      .filter(key => 
        filters[key as keyof LeadSearchFilters] && 
        this.supportedFilters.includes(key)
      );
  }
}
