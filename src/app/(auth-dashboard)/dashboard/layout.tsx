"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Database,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Search,
  Bell,
  ChevronDown,
  Menu,
  User,
  Briefcase,
  Zap,
  LifeBuoy,
  Inbox
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { logout } from "@/app/auth/logout/actions"
import { AIChatbot } from "@/app/components/dashboard/AIChatbot"
import { getCurrentUser, type UserProfile } from "@/app/actions/user"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getCurrentUser()
        console.log("Fetched user profile:", profile)
        setUserProfile(profile)
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!userProfile?.full_name) return "U"
    
    const nameParts = userProfile.full_name.split(" ")
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-full bg-white border-r border-orange-100 transition-all duration-300 ease-in-out z-30",
          collapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-orange-100">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between w-full")}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                  <Database className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  LeadGen AI
                </span>
              </div>
            )}
            {collapsed && (
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                <Database className="h-5 w-5" />
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className={collapsed ? "hidden" : ""}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <nav className="space-y-6">
            <div className="space-y-2">
              {!collapsed && <p className="text-xs font-medium text-gray-500 px-3 mb-2">MAIN NAVIGATION</p>}
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive 
                          ? "bg-orange-100 text-orange-600" 
                          : "text-gray-600 hover:bg-orange-50 hover:text-orange-600",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive ? "text-orange-600" : "text-gray-500")} />
                      {!collapsed && <span>{item.name}</span>}
                      {!collapsed && item.name === "Leads" && (
                        <Badge className="ml-auto bg-orange-100 text-orange-600 hover:bg-orange-100">New</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {!collapsed && (
              <>

                <div className="px-3 py-4">
                  <div className="rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                        <Zap className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Upgrade Plan</h4>
                        <p className="text-xs text-gray-600">Get more leads</p>
                      </div>
                    </div>
                    <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 border border-orange-200">
                      Upgrade
                    </Button>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* User Profile */}
        <div className="border-t border-orange-100 p-4">
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between"
          )}>
            {!collapsed ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-orange-100">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {isLoading ? "..." : getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {isLoading ? "Loading..." : userProfile?.full_name || "User"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {isLoading ? "..." : userProfile?.email || ""}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Avatar className="h-9 w-9 border-2 border-orange-100">
                <AvatarImage src="/placeholder.svg?height=36&width=36" />
                <AvatarFallback className="bg-orange-100 text-orange-600">
                  {isLoading ? "..." : getInitials()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="absolute left-4 top-3 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex h-full flex-col">
            <div className="h-16 flex items-center px-4 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                  <Database className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  LeadGen AI
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto py-6 px-3">
              <nav className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 px-3 mb-2">MAIN NAVIGATION</p>
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                            isActive 
                              ? "bg-orange-100 text-orange-600" 
                              : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                          )}
                        >
                          <item.icon className={cn("h-5 w-5", isActive ? "text-orange-600" : "text-gray-500")} />
                          <span>{item.name}</span>
                          {item.name === "Leads" && (
                            <Badge className="ml-auto bg-orange-100 text-orange-600 hover:bg-orange-100">New</Badge>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 px-3 mb-2">RESOURCES</p>
                  <div className="space-y-1">
                    <Link
                      href="#"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all"
                    >
                      <Briefcase className="h-5 w-5 text-gray-500" />
                      <span>Integrations</span>
                    </Link>
                    <Link
                      href="#"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all"
                    >
                      <Zap className="h-5 w-5 text-gray-500" />
                      <span>Automations</span>
                    </Link>
                    <Link
                      href="#"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-all"
                    >
                      <LifeBuoy className="h-5 w-5 text-gray-500" />
                      <span>Help Center</span>
                    </Link>
                  </div>
                </div>

                <div className="px-3 py-4">
                  <div className="rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                        <Zap className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Upgrade Plan</h4>
                        <p className="text-xs text-gray-600">Get more leads</p>
                      </div>
                    </div>
                    <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 border border-orange-200">
                      Upgrade
                    </Button>
                  </div>
                </div>
              </nav>
            </div>

            <div className="border-t border-orange-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-orange-100">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {isLoading ? "..." : getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {isLoading ? "Loading..." : userProfile?.full_name || "User"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {isLoading ? "..." : userProfile?.email || ""}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Navigation */}
        <header className="h-16 bg-white border-b border-orange-100 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
          <div className="md:hidden w-6" /> {/* Placeholder for mobile menu button */}
          
          <div className="flex-1 flex items-center max-w-md mx-auto md:mx-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search leads, campaigns, or anything..."
                className="w-full pl-10 rounded-xl border-orange-100 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="sr-only">Notifications</span>
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Inbox className="h-5 w-5 text-gray-600" />
                    <span className="sr-only">Messages</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" className="rounded-full h-9 gap-2 pl-2 pr-3">
                  <Avatar className="h-7 w-7 border border-orange-100">
                    <AvatarImage src="/placeholder.svg?height=28&width=28" />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                      {isLoading ? "..." : getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700">
                    {isLoading ? "..." : userProfile?.full_name?.split(' ')[0] || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  )
}