'use server';

import axios from 'axios';
import { Lead, LeadStatus } from '@/app/types/lead';
import { searchLeadsPDL } from './searchLeadsPDL';

interface SearchFilters {
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  jobLevel?: string;
}

// Define types for PDL API parameters and responses
interface PDLIdentifyParams {
  include_fields: string;
  pretty: boolean;
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  size?: string;
  job_title?: string;
  job_company_name?: string;
  job_company_industry?: string;
  location_country?: string;
  location_locality?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  [key: string]: string | boolean | undefined;
}

interface PDLIdentifyResponse {
  id?: string;
  name?: {
    first?: string;
    last?: string;
    middle?: string;
    full?: string;
  };
  emails?: Array<{
    address: string;
    type?: string;
  }>;
  phone_numbers?: string[];
  profiles?: {
    linkedin?: {
      url?: string;
    };
    [key: string]: any;
  };
  job_title?: string;
  job_company_name?: string;
  job_company_industry?: string;
  location_name?: string;
  location_country?: string;
  location_locality?: string;
  [key: string]: any;
}

/**
 * Search for leads using PDL's Person Identify API to ensure phone numbers are included
 * This is a separate implementation from searchLeadsPDL that uses the Person Identify API
 * instead of the Person Search API to get better phone number data
 */
