// lib/api/pdl.ts
import axios from 'axios';

interface PDLCompanyResponse {
  name: string;
  size?: string;
  industry?: string;
  location?: {
    country: string;
    locality: string;
  };
  linkedin_url?: string;
  website?: string;
  founded?: number;
  employees?: number;
  // Add other relevant fields from the API response
}

interface PDLCompanyErrorResponse {
  message?: string;
  status?: number;
  errors?: string[];
}

interface PDLPersonParams {
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  domain?: string;
  linkedin_url?: string;
}

interface PDLPersonResponse {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_numbers?: string[];
  phones?: Array<{
    number: string;
    first_seen: string;
    last_seen: string;
    num_sources: number;
    type?: string;
    country_code?: string;
  }>;
  phone?: string; // This will be populated by our converter
  job_title?: string;
  job_company_name?: string;
  linkedin_url?: string;
  summary?: string;
  experience?: Array<{
    company?: {
      name?: string;
    };
    title?: string;
    start_date?: string;
    end_date?: string;
  }>;
  education?: Array<{
    school?: {
      name?: string;
    };
    degree?: {
      name?: string;
    };
  }>;
  // Other fields from PDL person schema
}

export async function getCompanyData(domain: string): Promise<PDLCompanyResponse> {
  try {
    // Validate domain input
    if (!domain) {
      throw new Error('Domain is required');
    }

    // Clean domain input
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim();

    if (!cleanDomain) {
      throw new Error('Invalid domain format');
    }

    // Verify API key exists
    if (!process.env.PDL_API_KEY) {
      throw new Error('PDL API key not configured');
    }

    const response = await axios.get<PDLCompanyResponse>(
      'https://api.peopledatalabs.com/v5/company/enrich',
      {
        params: {
          website: cleanDomain,
        },
        headers: {
          'X-Api-Key': process.env.PDL_API_KEY,
          'Accept-Encoding': 'gzip', // Recommended by PDL docs
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('PDL API Error:', {
      domain,
      error: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      } : error
    });

    if (axios.isAxiosError<PDLCompanyErrorResponse>(error)) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.statusText || 
                         'Failed to fetch company data';
      throw new Error(`PDL API: ${errorMessage}`);
    }

    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch company data'
    );
  }
}

/**
 * Find a person using PDL's Person Enrichment API
 * This function will attempt to find a person using various parameters
 * and return their data including phone numbers if available
 */
export async function findPersonWithPDL(params: PDLPersonParams): Promise<PDLPersonResponse | null> {
  try {
    // Verify API key exists
    if (!process.env.PDL_API_KEY) {
      throw new Error('PDL API key not configured');
    }

    // Build request parameters
    const requestParams: Record<string, string> = {};
    
    if (params.firstName && params.lastName) {
      requestParams.first_name = params.firstName;
      requestParams.last_name = params.lastName;
    }
    
    if (params.company) {
      requestParams.company = params.company;
    }
    
    if (params.email) {
      requestParams.email = params.email;
    }
    
    if (params.domain) {
      requestParams.company_domain = params.domain;
    }
    
    if (params.linkedin_url) {
      requestParams.linkedin_url = params.linkedin_url;
    }
    
    // Call PDL Person Enrichment API
    const response = await axios.get<PDLPersonResponse>(
      'https://api.peopledatalabs.com/v5/person/enrich',
      {
        params: requestParams,
        headers: {
          'X-Api-Key': process.env.PDL_API_KEY,
          'Accept-Encoding': 'gzip',
        },
        timeout: 10000,
      }
    );

    // Process the response to extract phone number
    const personData = response.data;
    
    // Extract primary phone if available and add it as a simplified field
    if (personData.phones && personData.phones.length > 0) {
      personData.phone = personData.phones[0].number;
    } else if (personData.phone_numbers && personData.phone_numbers.length > 0) {
      personData.phone = personData.phone_numbers[0];
    }
    
    return personData;
  } catch (error) {
    console.error('PDL Person API Error:', {
      params,
      error: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      } : error
    });
    
    // If it's a 404 (not found), return null instead of throwing an error
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    
    // For other errors, log but don't throw to prevent breaking the enrichment flow
    return null;
  }
}

/**
 * Find a person using PDL's Person Identify API
 * This function provides better matching and phone number retrieval compared to the Enrich API
 */
export async function identifyPersonWithPDL(params: PDLPersonParams): Promise<PDLPersonResponse | null> {
  try {
    // Verify API key exists
    if (!process.env.PDL_API_KEY) {
      throw new Error('PDL API key not configured');
    }

    // Build request parameters - Person Identify API requires different parameter structure
    const requestParams: Record<string, string> = {};
    
    if (params.firstName && params.lastName) {
      requestParams.first_name = params.firstName;
      requestParams.last_name = params.lastName;
    }
    
    if (params.company) {
      requestParams.company = params.company;
    }
    
    if (params.email) {
      requestParams.email = params.email;
    }
    
    if (params.linkedin_url) {
      requestParams.profile = params.linkedin_url;
    }
    
    // Call PDL Person Identify API
    const response = await axios.get<PDLPersonResponse>(
      'https://api.peopledatalabs.com/v5/person/identify',
      {
        params: requestParams,
        headers: {
          'X-Api-Key': process.env.PDL_API_KEY,
          'Accept-Encoding': 'gzip',
        },
        timeout: 10000,
      }
    );

    // Process the response to extract phone number
    const personData = response.data;
    
    // Extract primary phone if available and add it as a simplified field
    if (personData.phones && personData.phones.length > 0) {
      personData.phone = personData.phones[0].number;
    } else if (personData.phone_numbers && personData.phone_numbers.length > 0) {
      personData.phone = personData.phone_numbers[0];
    }
    
    return personData;
  } catch (error) {
    console.error('PDL Person Identify API Error:', {
      params,
      error: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      } : error
    });
    
    // If it's a 404 (not found), return null instead of throwing an error
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    
    // For other errors, log but don't throw to prevent breaking the enrichment flow
    return null;
  }
}