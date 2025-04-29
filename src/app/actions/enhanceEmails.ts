'use server';

import leadGenerationRegistry from '@/services/leadGeneration/serviceRegistry';

/**
 * Define types for our lead data structure
 */
interface LeadData {
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: {
    first?: string;
    last?: string;
  };
  company?: string;
  job_company_name?: string;
  domain?: string;
  email_quality?: {
    guessed?: boolean;
    verified?: boolean;
    confidence?: number;
    deliverable?: boolean;
  };
  [key: string]: unknown;
}

/**
 * Generate a simple email guess based on first name, last name and company
 */
function generateSimpleEmailGuess(firstName: string, lastName: string, company: string): string {
  if (!firstName || !lastName || !company) return '';
  
  // Clean inputs
  firstName = firstName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  lastName = lastName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  // Create simple domain
  let domain = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  if (domain) {
    domain = `@${domain}.com`;
    // Return the most common format
    return `${firstName}.${lastName}${domain}`;
  }
  
  return '';
}

/**
 * Enhance lead data with email guessing when no email is available
 */
export async function guessEmailForLead(lead: LeadData): Promise<{ 
  email: string; 
  confidence: number;
  verified: boolean;
}> {
  try {
    // Skip if lead already has an email
    if (lead.email) {
      return { 
        email: lead.email, 
        confidence: 1.0,
        verified: false 
      };
    }
    
    const firstName = lead.first_name || lead.name?.first || '';
    const lastName = lead.last_name || lead.name?.last || '';
    const company = lead.company || lead.job_company_name || '';
    
    if (!firstName || !lastName || !company) {
      console.log('Missing required data for email guessing');
      return { email: '', confidence: 0, verified: false };
    }
    
    // First try to use Hunter's email finder API
    const hunterService = leadGenerationRegistry.getService('hunter');
    if (hunterService && typeof hunterService.findEmail === 'function') {
      try {
        // Try to get domain from the lead data or derive it from company name
        const domain = lead.domain || company.toLowerCase().replace(/[^a-z0-9]/g, '').trim() + '.com';
        
        if (domain) {
          console.log(`Using Hunter to find email for ${firstName} ${lastName} at ${domain}`);
          const hunterResult = await hunterService.findEmail(firstName, lastName, domain);
          
          if (hunterResult.email) {
            console.log(`Hunter found email: ${hunterResult.email} with score: ${hunterResult.score}`);
            return {
              email: hunterResult.email,
              confidence: hunterResult.score / 100, // Convert Hunter score (0-100) to our format (0-1)
              verified: hunterResult.verified
            };
          }
        }
      } catch (error) {
        console.error('Error finding email with Hunter:', error);
        // Continue to fallback method
      }
    }
    
    // Fallback to simple email generation
    console.log(`Using simple algorithm to guess email for ${firstName} ${lastName} at ${company}`);
    const email = generateSimpleEmailGuess(firstName, lastName, company);
    
    return {
      email: email,
      confidence: email ? 0.5 : 0, // Medium confidence for guessed emails
      verified: false
    };
  } catch (error) {
    console.error('Error guessing email:', error);
    return { email: '', confidence: 0, verified: false };
  }
}

/**
 * Verify an email address with Hunter.io
 */
export async function verifyEmail(email: string): Promise<{ 
  isValid: boolean; 
  score: number;
  status: string; 
}> {
  try {
    if (!email) {
      return { isValid: false, score: 0, status: 'invalid' };
    }
    
    const hunterService = leadGenerationRegistry.getService('hunter');
    if (!hunterService || typeof hunterService.verify !== 'function') {
      return { isValid: false, score: 0, status: 'service_unavailable' };
    }
    
    const result = await hunterService.verify(email);
    return {
      isValid: result.isValid,
      score: result.score,
      status: result.status
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { isValid: false, score: 0, status: 'error' };
  }
}

/**
 * Process a batch of leads to add or verify emails
 */
export async function enhanceLeadsWithEmails(leads: LeadData[]): Promise<LeadData[]> {
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return [];
  }
  
  // Process leads in parallel with simple error handling
  const enhancedLeadsPromises = leads.map(async (lead) => {
    try {
      // Skip leads that already have emails
      if (lead.email) {
        return lead;
      }
      
      // Try to guess email
      const guessResult = await guessEmailForLead(lead);
      
      if (guessResult.email) {
        return {
          ...lead,
          email: guessResult.email,
          email_quality: {
            guessed: !guessResult.verified,
            verified: guessResult.verified,
            confidence: guessResult.confidence,
            deliverable: guessResult.verified
          }
        };
      }
      
      return lead;
    } catch (error) {
      console.error('Error enhancing lead:', error);
      return lead;
    }
  });
  
  return Promise.all(enhancedLeadsPromises);
}
