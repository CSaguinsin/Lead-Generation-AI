"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Lead } from "@/app/types/lead"
import { LeadService } from "@/lib/leadService"

export function SavedLeadsTab() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Load saved leads on mount
    useEffect(() => {
        const loadSavedLeads = async () => {
            try {
                setIsLoading(true)
                const savedLeads = await LeadService.getLeads()
                setLeads(savedLeads)
            } catch (error) {
                console.error("Error loading saved leads:", error)
            } finally {
                setIsLoading(false)
            }
        }
        
        loadSavedLeads()
    }, [])
    
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>Your Saved Leads</CardTitle>
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
                ) : leads.length > 0 ? (
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
                            {leads.map((lead, index) => (
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
                                        <Button variant="ghost" size="sm">View</Button>
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
    )
}
