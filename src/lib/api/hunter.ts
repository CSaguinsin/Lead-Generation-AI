// lib/api/hunter.ts
import axios from 'axios';

interface HunterEmailFinderResponse {
  data: {
    email: string;
    score: number;
    domain: string;
    accept_all: boolean;
    position: string | null;
    twitter: string | null;
    linkedin_url: string | null;
    phone_number: string | null;
    company: string | null;
    sources: Array<{
      domain: string;
      uri: string;
      extracted_on: string;
      last_seen_on: string;
      still_on_page: boolean;
    }>;
    verification: {
      date: string | null;
      status: 'valid' | 'accept_all' | 'unknown';
    };
  };
  meta: {
    params: {
      first_name: string;
      last_name: string;
      domain: string;
      company: string | null;
    };
    results: number;
  };
}

interface HunterErrorResponse {
  errors?: Array<{
    id: string;
    code: number;
    details: string;
  }>;
}

export async function findEmail(
  firstName: string,
  lastName: string,
  domain: string,
  company?: string
): Promise<HunterEmailFinderResponse['data']> {
  try {
    // Validate inputs
    if (!firstName || !lastName || !domain) {
      throw new Error('First name, last name, and domain are required');
    }

    // Clean domain input
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim();

    const response = await axios.get<HunterEmailFinderResponse>(
      'https://api.hunter.io/v2/email-finder',
      {
        params: {
          domain: cleanDomain,
          first_name: firstName,
          last_name: lastName,
          company: company || undefined,
          api_key: process.env.HUNTER_API_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Hunter.io API Error:', {
      firstName,
      lastName,
      domain,
      error: axios.isAxiosError(error) ? {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      } : error
    });

    if (axios.isAxiosError<HunterErrorResponse>(error)) {
      const errorMessages = error.response?.data?.errors?.map(err => err.details).join(', ');
      throw new Error(errorMessages || 'Failed to fetch email from Hunter.io');
    }

    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch email from Hunter.io'
    );
  }
}

// Utility function for domain cleaning (reusable)
export function cleanDomain(domain: string): string {
  return domain
    .replace(/^(https?:\/\/)?(www\.)?/i, '')
    .split('/')[0]
    .trim();
}