// app/api/hunter/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Verify API key exists
    if (!process.env.HUNTER_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { firstName, lastName, domain, company } = await req.json();

    // Clean domain input
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
      .trim();

    // Build query parameters
    const params = new URLSearchParams({
      domain: cleanDomain,
      first_name: firstName,
      last_name: lastName,
      api_key: process.env.HUNTER_API_KEY
    });
    
    if (company) params.append('company', company);

    // Make request to Hunter.io
    const response = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hunter API Error:', {
        status: response.status,
        error: errorText.slice(0, 500)
      });
      return NextResponse.json(
        { error: "Failed to fetch from Hunter.io" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy Server Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}