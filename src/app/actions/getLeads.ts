'use server';

import { getLeads, getLeadStats } from '@/lib/supabase/leads';
import { Lead } from '@/app/types/lead';

export async function fetchLeads(filter?: 'verified' | 'unverified'): Promise<Lead[]> {
  try {
    const leads = await getLeads(filter);
    return leads;
  } catch (error) {
    console.error('Error in fetchLeads action:', error);
    return [];
  }
}

export async function fetchLeadStats() {
  try {
    const stats = await getLeadStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error in fetchLeadStats action:', error);
    return {
      success: false,
      data: {
        totalLeads: 0,
        verifiedLeads: 0,
        conversionRate: '0%',
        activeCampaigns: 0
      }
    };
  }
}
