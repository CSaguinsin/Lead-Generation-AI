'use server';

import { LeadSearchFilters, LeadSearchResults } from '@/services/leadGeneration/types';
import leadGenerationRegistry from '@/services/leadGeneration/serviceRegistry';

/**
 * Define a type for lead data
 */
interface LeadData {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  company?: string;
  domain?: string;
  linkedin_url?: string;
  company_data?: {
    name?: string;
    industry?: string;
    size?: string;
    location?: {
      country?: string;
      locality?: string;
    };
  };
  [key: string]: unknown;
}

/**
 * Server action to search for leads using multiple services
 */
export async function searchLeads(
  filters: LeadSearchFilters, 
  options: { 
    useServices?: string[],
    combineResults?: boolean
  } = {}
): Promise<LeadSearchResults[]> {
  try {
    console.log('Searching leads with filters:', JSON.stringify(filters));
    console.log('Using services:', options.useServices?.join(', ') || 'all available');
    
    // Use the registry to search across selected services
    const results = await leadGenerationRegistry.multiSearch(filters, {
      useServices: options.useServices,
      combineResults: options.combineResults || false
    });
    
    console.log(`Found results from ${results.length} services`);
    results.forEach(result => {
      console.log(`- ${result.sourceName}: ${result.leads.length} leads`);
    });
    
    return results;
  } catch (error) {
    console.error('Error searching leads:', error);
    throw new Error(`Failed to search leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available lead generation services
 */
export async function getLeadServices() {
  try {
    return await leadGenerationRegistry.refreshSources();
  } catch (error) {
    console.error('Error getting lead services:', error);
    return [];
  }
}

/**
 * Verify an email address using Hunter.io
 */
export async function verifyEmail(email: string) {
  try {
    const hunterService = leadGenerationRegistry.getService('hunter');
    if (!hunterService) {
      throw new Error('Email verification service not available');
    }
    
    // Check if the service has a verify method
    if (!hunterService.verify || typeof hunterService.verify !== 'function') {
      throw new Error('Email verification not supported by this service');
    }
    
    return await hunterService.verify(email);
  } catch (error) {
    console.error('Error verifying email:', error);
    throw new Error(`Failed to verify email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enrich a lead with additional data
 */
export async function enrichLead(lead: LeadData) {
  try {
    return await leadGenerationRegistry.enrichLead(lead);
  } catch (error) {
    console.error('Error enriching lead:', error);
    throw new Error(`Failed to enrich lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
