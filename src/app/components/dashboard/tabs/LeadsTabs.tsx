"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, PlusCircle } from "lucide-react"
import { Lead } from "@/app/types/lead"
import { LeadSearchResults } from "@/services/leadGeneration/types"

interface LeadsTabsProps {
  // Search results tab
  searchResults: any[];
  isLoadingSearchResults: boolean;
  currentSearchMetadata: {
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
  } | null;
  noResultsFound: boolean;
  isProcessingEmails: boolean;
  onAddLead: (lead: any) => Promise<void>;
  
  // Saved leads tab
  savedLeads: Lead[];
  isLoadingSavedLeads: boolean;
  
  // Search UI container - this will be rendered in the search tab
  searchUIContainer: React.ReactNode;
  
  // Lead details
  onViewLeadDetails: (lead: Lead) => void;
}

export function LeadsTabs({
  searchResults,
  isLoadingSearchResults,
  currentSearchMetadata,
  noResultsFound,
  isProcessingEmails,
  onAddLead,
  savedLeads,
  isLoadingSavedLeads,
  searchUIContainer,
  onViewLeadDetails
}: LeadsTabsProps) {
    const [activeTab, setActiveTab] = useState<string>("search")
    
    return (
        <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="search">Search Results</TabsTrigger>
                <TabsTrigger value="saved">Saved Leads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search">
                {/* Render the search UI container */}
                {searchUIContainer}
                
                {/* Search results */}
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
                        {isLoadingSearchResults ? (
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Email</TableHead>
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
                                                        <span className="text-blue-600">
                                                            {person.email}
                                                        </span>
                                                        {person.email_quality?.verified && (
                                                            <Badge variant="outline" className="ml-1 text-xs bg-green-50">
                                                                Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-sm">
                                                        No email available
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{person.location?.name || person.location_locality || person.location || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => onAddLead(person)}>
                                                        <PlusCircle className="h-4 w-4 mr-1" />
                                                        Add
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => onViewLeadDetails(person)}>
                                                        View
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
            </TabsContent>
            
            <TabsContent value="saved">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Your Saved Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSavedLeads ? (
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
                        ) : savedLeads.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savedLeads.map((lead, index) => (
                                        <TableRow key={lead.id || index}>
                                            <TableCell className="font-medium">
                                                {lead.first_name} {lead.last_name}
                                            </TableCell>
                                            <TableCell>{lead.email}</TableCell>
                                            <TableCell>{lead.company}</TableCell>
                                            <TableCell>{lead.position || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={lead.status === 'verified' ? 'default' : 'secondary'} 
                                                    className={lead.status === 'verified' ? 'bg-green-500' : ''}>
                                                    {lead.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => onViewLeadDetails(lead)}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <div className="flex flex-col items-center">
                                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="font-medium">No saved leads found</p>
                                    <p className="text-sm mt-1">Search for leads and add them to your saved list</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
