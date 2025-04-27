// types/lead.ts
export interface EmailQuality {
  deliverable: boolean;
  quality_score: string;
  is_valid_format: boolean;
}

export interface CompanyData {
  name: string;
  industry?: string;
  size?: string;
  location?: {
    country: string;
    locality: string;
  };
  linkedin_url?: string;
}

export interface ProfileData {
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
}

// Define the LeadStatus type
export type LeadStatus = 'verified' | 'unverified' | 'pending';

export interface Lead {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string | null;
  company: string;
  domain: string;
  status: LeadStatus;
  avatar?: string; // Added avatar property
  email_quality?: {
    deliverable: boolean;
    quality_score: string;
    is_valid_format: boolean;
  };
  company_data?: {
    name?: string;
    industry?: string;
    size?: string;
    location?: {
      country: string;
      locality: string;
    };
    linkedin_url?: string;
  };
  profile_data?: {
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
  linkedin_url?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  enriched_at?: string;
  phone_number?: string;
  phone_data?: PhoneData;
}

// src/app/types/lead.ts
export interface EnrichedLead {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    emailQuality: EmailQuality;
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
  profile?: ProfileData;
}

export interface PhoneData {
  type: string;
  country_code?: string;
  verified: boolean;
  source: string;
}