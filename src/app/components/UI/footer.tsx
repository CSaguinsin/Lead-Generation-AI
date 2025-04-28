"use client"

import { Database, Mail, Globe, Phone, Github, Linkedin, Twitter, ArrowRight, ExternalLink, Zap } from "lucide-react"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "API", href: "/api" },
        { label: "Documentation", href: "/docs" }
      ]
    },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pt-16 pb-8 overflow-hidden">
      {/* Diagonal divider from main content */}
      <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 clip-diagonal-footer"></div>
      </div>
      
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 w-1/2 h-1/2 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute -left-1/4 bottom-0 w-1/2 h-1/2 bg-amber-400 rounded-full blur-3xl"></div>
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-orange-400/50 rounded-full blur-3xl"></div>
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid-footer" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"></path>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-footer)"></rect>
        </svg>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-16">
          {/* Company info */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-7 w-7 text-orange-400" />
              <span className="text-2xl font-bold text-white">Lead Generator AI</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Discover and connect with the perfect business contacts using our AI-powered lead generation platform.
            </p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://linkedin.com" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="https://github.com" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
          
          {/* Links sections */}
          {footerLinks.map((section, i) => (
            <div key={i} className="lg:col-span-2">
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link 
                      href={link.href}
                      className="text-gray-400 hover:text-orange-400 transition-colors flex items-center group"
                    >
                      <span>{link.label}</span>
                      <ArrowRight 
                        className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" 
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest updates and insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full px-4 py-2.5 bg-gray-800/70 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white"
                />
              </div>
              <Button 
                type="submit"
                className="whitespace-nowrap bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            {currentYear} Lead Generator AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
      
      {/* Add custom CSS for diagonal clipping */}
      <style jsx global>{`
        .clip-diagonal-footer {
          clip-path: polygon(0 0, 100% 100%, 100% 0);
        }
      `}</style>
    </footer>
  )
}