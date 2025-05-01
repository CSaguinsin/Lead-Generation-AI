import axios from 'axios';
import { 
  LeadGenerationService, 
  LeadSearchFilters, 
  LeadSearchResults,
  LeadEnrichmentResult 
} from '../types';
import { mapJobLevelToTitle } from '@/utils/pdlHelpers';
import { Lead, LeadStatus } from '@/app/types/lead';

/**
 * People Data Labs service implementation
 * Specializes in lead discovery with comprehensive data
 */
export default class PDLService implements LeadGenerationService {
  id = 'pdl';
  name = 'People Data Labs';
  description = 'Lead discovery with rich professional data and company information';
  
  // Capabilities
  supportsSearch = true;
  supportsEnrichment = true;
  supportsVerification = false;
  
  // Supported filters
  supportedFilters = [
    'title',
    'company',
    'location',
    'industry',
    'companySize',
    'jobLevel'
  ];
  
  /**
   * Search for leads using PDL API
   * Uses the Person Search API which is specifically designed for finding multiple people
   * matching criteria, which is exactly what lead generation requires.
   */
  async search(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      const apiKey = process.env.PDL_API_KEY;
      if (!apiKey) {
        return this.createErrorResults('PDL API key is missing');
      }

      console.log('Using PDL Person Search API for lead generation');
      
      // Build PDL Elasticsearch query
      const esQuery: any = {
        bool: {
          must: []
        }
      };
      
      // Add job title filter
      if (filters.title && filters.title !== 'any') {
        esQuery.bool.must.push({
          match: { "job_title": filters.title }
        });
      }
      
      // Add job level filter
      if (filters.jobLevel && filters.jobLevel !== 'any_level') {
        const jobTitles = mapJobLevelToTitle(filters.jobLevel);
        if (jobTitles) {
          const titleTerms = jobTitles.split(',');
          esQuery.bool.must.push({
            bool: {
              should: titleTerms.map(title => ({
                match: { "job_title": title.trim() }
              })),
              minimum_should_match: 1
            }
          });
        }
      }
      
      // Add company filter
      if (filters.company && filters.company !== 'any') {
        esQuery.bool.must.push({
          match: { "job_company_name": filters.company }
        });
      }
      
      // Add location filter
      if (filters.location && filters.location !== 'any') {
        esQuery.bool.must.push({
          bool: {
            should: [
              { match: { "location_name": filters.location } },
              { match: { "location_country": filters.location } },
              { match: { "location_locality": filters.location } }
            ],
            minimum_should_match: 1
          }
        });
      }
      
      // Add industry filter
      if (filters.industry && filters.industry !== 'all') {
        esQuery.bool.must.push({
          match: { "job_company_industry": filters.industry }
        });
      }
      
      // Add company size filter
      if (filters.companySize && filters.companySize !== 'any_size') {
        // Parse company size range
        const sizeMapping: Record<string, [number, number]> = {
          '1-10': [1, 10],
          '11-50': [11, 50], 
          '51-200': [51, 200],
          '201-500': [201, 500],
          '501-1000': [501, 1000],
          '1001-5000': [1001, 5000],
          '5001-10000': [5001, 10000],
          '10001+': [10001, 1000000]
        };
        
        const sizeRange = sizeMapping[filters.companySize];
        if (sizeRange) {
          esQuery.bool.must.push({
            range: {
              "job_company_employee_count": {
                gte: sizeRange[0],
                lte: sizeRange[1]
              }
            }
          });
        }
      }
      
      // If no filters are provided, use a simple match_all query
      if (esQuery.bool.must.length === 0) {
        esQuery.bool.must.push({
          match_all: {}
        });
      }
      
      // Build request payload
      const requestPayload = {
        query: esQuery,
        size: 25,
        from: Math.floor(Math.random() * 20), // Add randomization to get different results each time
        pretty: false,
        // Request only the fields we need according to PDL schema
        fields: [
          'id',
          'name',
          'first_name',
          'last_name',
          'emails',
          'phone_numbers',
          'job_title',
          'job_company_name',
          'job_company_industry',
          'job_company_website',
          'job_company_size',
          'location_name',
          'location_country',
          'location_locality',
          'linkedin_url',
          'summary',
          'experience',
          'education'
        ]
      };
      
      console.log('PDL Search request payload:', JSON.stringify(requestPayload, null, 2));
      
      try {
        // Call PDL Search API
        const response = await axios.post(
          'https://api.peopledatalabs.com/v5/person/search', 
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': apiKey,
              'User-Agent': 'LeadGenerationAI/1.0'
            }
          }
        );
        
