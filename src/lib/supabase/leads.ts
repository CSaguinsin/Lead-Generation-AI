// lib/supabase/leads.ts
import { createClient } from "@/utils/supabase/client";

interface Lead {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  domain: string;
  status: 'verified' | 'unverified';
  hunter_score?: number;
}

export async function saveLead(lead: Lead) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('leads')
    .insert([lead])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}