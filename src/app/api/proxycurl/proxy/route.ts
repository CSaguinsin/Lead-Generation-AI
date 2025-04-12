import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.PROXYCURL_API_KEY) {
      throw new Error('Proxycurl API key not configured');
    }

    const { profileUrl } = await request.json();

    const response = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(profileUrl)}&use_cache=if-present`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Proxycurl responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxycurl Proxy Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Profile lookup failed' },
      { status: 500 }
    );
  }
}