        console.log('PDL response status:', response.status);
        if (response.data && response.data.data) {
          console.log(`Found ${response.data.data.length} PDL results`);
          
          // Format the results into our lead format
          const leads = this.formatPDLResultsToLeads(response.data.data);
          
          // Return results in our standard format
          return {
            sourceId: this.id,
            sourceName: this.name,
            leads,
            metadata: {
              total: response.data.total,
              query: { filters },
              filtersCovered: this.getFiltersCovered(filters)
            }
          };
        } else {
          return this.createErrorResults('Unexpected PDL API response format');
        }
      } catch (searchError: any) {
        console.error('Error searching PDL:', searchError);
        
        // Log detailed error information if available
        if (searchError.response) {
          console.error('PDL API error response:', {
            status: searchError.response.status,
            statusText: searchError.response.statusText,
            data: searchError.response.data
          });
          
          // Handle quota limit exceeded (402 Payment Required)
          if (searchError.response.status === 402) {
            return {
              sourceId: this.id,
              sourceName: this.name,
              leads: [],
              metadata: {
                error: 'You have reached your PDL API quota limit. Please upgrade your plan or try again later.',
                filtersCovered: [],
                usageLimitReached: true
              }
            };
          }
        }
        
        return this.createErrorResults(
          searchError.response?.data?.error?.message || 
          searchError.message || 
          'Error searching PDL'
        );
      }
    } catch (error: any) {
      console.error('Error in PDL search:', error);
      return this.createErrorResults(error.message || 'Unknown error in PDL search');
    }
  }

  /**
   * Enrich a lead with additional data from PDL
   * Uses the Person Enrich API to get detailed information for a specific lead
   */
  async enrich(lead: any): Promise<LeadEnrichmentResult> {
    try {
      const apiKey = process.env.PDL_API_KEY;
      if (!apiKey) {
        return {
          sourceId: this.id,
          sourceName: this.name,
          originalLead: lead,
          enrichedData: {},
          confidence: 0,
          fieldsEnriched: [],
          error: 'PDL API key is missing'
        };
      }
      
      // Build parameters for the Enrich API
      const params: any = {
        pretty: false
      };
      
      // Add as many identifying parameters as possible to get the best match
      if (lead.email) {
        params.email = lead.email;
      }
      
      if (lead.first_name && lead.last_name) {
        params.first_name = lead.first_name;
        params.last_name = lead.last_name;
      } else if (lead.name) {
        params.name = lead.name;
      }
      
      if (lead.company || lead.job_company_name) {
        params.company = lead.company || lead.job_company_name;
      }
      
      if (lead.linkedin_url) {
        params.profile = lead.linkedin_url;
      }
      
      if (lead.location || lead.location_locality) {
        params.location = lead.location || lead.location_locality;
      }
      
      console.log('PDL Enrich API params:', JSON.stringify(params, null, 2));
      
      // Make the API request
      const response = await axios.get('https://api.peopledatalabs.com/v5/person/enrich', {
        params,
        headers: {
          'X-Api-Key': apiKey,
          'User-Agent': 'LeadGenerationAI/1.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`PDL Enrich API response status: ${response.status}`);
      
      if (response.data && response.data.data) {
        // Format the enriched data
        const enrichedLead = this.formatPDLResultToLead(response.data.data);
        
        // Determine which fields were enriched
        const fieldsEnriched = Object.keys(response.data.data).filter(key => 
          response.data.data[key] !== undefined && 
          (!lead[key] || lead[key] !== response.data.data[key])
        );
        
        return {
          sourceId: this.id,
          sourceName: this.name,
          originalLead: lead,
          enrichedData: enrichedLead || {},
          confidence: response.data.likelihood || 0.8,
          fieldsEnriched
        };
      }
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        originalLead: lead,
        enrichedData: {},
        confidence: 0,
        fieldsEnriched: [],
        error: 'No enrichment data found'
      };
    } catch (error: any) {
      console.error('Error in PDL enrich:', error);
      
      // Log detailed error information if available
      if (axios.isAxiosError(error) && error.response) {
        console.error('PDL API error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        originalLead: lead,
        enrichedData: {},
        confidence: 0,
        fieldsEnriched: [],
        error: error.message || 'Unknown error in PDL enrich'
      };
    }
  }
  
  /**
   * Format PDL API results into our lead format
   */
  private formatPDLResultsToLeads(results: any[]): Lead[] {
    return results
      .map(result => this.formatPDLResultToLead(result))
      .filter((lead): lead is Lead => lead !== null);
  }
  
  /**
   * Format a single PDL API result into our lead format
   */
  private formatPDLResultToLead(data: any): Lead | null {
    if (!data) return null;
    
    try {
      // Extract name parts
      let firstName = data.first_name || '';
      let lastName = data.last_name || '';
      
      // If we have a full name but not first/last name, try to split it
      if (data.name && (!firstName || !lastName)) {
        const nameParts = data.name.split(' ');
        if (nameParts.length >= 2) {
          firstName = firstName || nameParts[0];
          lastName = lastName || nameParts[nameParts.length - 1];
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = '';
        }
      }
      
      // Handle various email field formats from PDL
      let email = '';
      if (data.emails && Array.isArray(data.emails) && data.emails.length > 0) {
        // Handle case where email might be an object with address property
        if (typeof data.emails[0] === 'object' && data.emails[0] !== null) {
          email = data.emails[0].address || '';
        } else {
          email = String(data.emails[0]); // Ensure it's a string
        }
      } else if (data.email) {
        // Handle case where email might be an object
        if (typeof data.email === 'object' && data.email !== null) {
          email = data.email.address || '';
        } else {
          email = String(data.email); // Ensure it's a string
        }
      } else if (data.work_email) {
        // Handle case where work_email might be an object
        if (typeof data.work_email === 'object' && data.work_email !== null) {
          email = data.work_email.address || '';
        } else {
          email = String(data.work_email); // Ensure it's a string
        }
      }
      
      // Get the job title
      const position = data.job_title || data.title || data.position || '';
      
      // Get the company name
      const company = data.job_company_name || data.company || '';
      
      // Get the domain (from company website if available)
      let domain = '';
      if (data.job_company_website) {
        try {
          const url = new URL(data.job_company_website);
          domain = url.hostname;
        } catch (e) {
          domain = data.job_company_website;
        }
      }
      
      // Extract phone number
      let phoneNumber = '';
      
      // Check for phone_numbers array first (most common in PDL API)
      if (data.phone_numbers && Array.isArray(data.phone_numbers)) {
        if (data.phone_numbers.length > 0) {
          if (typeof data.phone_numbers[0] === 'object' && data.phone_numbers[0] !== null) {
            // Handle case where phone is an object
            phoneNumber = data.phone_numbers[0].number || data.phone_numbers[0].value || '';
          } else {
            phoneNumber = String(data.phone_numbers[0]);
          }
        }
      } 
      // Then check for other phone fields
      else if (data.phones && Array.isArray(data.phones) && data.phones.length > 0) {
        if (typeof data.phones[0] === 'object' && data.phones[0] !== null) {
          phoneNumber = data.phones[0].number || data.phones[0].value || '';
        } else {
          phoneNumber = String(data.phones[0]);
        }
      } 
      else if (data.mobile_phone) {
        if (typeof data.mobile_phone === 'object' && data.mobile_phone !== null) {
          phoneNumber = data.mobile_phone.number || data.mobile_phone.value || '';
        } else {
          phoneNumber = String(data.mobile_phone);
        }
      }
      
      // Format phone number if needed
      if (phoneNumber && typeof phoneNumber === 'string') {
        // Keep the + sign for international format if it exists
        if (!phoneNumber.startsWith('+')) {
          // For US numbers, ensure proper formatting
          const digits = phoneNumber.replace(/\D/g, '');
          if (digits.length === 10) {
            phoneNumber = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
          }
        }
      }
      
      // Create company data
      const companyData = {
        name: company,
        industry: data.job_company_industry || data.industry || '',
        size: data.job_company_size || data.job_company_employee_count || '',
        location: {
          country: data.location_country || data.job_company_location_country || '',
          locality: data.location_locality || data.job_company_location_locality || ''
        },
        linkedin_url: data.job_company_linkedin_url || ''
      };
      
      // Create profile data
      const profileData = {
        summary: data.summary || '',
        experiences: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
          company: exp.company || '',
          title: exp.title || '',
          duration: exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : ''
        })) : [],
        education: Array.isArray(data.education) ? data.education.map((edu: any) => ({
          school: edu.school || '',
          degree: edu.degree || ''
        })) : []
      };
      
      // Create the lead object
      return {
        id: data.id || `pdl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        first_name: firstName,
        last_name: lastName,
        email: email,
        position: position,
        company: company,
        domain: domain || '',
        status: email ? LeadStatus.Verified : LeadStatus.Unverified,
        linkedin_url: data.linkedin_url || '',
        company_data: companyData,
        phone_number: phoneNumber,
        profile_data: profileData
      };
    } catch (error) {
      console.error('Error formatting PDL response:', error);
      return null;
    }
  }
  
  /**
   * Get the filters covered by this service
   */
  private getFiltersCovered(filters: LeadSearchFilters): string[] {
    const covered = [];
    
    if (filters.title && filters.title !== 'any') covered.push('title');
    if (filters.company && filters.company !== 'any') covered.push('company');
    if (filters.location && filters.location !== 'any') covered.push('location');
    if (filters.industry && filters.industry !== 'all') covered.push('industry');
    if (filters.companySize && filters.companySize !== 'any_size') covered.push('companySize');
    if (filters.jobLevel && filters.jobLevel !== 'any_level') covered.push('jobLevel');
    
    return covered;
  }
  
  /**
   * Create error results
   */
  private createErrorResults(error: string): LeadSearchResults {
    return {
      sourceId: this.id,
      sourceName: this.name,
      leads: [],
      metadata: {
        error,
        filtersCovered: []
      }
    };
  }

  /**
   * Verify an email address (not implemented for PDL)
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
      status: 'Not implemented',
      details: { error: 'Email verification is not supported by PDL' }
    };
  }

  /**
   * Find an email address (not implemented for PDL)
   */
  async findEmail(firstName: string, lastName: string, domain: string): Promise<{
    email: string;
    score: number;
    status: string;
    verified: boolean;
  }> {
    return {
      email: '',
      score: 0,
      status: 'Not implemented',
      verified: false
    };
  }

  /**
   * Check if this service is properly configured
   */
  async isConfigured(): Promise<boolean> {
    return !!process.env.PDL_API_KEY;
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
      // Check if API key exists
      if (!process.env.PDL_API_KEY) {
        return {
          available: false,
          error: 'PDL API key is missing'
        };
      }
      
      // PDL doesn't have a specific status endpoint that's reliable for checks
      return {
        available: true
      };
    } catch (error: any) {
      console.error('Error checking PDL status:', error);
      return {
        available: false,
        error: error.message || 'Unknown error checking PDL status'
      };
    }
  }
}
