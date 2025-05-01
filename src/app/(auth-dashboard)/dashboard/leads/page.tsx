"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  RefreshCw
} from "lucide-react"
import { Lead, LeadStatus } from "@/app/types/lead"
import { AddLeadModal } from "@/app/components/dashboard/AddLeadModal"
import { pdlPersonToLead } from "@/utils/pdlConverter"
import { LeadSearchResults, LeadSearchMetadata, LeadSource } from "@/services/leadGeneration/types"
import { enhanceLeadsWithEmails } from "@/app/actions/enhanceEmails"
import { LeadService } from "@/lib/leadService";
import { LeadsTabs } from "@/app/components/dashboard/tabs/LeadsTabs"
import { SearchFiltersCard } from "@/app/components/dashboard/tabs/SearchFiltersCard"
import { LeadDetailsSidebar } from "@/app/components/dashboard/LeadDetailsSidebar"
import { PDLQuotaErrorModal } from "@/app/components/dashboard/PDLQuotaErrorModal"

// Define a type for LeadData to match the one in enhanceEmails.ts
interface LeadData {
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: {
    first?: string;
    last?: string;
  };
  company?: string;
  job_company_name?: string;
  domain?: string;
  email_quality?: {
    guessed?: boolean;
    verified?: boolean;
    confidence?: number;
    deliverable?: boolean;
  };
  [key: string]: unknown;
}

// Define a type for PDL person data that might not match our Lead interface
interface PDLPerson {
  first_name?: string;
  last_name?: string;
  name?: {
    first?: string;
    last?: string;
  };
  email?: string;
  job_title?: string;
  title?: string;
  position?: string;
  job_company_name?: string;
  company?: string;
  job_company_website?: string;
  domain?: string;
  job_company_industry?: string;
  industry?: string;
  location_country?: string;
  country?: string;
  location_locality?: string;
  city?: string;
  linkedin_url?: string;
  company_data?: {
    name: string;
    industry?: string;
    size?: string;
    location?: {
      country: string;
      locality: string;
    };
  };
  [key: string]: any; // Allow other properties
}

// Helper function to convert Lead to LeadData
const leadToLeadData = (lead: Lead): LeadData => {
  return {
    ...lead,
    // Any specific property overrides would go here if needed
  };
};

// Helper function to convert LeadData to Lead
const leadDataToLead = (leadData: LeadData): Lead => {
  return {
    first_name: leadData.first_name || '',
    last_name: leadData.last_name || '',
    email: leadData.email || '',
    position: leadData.position as string | null || null,
    company: leadData.company || '',
    domain: leadData.domain || '',
    status: leadData.status as LeadStatus || LeadStatus.New,
    // Add any other required fields with defaults
  };
};

