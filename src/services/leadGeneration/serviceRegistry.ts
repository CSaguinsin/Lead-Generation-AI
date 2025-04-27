import { LeadGenerationService, LeadSearchFilters, LeadSearchResults, LeadSource } from './types';
import PDLService from '@/services/leadGeneration/services/pdlService';
import HunterService from '@/services/leadGeneration/services/hunterService';
import ClearbitService from '@/services/leadGeneration/services/clearbitService';

/**
 * Registry of all available lead generation services
 * Manages service discovery, priority, and orchestration
 */
class LeadGenerationRegistry {
  private services: Map<string, LeadGenerationService> = new Map();
  private sources: LeadSource[] = [];
  
  constructor() {
    this.initializeRegistry();
  }
  
  /**
   * Initialize the registry with all available services
   * This is called automatically when the registry is created
   */
  private async initializeRegistry() {
    try {
      // Create instances of each service
      const pdlService = new PDLService();
      const hunterService = new HunterService();
      const clearbitService = new ClearbitService();
      
      // Register services
      this.register(pdlService);
      this.register(hunterService);
      this.register(clearbitService);
      
      // Build source list (configuration information for the UI)
      await this.refreshSources();
    } catch (error) {
      console.error('Error initializing lead generation registry:', error);
    }
  }
  
  // Standard methods to manage services
  register(service: LeadGenerationService) {
    this.services.set(service.id, service);
  }
  
  getService(id: string): LeadGenerationService | undefined {
    return this.services.get(id);
  }
  
  getAllServices(): LeadGenerationService[] {
    return Array.from(this.services.values());
  }
  
  async refreshSources(): Promise<LeadSource[]> {
    const sources: LeadSource[] = [];
    
    for (const service of this.services.values()) {
      const status = await service.getStatus();
      const isConfigured = await service.isConfigured();
      
      sources.push({
        id: service.id,
        name: service.name,
        description: service.description,
        isEnabled: status.available,
        priority: sources.length + 1, // Default priority based on registration order
        apiKeyEnvVar: `${service.id.toUpperCase()}_API_KEY`,
        hasValidConfig: isConfigured
      });
    }
    
    // Sort by priority
    sources.sort((a, b) => b.priority - a.priority);
    this.sources = sources;
    
    return sources;
  }
  
  getSources(): LeadSource[] {
    return this.sources;
  }

  async multiSearch(
    filters: LeadSearchFilters, 
    options: { 
      useServices?: string[],
      combineResults?: boolean,
      maxResultsPerService?: number 
    } = {}
  ): Promise<LeadSearchResults[]> {
    const {
      useServices,
      combineResults = true,
      maxResultsPerService = 25
    } = options;
    
    // Determine which services to use
    let servicesToUse: LeadGenerationService[] = [];
    
    if (useServices && useServices.length > 0) {
      // Use specific services if provided
      servicesToUse = useServices
        .map(id => this.services.get(id))
        .filter(Boolean) as LeadGenerationService[];
    } else {
      // Otherwise use all available services that support search
      servicesToUse = Array.from(this.services.values())
        .filter(service => service.supportsSearch);
    }
    
    // If no services are available, return empty result
    if (servicesToUse.length === 0) {
      return [];
    }
    
    // Execute search across all services in parallel
    const searchPromises = servicesToUse.map(service => 
      service.search(filters)
        .catch(error => {
          console.error(`Error searching with service ${service.id}:`, error);
          return {
            sourceId: service.id,
            sourceName: service.name,
            leads: [],
            metadata: {
              error: error.message,
              filtersCovered: []
            }
          } as LeadSearchResults;
        })
    );
    
    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);
    
    // Return results directly if not combining
    if (!combineResults) {
      return results;
    }
    
    // Combine and deduplicate results if requested
    // TBD: Implement deduplication logic based on email, LinkedIn URL, etc.
    
    return results;
  }
  
  async enrichLead(lead: any): Promise<any> {
    // Get all services that support enrichment
    const enrichmentServices = Array.from(this.services.values())
      .filter(service => service.supportsEnrichment && service.enrich);
    
    if (enrichmentServices.length === 0) {
      return lead;
    }
    
    // Execute enrichment with all services in parallel
    const enrichmentPromises = enrichmentServices.map(service => 
      service.enrich!(lead)
        .catch(error => {
          console.error(`Error enriching with service ${service.id}:`, error);
          return {
            sourceId: service.id,
            sourceName: service.name,
            originalLead: lead,
            enrichedData: {},
            confidence: 0,
            fieldsEnriched: []
          };
        })
    );
    
    // Wait for all enrichments to complete
    const results = await Promise.all(enrichmentPromises);
    
    // Basic enrichment result merging
    const enrichedLead = { ...lead };
    const mergedData: any = {};
    const fieldsEnriched: string[] = [];
    
    // For each enrichment result, evaluate confidence and merge data
    results.forEach(result => {
      // Extract keys that were enriched and not already in our merged data
      Object.keys(result.enrichedData || {}).forEach(key => {
        // If field is not yet enriched or this result has higher confidence
        if (!mergedData[key] || (result.confidence > mergedData[key]?.confidence)) {
          mergedData[key] = {
            value: result.enrichedData[key],
            source: result.sourceName,
            confidence: result.confidence
          };
          
          // Add to enriched fields if not already there
          if (!fieldsEnriched.includes(key)) {
            fieldsEnriched.push(key);
          }
          
          // Set the actual value in the enriched lead
          enrichedLead[key] = result.enrichedData[key];
        }
      });
    });
    
    // Add metadata about the enrichment
    enrichedLead._enrichment = {
      fieldsEnriched,
      sources: results.map(r => r.sourceName),
      timestamp: new Date().toISOString()
    };
    
    return enrichedLead;
  }
}

// Export a singleton instance
const registry = new LeadGenerationRegistry();
export default registry;
