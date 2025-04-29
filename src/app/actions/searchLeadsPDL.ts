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

export async function searchLeadsPDL(filters: SearchFilters) {
  try {
    // Ensure PDL API key exists
    const apiKey = process.env.PDL_API_KEY;
    if (!apiKey) {
      throw new Error('PDL API key is missing');
    }

    // Build PDL Elasticsearch query using correct field names
    // According to the PDL documentation
    const esQuery: PDLElasticsearchQuery = {
      bool: {
        must: []
      }
    };
    
    // Add job title filter - use the correct field name
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
    
    // Add company filter - use job_company_name instead of company.name
    if (filters.company && filters.company !== 'any') {
      esQuery.bool.must.push({
        match: { "job_company_name": filters.company }
      });
    }
    
    // Add location filter - use the correct location fields
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
    
    // Add industry filter - use job_company_industry instead of company.industry
    if (filters.industry && filters.industry !== 'all') {
      esQuery.bool.must.push({
        match: { "job_company_industry": filters.industry }
      });
    }
    
    // Add company size filter - use job_company_employee_count
    if (filters.companySize && filters.companySize !== 'any_size') {
      const sizeFilter = mapCompanySizeToRange(filters.companySize);
      if (sizeFilter) {
        const sizeParts = sizeFilter.split(':');
        if (sizeParts.length === 2) {
          const sizeRange = sizeParts[1].split('-');
          esQuery.bool.must.push({
            range: {
              "job_company_employee_count": {
                gte: parseInt(sizeRange[0], 10),
                lte: parseInt(sizeRange[1] || "1000000", 10)
              }
            }
          });
        }
      }
    }
    
    // Build request payload with the proper query structure
    const requestPayload = {
      query: esQuery,
      size: 100,
      pretty: false,
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
        JSON.stringify(requestPayload),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
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
      // Check if this is a "no records found" response (404)
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('No records found matching the search criteria');
        return []; // Return empty array instead of throwing an error
      }
      
      // Handle other errors
      console.error('Error searching for leads:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
      }
      throw new Error('Failed to search for leads. ' + (axios.isAxiosError(error) ? error.response?.data?.error?.message || '' : ''));
    }
  } catch (error) {
    console.error('Error setting up search request:', error);
    throw new Error('Failed to set up search request');
  }
}
