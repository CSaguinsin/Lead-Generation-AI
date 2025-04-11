// app/api/hunter/proxy/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify API key exists
    if (!process.env.HUNTER_API_KEY) {
      console.error('Hunter API key missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { firstName, lastName, domain, company } = await request.json();

    // Clean domain input
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim();

    // Construct Hunter.io URL
    const params = new URLSearchParams({
      domain: cleanDomain,
      first_name: firstName,
      last_name: lastName,
      api_key: process.env.HUNTER_API_KEY
    });
    
    if (company) params.append('company', company);

    const hunterUrl = `https://api.hunter.io/v2/email-finder?${params.toString()}`;
    
    // Make request to Hunter.io
    const response = await fetch(hunterUrl);
    const responseText = await response.text();

    // Check for HTML response
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<')) {
      console.error('HTML Response from Hunter.io:', {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: responseText.slice(0, 500)
      });
      return NextResponse.json(
        { error: 'Received HTML response from API - check server logs' },
        { status: 502 }
      );
    }

    // Parse JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (error) {
      console.error('JSON Parse Error:', {
        responseText: responseText.slice(0, 500)
      });
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}