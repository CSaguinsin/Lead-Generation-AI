"use client"

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Building, Mail, ChevronRight, ArrowRight, Database, 
  Sparkles, Zap, Layers, Globe, Target, CheckCircle, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HeroSection() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hoverCard, setHoverCard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Mock data to simulate People Data Labs results
  const mockResults = [
    { name: "Sarah Johnson", title: "VP of Marketing", company: "TechGrowth Inc.", image: "/avatar1.png" },
    { name: "Michael Chen", title: "Sales Director", company: "Innovate Solutions", image: "/avatar2.png" },
    { name: "Priya Sharma", title: "Head of Operations", company: "Global Ventures", image: "/avatar3.png" }
  ];
  
  useEffect(() => {
    // Mark that we're now on the client side
    setIsClient(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useEffect(() => {
    // Auto-rotate features every 4 seconds
    const interval = setInterval(() => {
      
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      const elements = container.querySelectorAll('.parallax-element');
      elements.forEach((el) => {
        const speed = parseFloat((el as HTMLElement).dataset.speed || '5');
        const moveX = x * speed;
        const moveY = y * speed;
        (el as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isClient]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate API call to People Data Labs
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1500);
  };
  


  const cards = [
    {
      id: 0,
      title: "AI-Powered Search",
      description: "Find the perfect leads with intelligent filtering",
      icon: <Target className="w-5 h-5" />,
      color: "bg-gradient-to-br from-orange-500/90 to-amber-600/90"
    },
    {
      id: 1,
      title: "Verified Data",
      description: "Access accurate, up-to-date contact information",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-gradient-to-br from-amber-500/90 to-orange-600/90"
    },
    {
      id: 2,
      title: "Global Reach",
      description: "Connect with professionals across industries worldwide",
      icon: <Globe className="w-5 h-5" />,
      color: "bg-gradient-to-br from-orange-400/90 to-amber-500/90"
    }
  ];

  const tabs = [
    { 
      id: 0, 
      title: "Sales Leaders", 
      icon: <Briefcase className="w-4 h-4 mr-2" />,
      placeholder: "Search for VPs of Sales, Sales Directors..."
    },
    { 
      id: 1, 
      title: "Tech Executives", 
      icon: <Layers className="w-4 h-4 mr-2" />,
      placeholder: "Search for CTOs, Engineering Directors..."
    },
    { 
      id: 2, 
      title: "Marketing Pros", 
      icon: <Target className="w-4 h-4 mr-2" />,
      placeholder: "Search for CMOs, Marketing Managers..."
    }
  ];

  // Generate random positions for data points
  const generateDataPoints = () => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.3,
      size: 1 + Math.random() * 2,
      type: i % 3
    }));
  };
  
  // Only generate data points on the client side
  const [dataPoints, setDataPoints] = useState<Array<{id: number, x: number, y: number, opacity: number, size: number, type: number}>>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDataPoints(generateDataPoints());
    }
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative pt-20 min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {/* Asymmetric grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_40%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(251,191,36,0.1),transparent_40%)]"></div>
          <svg className="w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"></path>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)"></rect>
          </svg>
        </div>
        
        {/* Animated data points */}
        {isClient && (
          <div className="absolute inset-0 overflow-hidden">
            {dataPoints.map((point) => (
              <motion.div
                key={point.id}
                initial={{ 
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  opacity: point.opacity,
                  width: `${point.size}px`,
                  height: `${point.size}px`
                }}
                animate={{ 
                  left: [`${point.x}%`, `${(point.x + (Math.random() * 10) - 5) % 100}%`],
                  top: [`${point.y}%`, `${(point.y + (Math.random() * 10) - 5) % 100}%`],
                  opacity: [point.opacity, point.opacity * 1.5, point.opacity]
                }}
                transition={{ 
                  duration: 10 + Math.random() * 20, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className={`absolute rounded-full ${
                  point.type === 0 ? 'bg-orange-400' : point.type === 1 ? 'bg-amber-400' : 'bg-orange-500'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Glowing orbs */}
        <div className="absolute top-1/3 left-1/5 w-72 h-72 bg-orange-500 rounded-full filter blur-[150px] opacity-10 parallax-element" data-speed="3"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500 rounded-full filter blur-[180px] opacity-10 parallax-element" data-speed="5"></div>
        <div className="absolute top-2/3 left-2/3 w-64 h-64 bg-orange-400 rounded-full filter blur-[120px] opacity-10 parallax-element" data-speed="4"></div>
      </div>
      
      <div className="relative z-10 h-full">
        {/* Floating badge */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur-sm border border-orange-500/20 shadow-lg">
            <Zap className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium mr-2">AI Powered</span>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">
              Leads Generator
            </span>
            <Sparkles className="w-4 h-4 ml-2 text-amber-400" />
          </div>
        </motion.div>
        
        {/* Main hero content - Split layout */}
        <div className="container mx-auto pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left column - Text content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6 px-4 lg:px-8"
            >
              <div className="max-w-xl">
                <div className="mb-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-sm mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500 font-medium">
                      People Data Labs Integration
                    </span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="block">Find and connect with</span>
                    <div className="relative inline-block mt-2">
                      <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                        perfect leads
                      </span>
                      <motion.div 
                        className="absolute -bottom-2 left-0 h-3 w-full bg-orange-500/30 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    </div>
                    <span className="block mt-2">in seconds</span>
                  </h1>
                </div>
                
                <p className="text-xl text-gray-300 mb-8">
                  Our AI platform leverages People Data Labs to discover and enrich business contacts with unparalleled accuracy and depth.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button 
                    onClick={() => router.push('/leads')}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-3 px-6 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span>Start Generating Leads</span>
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const featuresElement = document.getElementById('features');
                      if (featuresElement) {
                        featuresElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-gray-800/60 hover:bg-gray-800/80 backdrop-blur-sm border border-white/10 text-white font-medium py-3 px-6 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span>Learn More</span>
                      <ChevronRight className="ml-1 w-4 h-4" />
                    </div>
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 px-6 rounded-xl bg-gray-900/40 backdrop-blur-sm border border-white/5">
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">2B+</div>
                    <div className="text-sm text-gray-400">Profiles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">150M+</div>
                    <div className="text-sm text-gray-400">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">99%</div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Right column - Interactive search */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 px-4"
            >
              <div className="relative mx-auto max-w-xl">
                {/* Floating elements */}
                <motion.div 
                  className="absolute -top-12 -right-8 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl backdrop-blur-sm border border-white/10 flex items-center justify-center parallax-element"
                  data-speed="2"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Users className="w-10 h-10 text-orange-400" />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl backdrop-blur-sm border border-white/10 flex items-center justify-center parallax-element"
                  data-speed="3"
                  animate={{ 
                    y: [0, 10, 0],
                    rotate: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Database className="w-8 h-8 text-amber-400" />
                </motion.div>
                
                {/* Search card */}
                <div className="relative z-10 backdrop-blur-lg rounded-2xl p-6 bg-gradient-to-r from-gray-900/80 to-gray-800/80 shadow-2xl border border-white/10">
                  {/* Tabs */}
                  <div className="flex mb-6 bg-gray-800/50 rounded-lg p-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium flex-1 transition-all duration-200 ${
                          activeTab === tab.id 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.title}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Search form */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tabs[activeTab].placeholder}
                        className="block w-full pl-10 pr-4 py-3 bg-gray-900/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-gray-700"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="Company"
                          className="block w-full pl-10 pr-4 py-2.5 bg-gray-900/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-gray-700 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="Location"
                          className="block w-full pl-10 pr-4 py-2.5 bg-gray-900/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-gray-700 text-sm"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-3 px-4 rounded-lg"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          <span>Searching People Data Labs...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Find Leads</span>
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </div>
                      )}
                    </Button>
                  </form>
                  
                  {/* Results preview */}
                  <AnimatePresence>
                    {showResults && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-gray-800">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium text-gray-300">Results from People Data Labs</h3>
                            <span className="text-xs text-orange-400">200+ matches found</span>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            {mockResults.map((result, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center p-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                              >
                                <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                  {result.image ? (
                                    <Image src={result.image} alt={result.name} width={40} height={40} className="object-cover" />
                                  ) : (
                                    <span className="text-lg font-medium text-orange-400">{result.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-white">{result.name}</h4>
                                  <p className="text-sm text-gray-400">{result.title} • {result.company}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                              </motion.div>
                            ))}
                          </div>
                          
                          <Button 
                            onClick={() => router.push('/leads')}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg border border-gray-700"
                          >
                            View All 200+ Results
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Feature cards section */}
        <div id="features" className="container mx-auto py-16 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Our platform combines AI with People Data Labs to deliver accurate, comprehensive lead data
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="relative h-full overflow-hidden rounded-2xl backdrop-blur-sm border border-white/10 bg-gray-900/60 p-6 flex flex-col">
                  <div className={`p-4 rounded-xl w-fit mb-5 ${card.color} bg-opacity-20`}>
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-gray-300 mb-5">{card.description}</p>
                  <div className="mt-auto">
                    <div className="inline-flex items-center text-sm font-medium text-orange-400 group-hover:text-orange-300 transition-colors">
                      Learn more
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        

        
        {/* Add custom CSS for styling */}
        <style jsx global>{`
          .perspective-1000 {
            perspective: 1000px;
          }
        `}</style>
      </div>
    </section>
  );
}