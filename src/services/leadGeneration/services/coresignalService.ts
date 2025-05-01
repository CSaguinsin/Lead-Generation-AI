import axios from 'axios';
import { Lead, LeadStatus } from '@/app/types/lead';
import { 
  LeadGenerationService, 
  LeadSearchFilters, 
  LeadSearchResults, 
  LeadSearchMetadata,
  LeadEnrichmentResult
} from '../types';
import { getAuthHeaders } from '@/utils/apiTokens';

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
   */
  async search(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      // Get API key from environment variable
      const apiKey = process.env.CORESIGNAL_API_KEY;
      
      if (!apiKey) {
        return {
          leads: [],
          sourceId: 'coresignal',
          sourceName: 'Coresignal',
          metadata: {
            filtersCovered: [],
            error: 'Coresignal API key is missing'
          }
        };
      }
      
      // Search for employees using the Coresignal API
      return this.searchEmployees(filters);
    } catch (error) {
      console.error('Error searching Coresignal:', error);
      return {
        leads: [],
        sourceId: 'coresignal',
        sourceName: 'Coresignal',
        metadata: {
          filtersCovered: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Search for employees using Coresignal's Multi-source Employee API
   */
  async searchEmployees(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      // Get API key from environment variable
      const apiKey = process.env.CORESIGNAL_API_KEY;
      console.log(`Using Coresignal API key: ${apiKey ? 'Available' : 'Missing'}`);
      
      if (!apiKey) {
        throw new Error('Coresignal API key is missing');
      }
      
      const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
      
      console.log('Using Coresignal search endpoint:', url);
      
      // Create the simplest possible valid query that will return results
      const requestPayload = {
        query: {
          match_all: {}
        },
        size: 10
      };
      
      console.log('Coresignal search query:', JSON.stringify(requestPayload, null, 2));
      
      // Make the API request - POST for search endpoint
      const response = await axios.post(url, requestPayload, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Coresignal API response status: ${response.status}`);
      
      // Handle the response - Coresignal returns hits with _source containing employee data
      if (response.data && response.data.hits && Array.isArray(response.data.hits.hits)) {
        const employees = response.data.hits.hits.map((hit: any) => hit._source);
        console.log(`Found ${employees.length} employees from Coresignal`);
        
        // Apply filters manually since we're using a simple match_all query
        const filteredEmployees = employees.filter((employee: Record<string, any>) => this.matchesFilters(employee, filters));
        console.log(`After filtering: ${filteredEmployees.length} employees match criteria`);
        
        // Format the results for our lead format
        const leads = filteredEmployees.map((employee: Record<string, any>) => this.formatEmployeeToLead(employee));
        
        return {
          leads,
          sourceId: 'coresignal',
          sourceName: 'Coresignal',
          metadata: {
            filtersCovered: this.getFiltersCovered(filters),
            total: filteredEmployees.length,
            error: undefined
          }
        };
      } else {
        console.error('Unexpected Coresignal API response format:', response.data);
        return {
          leads: [],
          sourceId: 'coresignal',
          sourceName: 'Coresignal',
          metadata: {
            filtersCovered: [],
            error: 'Unexpected API response format'
          }
        };
      }
    } catch (error: any) {
      console.error('Error in searchEmployees:', error);
      
      // Log detailed error information if available
      if (error.response) {
        console.error('Coresignal API error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      return {
        leads: [],
        sourceId: 'coresignal',
        sourceName: 'Coresignal',
        metadata: {
          filtersCovered: [],
          error: error.message || 'Unknown error'
        }
      };
    }
  }

  /**
   * Check if an employee record matches the given filters
   */
  private matchesFilters(employee: Record<string, any>, filters: LeadSearchFilters): boolean {
    // If no filters are provided, return true
    if (!filters.title && !filters.company && !filters.location && !filters.industry) {
      return true;
    }

    // Check title filter
    if (filters.title && filters.title !== 'any') {
      const position = employee.position || '';
      if (!position.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }
    }

    // Check company filter
    if (filters.company && filters.company !== 'any') {
      const company = employee.company_name || '';
      if (!company.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }
    }

    // Check location filter
    if (filters.location && filters.location !== 'any') {
      const location = employee.location_name || '';
      if (!location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Check industry filter
    if (filters.industry && filters.industry !== 'any') {
      const industry = employee.company_industry || '';
      if (!industry.toLowerCase().includes(filters.industry.toLowerCase())) {
        return false;
      }
    }

    return true;
  }
  
  /**
   * Get detailed employee data by ID using Coresignal's Multi-source Employee API
   */
  private async getEmployeeById(id: string, apiKey: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${id}`,
        {
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error getting employee data for ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Enrich a lead with additional data from Coresignal
   * @param lead Lead to enrich
   */
  async enrich(lead: Lead): Promise<LeadEnrichmentResult> {
    try {
      // Get API key from environment variable
      const apiKey = process.env.CORESIGNAL_API_KEY;
      if (!apiKey) {
        console.error('Coresignal API key is missing');
        return {
          sourceId: this.id,
          sourceName: this.name,
          originalLead: lead,
          enrichedData: {},
          confidence: 0,
          fieldsEnriched: []
        };
      }
      
      // Skip if we don't have enough data to search
      if (!lead.first_name || !lead.last_name) {
        return {
          sourceId: this.id,
          sourceName: this.name,
          originalLead: lead,
          enrichedData: {},
          confidence: 0,
          fieldsEnriched: []
        };
      }
      
      // Try to find the employee by name
      const searchQuery = this.buildEmployeeByNameQuery(lead);
      
      // Make the API request
      const response = await axios.post(
        'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl',
        searchQuery,
        {
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Handle the response - Coresignal returns an array of IDs
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Get the first ID
        const employeeId = response.data[0];
        
        // Get detailed employee data
        const employeeData = await this.getEmployeeById(employeeId, apiKey);
        
        if (employeeData) {
          // Process the enriched data
          const enrichedFields = this.processEnrichedData(employeeData);
          return {
            sourceId: this.id,
            sourceName: this.name,
            originalLead: lead,
            enrichedData: enrichedFields,
            confidence: 0.8,
            fieldsEnriched: Object.keys(enrichedFields)
          };
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
   * Build the Elasticsearch DSL query for employee search
   */
  buildEmployeeQuery(filters: LeadSearchFilters): any {
    // According to Coresignal docs, we need to wrap our query in a proper structure
    // For an empty search (when no filters are provided), use a match_all query
    if (!filters.title && !filters.company && !filters.location && !filters.industry) {
      return {
        query: {
          match_all: {}
        },
        size: 10
      };
    }
    
    // Otherwise, build a query with the provided filters
    const queryObj: any = {
      query: {
        bool: {
          must: [] as any[]
        }
      },
      size: 10
    };

    // Add title filter
    if (filters.title && filters.title !== 'any') {
      queryObj.query.bool.must.push({
        match_phrase_prefix: {
          position: filters.title
        }
      });
    }

    // Add company filter
    if (filters.company && filters.company !== 'any') {
      queryObj.query.bool.must.push({
        match_phrase_prefix: {
          company_name: filters.company
        }
      });
    }

    // Add location filter
    if (filters.location && filters.location !== 'any') {
      queryObj.query.bool.must.push({
        bool: {
          should: [
            { match_phrase_prefix: { country: filters.location } },
            { match_phrase_prefix: { city: filters.location } },
            { match_phrase_prefix: { region: filters.location } }
          ],
          minimum_should_match: 1
        }
      });
    }

    // Add industry filter
    if (filters.industry && filters.industry !== 'all') {
      queryObj.query.bool.must.push({
        match_phrase_prefix: {
          company_industry: filters.industry
        }
      });
    }

    return queryObj;
  }

  /**
   * Build a query to find an employee by ID
   */
  private buildEmployeeByIdQuery(id: string): any {
    return {
      query: {
        match: {
          "id": id
        }
      }
    };
  }
  
  /**
   * Build a query to find an employee by name
   */
  private buildEmployeeByNameQuery(lead: Lead): any {
    return {
      query: {
        bool: {
          should: [
            { match_phrase_prefix: { "first_name": lead.first_name || '' } },
            { match_phrase_prefix: { "last_name": lead.last_name || '' } }
          ]
        }
      }
    };
  }
  
  /**
   * Collect employee data by ID using Coresignal's Multi-source Employee API
   */
  private async collectById(employeeId: string, apiKey: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`,
        {
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error collecting employee data for ID ${employeeId}:`, error);
      return null;
    }
  }

  /**
   * Collect employee data by shorthand name (e.g., linkedin profile name)
   */
  private async collectByShorthandName(shorthandName: string, apiKey: string): Promise<any> {
    try {
      const headers = {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(
        `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${shorthandName}`,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error collecting employee by shorthand name ${shorthandName}:`, error);
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
  
  private formatEmployeeToLead(employee: Record<string, any>): Lead {
    return {
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.primary_professional_email || '',
      position: employee.job_title || '',
      company: employee.workplace?.name || '',
      linkedin_url: employee.professional_network_url || '',
      domain: employee.workplace?.domain || '',
      status: LeadStatus.New,
      company_data: {
        name: employee.workplace?.name || '',
        industry: employee.workplace?.industry || '',
        size: employee.workplace?.employee_count?.toString() || '',
        location: {
          country: employee.location?.country || '',
          locality: employee.location?.city || ''
        }
      }
    };
  }
  
  private getFiltersCovered(filters: LeadSearchFilters): string[] {
    return Object.keys(filters).filter(key => !!filters[key as keyof LeadSearchFilters]);
  }
  
  private enhanceLeadWithEmployeeData(lead: Lead, employeeData: any): Lead {
    const enrichedFields = this.processEnrichedData(employeeData);
    return { ...lead, ...enrichedFields };
  }
}

export default CoresignalService;
