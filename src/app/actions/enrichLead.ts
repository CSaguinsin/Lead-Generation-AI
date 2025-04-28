// app/actions/enrichLead.ts
'use server';

import { enrichLead } from '../services/leadEnrichment';
import { saveLead } from '@/lib/supabase/leads';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function handleLeadEnrichment(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  try {
    // Get the user ID from the cookie instead of using Supabase Auth
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      throw new Error('Authentication required: Please log in to save leads');
    }

    // Fetch the user from the database to verify they exist
    const { data: user, error: userError } = await supabase
      .from('user_clients')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Authentication required: Please log in to save leads');
    }

    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const domain = formData.get('domain')?.toString();
    const company = formData.get('company')?.toString();

    if (!firstName || !lastName || !domain) {
      throw new Error('First name, last name, and domain are required');
    }

    const enrichedData = await enrichLead(firstName, lastName, domain, company);
    
    // Pass the user ID from the cookie for saving the lead
    await saveLead(enrichedData, userId);

    return { success: true, error: null };
  } catch (error) {
    console.error('Lead Enrichment Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Lead enrichment failed' 
    };
  }
}