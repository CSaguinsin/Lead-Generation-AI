"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  const handleLeadAdded = () => {
    refreshData();
    // In a real app, you would:
    // 1. Save the new lead to Supabase
    // 2. Update the leads state with the new lead
    // 3. Possibly show a toast notification
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="h-9">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AddLeadModal onLeadAdded={handleLeadAdded} />
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            title: "Total Leads",
            value: "3,721",
            change: "+12.5%",
            changeType: "positive",
            icon: Users,
          },
          {
            title: "Verified Emails",
            value: "2,891",
            change: "+7.2%",
            changeType: "positive",
            icon: BarChart3,
          },
          {
            title: "Conversion Rate",
            value: "14.2%",
            change: "-2.1%",
            changeType: "negative",
            icon: BarChart3,
          },
          {
            title: "Active Campaigns",
            value: "8",
            change: "+1",
            changeType: "positive",
            icon: BarChart3,
          },
        ].map((card, i) => (
          <motion.div key={i} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div
                  className={`flex items-center text-xs ${
                    card.changeType === "positive" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {card.change}
                  <ArrowUpRight className={`ml-1 h-3 w-3 ${card.changeType === "negative" ? "rotate-90" : ""}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All Leads</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="unverified">Unverified</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search leads..."
                className="w-full pl-9 focus-visible:ring-orange-500"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Download className="h-4 w-4" />
            </Button>
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
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <div className="flex items-center space-x-1">
                        <span>#</span>
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      id: 1,
                      name: "Sarah Johnson",
                      email: "sarah.johnson@example.com",
                      company: "TechCorp",
                      status: "Verified",
                      date: "2023-05-12",
                    },
                    {
                      id: 2,
                      name: "Michael Chen",
                      email: "michael.chen@example.com",
                      company: "GrowthLabs",
                      status: "Unverified",
                      date: "2023-05-11",
                    },
                    {
                      id: 3,
                      name: "Emma Rodriguez",
                      email: "emma.rodriguez@example.com",
                      company: "Innovate Inc.",
                      status: "Verified",
                      date: "2023-05-10",
                    },
                    {
                      id: 4,
                      name: "David Kim",
                      email: "david.kim@example.com",
                      company: "NextLevel",
                      status: "Verified",
                      date: "2023-05-09",
                    },
                    {
                      id: 5,
                      name: "Lisa Wang",
                      email: "lisa.wang@example.com",
                      company: "TechSolutions",
                      status: "Unverified",
                      date: "2023-05-08",
                    },
                  ].map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                            <AvatarFallback>
                              {lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{lead.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            lead.status === "Verified" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>{lead.date}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                            <DropdownMenuItem>Add to Campaign</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Showing 5 of 100 leads</div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="verified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verified Leads</CardTitle>
              <CardDescription>These leads have verified email addresses that are ready for outreach.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Switch to the "All Leads" tab to see the complete list.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unverified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unverified Leads</CardTitle>
              <CardDescription>
                These leads need email verification before they can be used in campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Switch to the "All Leads" tab to see the complete list.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Lead Acquisition</CardTitle>
            <CardDescription>Lead growth over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full bg-orange-50 rounded-md flex items-center justify-center">
              <p className="text-sm text-gray-500">Chart placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "New lead added",
                  description: "Sarah Johnson was added to your leads",
                  time: "2 hours ago",
                },
                {
                  action: "Campaign started",
                  description: "Q2 Outreach campaign was started",
                  time: "5 hours ago",
                },
                {
                  action: "Email verified",
                  description: "15 email addresses were verified",
                  time: "Yesterday",
                },
                {
                  action: "Data exported",
                  description: "Lead data was exported to CSV",
                  time: "2 days ago",
                },
                {
                  action: "Integration connected",
                  description: "Connected to HubSpot CRM",
                  time: "3 days ago",
                },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="rounded-full bg-orange-100 p-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
