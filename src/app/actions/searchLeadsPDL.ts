'use server';

import axios from 'axios';
import { mapJobLevelToTitle, mapCompanySizeToRange } from '@/utils/pdlHelpers';

interface SearchFilters {
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  jobLevel?: string;
}

// Define a type for PDL Elasticsearch query
interface PDLElasticsearchQuery {
  bool: {
    must: Array<{
      match?: Record<string, string>;
      bool?: {
        should: Array<{
          match: Record<string, string>;
        }>;
        minimum_should_match: number;
      };
      range?: {
        [key: string]: {
          gte?: number;
          lte?: number;
        };
      };
    }>;
  };
}

/**
 * Build a PDL Elasticsearch query from our filter options
 */
function buildPDLQuery(filters: SearchFilters): any {
  const query: any = {
    bool: {
      must: []
    }
  };

  // Add title filter
  if (filters.title && filters.title !== 'any') {
    // Use a more flexible match for job titles
    query.bool.must.push({
      match: {
        job_title: filters.title
      }
    });
  }

  // Add company filter
  if (filters.company && filters.company !== 'any') {
    query.bool.must.push({
      match: {
        job_company_name: filters.company
      }
    });
  }

  // Add location filter
  if (filters.location && filters.location !== 'any') {
    query.bool.must.push({
      bool: {
        should: [
          { match: { location_country: filters.location } },
          { match: { location_locality: filters.location } },
          { match: { location_region: filters.location } }
        ],
        minimum_should_match: 1
      }
    });
  }

  // Add industry filter
  if (filters.industry && filters.industry !== 'all') {
    query.bool.must.push({
      match: {
        job_company_industry: filters.industry
      }
    });
  }

  // Add company size filter
  if (filters.companySize && filters.companySize !== 'any_size') {
    // Map UI filter values to PDL size ranges
    const sizeRanges: Record<string, { gte?: number; lte?: number }> = {
      'small': { lte: 50 },
      'medium': { gte: 51, lte: 200 },
      'large': { gte: 201, lte: 1000 },
      'enterprise': { gte: 1001 }
    };

    const sizeRange = sizeRanges[filters.companySize];
    if (sizeRange) {
      query.bool.must.push({
        range: {
          job_company_employee_count: sizeRange
        }
      });
    }
  }

  // Add job level filter
  if (filters.jobLevel && filters.jobLevel !== 'any_level') {
    // Map UI filter values to PDL job levels
    const jobLevelMap: Record<string, string[]> = {
      'c_level': ['CEO', 'CTO', 'CFO', 'CMO', 'COO', 'Chief'],
      'vp_level': ['VP', 'Vice President'],
      'director_level': ['Director'],
      'manager_level': ['Manager'],
      'entry_level': ['Associate', 'Specialist', 'Analyst']
    };

    const jobLevels = jobLevelMap[filters.jobLevel];
    if (jobLevels && jobLevels.length > 0) {
      const shouldClauses = jobLevels.map(level => ({
        match: {
          job_title: level
        }
      }));

      query.bool.must.push({
        bool: {
          should: shouldClauses,
          minimum_should_match: 1
        }
      });
    }
  }

  return query;
}

export async function searchLeadsPDL(filters: SearchFilters) {
  try {
    // Ensure PDL API key exists
    const pdlApiKey = process.env.PDL_API_KEY;
    if (!pdlApiKey) {
      throw new Error('PDL API key is missing');
    }

    // Build PDL Elasticsearch query using correct field names
    // According to the PDL documentation
    const esQuery = buildPDLQuery(filters);
    
    // Build request payload with the proper query structure
    const requestPayload = {
      query: esQuery,
      size: 10,
      pretty: false,
      from: Math.floor(Math.random() * 20), // Add randomization to get different results each time
      fields: [
        "id",
        "name",
        "first_name",
        "last_name",
        "emails",
        "email",
        "phone_numbers",
        "phones",
        "mobile_phone",
        "job_title",
        "job_company_name",
        "job_company_industry",
        "job_company_website",
        "job_company_size",
        "job_company_founded",
        "job_company_location_name",
        "job_company_employee_count",
        "location_name",
        "location_country",
        "location_locality",
        "location_region",
        "linkedin_url",
        "facebook_url",
        "twitter_url",
        "github_url",
        "work_email",
        "personal_emails",
        "summary",
        "skills",
        "experience",
        "education"
      ]
    };
    
    console.log("PDL Search request payload:", JSON.stringify(requestPayload, null, 2));
    
    try {
      // Call PDL Search API
      const response = await axios.post(
        'https://api.peopledatalabs.com/v5/person/search', 
        requestPayload,
        { 
          headers: {
            'X-Api-Key': pdlApiKey,
            'User-Agent': 'LeadGenerationAI/1.0',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('PDL response status:', response.status);
      if (response.data && response.data.data) {
        console.log(`Found ${response.data.data.length} results`);
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      // Check if this is a "no records found" response (404) or payment required (402)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log('No records found matching the search criteria');
          return []; // Return empty array instead of throwing an error
        }
        
        if (error.response?.status === 402) {
          console.log('PDL account limit reached. Returning empty results to allow fallback to other services.');
          // Log this as a warning for the admin to see
          console.warn('WARNING: PDL API quota has been exhausted. Please upgrade your plan or wait for quota reset.');
          return []; // Return empty array instead of throwing an error
        }
        
        console.error('API Response:', error.response?.data);
      }
      
      // For other errors, return empty results instead of throwing
      console.error('Error searching for leads:', error);
      return [];
    }
  } catch (error) {
    console.error('Error setting up search request:', error);
    // Return empty array instead of throwing
    return [];
  }
}
