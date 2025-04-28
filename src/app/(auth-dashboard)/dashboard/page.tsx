"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Download,
  Filter,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Users,
  ExternalLink,
  Briefcase,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Inbox,
  Settings,
  PieChart,
  LineChart,
  BarChart,
  Activity,
  Layers,
  Shield,
  Phone,
  Sparkles,
  Target,
  Zap,
  Building2,
  MapPin,
  UserCheck,
  Clock,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddLeadModal } from "@/app/components/dashboard/AddLeadModal"
import { fetchLeads, fetchLeadStats } from "@/app/actions/getLeads"
import { Lead } from "@/app/types/lead"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { LeadDetailsSidebar } from "@/app/components/dashboard/LeadDetailsSidebar"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'unverified'>('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState({
    totalLeads: 0,
    verifiedLeads: 0,
    conversionRate: '0%',
    activeCampaigns: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showEmailTooltip, setShowEmailTooltip] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [activeTimeframe, setActiveTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week')

  const loadLeads = async (filter?: 'verified' | 'unverified') => {
    setIsLoading(true)
    try {
      const fetchedLeads = await fetchLeads(filter);
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await fetchLeadStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await Promise.all([
      loadLeads(activeTab === 'all' ? undefined : activeTab),
      loadStats()
    ]);
    setIsLoading(false)
  }

  const handleTabChange = (value: string) => {
    const tabValue = value as 'all' | 'verified' | 'unverified';
    setActiveTab(tabValue);
    loadLeads(tabValue === 'all' ? undefined : tabValue);
  }

  const handleLeadAdded = () => {
    refreshData();
  };

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailView(true);
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.company.toLowerCase().includes(searchLower)
    );
  });

  // Load data on initial render
  useEffect(() => {
    refreshData();
  }, []);

  // Format date function without date-fns dependency
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (error) {
      return 'Invalid date';
    }
  }

  // Calculate percentage for progress bar
  const calculatePercentage = () => {
    if (stats.totalLeads === 0) return 0;
    return Math.round((stats.verifiedLeads / stats.totalLeads) * 100);
  }

  const verificationPercentage = calculatePercentage();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  // Dashboard welcome section
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <div className="w-full max-w-full overflow-hidden">
        {/* Dashboard Header */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <div className="flex flex-col space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">
                    {getGreeting()}
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here's what's happening with your leads today
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search leads..."
                    className="w-full md:w-[260px] pl-10 rounded-full border-orange-100 focus-visible:ring-orange-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={refreshData} 
                  disabled={isLoading} 
                  className="rounded-full border-orange-100 hover:bg-orange-50 hover:text-orange-600"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <AddLeadModal onLeadAdded={handleLeadAdded} />
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold">{stats.totalLeads}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="text-2xl font-bold">{stats.verifiedLeads}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion</p>
                    <p className="text-2xl font-bold">{stats.conversionRate}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Campaigns</p>
                    <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-violet-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Timeframe Selector */}
        <div className="flex justify-end mb-6">
          <div className="bg-white border border-orange-100 rounded-lg p-1 inline-flex">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTimeframe('day')}
              className={cn(
                "rounded-md text-sm px-3",
                activeTimeframe === 'day' ? "bg-orange-100 text-orange-600" : "text-gray-600"
              )}
            >
              Day
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTimeframe('week')}
              className={cn(
                "rounded-md text-sm px-3",
                activeTimeframe === 'week' ? "bg-orange-100 text-orange-600" : "text-gray-600"
              )}
            >
              Week
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTimeframe('month')}
              className={cn(
                "rounded-md text-sm px-3",
                activeTimeframe === 'month' ? "bg-orange-100 text-orange-600" : "text-gray-600"
              )}
            >
              Month
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTimeframe('year')}
              className={cn(
                "rounded-md text-sm px-3",
                activeTimeframe === 'year' ? "bg-orange-100 text-orange-600" : "text-gray-600"
              )}
            >
              Year
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Recent Leads Activity */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="h-full border-none shadow-md bg-white overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Lead Activity</CardTitle>
                  <CardDescription>Latest leads and verification status</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={refreshData}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Refresh</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[240px]">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <Inbox className="h-6 w-6 text-orange-600" />
                      </div>
                      <p className="text-muted-foreground">No leads available</p>
                      <Button 
                        onClick={() => document.querySelector<HTMLButtonElement>('[data-add-lead]')?.click()}
                        className="mt-4 bg-orange-600 hover:bg-orange-700 text-white gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add your first lead
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {leads.slice(0, 5).map((lead, index) => (
                          <div 
                            key={lead.id || index} 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                            onClick={() => handleViewDetails(lead)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-orange-100">
                                <AvatarImage src={lead.avatar || `/placeholder.svg?height=36&width=36`} />
                                <AvatarFallback className="bg-orange-100 text-orange-600">
                                  {`${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{`${lead.first_name} ${lead.last_name}`}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {newFunction(lead)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`${
                                  lead.status === "verified" 
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {lead.status === "verified" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                  )}
                                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                </span>
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full p-0 hover:bg-orange-100"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the parent div's onClick
                                  handleViewDetails(lead);
                                }}
                              >
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-center mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-orange-100 hover:bg-orange-50 hover:text-orange-600"
                          onClick={() => window.location.href = '/dashboard/leads'}
                        >
                          View all leads
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lead Verification Status */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-none shadow-md bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Verification Status</CardTitle>
                <CardDescription>Email verification breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative w-[160px] h-[160px]">
                    {/* Circular progress indicator */}
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                      />
                      {/* Progress circle - using stroke-dasharray and stroke-dashoffset for percentage */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#orange-gradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="282.7"
                        strokeDashoffset={282.7 - (282.7 * verificationPercentage) / 100}
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#fb923c" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Percentage text in the middle */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">{verificationPercentage}%</span>
                      <span className="text-sm text-muted-foreground">Verified</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-sm">Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.verifiedLeads}</span>
                      <span className="text-xs text-muted-foreground">({verificationPercentage}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-sm">Unverified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.totalLeads - stats.verifiedLeads}</span>
                      <span className="text-xs text-muted-foreground">({100 - verificationPercentage}%)</span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Verification Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start border-orange-100 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verify All Emails
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start border-orange-100 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Verification Report
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Verification Progress */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg font-semibold">Email Verification Status</CardTitle>
                </div>
                <Badge variant="outline" className="font-medium bg-orange-50 text-orange-600 border-orange-200">
                  {verificationPercentage}% Complete
                </Badge>
              </div>
              <CardDescription>
                Track the verification status of your lead email addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                    style={{ width: `${verificationPercentage}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Leads</span>
                    <span className="text-xl font-bold">{stats.totalLeads}</span>
                  </div>
                  <div className="flex flex-col p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    <span className="text-xl font-bold text-emerald-600">{stats.verifiedLeads}</span>
                  </div>
                  <div className="flex flex-col p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Unverified</span>
                    <span className="text-xl font-bold text-amber-600">{stats.totalLeads - stats.verifiedLeads}</span>
                  </div>
                  <div className="flex flex-col p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Verification Rate</span>
                    <span className="text-xl font-bold text-orange-600">{verificationPercentage}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leads Table Section */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lead Management</h2>
              <p className="text-sm text-muted-foreground">View, filter, and manage your leads</p>
            </div>
            <Tabs defaultValue="all" onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex h-10 rounded-lg p-1 bg-orange-50/50 border border-orange-100">
                <TabsTrigger value="all" className="rounded-md text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                  All Leads
                </TabsTrigger>
                <TabsTrigger value="verified" className="rounded-md text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                  Verified
                </TabsTrigger>
                <TabsTrigger value="unverified" className="rounded-md text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">
                  Unverified
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="pb-0 pt-5 px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {activeTab === 'all' ? 'All Leads' : 
                       activeTab === 'verified' ? 'Verified Leads' : 'Unverified Leads'}
                    </CardTitle>
                    <CardDescription>
                      {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-orange-50 p-1 rounded-lg">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-600 hover:text-orange-600 hover:bg-orange-100">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Filter leads</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-600 hover:text-orange-600 hover:bg-orange-100">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export leads</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="h-9 w-[80px] border-orange-100 focus:ring-orange-200">
                      <SelectValue placeholder="30" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-orange-100">
                      <TableHead className="w-[50px] font-medium text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>#</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </TableHead>
                      <TableHead className="font-medium text-gray-600">Name</TableHead>
                      <TableHead className="font-medium text-gray-600">Email</TableHead>
                      <TableHead className="font-medium text-gray-600">Phone</TableHead>
                      <TableHead className="font-medium text-gray-600">Company</TableHead>
                      <TableHead className="font-medium text-gray-600">Status</TableHead>
                      <TableHead className="font-medium text-gray-600">Added</TableHead>
                      <TableHead className="text-right font-medium text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-[300px]">
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                                <RefreshCw className="h-6 w-6 animate-spin text-orange-600" />
                              </div>
                              <p className="text-muted-foreground">Loading leads...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-[300px]">
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                                <Inbox className="h-8 w-8 text-orange-600" />
                              </div>
                              <h3 className="text-lg font-medium mb-1">No leads found</h3>
                              <p className="text-muted-foreground mb-4">
                                {activeTab === 'all' 
                                  ? "You don't have any leads yet." 
                                  : `No ${activeTab} leads available.`}
                              </p>
                              {activeTab === 'all' && (
                                <Button 
                                  onClick={() => document.querySelector<HTMLButtonElement>('[data-add-lead]')?.click()}
                                  className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add your first lead
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLeads.map((lead, index) => (
                          <motion.tr
                            key={lead.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="group hover:bg-orange-50/50 transition-colors"
                          >
                            <TableCell className="font-medium text-gray-600">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-orange-100">
                                  <AvatarImage src={lead.avatar || `/placeholder.svg?height=36&width=36`} />
                                  <AvatarFallback className="bg-orange-100 text-orange-600">
                                    {`${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">{`${lead.first_name} ${lead.last_name}`}</div>
                                  {lead.position && (
                                    <div className="text-xs text-muted-foreground">{lead.position}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div 
                                className="relative"
                                onMouseEnter={() => setShowEmailTooltip(lead.id || `${index}`)}
                                onMouseLeave={() => setShowEmailTooltip(null)}
                              >
                                <button
                                  onClick={() => handleEmailClick(lead.email)}
                                  className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 transition-colors group/email"
                                >
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate max-w-[160px]">{lead.email}</span>
                                  <div className={`absolute -top-10 left-0 bg-white text-gray-900 shadow-md rounded-md px-3 py-1.5 text-xs transition-opacity ${
                                    showEmailTooltip === (lead.id || `${index}`) ? "opacity-100" : "opacity-0 pointer-events-none"
                                  }`}>
                                    Click to send email
                                  </div>
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {lead.phone_number ? (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="truncate max-w-[120px]">{lead.phone_number}</span>
                                  {lead.phone_data?.type && (
                                    <Badge variant="outline" className="text-xs border-orange-200 bg-orange-50 text-orange-600">
                                      {lead.phone_data.type}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not available</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span>{lead.company}</span>
                                {lead.linkedin_url && (
                                  <a 
                                    href={lead.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-orange-600 transition-colors"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${
                                  lead.status === "verified" 
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50" 
                                    : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {lead.status === "verified" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5" />
                                  )}
                                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                </span>
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full p-0 hover:bg-orange-100"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the parent div's onClick
                                  handleViewDetails(lead);
                                }}
                              >
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(lead.created_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEmailClick(lead.email)}
                                  className="h-8 w-8 mr-1 opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-orange-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-[180px]">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleEmailClick(lead.email)}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      <span>Send Email</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                                      <Users className="mr-2 h-4 w-4" />
                                      <span>View Details</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Briefcase className="mr-2 h-4 w-4" />
                                      <span>Add to Campaign</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                      <span>Delete Lead</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {filteredLeads.length > 0 && (
              <CardFooter className="flex items-center justify-between border-t border-orange-100 p-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{filteredLeads.length}</span> of{" "}
                  <span className="font-medium">{stats.totalLeads}</span> leads
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled
                    className="border-orange-100 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled
                    className="border-orange-100 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Lead Details Sidebar */}
      <LeadDetailsSidebar 
        isOpen={showDetailView}
        onClose={() => setShowDetailView(false)}
        lead={selectedLead}
      />
    </>
  )

  function newFunction(lead: Lead) {
    return <span className="truncate max-w-[160px]">{lead.email}</span>
  }
}
