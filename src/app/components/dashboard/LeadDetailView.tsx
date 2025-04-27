import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Building2, 
  Globe, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Phone,
  Shield,
  Users
} from "lucide-react";
import { Lead, PhoneData } from "@/app/types/lead";

interface LeadDetailViewProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailView({ lead, isOpen, onClose }: LeadDetailViewProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {lead.first_name} {lead.last_name}
          </SheetTitle>
          <SheetDescription>
            {lead.position || "No position information"}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium mb-2">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div>{lead.email}</div>
                  {lead.email_quality && (
                    <Badge variant={lead.email_quality.deliverable ? "default" : "secondary"} className={lead.email_quality.deliverable ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" : ""}>
                      {lead.email_quality.deliverable ? "Valid" : "Unverified"} 
                      {lead.email_quality.quality_score && ` - Score: ${lead.email_quality.quality_score}`}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Phone Information - New addition */}
              {lead.phone_number && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div>{lead.phone_number}</div>
                    {lead.phone_data && (
                      <div className="flex gap-2 mt-1">
                        {lead.phone_data.type && (
                          <Badge variant="outline">{lead.phone_data.type}</Badge>
                        )}
                        {lead.phone_data.country_code && (
                          <Badge variant="outline">{lead.phone_data.country_code}</Badge>
                        )}
                        {lead.phone_data.source && (
                          <div className="text-xs text-muted-foreground">
                            via {lead.phone_data.source}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Company Information */}
          <div>
            <h3 className="text-sm font-medium mb-2">Company Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>{lead.company}</div>
              </div>
              
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>{lead.domain}</div>
              </div>
              
              {lead.company_data && (
                <>
                  {lead.company_data.industry && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>{lead.company_data.industry}</div>
                    </div>
                  )}
                  
                  {lead.company_data.size && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>{lead.company_data.size} employees</div>
                    </div>
                  )}
                  
                  {lead.company_data.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {lead.company_data.location.locality}
                        {lead.company_data.location.locality && lead.company_data.location.country && ", "}
                        {lead.company_data.location.country}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {lead.profile_data && (
            <>
              <Separator />
              
              {/* Profile Information */}
              <div>
                <h3 className="text-sm font-medium mb-2">Profile Information</h3>
                
                {lead.profile_data.summary && (
                  <div className="mb-4 text-sm">
                    {lead.profile_data.summary}
                  </div>
                )}
                
                {lead.profile_data.experiences && lead.profile_data.experiences.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Experience</h4>
                    <div className="space-y-2">
                      {lead.profile_data.experiences.map((exp, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{exp.title}</div>
                          <div className="text-muted-foreground">{exp.company}</div>
                          <div className="text-xs text-muted-foreground">{exp.duration}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {lead.profile_data.education && lead.profile_data.education.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Education</h4>
                    <div className="space-y-2">
                      {lead.profile_data.education.map((edu, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{edu.school}</div>
                          <div className="text-muted-foreground">{edu.degree}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          <Separator />
          
          {/* Lead Metadata */}
          <div>
            <h3 className="text-sm font-medium mb-2">Lead Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge variant={lead.status === "verified" ? "default" : "outline"} 
                       className={lead.status === "verified" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" : ""}>
                  {lead.status}
                </Badge>
              </div>
              
              {lead.created_at && (
                <div>
                  <div className="text-xs text-muted-foreground">Added on</div>
                  <div>{new Date(lead.created_at).toLocaleDateString()}</div>
                </div>
              )}
              
              {lead.enriched_at && (
                <div>
                  <div className="text-xs text-muted-foreground">Last enriched</div>
                  <div>{new Date(lead.enriched_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
