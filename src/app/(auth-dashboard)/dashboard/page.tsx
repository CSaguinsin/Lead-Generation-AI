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
} from "lucide-react"

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

  // Stat cards data
  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      change: "+12.5%",
      changeType: "positive",
      icon: Users,
      color: "bg-blue-500",
      description: "All leads in your database",
      chartData: [35, 60, 25, 65, 45, 75, 55],
      chartColor: "#3b82f6"
    },
    {
      title: "Verified Emails",
      value: stats.verifiedLeads,
      change: "+7.2%",
      changeType: "positive",
      icon: CheckCircle2,
      color: "bg-emerald-500",
      description: "Verified email addresses",
      chartData: [25, 40, 30, 45, 35, 55, 40],
      chartColor: "#10b981"
    },
    {
      title: "Conversion Rate",
      value: stats.conversionRate,
      change: "-2.1%",
      changeType: "negative",
      icon: Activity,
      color: "bg-violet-500",
      description: "Lead to customer conversion",
      chartData: [45, 30, 60, 25, 45, 40, 35],
      chartColor: "#8b5cf6"
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns,
      change: "+1",
      changeType: "positive",
      icon: Layers,
      color: "bg-amber-500",
      description: "Currently running campaigns",
      chartData: [15, 25, 20, 30, 25, 35, 30],
      chartColor: "#f59e0b"
    }
  ];

  return (
<div className="w-full max-w-full overflow-hidden">
      {/* Dashboard Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
            Lead Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your leads and track conversion performance
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads..."
              className="w-full sm:w-[220px] pl-9 rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={isLoading} 
            className="rounded-full"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AddLeadModal onLeadAdded={handleLeadAdded} />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {statCards.map((card, i) => (
          <motion.div key={i} variants={itemVariants} className="h-full">
            <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${card.color} bg-opacity-10 dark:bg-opacity-20`}>
                      <card.icon className={`h-5 w-5 ${card.color} text-opacity-90 dark:text-opacity-90`} />
                    </div>
                    <CardTitle className="text-base font-medium">{card.title}</CardTitle>
                  </div>
                  <div
                    className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                      card.changeType === "positive" 
                        ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30" 
                        : "text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30"
                    }`}
                  >
                    {card.change}
                    <ArrowUpRight className={`ml-1 h-3 w-3 ${card.changeType === "negative" ? "rotate-90" : ""}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
                <div className="mt-3 h-10">
                  <svg width="100%" height="100%" viewBox="0 0 100 30">
                    <defs>
                      <linearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={card.chartColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={card.chartColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Line chart */}
                    <path
                      d={`M0,${30 - (card.chartData[0] / 100) * 30} ${card.chartData.map((d, i) => 
                        `L${(i + 1) * (100 / card.chartData.length)},${30 - (d / 100) * 30}`
                      ).join(' ')}`}
                      fill="none"
                      stroke={card.chartColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Area under the line */}
                    <path
                      d={`M0,${30 - (card.chartData[0] / 100) * 30} ${card.chartData.map((d, i) => 
                        `L${(i + 1) * (100 / card.chartData.length)},${30 - (d / 100) * 30}`
                      ).join(' ')} L100,30 L0,30 Z`}
                      fill={`url(#gradient-${i})`}
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Verification Progress */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <Card className="border-none shadow-md bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base font-medium">Email Verification Status</CardTitle>
              </div>
              <Badge variant="outline" className="font-medium">
                {verificationPercentage}% Complete
              </Badge>
            </div>
            <CardDescription>
              Track the verification status of your lead email addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={verificationPercentage} className="h-2" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Total Leads</span>
                  <span className="font-medium">{stats.totalLeads}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Verified</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.verifiedLeads}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Unverified</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{stats.totalLeads - stats.verifiedLeads}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Verification Rate</span>
                  <span className="font-medium">{verificationPercentage}%</span>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Lead Management</h2>
          <Tabs defaultValue="all" onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex h-9 rounded-lg p-1 bg-muted/30">
              <TabsTrigger value="all" className="rounded-md text-sm px-3">All Leads</TabsTrigger>
              <TabsTrigger value="verified" className="rounded-md text-sm px-3">Verified</TabsTrigger>
              <TabsTrigger value="unverified" className="rounded-md text-sm px-3">Unverified</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-gray-800">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-medium">
                  {activeTab === 'all' ? 'All Leads' : 
                   activeTab === 'verified' ? 'Verified Leads' : 'Unverified Leads'}
                </CardTitle>
                <Badge variant="outline" className="ml-2">
                  {filteredLeads.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Filter leads</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export leads</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select defaultValue="30">
                  <SelectTrigger className="h-9 w-[70px]">
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
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[50px] font-medium">
                      <div className="flex items-center space-x-1">
                        <span>#</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </TableHead>
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Company</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Added</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-[300px]">
                          <div className="flex flex-col items-center justify-center h-full">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary/70 mb-4" />
                            <p className="text-muted-foreground">Loading leads...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-[300px]">
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                              <Inbox className="h-8 w-8 text-muted-foreground" />
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
                                className="gap-2"
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
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border">
                                <AvatarImage src={lead.avatar || `/placeholder.svg?height=36&width=36`} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {`${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{`${lead.first_name} ${lead.last_name}`}</div>
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
                                className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors group/email"
                              >
                                <Mail className="h-4 w-4" />
                                <span className="truncate max-w-[160px]">{lead.email}</span>
                                <div className={`absolute -top-10 left-0 bg-popover text-popover-foreground shadow-md rounded-md px-3 py-1.5 text-xs transition-opacity ${
                                  showEmailTooltip === (lead.id || `${index}`) ? "opacity-100" : "opacity-0 pointer-events-none"
                                }`}>
                                  Click to send email
                                </div>
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span>{lead.company}</span>
                              {lead.linkedin_url && (
                                <a 
                                  href={lead.linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
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
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" 
                                  : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
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
                                className="h-8 w-8 mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Mail className="h-4 w-4 text-primary" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                  <DropdownMenuItem>
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
            <CardFooter className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{filteredLeads.length}</span> of{" "}
                <span className="font-medium">{stats.totalLeads}</span> leads
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
