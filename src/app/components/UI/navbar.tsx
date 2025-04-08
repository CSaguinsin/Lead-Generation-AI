"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Database, Menu, X, ChevronDown } from "lucide-react"
import { useRouter } from 'next/navigation'


export default function Navbar() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  // Toggle dropdown menus - fixed the TypeScript error by adding proper type annotation
  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name)
  }

  return (
    <header className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-md py-2" : "bg-white py-4"}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left section - Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-2 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">Lead Generator AI</span>
            </div>
          </div>
          
          {/* Center section - Navigation (desktop only) */}
          <nav className="hidden lg:flex justify-center flex-1 ml-8">
            <ul className="flex space-x-1">
              <li className="relative group">
                <button 
                  onClick={() => toggleDropdown('features')} 
                  className="px-4 py-2 rounded-full flex items-center space-x-1 hover:bg-orange-50 transition-colors text-gray-700"
                >
                  <span>Features</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {activeDropdown === 'features' && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-4 w-64">
                    <div className="space-y-2">
                      <a href="#" className="block px-3 py-2 rounded-md hover:bg-orange-50 text-gray-700">Lead Generation</a>
                      <a href="#" className="block px-3 py-2 rounded-md hover:bg-orange-50 text-gray-700">AI Analysis</a>
                      <a href="#" className="block px-3 py-2 rounded-md hover:bg-orange-50 text-gray-700">Contact Management</a>
                    </div>
                  </div>
                )}
              </li>
              <li>
                <a href="#how-it-works" className="px-4 py-2 rounded-full inline-block hover:bg-orange-50 transition-colors text-gray-700">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="px-4 py-2 rounded-full inline-block hover:bg-orange-50 transition-colors text-gray-700">
                  Pricing
                </a>
              </li>
            </ul>
          </nav>
          
          {/* Right section - CTA buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button onClick={() => router.push('/auth/login')} variant="ghost" className="rounded-full text-gray-700 hover:text-orange-600 hover:bg-orange-50">
              Log in
            </Button>
            <Button onClick={() => router.push('/auth/signup')} className="rounded-full px-6 py-5 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white">
              Get Started
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="rounded-full text-gray-700 hover:text-orange-600 hover:bg-orange-50">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 pt-20">
          <div className="container mx-auto px-4 py-8">
            <nav>
              <ul className="space-y-6">
                <li>
                  <button 
                    onClick={() => toggleDropdown('mobileFeatures')}
                    className="flex items-center justify-between w-full text-lg text-gray-700"
                  >
                    <span>Features</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${activeDropdown === 'mobileFeatures' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === 'mobileFeatures' && (
                    <div className="mt-3 pl-4 space-y-3 border-l-2 border-orange-200">
                      <a href="#" className="block py-2 text-gray-700 hover:text-orange-600">Lead Generation</a>
                      <a href="#" className="block py-2 text-gray-700 hover:text-orange-600">AI Analysis</a>
                      <a href="#" className="block py-2 text-gray-700 hover:text-orange-600">Contact Management</a>
                    </div>
                  )}
                </li>
                <li>
                  <a href="#how-it-works" className="block text-lg text-gray-700 hover:text-orange-600">How It Works</a>
                </li>
                <li>
                  <a href="#pricing" className="block text-lg text-gray-700 hover:text-orange-600">Pricing</a>
                </li>
                <li className="pt-6 border-t">
                  <Button variant="ghost" className="w-full justify-center text-lg text-gray-700 hover:text-orange-600">
                    Log in
                  </Button>
                </li>
                <li>
                  <Button className="w-full justify-center py-6 text-lg bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white">
                    Get Started
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}