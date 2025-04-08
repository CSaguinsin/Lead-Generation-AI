"use client"

import { Database} from "lucide-react"

export default function Footer() {

  return (
    <footer className="relative bg-gray-900 text-white pt-16 pb-8 overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 w-1/2 h-1/2 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute -left-1/4 bottom-0 w-1/2 h-1/2 bg-orange-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">


        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <Database className="h-7 w-7 text-orange-400" />
            <span className="text-2xl font-bold text-white">Lead Generator AI</span>
          </div>
          
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Lead Generator AI. All rights reserved.</p>
          
          <div className="mt-4 md:mt-0">
            <select className="bg-gray-800 text-gray-400 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500">
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  )
}