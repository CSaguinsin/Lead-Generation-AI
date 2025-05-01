'use server';

import { LeadSearchFilters, LeadSearchResults, LeadGenerationService, LeadEnrichmentResult } from '@/services/leadGeneration/types';
import leadGenerationRegistry from '@/services/leadGeneration/serviceRegistry';
import { enrichLeadsPDL } from './identifyLeadsPDL';
import { Lead } from '../types/lead';

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
    combineResults?: boolean,
    enrichResults?: boolean
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
    
    // Enrich results with phone numbers if requested
    if (options.enrichResults !== false) {
      console.log('Enriching search results with phone numbers and additional details');
      
      // Process each result set
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        // Skip if no leads or already have phone numbers
        if (result.leads.length === 0 || result.leads.every(lead => lead.phone_number)) {
          continue;
        }
        
        try {
          // Enrich leads with PDL Enrich API to get phone numbers
          const enrichedLeads = await enrichLeadsPDL(result.leads as Lead[]);
          
          // Update the results with enriched leads
          results[i] = {
            ...result,
            leads: enrichedLeads,
            metadata: {
              ...result.metadata,
              enriched: true,
              enrichmentSource: 'pdl'
            }
          };
          
          console.log(`Enriched ${result.sourceName} results: ${enrichedLeads.filter(l => l.phone_number).length}/${enrichedLeads.length} leads have phone numbers`);
        } catch (enrichError) {
          console.error(`Error enriching ${result.sourceName} results:`, enrichError);
          // Continue with other results even if enrichment fails for one service
        }
      }
    }
    
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
    throw new Error(`Email verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enrich a lead with additional data
 */
export async function enrichLead(lead: LeadData) {
  try {
    // Try PDL first for enrichment
    const pdlService = leadGenerationRegistry.getService('pdl');
    if (pdlService && pdlService.supportsEnrichment && typeof pdlService.enrich === 'function') {
      try {
        const enrichmentResult = await pdlService.enrich(lead);
        if (!enrichmentResult.error) {
          return enrichmentResult;
        }
      } catch (pdlError) {
        console.error('Error enriching lead with PDL:', pdlError);
        // Continue to other services
      }
    }
    
    // Fallback to other services if PDL fails
    const allServices = leadGenerationRegistry.getAllServices();
    const enrichmentServices: LeadGenerationService[] = [];
    
    // Filter services that support enrichment and have the enrich method
    for (const service of allServices) {
      if (service.id !== 'pdl' && 
          service.supportsEnrichment && 
          typeof service.enrich === 'function') {
        enrichmentServices.push(service);
      }
    }
    
    // Try each service until one succeeds
    for (const service of enrichmentServices) {
      try {
        // Create a type guard to ensure enrich method exists and is callable
        if (service && typeof service.enrich === 'function') {
          const enrichmentResult = await service.enrich(lead);
          if (enrichmentResult && !enrichmentResult.error) {
            return enrichmentResult;
          }
        }
      } catch (serviceError) {
        console.error(`Error enriching lead with ${service.name}:`, serviceError);
        // Continue to next service
      }
    }
    
    throw new Error('No enrichment service was able to enrich this lead');
  } catch (error) {
    console.error('Error enriching lead:', error);
    throw new Error(`Lead enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
