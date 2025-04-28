"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Lead, LeadStatus } from "@/app/types/lead"
import { Mail, Phone, Building2, MapPin, Briefcase, ExternalLink, X, Check, AlertTriangle } from "lucide-react"

interface LeadDetailsSidebarProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
}

export function LeadDetailsSidebar({ isOpen, onClose, lead }: LeadDetailsSidebarProps) {
  if (!lead) return null

  const emailStatus = lead.status === LeadStatus.Verified ? 'verified' : 
                     lead.status === LeadStatus.Unverified ? 'unverified' : 'unknown'

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 space-y-1">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-bold">Lead Details</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <SheetDescription>
            View and manage lead information
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-base font-medium">{lead.first_name} {lead.last_name}</h4>
                  <p className="text-sm text-muted-foreground">{lead.position || 'Position not available'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-medium">Email</h4>
                  {lead.email ? (
                    <div className="flex items-center">
                      <a 
                        href={`mailto:${lead.email}`} 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {lead.email}
                      </a>
                      {emailStatus === 'verified' && (
                        <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                          <Check className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {emailStatus === 'unverified' && (
                        <Badge variant="outline" className="ml-2">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No email available</p>
                  )}
                </div>
              </div>
              
              {/* Phone number - based on the Lead model, we don't have this field directly */}
              
              {lead.linkedin_url && (
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium">LinkedIn</h4>
                    <a 
                      href={lead.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Company Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-base font-medium">Company</h4>
                  <p className="text-sm">{lead.company || 'Not available'}</p>
                  {lead.company_data?.industry && (
                    <Badge variant="outline" className="mt-1">
                      {lead.company_data.industry}
                    </Badge>
                  )}
                  {lead.company_data?.size && (
                    <Badge variant="outline" className="mt-1 ml-1">
                      {lead.company_data.size} employees
                    </Badge>
                  )}
                </div>
              </div>
              
              {lead.domain && (
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <ExternalLink className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium">Website</h4>
                    <a 
                      href={`https://${lead.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {lead.domain}
                    </a>
                  </div>
                </div>
              )}
              
              {(lead.company_data?.location?.country || lead.company_data?.location?.locality) && (
                <div className="flex items-start">
                  <div className="bg-red-100 p-2 rounded-full mr-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium">Location</h4>
                    <p className="text-sm">
                      {lead.company_data.location.locality && lead.company_data.location.locality}
                      {lead.company_data.location.locality && lead.company_data.location.country && ', '}
                      {lead.company_data.location.country && lead.company_data.location.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {lead.profile_data && (
            <>
              <Separator />
              
              {/* Profile Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Profile Information</h3>
                
                {lead.profile_data.summary && (
                  <div className="mb-4">
                    <h4 className="text-base font-medium mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">{lead.profile_data.summary}</p>
                  </div>
                )}
                
                {lead.profile_data.experiences && lead.profile_data.experiences.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-medium mb-1">Experience</h4>
                    <div className="space-y-2">
                      {lead.profile_data.experiences.map((exp, index) => (
                        <div key={index} className="border-l-2 border-muted pl-3 py-1">
                          <p className="text-sm font-medium">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{exp.company}</p>
                          {exp.duration && (
                            <p className="text-xs text-muted-foreground">{exp.duration}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {lead.profile_data.education && lead.profile_data.education.length > 0 && (
                  <div>
                    <h4 className="text-base font-medium mb-1">Education</h4>
                    <div className="space-y-2">
                      {lead.profile_data.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-muted pl-3 py-1">
                          <p className="text-sm font-medium">{edu.school}</p>
                          {edu.degree && (
                            <p className="text-xs text-muted-foreground">{edu.degree}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button>
            Add to Campaign
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
