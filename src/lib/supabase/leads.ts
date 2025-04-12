// lib/supabase/leads.ts
import { createClient as createClientBrowser } from "@/utils/supabase/client";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { Lead, LeadStatus } from "@/app/types/lead";

export async function saveLead(
  enrichedData: {
    contact: {
      firstName: string;
      lastName: string;
      email: string;
      position?: string;
      emailQuality: {
        deliverable: boolean;
        quality_score: string;
        is_valid_format: boolean;
      };
      linkedinUrl?: string;
    };
    company: {
      name: string;
      domain: string;
      industry?: string;
      size?: string;
      location?: {
        country: string;
        locality: string;
      };
    };
    profile?: {
      summary?: string;
      experiences?: Array<{
        company: string;
        title: string;
        duration: string;
      }>;
      education?: Array<{
        school: string;
        degree: string;
      }>;
    };
  },
  userId: string
): Promise<Lead> {
  // Use the server-side Supabase client which properly handles authentication
  const supabase = await createServerClient();

  // We don't need to check authentication here as it's already handled in the server action
  // and the server-side client will properly pass the auth context
  const leadData = {
    first_name: enrichedData.contact.firstName,
    last_name: enrichedData.contact.lastName,
    email: enrichedData.contact.email,
    position: enrichedData.contact.position || null,
    company: enrichedData.company.name,
    domain: enrichedData.company.domain,
    status: enrichedData.contact.emailQuality.deliverable ? "verified" : "unverified",
    deliverable: enrichedData.contact.emailQuality.deliverable,
    quality_score: enrichedData.contact.emailQuality.quality_score,
    is_valid_format: enrichedData.contact.emailQuality.is_valid_format,
    linkedin_url: enrichedData.contact.linkedinUrl || null,
    created_by: userId,
    created_at: new Date().toISOString(),
    enriched_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Error saving lead:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(
      "Failed to save lead:",
      error instanceof Error ? error.message : 'Failed to save lead'
    );
    throw new Error(
      error instanceof Error ? error.message : 'Failed to save lead'
    );
  }
}

// Function to fetch leads from Supabase
export async function getLeads(filter?: LeadStatus) {
  const supabase = await createServerClient();
  
  try {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filter if provided
    if (filter) {
      query = query.eq('status', filter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    throw new Error('Failed to fetch leads');
  }
}

// Function to get lead statistics
export async function getLeadStats() {
  const supabase = await createServerClient();
  
  try {
    // Get total leads count
    const { count: totalLeadsCount, error: totalError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
      
    if (totalError) throw totalError;
    
    // Get verified leads count
    const { count: verifiedLeadsCount, error: verifiedError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified');
      
    if (verifiedError) throw verifiedError;
    
    // Ensure we have valid numbers by using nullish coalescing
    const totalLeads = totalLeadsCount ?? 0;
    const verifiedLeads = verifiedLeadsCount ?? 0;
    
    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((verifiedLeads / totalLeads) * 100).toFixed(1) : '0';
    
    return {
      totalLeads,
      verifiedLeads,
      conversionRate: `${conversionRate}%`,
      activeCampaigns: 0 // Placeholder for future implementation
    };
  } catch (error) {
    console.error('Failed to fetch lead statistics:', error);
    return {
      totalLeads: 0,
      verifiedLeads: 0,
      conversionRate: '0%',
      activeCampaigns: 0
    };
  }
}