"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Mail, Building, Users, Search, Database, Shield } from "lucide-react"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function Features() {
  // For client-side rendering
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Feature data
  const featureData = [
    {
      icon: <Mail className="h-5 w-5 text-white" />,
      title: "Email Finder",
      description:
        "Find verified email addresses of professionals and businesses with our powerful search algorithm.",
    },
    {
      icon: <Building className="h-5 w-5 text-white" />,
      title: "Company Information",
      description: "Gather detailed company information including size, industry, location, and more.",
    },
    {
      icon: <Users className="h-5 w-5 text-white" />,
      title: "Lead Organization",
      description: "Organize your leads into custom lists and segments for targeted outreach campaigns.",
    },
    {
      icon: <Search className="h-5 w-5 text-white" />,
      title: "Advanced Search",
      description: "Filter leads by job title, industry, location, company size, and more.",
    },
    {
      icon: <Database className="h-5 w-5 text-white" />,
      title: "Data Enrichment",
      description: "Automatically enrich your existing contacts with additional information.",
    },
    {
      icon: <Shield className="h-5 w-5 text-white" />,
      title: "Data Verification",
      description: "Ensure your contact data is accurate and up-to-date with our verification system.",
    },
  ]

  return (
    <section id="features" className="py-24 relative bg-gray-50">
      {/* Top curvy separator */}
      <div className="absolute top-0 left-0 right-0 h-16">
        <svg className="absolute bottom-0 fill-current text-white w-full h-16" viewBox="0 0 1440 48" preserveAspectRatio="none">
          <path d="M0,48 C480,0 960,0 1440,48 L1440,0 L0,0 Z"></path>
        </svg>
      </div>
      
      <div className="container mx-auto px-4 pt-8">
        {/* Header with Orange Bar */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="relative max-w-3xl mx-auto mb-20 text-center"
        >
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-orange-500"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Powerful Features</h2>
          <p className="text-lg text-gray-600">
            Everything you need to discover, enrich, and organize your business contacts
          </p>
        </motion.div>
        
        {/* Features in cards layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureData.map((feature, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={slideUp}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              {/* Card with shadow on hover */}
              <div className="h-full bg-white rounded-lg p-6 transition-all duration-300 group-hover:shadow-xl flex flex-col">
                {/* Icon with background */}
                <div className="mb-6 flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mr-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                
                <p className="text-gray-600 mt-2 flex-grow">{feature.description}</p>
                
                {/* Bottom indicator */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="w-8 h-1 bg-orange-500 rounded-full group-hover:w-12 transition-all duration-300"></div>
                  <span className="text-xs font-medium text-gray-400">0{i + 1}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
      
      {/* Bottom curvy separator */}
      <div className="absolute bottom-0 left-0 right-0 h-16">
        <svg className="absolute top-0 fill-current text-white w-full h-16" viewBox="0 0 1440 48" preserveAspectRatio="none">
          <path d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z"></path>
        </svg>
      </div>
    </section>
  )
}