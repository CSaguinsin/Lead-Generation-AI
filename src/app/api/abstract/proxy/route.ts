import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.ABSTRACT_API_KEY) {
      throw new Error('Abstract API key not configured');
    }

    const { email } = await request.json();

    const response = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      throw new Error(`Abstract API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Abstract Proxy Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}