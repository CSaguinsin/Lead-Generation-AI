"use client"

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Building, Mail, ChevronRight, ArrowRight, Database, Sparkles, Zap, Layers, Globe, Target } from "lucide-react";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
      setActiveFeature(prev => (prev + 1) % features.length);
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
  
  const features = [
    {
      id: 0,
      title: "Discover",
      description: "Find decision-makers instantly with our AI-powered search",
      icon: <Search className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
      image: "/discover-tab.png"
    },
    {
      id: 1,
      title: "Enrich",
      description: "Get complete profiles with verified contact information",
      icon: <Database className="w-6 h-6" />,
      color: "from-orange-400 to-amber-500",
      image: "/enrich-tab.png"
    },
    {
      id: 2,
      title: "Connect",
      description: "Reach out with confidence using verified data",
      icon: <Users className="w-6 h-6" />,
      color: "from-amber-500 to-orange-600",
      image: "/connect-tab.png"
    }
  ];

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
      icon: <Layers className="w-5 h-5" />,
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
      className="pt-20 relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white"
    >
      {/* Diagonal divider */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gray-900/0 via-gray-900/0 to-orange-950/20 clip-diagonal"></div>
        <div className="absolute top-0 left-0 w-3/4 h-full bg-gradient-to-tr from-gray-900/0 via-gray-900/0 to-amber-950/10 clip-diagonal-reverse"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"></path>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)"></rect>
          </svg>
        </div>
        
        {/* Animated data points - only rendered on client side */}
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
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500 rounded-full filter blur-[120px] opacity-10 parallax-element" data-speed="3"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-500 rounded-full filter blur-[150px] opacity-10 parallax-element" data-speed="5"></div>
        <div className="absolute top-2/3 left-2/3 w-48 h-48 bg-orange-400 rounded-full filter blur-[100px] opacity-10 parallax-element" data-speed="4"></div>
      </div>
      
      <div className="container mx-auto relative z-10 h-full">
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
        
        <div className="pt-32 pb-20 flex flex-col items-center">
          {/* Central headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-12 px-4"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <div className="relative inline-block">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                  Discover
                </span>
                <motion.div 
                  className="absolute -bottom-2 left-0 h-3 w-full bg-orange-500/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
              <span className="block">the perfect leads</span>
              <span className="block">in seconds</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our AI platform leverages modern technologies with AI to discover and enrich business contacts with unparalleled accuracy.
            </p>
          </motion.div>
          
          {/* Interactive search demo - centered */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-2xl mx-auto relative px-4 mb-16"
          >
            <div className="relative z-10 backdrop-blur-lg rounded-2xl p-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 shadow-xl border border-white/10">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by job title, company, or industry..."
                  className="w-full py-4 px-5 bg-gray-900/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <Button 
                  type="submit" 
                  className="absolute right-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-2 px-4 rounded-lg"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span>Search</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            </div>
            
            {/* Floating search results */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-400">Results from People Data Labs</h3>
                      <button 
                        onClick={() => setShowResults(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
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
                    
                    <div className="mt-3 pt-3 border-t border-gray-800 flex justify-center">
                      <Button 
                        onClick={() => router.push('/leads')}
                        className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 text-white text-sm font-medium py-2 px-4 rounded-lg"
                      >
                        View All Results
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Feature cards - horizontal layout */}
          <div className="w-full px-4 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  onHoverStart={() => setHoverCard(card.id)}
                  onHoverEnd={() => setHoverCard(null)}
                  className="relative overflow-hidden rounded-xl backdrop-blur-sm border border-white/10 h-full"
                >
                  <div className={`absolute inset-0 opacity-80 ${hoverCard === card.id ? 'opacity-100' : 'opacity-80'} transition-opacity duration-300 ${card.color}`}></div>
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="p-3 bg-white/10 rounded-lg w-fit mb-4">
                      {card.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-white/80 mb-4">{card.description}</p>
                    <div className="mt-auto">
                      <div className="inline-flex items-center text-sm font-medium">
                        Learn more
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          {/* Feature showcase with 3D effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="w-full max-w-6xl mx-auto px-4 relative"
          >
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 shadow-2xl">
              {/* Feature content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 p-8 md:p-12 flex flex-col md:flex-row items-center"
                >
                  <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${features[activeFeature].color.replace('to-', 'to-')}/20 backdrop-blur-sm mb-6`}>
                      {features[activeFeature].icon}
                      <span className="ml-2 font-medium">{features[activeFeature].title}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">{features[activeFeature].description}</h3>
                    <p className="text-gray-300 mb-6">
                      Access the most comprehensive B2B data source with our People Data Labs integration. Find and connect with decision-makers across industries.
                    </p>
                    <Button 
                      onClick={() => router.push('/leads')}
                      className={`bg-gradient-to-r ${features[activeFeature].color} text-white font-medium py-2 px-6 rounded-lg`}
                    >
                      Try it now
                    </Button>
                  </div>
                  
                  <div className="md:w-1/2 relative">
                    <div className="relative z-10 transform perspective-1000 rotate-y-[-5deg] hover:rotate-y-0 transition-transform duration-500">
                      <div className="rounded-lg overflow-hidden border border-white/20 shadow-2xl">
                        {features[activeFeature].image && (
                          <Image 
                            src={features[activeFeature].image} 
                            alt={features[activeFeature].title}
                            width={600}
                            height={400}
                            className="w-full h-auto"
                          />
                        )}
                      </div>
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Feature navigation */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {features.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                      activeFeature === index 
                        ? 'bg-gradient-to-r from-orange-400 to-amber-500' 
                        : 'bg-gray-600'
                    }`}
                    aria-label={`View ${feature.title} feature`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Add custom CSS for diagonal clipping */}
      <style jsx global>{`
        .clip-diagonal {
          clip-path: polygon(100% 0, 0% 100%, 100% 100%);
        }
        .clip-diagonal-reverse {
          clip-path: polygon(0 0, 0% 100%, 100% 0);
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-[-5deg] {
          transform: rotateY(-5deg);
        }
        .hover\:rotate-y-0:hover {
          transform: rotateY(0deg);
        }
      `}</style>
    </section>
  );
}