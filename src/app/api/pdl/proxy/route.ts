import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.PDL_API_KEY) {
      throw new Error('PDL API key not configured');
    }

    const { domain } = await request.json();

    const response = await fetch(
      `https://api.peopledatalabs.com/v5/company/enrich?website=${encodeURIComponent(domain)}`,
      {
        headers: {
          'X-Api-Key': process.env.PDL_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`PDL API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('PDL Proxy Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Company lookup failed' },
      { status: 500 }
    );
  }
}