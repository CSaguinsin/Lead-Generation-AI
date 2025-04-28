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
        const identifyParams: Record<string, any> = {
          include_fields: 'emails,phone_numbers,profiles,location_name,job_title,job_company_name',
          pretty: true
        };

        // Add identifying information from search result
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

        if (person.job_company_name) {
          identifyParams.company = person.job_company_name;
        }

        if (person.job_title) {
          identifyParams.title = person.job_title;
        }

        if (person.linkedin_url) {
          identifyParams.profile = person.linkedin_url;
        }

        // Ensure we have at least one parameter to identify the person
        if (!identifyParams.first_name && !identifyParams.profile && !identifyParams.email) {
          console.log('Insufficient data to identify person:', person);
          enhancedResults.push(formatIdentifyResponse(person));
          continue;
        }

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
          const identifyData = response.data;
          enhancedResults.push(formatIdentifyResponse({
            ...person,
            ...identifyData,
            // Preserve original search data if identify doesn't have it
            job_title: identifyData.job_title || person.job_title,
            job_company_name: identifyData.job_company_name || person.job_company_name,
            linkedin_url: identifyData.linkedin_url || person.linkedin_url
          }));
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
function formatIdentifyResponse(identifyData: any): Lead | null {
  try {
    if (!identifyData) return null;

    // Extract primary email
    let primaryEmail = '';
    if (identifyData.emails && identifyData.emails.length > 0) {
      primaryEmail = identifyData.emails[0].address || identifyData.emails[0];
    }

    // Extract primary phone number
    let primaryPhone = '';
    if (identifyData.phones && identifyData.phones.length > 0) {
      primaryPhone = identifyData.phones[0].number;
    } else if (identifyData.phone_numbers && identifyData.phone_numbers.length > 0) {
      primaryPhone = identifyData.phone_numbers[0];
    }

    // Format phone number if needed
    if (primaryPhone) {
      if (!primaryPhone.startsWith('+')) {
        const digits = primaryPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          primaryPhone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
        } else if (digits.length === 11 && digits.startsWith('1')) {
          primaryPhone = `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
        }
      }
    }

    // Create a standardized lead object
    return {
      first_name: identifyData.first_name || '',
      last_name: identifyData.last_name || '',
      email: primaryEmail,
      phone: primaryPhone,
      position: identifyData.job_title || '',
      company: identifyData.job_company_name || '',
      linkedin_url: identifyData.linkedin_url || '',
      location: identifyData.location_name || 
               (identifyData.location_country ? 
                 `${identifyData.location_locality || ''}, ${identifyData.location_country}` : 
                 ''),
      source: 'pdl_identify',
      status: LeadStatus.New,
      // Include additional data from identify response
      ...identifyData
    };
  } catch (error) {
    console.error('Error formatting identify response:', error);
    return null;
  }
}
