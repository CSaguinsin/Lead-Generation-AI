import axios from 'axios';
import { Lead, LeadStatus } from '@/app/types/lead';
import { 
  LeadGenerationService, 
  LeadSearchFilters, 
  LeadSearchResults, 
  LeadSearchMetadata,
  LeadEnrichmentResult
} from '../types';

/**
 * Coresignal API service for lead generation
 * Uses Coresignal's Multi-source Employee API to find and enrich leads
 */
class CoresignalService implements LeadGenerationService {
  id = 'coresignal';
  name = 'Coresignal';
  description = 'Find leads using Coresignal\'s Multi-source Employee API';
  supportsSearch = true;
  supportsEnrichment = true;
  supportsVerification = false;
  supportedFilters = ['title', 'company', 'location', 'industry', 'companySize'];
  
  /**
   * Check if the service is configured with valid API credentials
   */
  async isConfigured(): Promise<boolean> {
    const apiKey = process.env.CORESIGNAL_API_KEY;
    return !!apiKey;
  }
  
  /**
   * Get the current status of the service
   */
  async getStatus(): Promise<{
    available: boolean;
    quotaRemaining?: number;
    error?: string;
  }> {
    const isConfigured = await this.isConfigured();
    
    return {
      available: isConfigured,
      error: isConfigured ? undefined : 'Coresignal API key is missing'
    };
  }
  
