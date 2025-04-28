import { NextRequest, NextResponse } from 'next/server';
import { getLeads, saveLead } from '@/lib/supabase/leads';
import { cookies } from 'next/headers';

/**
 * GET handler for fetching leads
 */
export async function GET(request: NextRequest) {
  try {
    // Get the status filter from query params if present
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    
    // Get leads from the database
    const leads = await getLeads(status);
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for saving a lead
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { leadData, userId } = await request.json();
    
    // Validate the request
    if (!leadData || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Save the lead to the database
    const savedLead = await saveLead(leadData, userId);
    
    return NextResponse.json(savedLead);
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save lead' },
      { status: 500 }
    );
  }
}