export async function identifyLeadsPDL(filters: SearchFilters) {
  try {
    // Ensure PDL API key exists
    const apiKey = process.env.PDL_API_KEY;
    if (!apiKey) {
      throw new Error('PDL API key is missing');
    }

    // First, use the search API to get a list of potential leads
    const searchResults = await searchLeadsPDL(filters);
    
    if (!searchResults || searchResults.length === 0) {
      return [];
    }
    
    console.log(`Found ${searchResults.length} initial results, enhancing with Identify API...`);
    
    // Now use the Identify API to get detailed information including phone numbers
    // Process up to 10 results to avoid rate limiting
    const resultsToProcess = searchResults.slice(0, 10);
    
    // Process each result with the Identify API
    // Use sequential processing with delay to avoid rate limiting
    const enhancedResults = [];
    for (const person of resultsToProcess) {
      try {
        // Prepare parameters for Person Identify API
        const identifyParams: PDLIdentifyParams = {
          include_fields: 'emails,phone_numbers,profiles,location_name,job_title,job_company_name',
          pretty: true
        };

        // IMPORTANT FIX: First add the original search filters to ensure we're respecting the search criteria
        if (filters.title && filters.title !== 'any') {
          identifyParams.title = filters.title;
        }
        
        if (filters.company && filters.company !== 'any') {
          identifyParams.company = filters.company;
        }
        
        if (filters.location && filters.location !== 'any') {
          identifyParams.location = filters.location;
        }
        
        if (filters.industry && filters.industry !== 'all') {
          // Industry isn't directly supported by Identify API, but we'll keep the filter consistent
          // by ensuring we only use company matches that would match this industry
          if (person.job_company_industry !== filters.industry) {
            console.log('Skipping person due to industry mismatch:', person.name);
            continue;
          }
        }

        // Now add identifying information from search result as additional context
        // but don't override the original filters
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

        // Only add company from person if we don't already have a company filter
        if (!identifyParams.company && person.job_company_name) {
          identifyParams.company = person.job_company_name;
        }

        // Only add title from person if we don't already have a title filter
        if (!identifyParams.title && person.job_title) {
          identifyParams.title = person.job_title;
        }

        if (person.linkedin_url) {
          identifyParams.profile = person.linkedin_url;
        }

        // Ensure we have at least one parameter to identify the person
        if (!identifyParams.first_name && !identifyParams.profile && !identifyParams.email && 
            !identifyParams.company && !identifyParams.title && !identifyParams.location) {
          console.log('Insufficient data to identify person:', person);
          enhancedResults.push(formatIdentifyResponse(person));
          continue;
        }

        console.log('Identify API parameters:', identifyParams);

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        // Call PDL Person Identify API
        const response = await axios.get(
          'https://api.peopledatalabs.com/v5/person/identify',
          {
            params: identifyParams,
            headers: {
              'X-Api-Key': apiKey,
              'Accept-Encoding': 'gzip'
            },
            timeout: 10000
          }
        );

        if (response.data) {
          // Merge search result data with identify data
          const identifyData: PDLIdentifyResponse = response.data;
          
          // Verify that the identified person matches our original search criteria
          let matchesSearchCriteria = true;
          
          if (filters.title && filters.title !== 'any' && 
              identifyData.job_title && !identifyData.job_title.toLowerCase().includes(filters.title.toLowerCase())) {
            console.log('Identified person does not match title criteria:', identifyData.job_title);
            matchesSearchCriteria = false;
          }
          
          if (filters.company && filters.company !== 'any' && 
              identifyData.job_company_name && !identifyData.job_company_name.toLowerCase().includes(filters.company.toLowerCase())) {
            console.log('Identified person does not match company criteria:', identifyData.job_company_name);
            matchesSearchCriteria = false;
          }
          
          // Only add the result if it matches our search criteria
          if (matchesSearchCriteria) {
            enhancedResults.push(formatIdentifyResponse({
              ...person,
              ...identifyData,
              // Preserve original search data if identify doesn't have it
              job_title: identifyData.job_title || person.job_title,
              job_company_name: identifyData.job_company_name || person.job_company_name,
              linkedin_url: identifyData.profiles?.linkedin?.url || identifyData.linkedin_url || person.linkedin_url
            }));
          } else {
            console.log('Skipping result that does not match search criteria');
          }
        } else {
          // If identify fails, format the original search result
          enhancedResults.push(formatIdentifyResponse(person));
        }
      } catch (error) {
        console.error('Error enhancing lead with Identify API:', error);
        // On error, return the original search result formatted
        enhancedResults.push(formatIdentifyResponse(person));
        
        // If we hit a rate limit, add a longer delay
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          console.log('Rate limit hit, adding delay...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Filter out any null results
    const validResults = enhancedResults.filter(result => result !== null);
    
    console.log(`Successfully enhanced ${validResults.length} leads with additional data`);
    return validResults;
    
  } catch (error) {
    console.error('Error in identifyLeadsPDL:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Response:', error.response?.data);
    }
    throw new Error('Failed to identify leads. ' + (axios.isAxiosError(error) ? error.response?.data?.error?.message || '' : ''));
  }
}

/**
 * Format the PDL Identify API response into our lead format
 */
function formatIdentifyResponse(identifyData: PDLIdentifyResponse): Lead | null {
  try {
    if (!identifyData) return null;

    // Extract primary email
    let primaryEmail = '';
    if (identifyData.emails && identifyData.emails.length > 0) {
      // Handle email being either a string or an object with address property
      primaryEmail = typeof identifyData.emails[0] === 'string' 
        ? identifyData.emails[0] 
        : identifyData.emails[0].address;
    }

    // Extract primary phone number
    let primaryPhone = '';
    if (identifyData.phone_numbers && identifyData.phone_numbers.length > 0) {
      primaryPhone = identifyData.phone_numbers[0];
    }

    // Format phone number if needed
    if (primaryPhone) {
      // Keep the + sign for international format if it exists
      if (!primaryPhone.startsWith('+')) {
        // For US numbers, ensure proper formatting
        const digits = primaryPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          primaryPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
        }
      }
    }

    // Create a standardized lead object
    return {
      first_name: identifyData.name?.first || '',
      last_name: identifyData.name?.last || '',
      email: primaryEmail,
      position: identifyData.job_title || '',
      company: identifyData.job_company_name || '',
      domain: '', // PDL doesn't always provide domain
      status: primaryEmail ? LeadStatus.Verified : LeadStatus.Unverified,
      linkedin_url: identifyData.profiles?.linkedin?.url || '',
      company_data: {
        name: identifyData.job_company_name || '',
        industry: identifyData.job_company_industry || '',
        location: {
          country: identifyData.location_country || '',
          locality: identifyData.location_locality || ''
        }
      },
      // Add phone_number to the lead data for display
      phone_number: primaryPhone,
      // Include profile data if available
      profile_data: {
        summary: '',
        experiences: [],
        education: []
      }
    };
  } catch (error) {
    console.error('Error formatting PDL identify response:', error);
    return null;
  }
}
