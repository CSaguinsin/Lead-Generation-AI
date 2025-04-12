// types/supabase.ts
import { EmailQuality, CompanyData, ProfileData } from '@/app/types/lead';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          position: string | null;
          company: string;
          domain: string;
          status: 'verified' | 'unverified';
          email_quality: EmailQuality | null;
          company_data: CompanyData | null;
          profile_data: ProfileData | null;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string | null;
          created_by: string;
          enriched_at: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          position?: string | null;
          company: string;
          domain: string;
          status: 'verified' | 'unverified';
          email_quality?: EmailQuality | null;
          company_data?: CompanyData | null;
          profile_data?: ProfileData | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
          created_by: string;
          enriched_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          position?: string | null;
          company?: string;
          domain?: string;
          status?: 'verified' | 'unverified';
          email_quality?: EmailQuality | null;
          company_data?: CompanyData | null;
          profile_data?: ProfileData | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
          created_by?: string;
          enriched_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