  /**
   * Search for leads using Coresignal's Multi-source Employee API
   * @param filters Search filters
   */
  async search(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      // Check if API key exists
      const apiKey = process.env.CORESIGNAL_API_KEY;
      if (!apiKey) {
        return {
          sourceId: this.id,
          sourceName: this.name,
          leads: [],
          metadata: {
            error: 'Coresignal API key is missing',
            filtersCovered: []
          }
        };
      }
      
      console.log('Using Coresignal Multi-source Employee API for lead search');
      
      // Build Elasticsearch DSL query based on filters
      const esQuery = this.buildElasticsearchQuery(filters);
      
      // Call Coresignal search API
      const searchResults = await this.searchEmployees(esQuery, apiKey);
      
      if (!searchResults || searchResults.length === 0) {
        return {
          sourceId: this.id,
          sourceName: this.name,
          leads: [],
          metadata: {
            total: 0,
            filtersCovered: Object.keys(filters).filter(key => !!filters[key as keyof LeadSearchFilters])
          }
        };
      }
      
      console.log(`Found ${searchResults.length} results from Coresignal`);
      
      // Process up to 200 results
      const resultsToProcess = searchResults.slice(0, 200);
      
      // Convert Coresignal results to leads
      const leads = resultsToProcess.map(result => this.formatCoresignalResult(result));
      
      // Filter out any null results
      const validLeads = leads.filter(lead => lead !== null) as Lead[];
      
      const metadata: LeadSearchMetadata = {
        total: searchResults.length,
        remaining: searchResults.length - resultsToProcess.length,
        filtersCovered: Object.keys(filters).filter(key => !!filters[key as keyof LeadSearchFilters])
      };
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        leads: validLeads,
        metadata
      };
    } catch (error) {
      console.error('Error in Coresignal search:', error);
      return {
        sourceId: this.id,
        sourceName: this.name,
        leads: [],
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          filtersCovered: []
        }
      };
    }
  }
  
  /**
   * Enrich a lead with additional data from Coresignal
   * @param lead Lead to enrich
   */
  async enrich(lead: Lead): Promise<LeadEnrichmentResult> {
    try {
      // Check if API key exists
      const apiKey = process.env.CORESIGNAL_API_KEY;
      if (!apiKey) {
        return {
          sourceId: this.id,
          sourceName: this.name,
          originalLead: lead,
          enrichedData: {},
          confidence: 0,
          fieldsEnriched: []
        };
      }
      
      // Skip if no LinkedIn URL or name to identify the person
      if (!lead.linkedin_url && !lead.first_name && !lead.last_name) {
        return {
          sourceId: this.id,
          sourceName: this.name,
          originalLead: lead,
          enrichedData: {},
          confidence: 0,
          fieldsEnriched: []
        };
      }
      
      let employeeId;
      let shorthandName;
      
      // Extract shorthand name from LinkedIn URL if available
      if (lead.linkedin_url) {
        const urlParts = lead.linkedin_url.split('/');
        shorthandName = urlParts[urlParts.length - 1];
      }
      
      // If we have a shorthand name, use the collect by shorthand name endpoint
      if (shorthandName) {
        const enrichedData = await this.collectByShorthandName(shorthandName, apiKey);
        if (enrichedData) {
          const enrichedFields = this.processEnrichedData(enrichedData);
          return {
            sourceId: this.id,
            sourceName: this.name,
            originalLead: lead,
            enrichedData: enrichedFields,
            confidence: 0.9,
            fieldsEnriched: Object.keys(enrichedFields)
          };
        }
      }
      
      // If we don't have a shorthand name but have a name, try to search and then collect
      if (lead.first_name && lead.last_name) {
        const searchQuery = this.buildNameSearchQuery(lead);
        const searchResults = await this.searchEmployees(searchQuery, apiKey);
        
        if (searchResults && searchResults.length > 0) {
          // Use the first result's ID to collect detailed data
          employeeId = searchResults[0].id;
          const enrichedData = await this.collectById(employeeId, apiKey);
          
          if (enrichedData) {
            const enrichedFields = this.processEnrichedData(enrichedData);
            return {
              sourceId: this.id,
              sourceName: this.name,
              originalLead: lead,
              enrichedData: enrichedFields,
              confidence: 0.8, // Lower confidence since we're matching by name
              fieldsEnriched: Object.keys(enrichedFields)
            };
          }
        }
      }
      
      // If we couldn't enrich the lead, return the original
      return {
        sourceId: this.id,
        sourceName: this.name,
        originalLead: lead,
        enrichedData: {},
        confidence: 0,
        fieldsEnriched: []
      };
    } catch (error) {
      console.error('Error enriching lead with Coresignal:', error);
      return {
        sourceId: this.id,
        sourceName: this.name,
        originalLead: lead,
        enrichedData: {},
        confidence: 0,
        fieldsEnriched: []
      };
    }
  }
  
  /**
   * Verify an email address (not supported by Coresignal)
   */
  async verify(email: string): Promise<{
    isValid: boolean;
    score: number;
    status: string;
    details?: any;
  }> {
    return {
      isValid: false,
      score: 0,
      status: 'not_supported',
      details: { message: 'Email verification is not supported by Coresignal' }
    };
  }
  
  /**
   * Build Elasticsearch DSL query based on search filters
   */
  private buildElasticsearchQuery(filters: LeadSearchFilters): any {
    const query: any = {
      bool: {
        must: []
      }
    };
    
    // Add job title filter
    if (filters.title && filters.title !== 'any') {
      query.bool.must.push({
        match: { "job_title": filters.title }
      });
    }
    
    // Add company filter
    if (filters.company && filters.company !== 'any') {
      query.bool.must.push({
        match: { "workplace.name": filters.company }
      });
    }
    
    // Add location filter
    if (filters.location && filters.location !== 'any') {
      query.bool.must.push({
        bool: {
          should: [
            { match: { "location.country": filters.location } },
            { match: { "location.city": filters.location } }
          ],
          minimum_should_match: 1
        }
      });
    }
    
    // Add industry filter
    if (filters.industry && filters.industry !== 'all') {
      query.bool.must.push({
        match: { "workplace.industry": filters.industry }
      });
    }
    
    // Add company size filter
    if (filters.companySize && filters.companySize !== 'any_size') {
      // Map company size to employee count range
      const sizeRanges: Record<string, [number, number]> = {
        'small': [1, 50],
        'medium': [51, 200],
        'large': [201, 1000],
        'enterprise': [1001, 10000],
        'very_large': [10001, 1000000]
      };
      
      const range = sizeRanges[filters.companySize] || [1, 1000000];
      
      query.bool.must.push({
        range: {
          "workplace.employee_count": {
            gte: range[0],
            lte: range[1]
          }
        }
      });
    }
    
    return query;
  }
  
  /**
   * Build a search query to find a person by name
   */
  private buildNameSearchQuery(lead: Lead): any {
    return {
      bool: {
        must: [
          { match: { "first_name": lead.first_name || '' } },
          { match: { "last_name": lead.last_name || '' } }
        ]
      }
    };
  }
  
  /**
   * Search for employees using Coresignal's Multi-source Employee API
   */
  private async searchEmployees(query: any, apiKey: string): Promise<any[]> {
    try {
      const response = await axios.post(
        'https://api.coresignal.com/v1/multi_source/employee/search/es_dsl',
        {
          query,
          size: 100,
          _source: [
            "id",
            "first_name",
            "last_name",
            "professional_network_url",
            "primary_professional_email",
            "job_title",
            "workplace.name",
            "workplace.industry",
            "location.city",
            "location.country"
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.hits && response.data.hits.hits) {
        return response.data.hits.hits.map((hit: any) => hit._source);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching Coresignal employees:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
      }
      throw new Error('Failed to search for employees in Coresignal');
    }
  }
  
  /**
   * Collect employee data by ID using Coresignal's Multi-source Employee API
   */
  private async collectById(employeeId: string, apiKey: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.coresignal.com/v1/multi_source/employee/collect/${employeeId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error collecting Coresignal employee by ID:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
      }
      return null;
    }
  }
  
  /**
   * Collect employee data by shorthand name using Coresignal's Multi-source Employee API
   */
  private async collectByShorthandName(shorthandName: string, apiKey: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.coresignal.com/v1/multi_source/employee/collect/${shorthandName}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error collecting Coresignal employee by shorthand name:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
      }
      return null;
    }
  }
  
  /**
   * Process enriched data from Coresignal API
   */
  private processEnrichedData(data: any): Record<string, any> {
    const enrichedFields: Record<string, any> = {};
    
    // Extract relevant fields from the enriched data
    if (data.primary_professional_email) {
      enrichedFields.email = data.primary_professional_email;
    }
    
    // Get phone number if available (not typically provided by Coresignal)
    if (data.phone_number) {
      enrichedFields.phone_number = data.phone_number;
    }
    
    // Get additional profile information
    if (data.summary) {
      enrichedFields.summary = data.summary;
    }
    
    // Get skills
    if (data.skills && data.skills.length > 0) {
      enrichedFields.skills = data.skills;
    }
    
    // Get experience details
    if (data.experience && data.experience.length > 0) {
      enrichedFields.experience = data.experience;
    }
    
    // Get education details
    if (data.education && data.education.length > 0) {
      enrichedFields.education = data.education;
    }
    
    return enrichedFields;
  }
  
  /**
   * Format Coresignal search result into a standardized lead
   */
  private formatCoresignalResult(result: any): Lead | null {
    try {
      if (!result) return null;
      
      // Extract email
      const email = result.primary_professional_email || '';
      
      // Create a standardized lead object
      return {
        first_name: result.first_name || '',
        last_name: result.last_name || '',
        email: email,
        position: result.job_title || '',
        company: result.workplace?.name || '',
        linkedin_url: result.professional_network_url || '',
        domain: result.workplace?.domain || '',
        status: LeadStatus.New,
        // Store location in company_data
        company_data: {
          name: result.workplace?.name || '',
          industry: result.workplace?.industry || '',
          size: result.workplace?.employee_count?.toString() || '',
          location: {
            country: result.location?.country || '',
            locality: result.location?.city || ''
          }
        }
      };
    } catch (error) {
      console.error('Error formatting Coresignal result:', error);
      return null;
    }
  }
}

export default CoresignalService;
