"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Building2, MapPin, Briefcase, Users, Filter, Shield, Search } from "lucide-react"
import { LeadSearchFilters } from "@/services/leadGeneration/types"
import { LeadSource } from "@/services/leadGeneration/types"

interface SearchFiltersCardProps {
  filterOptions: {
    title: string;
    company: string;
    location: string;
    industry: string;
    companySize: string;
    jobLevel: string;
  };
  handleFilterChange: (field: string, value: string) => void;
  resetFilters: () => void;
  availableServices: LeadSource[];
  activeServices: string[];
  toggleService: (serviceId: string) => void;
  isLoadingServices: boolean;
}

export function SearchFiltersCard({
  filterOptions,
  handleFilterChange,
  resetFilters,
  availableServices,
  activeServices,
  toggleService,
  isLoadingServices
}: SearchFiltersCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Find Leads</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
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
                    <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-gray-200 animate-pulse" />
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
                    onClick={() => !isDisabled && toggleService(service.id)}
                    style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
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
            onClick={() => window.dispatchEvent(new CustomEvent('search-leads'))}
            variant="default"
            size="sm"
            className="h-9 bg-orange-500 hover:bg-orange-600"
          >
            <Search className="mr-2 h-4 w-4" />
            Find Leads
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
