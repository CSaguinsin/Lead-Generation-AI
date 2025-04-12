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