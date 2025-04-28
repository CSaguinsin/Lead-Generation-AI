import axios from 'axios';
import { 
  LeadGenerationService, 
  LeadSearchFilters, 
  LeadSearchResults,
  LeadEnrichmentResult 
} from '../types';
import { mapJobLevelToTitle } from '@/utils/pdlHelpers';
import { identifyLeadsPDL } from '@/app/actions/identifyLeadsPDL';

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
   */
  async search(filters: LeadSearchFilters): Promise<LeadSearchResults> {
    try {
      const apiKey = process.env.PDL_API_KEY;
      if (!apiKey) {
        return this.createErrorResults('PDL API key is missing');
      }

      console.log('Using PDL Person Identify API for lead search to include phone numbers');
      
      // Use the new identifyLeadsPDL action that uses Person Identify API
      const identifyResults = await identifyLeadsPDL(filters);
      
      if (identifyResults && identifyResults.length > 0) {
        console.log(`Found ${identifyResults.length} leads with phone numbers using Identify API`);
        
        // Return results in our standard format
        return {
          sourceId: this.id,
          sourceName: this.name,
          leads: identifyResults,
          metadata: {
            total: identifyResults.length,
            query: { filters },
            filtersCovered: this.getFiltersCovered(filters)
          }
        };
      }
      
      // If identify API fails or returns no results, fall back to the original search implementation
      console.log('Falling back to PDL Search API');
      
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
      
      // Build request payload
      const requestPayload = {
        query: esQuery,
        size: 25,
        pretty: false,
        // Make sure emails and phones are included in the response fields
        fields: [
          'name',
          'emails',
          'phone_numbers',
          'phones',
          'job_title',
          'job_company_name',
          'job_company_industry',
          'job_company_website',
          'job_company_employee_count',
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
              'X-Api-Key': apiKey
            }
          }
        );
        
        console.log('PDL response status:', response.status);
        if (response.data && response.data.data) {
          console.log(`Found ${response.data.data.length} PDL results`);
          
          // Process PDL results to extract emails and phones more explicitly
          const processedResults = response.data.data.map((person: any) => {
            // Extract primary email if available
            let primaryEmail = '';
            if (person.emails && Array.isArray(person.emails) && person.emails.length > 0) {
              // Get the best email (primary if available)
              const primaryEmails = person.emails.filter((e: any) => e.type === 'personal' || e.type === 'professional');
              if (primaryEmails.length > 0) {
                primaryEmail = primaryEmails[0].address;
              } else {
                primaryEmail = person.emails[0].address;
              }
            }
            
            // Extract primary phone if available - improved extraction logic
            let primaryPhone = '';
            // Check all possible phone number fields from PDL
            if (person.phones && Array.isArray(person.phones) && person.phones.length > 0) {
              // PDL returns phones as objects with number property
              primaryPhone = person.phones[0].number;
            } else if (person.phone_numbers && Array.isArray(person.phone_numbers) && person.phone_numbers.length > 0) {
              // Sometimes PDL returns phone_numbers as an array of strings
              primaryPhone = person.phone_numbers[0];
            } else if (person.phone) {
              // Sometimes PDL returns a single phone property
              primaryPhone = person.phone;
            }
            
            // Format phone number if needed (remove any non-digit characters except + for country code)
            if (primaryPhone) {
              // Keep the + sign for international format if it exists
              if (!primaryPhone.startsWith('+')) {
                // For US numbers, ensure proper formatting
                const digits = primaryPhone.replace(/\D/g, '');
                if (digits.length === 10) {
                  primaryPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
                } else if (digits.length === 11 && digits.startsWith('1')) {
                  primaryPhone = `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
                }
              }
            }
            
            // Enhance the person object with the extracted email and phone
            return {
              ...person,
              // Make email easy to access for the frontend
              email: primaryEmail,
              // Make phone easy to access for the frontend
              phone: primaryPhone,
              // Keep the original emails array for reference
              all_emails: person.emails,
              // Keep the original phones array for reference
              all_phones: person.phones || person.phone_numbers
            };
          });
          
          // Enhance results with phone numbers using Person Identify API
          // But limit to avoid excessive API calls
          const MAX_IDENTIFY_CALLS = 5; // Limit to avoid excessive API usage
          const resultsToEnhance = processedResults.slice(0, MAX_IDENTIFY_CALLS);
          
          // Only make additional API calls if we have valid results and no phone numbers
          if (resultsToEnhance.length > 0 && !resultsToEnhance.some((p: any) => p.phone)) {
            console.log(`Enhancing ${resultsToEnhance.length} results with phone numbers using Person Identify API`);
            
            // Create an array of promises for parallel processing
            const enhancementPromises = resultsToEnhance.map(async (person: any) => {
              try {
                // Skip if we already have a phone number
                if (person.phone) {
                  return person;
                }
                
                // Prepare parameters for Person Identify API
                const identifyParams: Record<string, string> = {};
                
                // Add the most reliable parameters we have
                if (person.first_name && person.last_name) {
                  identifyParams.first_name = person.first_name;
                  identifyParams.last_name = person.last_name;
                } else if (person.name) {
                  const nameParts = person.name.split(' ');
                  if (nameParts.length >= 2) {
                    identifyParams.first_name = nameParts[0];
                    identifyParams.last_name = nameParts[nameParts.length - 1];
                  }
                }
                
                if (person.email) {
                  identifyParams.email = person.email;
                }
                
                if (person.linkedin_url) {
                  identifyParams.profile = person.linkedin_url;
                }
                
                if (person.job_company_name) {
                  identifyParams.company = person.job_company_name;
                }
                
                // Call PDL Person Identify API
                const identifyResponse = await axios.get(
                  'https://api.peopledatalabs.com/v5/person/identify',
                  {
                    params: identifyParams,
                    headers: {
                      'X-Api-Key': apiKey,
                      'Accept-Encoding': 'gzip',
                    },
                    timeout: 10000,
                  }
                );
                
                if (identifyResponse.data) {
                  console.log(`Found additional data for ${person.first_name} ${person.last_name || ''}`);
                  
                  // Extract phone number from identify response
                  let identifyPhone = '';
                  const identifyData = identifyResponse.data;
                  
                  if (identifyData.phones && Array.isArray(identifyData.phones) && identifyData.phones.length > 0) {
                    identifyPhone = identifyData.phones[0].number;
                  } else if (identifyData.phone_numbers && Array.isArray(identifyData.phone_numbers) && identifyData.phone_numbers.length > 0) {
                    identifyPhone = identifyData.phone_numbers[0];
                  }
                  
                  // Format phone number if needed
                  if (identifyPhone) {
                    if (!identifyPhone.startsWith('+')) {
                      const digits = identifyPhone.replace(/\D/g, '');
                      if (digits.length === 10) {
                        identifyPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
                      } else if (digits.length === 11 && digits.startsWith('1')) {
                        identifyPhone = `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
                      }
                    }
                    
                    // Update the person object with the phone number
                    return {
                      ...person,
                      phone: identifyPhone,
                      phone_source: 'pdl_identify'
                    };
                  }
                }
                
                return person;
              } catch (error) {
                console.error('Error enhancing person with Identify API:', error);
                return person; // Return original person on error
              }
            });
            
            try {
              // Wait for all enhancement promises to complete
              const enhancedResults = await Promise.all(enhancementPromises);
              
              // Replace the enhanced results in the original array
              enhancedResults.forEach((enhancedPerson, index) => {
                processedResults[index] = enhancedPerson;
              });
              
              console.log(`Enhanced ${enhancedResults.filter(p => p.phone).length} results with phone numbers`);
            } catch (error) {
              console.error('Error enhancing results with phone numbers:', error);
            }
          }
          
          // Return results in our standard format
          return {
            sourceId: this.id,
            sourceName: this.name,
            leads: processedResults,
            metadata: {
              total: response.data.total || response.data.data.length,
              query: requestPayload.query,
              filtersCovered: this.getFiltersCovered(filters)
            }
          };
        }
        
        return {
          sourceId: this.id,
          sourceName: this.name,
          leads: [],
          metadata: {
            total: 0,
            query: requestPayload.query,
            filtersCovered: this.getFiltersCovered(filters)
          }
        };
        
      } catch (error: any) {
        // Handle PDL specific errors
        if (error.response) {
          console.error('PDL API Response:', error.response.data);
          
          // Check for usage limit error (402 Payment Required)
          if (error.response.status === 402) {
            const errorData = error.response.data?.error;
            const isUsageLimitError = errorData?.type?.includes('payment_required') || 
                                      (errorData?.message && errorData.message.includes('maximum'));
            
            if (isUsageLimitError) {
              console.warn('PDL API usage limit reached');
              return {
                sourceId: this.id,
                sourceName: this.name,
                leads: [],
                metadata: {
                  total: 0,
                  query: requestPayload.query,
                  filtersCovered: [],
                  error: 'API usage limit reached. You have used all available PDL credits.',
                  usageLimitReached: true
                }
              };
            }
          }
        }
        
        // Handle other errors
        console.error('Error searching with PDL:', error);
        return this.createErrorResults(error instanceof Error ? error.message : 'Unknown error');
      }
      
    } catch (error) {
      console.error('Error in PDL search:', error);
      return this.createErrorResults(error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Create standardized error results
   */
  private createErrorResults(errorMessage: string): LeadSearchResults {
    return {
      sourceId: this.id,
      sourceName: this.name,
      leads: [],
      metadata: {
        total: 0,
        error: errorMessage,
        filtersCovered: []
      }
    };
  }
  
  /**
   * Enrich a lead with PDL API
   */
  async enrich(lead: any): Promise<LeadEnrichmentResult> {
    try {
      const apiKey = process.env.PDL_API_KEY;
      if (!apiKey) {
        throw new Error('PDL API key is missing');
      }
      
      let searchParams: any = {};
      
      // Determine the best parameters to use for enrichment
      if (lead.email) {
        searchParams.email = lead.email;
      } else if (lead.linkedin_url) {
        searchParams.profile = lead.linkedin_url;
      } else if (lead.first_name && lead.last_name && (lead.company || lead.domain)) {
        searchParams = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          company: lead.company || undefined,
          domain: lead.domain || undefined
        };
      } else {
        throw new Error('Insufficient data for PDL enrichment');
      }
      
      // Call PDL enrichment API
      const response = await axios.get('https://api.peopledatalabs.com/v5/person/enrich', {
        params: searchParams,
        headers: { 'X-Api-Key': apiKey }
      });
      
      if (!response.data) {
        throw new Error('No data returned from PDL');
      }
      
      const enrichedData = response.data;
      const fieldsEnriched = Object.keys(enrichedData).filter(key => 
        enrichedData[key] !== undefined && 
        (!lead[key] || lead[key] !== enrichedData[key])
      );
      
      return {
        sourceId: this.id,
        sourceName: this.name,
        originalLead: lead,
        enrichedData,
        confidence: enrichedData.likelihood || 0.8, // Use PDL's own confidence score if available
        fieldsEnriched
      };
      
    } catch (error) {
      console.error('Error enriching lead with PDL:', error);
      throw new Error(`PDL enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      
      // Don't actually make an API call, just verify API key exists
      // PDL doesn't have a specific status endpoint that's reliable for checks
      return {
        available: true,
        // We can't easily get quota info from PDL
      };
    } catch (error) {
      console.error('Error checking PDL status:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error checking PDL status'
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
