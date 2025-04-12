// lib/supabase/leads.ts
import { createClient as createClientBrowser } from "@/utils/supabase/client";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { Lead } from "@/app/types/lead";

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
    status: enrichedData.contact.emailQuality.deliverable ? 'verified' : 'unverified',
    email_quality: enrichedData.contact.emailQuality,
    company_data: {
      name: enrichedData.company.name,
      industry: enrichedData.company.industry,
      size: enrichedData.company.size,
      location: enrichedData.company.location,
      linkedin_url: enrichedData.contact.linkedinUrl
    },
    profile_data: enrichedData.profile || null,
    linkedin_url: enrichedData.contact.linkedinUrl || null,
    created_at: new Date().toISOString(),
    created_by: userId // This should match the authenticated user ID from the server action
  };

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase Error Details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Full Error Context:', {
      error,
      leadData: {
        ...leadData,
        company_data: '[REDACTED]',
        profile_data: '[REDACTED]'
      },
      userId
    });
    throw new Error(
      error instanceof Error ? error.message : 'Failed to save lead'
    );
  }
}