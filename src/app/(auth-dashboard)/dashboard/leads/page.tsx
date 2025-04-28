"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Filter, 
  Search, 
  RefreshCw, 
  Download, 
  Building2, 
  MapPin, 
  Briefcase, 
  Users,
  PlusCircle,
  AlertCircle,
  ToggleLeft,
  Zap,
  Shield,
  Mail,
  Check,
  AlertTriangle,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Lead } from "@/app/types/lead"
import { AddLeadModal } from "@/app/components/dashboard/AddLeadModal"
import { pdlPersonToLead } from "@/utils/pdlConverter"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { LeadSearchResults, LeadSource } from "@/services/leadGeneration/types"
import { enhanceLeadsWithEmails, guessEmailForLead, verifyEmail } from "@/app/actions/enhanceEmails"
import { LeadService } from "@/lib/leadService";
import { LeadsTabs } from "@/app/components/dashboard/tabs/LeadsTabs"
import { SearchFiltersCard } from "@/app/components/dashboard/tabs/SearchFiltersCard"
import { LeadDetailsSidebar } from "@/app/components/dashboard/LeadDetailsSidebar"

export default function Leads() {
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessingEmails, setIsProcessingEmails] = useState(false)
    const [leads, setLeads] = useState<Lead[]>([])
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [noResultsFound, setNoResultsFound] = useState(false)
    const [activeServices, setActiveServices] = useState<string[]>(['pdl']) 
    const [availableServices, setAvailableServices] = useState<LeadSource[]>([])
    const [isLoadingServices, setIsLoadingServices] = useState(true)
    const [currentSearchMetadata, setCurrentSearchMetadata] = useState<{
        sources: Array<{
            id: string;
            name: string;
            count: number;
            metadata: any;
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
    const [enhanceEmailsAutomatically, setEnhanceEmailsAutomatically] = useState(true)
    const [verifyEmailsAutomatically, setVerifyEmailsAutomatically] = useState(false)
    const [verifyingEmail, setVerifyingEmail] = useState<string>('')

    // Add a state for loading saved leads
    const [isLoadingSavedLeads, setIsLoadingSavedLeads] = useState(false)

    // Add state for lead details sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    
    // Function to open the lead details sidebar
    const openLeadDetails = (lead: Lead) => {
        setSelectedLead(lead)
        setSidebarOpen(true)
    }

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

    // Add event listener for search button in SearchFiltersCard
    useEffect(() => {
        const handleSearchEvent = () => {
            handleSearch();
        };
        
        window.addEventListener('search-leads', handleSearchEvent);
        
        return () => {
            window.removeEventListener('search-leads', handleSearchEvent);
        };
    }, [filterOptions, activeServices]); // Re-add event listener when filters change

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
    
    // Handle search with multiple APIs
    const handleSearch = async () => {
        setIsLoading(true)
        setNoResultsFound(false)
        setSearchResults([])
        setCurrentSearchMetadata(null)
        
        try {
            // If no services are active, default to PDL
            const services = activeServices.length > 0 ? activeServices : ['pdl']
            
            // Use our server action to search across multiple services
            const results = await LeadService.searchLeads(
                filterOptions, 
                { 
                    useServices: services,
                    combineResults: false 
                }
            )
            
            // Combine all results from different sources
            let allLeads = results.flatMap(result => result.leads)
            
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
            
            // Automatically enhance emails if enabled
            if (enhanceEmailsAutomatically && allLeads.length > 0) {
                setIsProcessingEmails(true)
                try {
                    console.log("Enhancing emails for leads...");
                    const enhancedLeads = await enhanceLeadsWithEmails(allLeads);
                    allLeads = enhancedLeads;
                    console.log(`Enhanced ${enhancedLeads.filter(l => l.email).length} leads with emails`);
                } catch (error) {
                    console.error("Error enhancing emails:", error);
                } finally {
                    setIsProcessingEmails(false);
                }
            }
            
            setSearchResults(allLeads)
            setCurrentSearchMetadata(searchMetadata)
            
            // Show toast or message if no results found across all services
            if (allLeads.length === 0) {
                setNoResultsFound(true)
            }
        } catch (error) {
            console.error("Error searching leads:", error)
            setNoResultsFound(true)
        } finally {
            setIsLoading(false)
        }
    }
    
    // Verify an email address
    const handleVerifyEmail = async (email: string) => {
        if (!email) return;
        
        setVerifyingEmail(email);
        try {
            const result = await verifyEmail(email);
            
            // Update the lead with verification result
            setSearchResults(prev => 
                prev.map(lead => {
                    if (lead.email === email) {
                        return {
                            ...lead,
                            email_quality: {
                                ...lead.email_quality,
                                verified: true,
                                deliverable: result.isValid,
                                quality_score: result.score.toString(),
                                status: result.status
                            }
                        };
                    }
                    return lead;
                })
            );
            
            return result;
        } catch (error) {
            console.error("Error verifying email:", error);
            return null;
        } finally {
            setVerifyingEmail('');
        }
    }

    // Add lead from search results 
    const addLeadFromResults = async (person: any) => {
        try {
            // Try to use our utility function to convert to Lead format
            let newLead: Lead
            
            // Check if this is a PDL result
            if (person.job_company_name) {
                newLead = pdlPersonToLead(person)
            } else {
                // For other services, we'll construct a lead manually
                newLead = {
                    first_name: person.first_name || person.name?.first || '',
                    last_name: person.last_name || person.name?.last || '',
                    email: person.email || '',
                    position: person.position || person.job_title || person.title || null,
                    company: person.company || person.job_company_name || '',
                    domain: person.domain || person.job_company_website || '',
                    status: person.email ? 'verified' as any : 'unverified',
                    company_data: person.company_data || {
                        name: person.company || person.job_company_name || '',
                        industry: person.industry || person.job_company_industry || '',
                        location: {
                            country: person.location_country || person.country || '',
                            locality: person.location_locality || person.city || ''
                        }
                    },
                    linkedin_url: person.linkedin_url || null
                }
            }
            
            // Save lead to database
            console.log("Saving lead to database:", newLead)
            
            // Get the user ID from cookie (client-side)
            const userId = document.cookie
                .split('; ')
                .find(row => row.startsWith('user_id='))
                ?.split('=')[1];
                
            if (!userId) {
                console.error("User ID not found in cookies")
                throw new Error("Authentication required to save leads")
            }
            
            // Prepare lead data for saving
            const leadData = {
                contact: {
                    firstName: newLead.first_name,
                    lastName: newLead.last_name,
                    email: newLead.email,
                    position: newLead.position || '', 
                    emailQuality: {
                        deliverable: newLead.status === 'verified',
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
            
            // Save the lead to the database
            const savedLead = await LeadService.saveLead(leadData, userId)
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
            </div>
        </>
    )
}