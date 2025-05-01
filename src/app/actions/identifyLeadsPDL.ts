'use server';

import axios from 'axios';
import { Lead, LeadStatus } from '../types/lead';

// Define the PDL Enrich parameters type
interface PDLEnrichParams {
  email?: string;
  profile?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  location?: string;
  pretty?: boolean;
}

/**
 * Enriches leads with detailed information using PDL's Person Enrich API
 * This is the proper API to use for getting detailed contact information including phone numbers
 * 
 * @param leads - Array of leads to enrich with PDL
 * @returns Array of enriched leads
 */
export async function enrichLeadsPDL(leads: Lead[]): Promise<Lead[]> {
  if (!leads || leads.length === 0) {
    console.log('No leads to enrich');
    return [];
  }
  
  console.log(`Enriching ${leads.length} leads with PDL Person Enrich API`);
  
  // Limit the number of leads to enrich to avoid excessive API usage
  const MAX_ENRICH_CALLS = 10;
  const leadsToEnrich = leads.slice(0, MAX_ENRICH_CALLS);
  
  try {
    const apiKey = process.env.PDL_API_KEY;
    if (!apiKey) {
      console.error('PDL API key is missing');
      return leads;
    }
    
    // Process leads in parallel with Promise.all
    const enrichedLeadsPromises = leadsToEnrich.map(async (lead) => {
      try {
        // Create the base parameters for the Enrich API
        const params: PDLEnrichParams = {
          pretty: false
        };
        
        // Add as many identifying parameters as possible to get the best match
        if (lead.email) {
          params.email = lead.email;
        }
        
        if (lead.first_name && lead.last_name) {
          params.first_name = lead.first_name;
          params.last_name = lead.last_name;
        }
        
        if (lead.company) {
          params.company = lead.company;
        }
        
        if (lead.linkedin_url) {
          params.profile = lead.linkedin_url;
        }
        
        // Make the API request
        const response = await axios.get('https://api.peopledatalabs.com/v5/person/enrich', {
          params,
          headers: {
            'X-Api-Key': apiKey,
            'User-Agent': 'LeadGenerationAI/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (response.data && response.data.data) {
          // Format the enriched data
          const enrichedLead = formatEnrichResponse(response.data.data, lead);
          return enrichedLead;
        }
        
        return lead; // Return original lead if no enrichment data
      } catch (error) {
        console.error('Error enriching lead with PDL:', error);
        return lead; // Return original lead on error
      }
    });
    
    // Wait for all enrichment calls to complete
    const enrichedLeads = await Promise.all(enrichedLeadsPromises);
    
    // Merge enriched leads with the original leads array
    const resultLeads = [...leads];
    enrichedLeads.forEach((enrichedLead, index) => {
      resultLeads[index] = enrichedLead;
    });
    
    console.log(`Successfully enriched ${enrichedLeads.filter(l => l.phone_number).length} leads with phone numbers`);
    return resultLeads;
  } catch (error) {
    console.error('Error in enrichLeadsPDL:', error);
    return leads; // Return original leads on error
  }
}

/**
 * Format the PDL Enrich API response into our lead format
 * 
 * @param data - PDL API response data
 * @param originalLead - Original lead to merge with enriched data
 * @returns Formatted lead with enriched data
 */
function formatEnrichResponse(data: any, originalLead: Lead): Lead {
  if (!data) return originalLead;
  
  try {
    // Extract phone number (primary focus of enrichment)
    let phoneNumber = originalLead.phone_number || '';
    
    // Check for phone_numbers array first (most common in PDL API)
    if (data.phone_numbers && Array.isArray(data.phone_numbers)) {
      if (data.phone_numbers.length > 0) {
        if (typeof data.phone_numbers[0] === 'object' && data.phone_numbers[0] !== null) {
          // Handle case where phone is an object
          phoneNumber = data.phone_numbers[0].number || data.phone_numbers[0].value || phoneNumber;
        } else {
          phoneNumber = String(data.phone_numbers[0]);
        }
      }
    } 
    // Then check for other phone fields
    else if (data.phones && Array.isArray(data.phones) && data.phones.length > 0) {
      if (typeof data.phones[0] === 'object' && data.phones[0] !== null) {
        phoneNumber = data.phones[0].number || data.phones[0].value || phoneNumber;
      } else {
        phoneNumber = String(data.phones[0]);
      }
    } 
    else if (data.mobile_phone) {
      if (typeof data.mobile_phone === 'object' && data.mobile_phone !== null) {
        phoneNumber = data.mobile_phone.number || data.mobile_phone.value || phoneNumber;
      } else {
        phoneNumber = String(data.mobile_phone);
      }
    }
    
    // Format phone number if needed
    if (phoneNumber && typeof phoneNumber === 'string') {
      // Keep the + sign for international format if it exists
      if (!phoneNumber.startsWith('+')) {
        // For US numbers, ensure proper formatting
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length === 10) {
          phoneNumber = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
        }
      }
    }
    
    // Get additional profile data if available
    const profileData = originalLead.profile_data || {
      summary: '',
      experiences: [],
      education: []
    };
    
    // Enrich profile data if available
    if (data.summary) {
      profileData.summary = data.summary;
    }
    
    if (data.experience && Array.isArray(data.experience)) {
      profileData.experiences = data.experience.map((exp: any) => ({
        company: exp.company || '',
        title: exp.title || '',
        duration: exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : ''
      }));
    }
    
    if (data.education && Array.isArray(data.education)) {
      profileData.education = data.education.map((edu: any) => ({
        school: edu.school || '',
        degree: edu.degree || ''
      }));
    }
    
    // Create the enriched lead by merging with original lead
    return {
      ...originalLead,
      phone_number: phoneNumber,
      profile_data: profileData,
      // Only update these fields if they're empty in the original lead
      linkedin_url: originalLead.linkedin_url || data.linkedin_url || '',
      email: originalLead.email || (data.emails && data.emails.length > 0 ? data.emails[0] : ''),
      // Mark as verified if we have a phone number
      status: phoneNumber ? LeadStatus.Verified : originalLead.status
    };
  } catch (error) {
    console.error('Error formatting PDL enrich response:', error);
    return originalLead;
  }
}

/**
 * @deprecated Use enrichLeadsPDL instead
 * This function used the Person Identify API which is not the correct API for lead generation
 */
export async function identifyLeadsPDL(filters: any): Promise<Lead[]> {
  console.warn('identifyLeadsPDL is deprecated. Use enrichLeadsPDL instead.');
  return [];
}