export default function Leads() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSavedLeads, setIsLoadingSavedLeads] = useState(false)
  const [isProcessingEmails, setIsProcessingEmails] = useState(false)
  const [noResultsFound, setNoResultsFound] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [searchResults, setSearchResults] = useState<Lead[]>([])
  const [activeServices, setActiveServices] = useState<string[]>(['pdl']) 
  const [availableServices, setAvailableServices] = useState<LeadSource[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [currentSearchMetadata, setCurrentSearchMetadata] = useState<{
    sources: Array<{
      id: string;
      name: string;
      count: number;
      metadata: LeadSearchMetadata;
      error?: string;
      usageLimitReached?: boolean;
    }>;
    totalResults: number;
    filtersCovered: string[];
  } | null>(null)
  const [filterOptions, setFilterOptions] = useState({
    title: "",
    company: "",
    location: "",
    industry: "",
    companySize: "",
    jobLevel: ""
  })
  
  // Settings for email enhancement
  const [enhanceEmailsAutomatically] = useState(true)
  
  // Add a state for loading saved leads
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Function to open the lead details sidebar
  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead)
    setSidebarOpen(true)
  }

  // Add state for PDL quota error modal
  const [showPDLQuotaErrorModal, setShowPDLQuotaErrorModal] = useState(false)

  // Load available services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoadingServices(true)
        
        // Get available services using server action
        const sources = await LeadService.getLeadServices()
        setAvailableServices(sources)
        
        // Set default active services (those that are enabled and configured)
        const enabledServices = sources
          .filter((source: LeadSource) => source.isEnabled && source.hasValidConfig)
          .map((source: LeadSource) => source.id)
        
        if (enabledServices.length > 0) {
          setActiveServices(enabledServices)
        }
      } catch (error) {
        console.error("Error loading services:", error)
      } finally {
        setIsLoadingServices(false)
      }
    }
    
    loadServices()
  }, [])

  // Load saved leads on mount
  useEffect(() => {
    const loadSavedLeads = async () => {
      try {
        setIsLoadingSavedLeads(true)
        const savedLeads = await LeadService.getLeads()
        setLeads(savedLeads)
      } catch (error) {
        console.error("Error loading saved leads:", error)
      } finally {
        setIsLoadingSavedLeads(false)
      }
    }
    
    loadSavedLeads()
  }, [])

  // Handle search with multiple APIs
  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    setNoResultsFound(false)
    setSearchResults([])
    setCurrentSearchMetadata(null)
    
    try {
      // If no services are active, default to PDL
      const services = activeServices.length > 0 ? activeServices : ['pdl']
      
      // Filter out Coresignal due to API issues
      const filteredServices = services.filter(service => service !== 'coresignal')
      console.log('Using services for search:', filteredServices)
      
      // Use our server action to search across multiple services
      const results = await LeadService.searchLeads(
        filterOptions, 
        { 
          useServices: filteredServices,
          combineResults: false 
        }
      )
      
      // Combine all results from different sources
      let allLeads = results.flatMap(result => result.leads) as Lead[]
      
      // Keep track of which sources returned results
      const searchMetadata = {
        sources: results.map((result: LeadSearchResults) => ({
          id: result.sourceId,
          name: result.sourceName,
          count: result.leads.length,
          metadata: result.metadata,
          error: result.metadata.error,
          usageLimitReached: result.metadata.usageLimitReached
        })),
        totalResults: allLeads.length,
        filtersCovered: results.flatMap((r: LeadSearchResults) => r.metadata.filtersCovered)
          .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // Remove duplicates
      }
      
      // Check if PDL API quota limit has been reached
      const pdlResult = results.find(result => result.sourceId === 'pdl');
      if (pdlResult && pdlResult.metadata.usageLimitReached) {
        console.warn('PDL API quota limit reached');
        setShowPDLQuotaErrorModal(true);
      }
      
      // Automatically enhance emails if enabled
      if (enhanceEmailsAutomatically && allLeads.length > 0) {
        setIsProcessingEmails(true)
        try {
          console.log("Enhancing emails for leads...");
          // Convert Lead[] to LeadData[] for enhanceLeadsWithEmails
          const leadsData = allLeads.map(lead => leadToLeadData(lead));
          
          const enhancedLeadsData = await enhanceLeadsWithEmails(leadsData);
          
          // Map the enhanced data back to the original leads to preserve all properties
          const enhancedLeads = allLeads.map(originalLead => {
            // Find the matching enhanced lead data
            const enhancedData = enhancedLeadsData.find(
              data => data.email === originalLead.email || 
                    (data.first_name === originalLead.first_name && 
                     data.last_name === originalLead.last_name)
            );
            
            if (enhancedData) {
              // Update only the email and email_quality properties
              return {
                ...originalLead,
                email: enhancedData.email || originalLead.email,
                email_quality: enhancedData.email_quality ? {
                  deliverable: enhancedData.email_quality.deliverable || false,
                  quality_score: enhancedData.email_quality.confidence?.toString() || '0',
                  is_valid_format: true
                } : originalLead.email_quality,
                status: enhancedData.email_quality?.deliverable ? LeadStatus.Verified : 
                        LeadStatus.Unverified
              };
            }
            
            return originalLead;
          });
          
          allLeads = enhancedLeads;
        } catch (error) {
          console.error("Error enhancing emails:", error);
        } finally {
          setIsProcessingEmails(false);
        }
      }
      
      setSearchResults(allLeads)
      setCurrentSearchMetadata(searchMetadata)
      setNoResultsFound(allLeads.length === 0)
    } catch (error) {
      console.error("Error searching for leads:", error)
      setNoResultsFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [activeServices, enhanceEmailsAutomatically, filterOptions])

  // Automatically load initial leads when the component mounts
  useEffect(() => {
    // Only run this effect after services are loaded
    if (!isLoadingServices) {
      // Use default filter options to load initial leads
      const loadInitialLeads = async () => {
        await handleSearch();
      };
      
      loadInitialLeads();
    }
  }, [isLoadingServices, handleSearch]); // Depend on isLoadingServices to ensure services are loaded first

  // Add event listener for search button in SearchFiltersCard
  useEffect(() => {
    const handleSearchEvent = () => {
      handleSearch();
    };
    
    window.addEventListener('search-leads', handleSearchEvent);
    
    return () => {
      window.removeEventListener('search-leads', handleSearchEvent);
    };
  }, [handleSearch]); // Now handleSearch is memoized with useCallback
  
  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Toggle a service on/off
  const toggleService = (serviceId: string) => {
    setActiveServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  // Add lead from search results 
  const addLeadFromResults = async (person: PDLPerson | Lead) => {
    try {
      // Try to use our utility function to convert to Lead format
      let newLead: Lead
      
      // Check if this is a PDL result
      if ('job_company_name' in person) {
        newLead = pdlPersonToLead(person)
      } else {
        // For other services, we'll construct a lead manually
        const pdlPerson = person as PDLPerson
        newLead = {
          first_name: pdlPerson.first_name || pdlPerson.name?.first || '',
          last_name: pdlPerson.last_name || pdlPerson.name?.last || '',
          email: pdlPerson.email || '',
          position: pdlPerson.position || pdlPerson.job_title || pdlPerson.title || null,
          company: pdlPerson.company || pdlPerson.job_company_name || '',
          domain: pdlPerson.domain || pdlPerson.job_company_website || '',
          status: pdlPerson.email ? LeadStatus.Verified : LeadStatus.Unverified,
          company_data: pdlPerson.company_data || {
            name: pdlPerson.company || pdlPerson.job_company_name || '',
            industry: pdlPerson.industry || pdlPerson.job_company_industry || '',
            location: {
              country: pdlPerson.location_country || pdlPerson.country || '',
              locality: pdlPerson.location_locality || pdlPerson.city || ''
            }
          },
          linkedin_url: pdlPerson.linkedin_url || null
        }
      }
      
      // Save lead to database
      console.log("Saving lead to database:", newLead)
      
      // Prepare lead data for saving
      const leadData = {
        contact: {
          firstName: newLead.first_name,
          lastName: newLead.last_name,
          email: newLead.email,
          position: newLead.position || '', 
          emailQuality: {
            deliverable: newLead.status === LeadStatus.Verified,
            quality_score: newLead.email_quality?.quality_score || '0',
            is_valid_format: true
          },
          linkedinUrl: newLead.linkedin_url || undefined
        },
        company: {
          name: newLead.company,
          domain: newLead.domain,
          industry: newLead.company_data?.industry,
          size: newLead.company_data?.size,
          location: newLead.company_data?.location
        },
        profile: newLead.profile_data
      }
      
      // Save the lead to the database - the API will get the user ID from the cookie
      const savedLead = await LeadService.saveLead(leadData)
      console.log("Lead saved successfully:", savedLead)
      
      // Add to local state
      setLeads(prev => [...prev, savedLead])
      
      // Show success message
      alert("Lead saved successfully!")
    } catch (error) {
      console.error("Error adding lead:", error)
      alert(`Error saving lead: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return(
    <>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <div className="flex items-center gap-2">
            <AddLeadModal onLeadAdded={() => {
              // Refresh the leads list when a new lead is added
              const loadSavedLeads = async () => {
                try {
                  setIsLoadingSavedLeads(true);
                  const savedLeads = await LeadService.getLeads();
                  setLeads(savedLeads);
                } catch (error) {
                  console.error("Error loading saved leads:", error);
                } finally {
                  setIsLoadingSavedLeads(false);
                }
              };
              loadSavedLeads();
            }} />
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={() => handleSearch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
        
        <LeadsTabs
          searchResults={searchResults}
          isLoadingSearchResults={isLoading}
          currentSearchMetadata={currentSearchMetadata}
          noResultsFound={noResultsFound}
          isProcessingEmails={isProcessingEmails}
          onAddLead={addLeadFromResults}
          savedLeads={leads}
          isLoadingSavedLeads={isLoadingSavedLeads}
          searchUIContainer={
            <SearchFiltersCard
              filterOptions={filterOptions}
              handleFilterChange={handleFilterChange}
              resetFilters={() => setFilterOptions({
                title: "",
                company: "",
                location: "",
                industry: "",
                companySize: "",
                jobLevel: ""
              })}
              availableServices={availableServices}
              activeServices={activeServices}
              toggleService={toggleService}
              isLoadingServices={isLoadingServices}
            />
          }
          onViewLeadDetails={openLeadDetails}
        />
        
        {/* Lead Details Sidebar */}
        <LeadDetailsSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lead={selectedLead}
        />
        
        {/* PDL Quota Error Modal */}
        <PDLQuotaErrorModal 
          isOpen={showPDLQuotaErrorModal}
          onClose={() => setShowPDLQuotaErrorModal(false)}
        />
      </div>
    </>
  )
}