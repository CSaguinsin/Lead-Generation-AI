// app/actions/enrichLead.ts
'use server';

import { enrichLead } from '../services/leadEnrichment';
import { saveLead } from '@/lib/supabase/leads';
import { createClient } from '@/utils/supabase/server';

export async function handleLeadEnrichment(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  try {
    // Get the authenticated user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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
    
    // The saveLead function now gets the authenticated user ID from the session
    // We still pass the user.id for logging/debugging purposes
    await saveLead(enrichedData, user.id);

    return { success: true, error: null };
  } catch (error) {
    console.error('Lead Enrichment Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Lead enrichment failed' 
    };
  }
}