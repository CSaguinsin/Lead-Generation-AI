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
  errors: Array<{
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
    const response = await fetch('/api/hunter/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        domain,
        company
      }),
    });

    const responseText = await response.text();
    
    // Check for HTML responses
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<')) {
      throw new Error('Server returned HTML instead of JSON. Check API configuration.');
    }

    // Parse JSON
    const data = JSON.parse(responseText);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch email');
    }

    return data.data;
  } catch (error) {
    console.error('Error in findEmail:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch email. Please try again.'
    );
  }
}