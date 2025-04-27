import axios from 'axios';
import { 
  LeadGenerationService, 
  LeadSearchFilters, 
  LeadSearchResults,
  LeadEnrichmentResult 
} from '../types';

/**
 * Clearbit service implementation
 * Specializes in company and person data enrichment
 */
export default class ClearbitService implements LeadGenerationService {
  id = 'clearbit';
  name = 'Clearbit';
  description = 'High-quality company and person data enrichment';
  
  // Capabilities
  supportsSearch = true;
  supportsEnrichment = true;
  supportsVerification = false;
  
  // Supported filters
  supportedFilters = [
    'title',
    'company',
    'domain',
    'location'
  ];
  
  /**
   * Search for leads using Clearbit Prospector API
   */
  async search(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      const apiKey = process.env.CLEARBIT_API_KEY;
      if (!apiKey) {
        throw new Error('Clearbit API key is missing');
      }

      // Build query for Clearbit Prospector API
      const query: string[] = [];
      
      // Add title filter
      if (filters.title && filters.title !== 'any') {
        query.push(`role:${filters.title}`);
      }
      
      // Add job level filter (mapped to seniority)
      if (filters.jobLevel && filters.jobLevel !== 'any_level') {
        const seniorityMap: Record<string, string> = {
          'c_suite': 'executive',
          'vp': 'executive',
          'director': 'director',
          'manager': 'manager',
          'senior': 'senior',
          'entry': 'junior'
        };
        
        const seniority = seniorityMap[filters.jobLevel];
        if (seniority) {
          query.push(`seniority:${seniority}`);
        }
      }
      
      // Add company filter
      if (filters.company && filters.company !== 'any') {
        query.push(`company:${filters.company}`);
      }
      
      // Add domain filter
      if (filters.domain) {
        query.push(`domain:${filters.domain}`);
      }
      
      // Add location filter
      if (filters.location && filters.location !== 'any') {
        query.push(`location:${filters.location}`);
      }
      
      // Call Clearbit Prospector API
      const response = await axios.get('https://prospector.clearbit.com/v1/people/search', {
        params: {
          query: query.join(' '),
          limit: 25,
          email: true // Request email addresses
        },
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid response from Clearbit API');
      }
      
      // Transform Clearbit API response to our lead format
      const leads = response.data.map((person: any) => ({
        first_name: person.name.givenName,
        last_name: person.name.familyName,
        email: person.email,
        position: person.title,
        company: person.company.name,
        domain: person.company.domain,
        linkedin_url: person.linkedin.handle 
          ? `https://linkedin.com/in/${person.linkedin.handle}` 
          : null,
        status: person.email ? 'verified' : 'unverified',
        company_data: {
          name: person.company.name,
          industry: person.company.category?.industry,
          size: person.company.metrics?.employees?.toString(),
          location: {
            country: person.geo?.country,
            locality: person.geo?.city || ''
          },
          linkedin_url: person.company.linkedin?.handle 
            ? `https://linkedin.com/company/${person.company.linkedin.handle}` 
            : null
        },
        profile_data: {
          summary: `${person.title} at ${person.company.name}`,
          experiences: [{
            company: person.company.name,
            title: person.title,
            duration: 'Current'
          }]
        }
      }));
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        leads,
        metadata: {
          total: leads.length,
          query: { query: query.join(' ') },
          filtersCovered: this.getFiltersCovered(filters)
        }
      };
      
    } catch (error) {
      console.error('Error searching with Clearbit:', error);
      throw new Error(`Clearbit search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Enrich a lead with Clearbit API
   */
  async enrich(lead: any): Promise<LeadEnrichmentResult> {
    try {
      const apiKey = process.env.CLEARBIT_API_KEY;
      if (!apiKey) {
        throw new Error('Clearbit API key is missing');
      }
      
      // Determine the best parameters to use for enrichment
      if (!lead.email && !lead.domain) {
        throw new Error('Email or domain is required for Clearbit enrichment');
      }
      
      let enrichedPerson: any = null;
      let enrichedCompany: any = null;
      
      // Enrich person data if email is available
      if (lead.email) {
        try {
          const personResponse = await axios.get(`https://person.clearbit.com/v2/people/find`, {
            params: { email: lead.email },
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          
          if (personResponse.data) {
            enrichedPerson = personResponse.data;
          }
        } catch (error) {
          console.warn('Could not enrich person data:', error);
        }
      }
      
      // Enrich company data using domain
      const domain = lead.domain || (lead.email ? lead.email.split('@')[1] : null);
      if (domain) {
        try {
          const companyResponse = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
            params: { domain },
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          
          if (companyResponse.data) {
            enrichedCompany = companyResponse.data;
          }
        } catch (error) {
          console.warn('Could not enrich company data:', error);
        }
      }
      
      // Combine enriched data
      const enrichedData: any = {};
      const fieldsEnriched: string[] = [];
      
      if (enrichedPerson) {
        // Add personal data
        enrichedData.first_name = enrichedPerson.name?.givenName;
        enrichedData.last_name = enrichedPerson.name?.familyName;
        enrichedData.position = enrichedPerson.title;
        enrichedData.linkedin_url = enrichedPerson.linkedin?.handle 
          ? `https://linkedin.com/in/${enrichedPerson.linkedin.handle}` 
          : null;
        
        // Add to enriched fields list
        if (enrichedData.first_name) fieldsEnriched.push('first_name');
        if (enrichedData.last_name) fieldsEnriched.push('last_name');
        if (enrichedData.position) fieldsEnriched.push('position');
        if (enrichedData.linkedin_url) fieldsEnriched.push('linkedin_url');
      }
      
      if (enrichedCompany) {
        // Create company data object
        enrichedData.company = enrichedCompany.name;
        enrichedData.company_data = {
          name: enrichedCompany.name,
          industry: enrichedCompany.category?.industry,
          size: enrichedCompany.metrics?.employees?.toString(),
          location: {
            country: enrichedCompany.geo?.country,
            locality: enrichedCompany.geo?.city || ''
          },
          linkedin_url: enrichedCompany.linkedin?.handle 
            ? `https://linkedin.com/company/${enrichedCompany.linkedin.handle}` 
            : null
        };
        
        // Add to enriched fields list
        fieldsEnriched.push('company', 'company_data');
      }
      
      // Determine confidence based on available data
      let confidence = 0;
      if (enrichedPerson && enrichedCompany) {
        confidence = 0.9; // High confidence with both
      } else if (enrichedPerson || enrichedCompany) {
        confidence = 0.7; // Medium confidence with one
      }
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        originalLead: lead,
        enrichedData,
        confidence,
        fieldsEnriched
      };
      
    } catch (error) {
      console.error('Error enriching lead with Clearbit:', error);
      throw new Error(`Clearbit enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if this service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    return !!process.env.CLEARBIT_API_KEY;
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
      if (!process.env.CLEARBIT_API_KEY) {
        return {
          available: false,
          error: 'Clearbit API key is missing'
        };
      }
      
      // Clearbit doesn't have a status endpoint, so we'll just check
      // if the API key is present and assume it's available
      return {
        available: true
      };
      
    } catch (error) {
      console.error('Error checking Clearbit status:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error checking Clearbit status'
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
