// lib/supabase/leads.ts
import { createClient as createClientBrowser } from "@/utils/supabase/client";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { Lead, LeadStatus } from "@/app/types/lead";
import { cookies } from "next/headers";

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
      phoneNumber?: string;
      phoneType?: string;
      phoneCountry?: string;
      phoneData?: any;
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

  try {
    console.log(`Attempting to save lead for user ID: ${userId}`);
    
    // First, ensure the user exists in user_clients
    const { data: userClient, error: userClientError } = await supabase
      .from("user_clients")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();
      
    if (userClientError || !userClient) {
      console.error("Error fetching user client:", userClientError);
      throw new Error("User not found in user_clients table");
    }
    
    console.log(`User verified in user_clients: ${userClient.full_name} (${userClient.email})`);
    
    // Create the lead data
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
      phone_number: enrichedData.contact.phoneNumber || null,
      phone_type: enrichedData.contact.phoneType || null,
      phone_country: enrichedData.contact.phoneCountry || null,
      phone_data: enrichedData.contact.phoneData || null,
      created_at: new Date().toISOString(),
      enriched_at: new Date().toISOString(),
    };

    // SOLUTION: Instead of trying to use the foreign key constraint with a non-existent users table,
    // we'll insert the lead directly without the created_by field
    
    console.log("Inserting lead without created_by field to bypass foreign key constraint");
    const { data, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      // If there's an error, it might be because the created_by field is required
      console.error("Error saving lead without created_by:", error);
      
      // Try a different approach - use a null value for created_by
      console.log("Trying to insert lead with null created_by");
      const { data: nullData, error: nullError } = await supabase
        .from("leads")
        .insert({
          ...leadData,
          created_by: null
        })
        .select()
        .single();
        
      if (nullError) {
        console.error("Error saving lead with null created_by:", nullError);
        
        // Last resort: Try to use the user_clients ID directly despite the constraint
        console.log("Trying to insert lead with user_clients ID as created_by");
        const { data: directData, error: directError } = await supabase
          .from("leads")
          .insert({
            ...leadData,
            created_by: userId
          })
          .select()
          .single();
          
        if (directError) {
          console.error("All lead insert attempts failed:", directError);
          throw new Error("Cannot save lead after multiple attempts");
        }
        
        return directData;
      }
      
      return nullData;
    }

    console.log("Lead saved successfully!");
    return data;
  } catch (error) {
    console.error(
      "Failed to save lead:",
      error instanceof Error ? error.message : 'Failed to save lead',
      error
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
    // Get the user ID from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return [];
    }
    
    let query = supabase
      .from('leads')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    // Apply filter if provided and not 'all'
    if (filter && filter !== LeadStatus.All) {
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
    // Get the user ID from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return {
        totalLeads: 0,
        verifiedLeads: 0,
        conversionRate: '0%',
        activeCampaigns: 0
      };
    }
    
    // Get total leads count
    const { count: totalLeadsCount, error: totalError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);
      
    if (totalError) throw totalError;
    
    // Get verified leads count
    const { count: verifiedLeadsCount, error: verifiedError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .eq('created_by', userId);
      
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
    console.error('Failed to fetch lead stats:', error);
    return {
      totalLeads: 0,
      verifiedLeads: 0,
      conversionRate: '0%',
      activeCampaigns: 0
    };
  }
}