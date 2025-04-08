"use client"

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Users, Building, Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Use refs to store the particle positions
  const particlesRef = useRef<Array<{x: number, y: number, shade: string}>>([]);
  
  useEffect(() => {
    // Mark that we're now on the client
    setIsClient(true);
    
    // Generate particles once on client-side
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: Math.random() * 500 - 250,
          y: Math.random() * 300 + 200,
          // Use consistent shade values that match Tailwind classes
          shade: ['300', '400', '500'][Math.floor(Math.random() * 3)]
        });
      }
    }
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: custom * 0.1 }
    })
  };

  const features = [
    { icon: <Users className="w-5 h-5 text-orange-500" />, label: "10M+ Business contacts" },
    { icon: <Building className="w-5 h-5 text-orange-500" />, label: "AI-powered lead scoring" },
    { icon: <Mail className="w-5 h-5 text-orange-500" />, label: "Verified email addresses" }
  ];

  return (
    <section className="relative pt-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,107,0,0.15),transparent_50%)]"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-500 rounded-full filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500 rounded-full filter blur-[120px] opacity-10"></div>
        <div className="absolute inset-0 bg-[url('/api/placeholder/1500/800')] opacity-5 mix-blend-overlay bg-fixed"></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-screen py-16">
          
          {/* Left content area (spans 5 columns on medium+ screens) */}
          <div className="md:col-span-5 md:col-start-2 space-y-8 px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div 
                variants={fadeIn} 
                custom={0}
                className="inline-flex items-center px-3 py-1 rounded-full bg-orange-900/30 text-orange-400 text-sm font-medium border border-orange-700/50"
              >
                <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
                Introducing AI Contact Discovery
              </motion.div>
              
              <motion.h1 
                variants={fadeIn} 
                custom={1}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Reimagine</span> how you connect with business leads
              </motion.h1>
              
              <motion.p 
                variants={fadeIn} 
                custom={2}
                className="text-xl text-gray-300 max-w-lg"
              >
                Our AI platform discovers and enriches business contacts with unparalleled accuracy, giving your sales team the edge they need.
              </motion.p>
              
              <motion.div 
                variants={fadeIn} 
                custom={3}
                className="flex flex-wrap gap-4 pt-4"
              >
                <Button 
                  className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all text-lg"
                >
                  Get started <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline"
                  className="h-14 px-8 bg-transparent border-gray-600 text-white hover:bg-gray-800 font-medium rounded-lg transition-all text-lg"
                >
                  Watch demo
                </Button>
              </motion.div>
              
              <motion.div
                variants={fadeIn}
                custom={4}
                className="pt-12"
              >
                <p className="text-sm text-gray-400 mb-6">Trusted by sales teams at companies like:</p>
                <div className="flex flex-wrap gap-8 items-center">
                  <div className="h-8 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <img src="/api/placeholder/120/32" alt="Company logo" className="h-full w-auto invert" />
                  </div>
                  <div className="h-8 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <img src="/api/placeholder/120/32" alt="Company logo" className="h-full w-auto invert" />
                  </div>
                  <div className="h-8 w-auto opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <img src="/api/placeholder/120/32" alt="Company logo" className="h-full w-auto invert" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Right side: Interactive feature showcase (spans 6 columns on medium+ screens) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="md:col-span-6 px-4 relative"
          >
            {/* Central 3D-like dashboard */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="relative z-20"
            >
                            {/* Floating feature cards */}
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, y: (index - 1) * 30 }}
                animate={{ opacity: 1, x: 0, y: (index - 1) * 30 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
                className={`absolute ${
                  index === 0 ? 'top-16 -left-8' : 
                  index === 1 ? 'top-1/3 -right-8' : 
                  'bottom-1/4 -left-8'
                } bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-4 flex items-center space-x-4 border border-gray-700/70 z-10 max-w-xs`}
              >
                <div className="bg-gray-900/70 p-3 rounded-full">
                  {feature.icon}
                </div>
                <div>
                  <p className="font-medium text-white">{feature.label}</p>
                </div>
              </motion.div>
            ))}
              <div className="perspective-1000">
                <div className="relative transform-gpu rotateX-5 rounded-xl shadow-2xl overflow-hidden border border-gray-700/50 bg-gradient-to-b from-gray-800 to-gray-900">
                  {/* Dashboard header */}
                  <div className="h-12 bg-gray-800/80 border-b border-gray-700/50 flex items-center px-5">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-sm text-gray-400">AI Contact Enrichment Dashboard</div>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="p-4">
                    <img
                      src="/anotherpost.png"
                      alt="AI Contact Enrichment Dashboard"
                      className="w-full h-auto rounded-lg border border-gray-700/50"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
        
            
            {/* Data particles effect - Only render on client side to avoid hydration mismatch */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {isClient && particlesRef.current.map((particle, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0.3, 
                    y: particle.y,
                    x: particle.x
                  }}
                  animate={{ 
                    opacity: [0.2, 0.8, 0.2],
                    y: -100,
                    x: Math.random() * 50 - 25 + particle.x / 2
                  }}
                  transition={{ 
                    duration: 8 + (i % 5) * 2,
                    repeat: Infinity,
                    delay: i * 0.25
                  }}
                  className={`absolute w-1 h-1 rounded-full bg-orange-${particle.shade}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Wave divider to next section */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="fill-white w-full h-16">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,140.83,141.14,213.34,139.15,300.5,136.78,262.44,67.64,321.39,56.44Z" />
        </svg>
      </div>
    </section>
  );
}