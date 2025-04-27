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
import { searchLeads, getLeadServices, verifyEmail as verifyEmailAction, enrichLead } from "@/app/actions/searchLeads"
import { enhanceLeadsWithEmails, guessEmailForLead, verifyEmail } from "@/app/actions/enhanceEmails"

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

    // Load available services on mount
    useEffect(() => {
        const loadServices = async () => {
            try {
                setIsLoadingServices(true)
                
                // Get available services using server action
                const sources = await getLeadServices()
                setAvailableServices(sources)
                
                // Set default active services (those that are enabled and configured)
                const enabledServices = sources
                    .filter(source => source.isEnabled && source.hasValidConfig)
                    .map(source => source.id)
                
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
            const results = await searchLeads(
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
                sources: results.map(result => ({
                    id: result.sourceId,
                    name: result.sourceName,
                    count: result.leads.length,
                    metadata: result.metadata,
                    error: result.metadata.error,
                    usageLimitReached: result.metadata.usageLimitReached
                })),
                totalResults: allLeads.length,
                filtersCovered: results.flatMap(r => r.metadata.filtersCovered)
                    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
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
            
            // TODO: Save lead to database
            // This would call your existing lead creation functionality
            console.log("Adding lead:", newLead)
            
            // For now, just add to local state to demonstrate
            setLeads(prev => [...prev, newLead])
        } catch (error) {
            console.error("Error adding lead:", error)
        }
    }

    return(
        <>
            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                    <div className="flex items-center gap-2">
                        <AddLeadModal onLeadAdded={() => {}} />
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
                
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle>Find Leads</CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFilterOptions({
                                    title: "",
                                    company: "",
                                    location: "",
                                    industry: "",
                                    companySize: "",
                                    jobLevel: ""
                                })}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset Filters
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 border rounded-md p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium">Data Sources</h3>
                                <Badge variant="outline" className="font-normal">
                                    {activeServices.length} active
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isLoadingServices ? (
                                    // Loading skeleton
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-4 rounded-full" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                            <Skeleton className="h-4 w-8" />
                                        </div>
                                    ))
                                ) : (
                                    // Service toggles
                                    availableServices.map(service => {
                                        const isActive = activeServices.includes(service.id);
                                        const isDisabled = !service.hasValidConfig;
                                        
                                        return (
                                            <div 
                                                key={service.id} 
                                                className={`flex items-center justify-between p-2 border rounded ${isDisabled ? 'opacity-50' : ''}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {service.id === 'pdl' && <Users className="h-4 w-4 text-blue-500" />}
                                                    {service.id === 'hunter' && <Mail className="h-4 w-4 text-green-500" />}
                                                    {service.id === 'clearbit' && <Zap className="h-4 w-4 text-orange-500" />}
                                                    <span className="text-sm font-medium">{service.name}</span>
                                                </div>
                                                <Switch
                                                    checked={isActive}
                                                    disabled={isDisabled}
                                                    onCheckedChange={() => toggleService(service.id)}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            
                            {availableServices.some(s => !s.hasValidConfig) && (
                                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    <span>Some services require API keys. Check your environment variables.</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Briefcase className="h-4 w-4 text-muted-foreground mr-2" />
                                    <Label htmlFor="title" className="text-sm font-medium">Job Title</Label>
                                </div>
                                <Select 
                                    onValueChange={(value) => handleFilterChange('title', value)}
                                    value={filterOptions.title}
                                >
                                    <SelectTrigger id="title" className="h-9">
                                        <SelectValue placeholder="Select job title" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Title</SelectItem>
                                        <SelectItem value="CEO">CEO</SelectItem>
                                        <SelectItem value="CTO">CTO</SelectItem>
                                        <SelectItem value="CFO">CFO</SelectItem>
                                        <SelectItem value="CMO">CMO</SelectItem>
                                        <SelectItem value="COO">COO</SelectItem>
                                        <SelectItem value="VP of Sales">VP of Sales</SelectItem>
                                        <SelectItem value="VP of Marketing">VP of Marketing</SelectItem>
                                        <SelectItem value="VP of Engineering">VP of Engineering</SelectItem>
                                        <SelectItem value="Director of Engineering">Director of Engineering</SelectItem>
                                        <SelectItem value="Director of Marketing">Director of Marketing</SelectItem>
                                        <SelectItem value="Director of Sales">Director of Sales</SelectItem>
                                        <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                                        <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                                        <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
                                    <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                                </div>
                                <Select 
                                    onValueChange={(value) => handleFilterChange('company', value)}
                                    value={filterOptions.company}
                                >
                                    <SelectTrigger id="company" className="h-9">
                                        <SelectValue placeholder="Select company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Company</SelectItem>
                                        <SelectItem value="Google">Google</SelectItem>
                                        <SelectItem value="Microsoft">Microsoft</SelectItem>
                                        <SelectItem value="Apple">Apple</SelectItem>
                                        <SelectItem value="Amazon">Amazon</SelectItem>
                                        <SelectItem value="Facebook">Facebook</SelectItem>
                                        <SelectItem value="Meta">Meta</SelectItem>
                                        <SelectItem value="Netflix">Netflix</SelectItem>
                                        <SelectItem value="Salesforce">Salesforce</SelectItem>
                                        <SelectItem value="Oracle">Oracle</SelectItem>
                                        <SelectItem value="IBM">IBM</SelectItem>
                                        <SelectItem value="Adobe">Adobe</SelectItem>
                                        <SelectItem value="Cisco">Cisco</SelectItem>
                                        <SelectItem value="Intel">Intel</SelectItem>
                                        <SelectItem value="Dell">Dell</SelectItem>
                                        <SelectItem value="HP">HP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                                </div>
                                <Select 
                                    onValueChange={(value) => handleFilterChange('location', value)}
                                    value={filterOptions.location}
                                >
                                    <SelectTrigger id="location" className="h-9">
                                        <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Any Location</SelectItem>
                                        <SelectItem value="United States">United States</SelectItem>
                                        <SelectItem value="Canada">Canada</SelectItem>
                                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                        <SelectItem value="Germany">Germany</SelectItem>
                                        <SelectItem value="France">France</SelectItem>
                                        <SelectItem value="Australia">Australia</SelectItem>
                                        <SelectItem value="India">India</SelectItem>
                                        <SelectItem value="Philippines">Philippines</SelectItem>
                                        <SelectItem value="Singapore">Singapore</SelectItem>
                                        <SelectItem value="Japan">Japan</SelectItem>
                                        <SelectItem value="New York">New York</SelectItem>
                                        <SelectItem value="San Francisco">San Francisco</SelectItem>
                                        <SelectItem value="London">London</SelectItem>
                                        <SelectItem value="Berlin">Berlin</SelectItem>
                                        <SelectItem value="Paris">Paris</SelectItem>
                                        <SelectItem value="Sydney">Sydney</SelectItem>
                                        <SelectItem value="Toronto">Toronto</SelectItem>
                                        <SelectItem value="Mumbai">Mumbai</SelectItem>
                                        <SelectItem value="Manila">Manila</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Filter className="h-4 w-4 text-muted-foreground mr-2" />
                                    <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                                </div>
                                <Select 
                                    onValueChange={(value) => handleFilterChange('industry', value)}
                                    value={filterOptions.industry}
                                >
                                    <SelectTrigger id="industry" className="h-9">
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Industries</SelectItem>
                                        <SelectItem value="technology">Technology</SelectItem>
                                        <SelectItem value="healthcare">Healthcare</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                        <SelectItem value="retail">Retail</SelectItem>
                                        <SelectItem value="marketing">Marketing & Advertising</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 text-muted-foreground mr-2" />
                                    <Label htmlFor="companySize" className="text-sm font-medium">Company Size</Label>
                                </div>
                                <Select 
                                    onValueChange={(value) => handleFilterChange('companySize', value)}
                                    value={filterOptions.companySize}
                                >
                                    <SelectTrigger id="companySize" className="h-9">
                                        <SelectValue placeholder="Select company size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any_size">Any Size</SelectItem>
                                        <SelectItem value="1-10">1-10 employees</SelectItem>
                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                        <SelectItem value="51-200">51-200 employees</SelectItem>
                                        <SelectItem value="201-500">201-500 employees</SelectItem>
                                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                                        <SelectItem value="1001-5000">1001-5000 employees</SelectItem>
                                        <SelectItem value="5001-10000">5001-10000 employees</SelectItem>
                                        <SelectItem value="10001+">10001+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Briefcase className="h-4 w-4 text-muted-foreground mr-2" />
                                    <Label htmlFor="jobLevel" className="text-sm font-medium">Job Level</Label>
                                </div>
                                <Select 
                                    onValueChange={(value) => handleFilterChange('jobLevel', value)}
                                    value={filterOptions.jobLevel}
                                >
                                    <SelectTrigger id="jobLevel" className="h-9">
                                        <SelectValue placeholder="Select job level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any_level">Any Level</SelectItem>
                                        <SelectItem value="c_suite">C-Suite (CEO, CTO, CFO)</SelectItem>
                                        <SelectItem value="vp">VP Level</SelectItem>
                                        <SelectItem value="director">Director Level</SelectItem>
                                        <SelectItem value="manager">Manager Level</SelectItem>
                                        <SelectItem value="senior">Senior Individual Contributor</SelectItem>
                                        <SelectItem value="entry">Entry Level</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-end mt-4">
                            {Object.values(filterOptions).some(v => v !== "") && (
                                <Badge variant="outline" className="mr-2">
                                    {Object.values(filterOptions).filter(v => v !== "").length} filters applied
                                </Badge>
                            )}
                            <Button 
                                onClick={handleSearch} 
                                disabled={isLoading}
                                variant="default"
                                size="sm"
                                className="h-9 bg-orange-500 hover:bg-orange-600"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Find Leads
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle>Search Results</CardTitle>
                            {currentSearchMetadata && (
                                <Badge variant="outline">
                                    {currentSearchMetadata.totalResults} leads found
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            // Loading skeleton
                            <div className="space-y-4">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-[250px]" />
                                            <Skeleton className="h-4 w-[200px]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="my-6 w-full overflow-y-auto">
                                <div className="flex items-center justify-between pb-4">
                                    <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
                                    <div className="flex gap-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch 
                                                id="auto-enhance-emails"
                                                checked={enhanceEmailsAutomatically}
                                                onCheckedChange={setEnhanceEmailsAutomatically}
                                            />
                                            <Label htmlFor="auto-enhance-emails">Auto-enhance emails</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch 
                                                id="auto-verify-emails"
                                                checked={verifyEmailsAutomatically}
                                                onCheckedChange={setVerifyEmailsAutomatically}
                                            />
                                            <Label htmlFor="auto-verify-emails">Auto-verify emails</Label>
                                        </div>
                                    </div>
                                </div>
                                
                                {isProcessingEmails && (
                                    <div className="mb-4 p-2 bg-muted/30 rounded-md flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Enhancing emails...</span>
                                    </div>
                                )}
                                
                                {currentSearchMetadata && currentSearchMetadata.sources.some(s => s.usageLimitReached) && (
                                    <div className="mb-4 p-2 bg-amber-100 rounded-md flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm">API usage limit reached for some services. Please try again later.</span>
                                    </div>
                                )}
                                
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead className="min-w-[150px]">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-4 w-4" />
                                                    <span>Email</span>
                                                </div>
                                            </TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchResults.map((person, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {person.first_name} {person.last_name}
                                                </TableCell>
                                                <TableCell>{person.position || person.job_title || '-'}</TableCell>
                                                <TableCell>{person.company || person.job_company_name || '-'}</TableCell>
                                                <TableCell>
                                                    {person.email ? (
                                                        <div className="flex items-center">
                                                            <span 
                                                                className="text-blue-600 cursor-pointer hover:underline"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(person.email);
                                                                    // Simple alert for feedback
                                                                    alert('Email copied to clipboard!');
                                                                }}
                                                            >
                                                                {person.email}
                                                            </span>
                                                            {person.email_quality?.verified && (
                                                                <Badge variant="outline" className="ml-1 text-xs bg-green-50">
                                                                    Verified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <span className="text-muted-foreground italic text-sm">
                                                                No email available
                                                            </span>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 h-auto text-xs"
                                                                onClick={async () => {
                                                                    const guessResult = await guessEmailForLead(person);
                                                                    if (guessResult.email) {
                                                                        setSearchResults(prev => 
                                                                            prev.map((lead, idx) => 
                                                                                idx === index ? {
                                                                                    ...lead,
                                                                                    email: guessResult.email,
                                                                                    email_quality: {
                                                                                        verified: false,
                                                                                        confidence: guessResult.confidence
                                                                                    }
                                                                                } : lead
                                                                            )
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Find email
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{person.location?.name || person.location_locality || person.location || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => addLeadFromResults(person)}>
                                                        <PlusCircle className="h-4 w-4 mr-1" />
                                                        Add Lead
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                {noResultsFound ? (
                                    <div className="flex flex-col items-center">
                                        <AlertCircle className="h-10 w-10 text-orange-500 mb-2" />
                                        <p className="font-medium">No leads found matching your search criteria</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or selecting different criteria</p>
                                    </div>
                                ) : (
                                    "Use the Find Leads button to search for new leads"
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Your Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leads.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.map((lead, index) => (
                                        <TableRow key={lead.id || index}>
                                            <TableCell className="font-medium">
                                                {lead.first_name} {lead.last_name}
                                            </TableCell>
                                            <TableCell>{lead.email}</TableCell>
                                            <TableCell>{lead.company}</TableCell>
                                            <TableCell>
                                                <Badge variant={lead.status === 'verified' ? 'default' : 'secondary'} 
                                                       className={lead.status === 'verified' ? 'bg-green-500' : ''}>
                                                    {lead.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                No leads found. Add leads manually or search for new ones.
                            </div>
                        )}
                    </CardContent>
                </Card> */}
            </div>
        </>
    )
}