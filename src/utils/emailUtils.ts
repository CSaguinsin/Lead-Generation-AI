/**
 * Utility functions for email generation and validation
 */

import axios from 'axios';

/**
 * Common email domain patterns by industry
 */
const COMMON_EMAIL_FORMATS: {[key: string]: string[]} = {
  default: [
    '{first}.{last}@{domain}',
    '{first}{last}@{domain}',
    '{first}@{domain}',
    '{f}{last}@{domain}',
    '{last}@{domain}',
    '{first}-{last}@{domain}',
    '{first}_{last}@{domain}'
  ],
  tech: [
    '{first}.{last}@{domain}',
    '{first}@{domain}',
    '{f}{last}@{domain}',
    '{first}{last}@{domain}'
  ],
  finance: [
    '{first}.{last}@{domain}',
    '{f}{last}@{domain}',
    '{first}.{l}@{domain}'
  ],
  retail: [
    '{first}.{last}@{domain}',
    '{first}{last}@{domain}',
    '{first}@{domain}'
  ],
  healthcare: [
    '{first}.{last}@{domain}',
    '{f}{last}@{domain}',
    '{last}.{first}@{domain}'
  ],
  education: [
    '{first}.{last}@{domain}',
    '{last}@{domain}',
    '{f}{last}@{domain}'
  ],
  government: [
    '{first}.{last}@{domain}',
    '{last}.{first}@{domain}',
    '{first}_{last}@{domain}'
  ]
};

/**
 * Industry keywords for categorizing companies
 */
const INDUSTRY_KEYWORDS = {
  tech: ['tech', 'software', 'it', 'digital', 'cyber', 'computer', 'data', 'web', 'internet', 'cloud'],
  finance: ['bank', 'financ', 'invest', 'capital', 'wealth', 'fund', 'asset', 'insur', 'credit', 'loan', 'mortgage'],
  retail: ['retail', 'shop', 'store', 'market', 'ecommerce', 'commerce', 'consumer', 'product', 'brand', 'goods'],
  healthcare: ['health', 'hospital', 'clinic', 'medical', 'pharma', 'care', 'wellness', 'therapy', 'bio'],
  education: ['edu', 'school', 'college', 'university', 'academy', 'institute', 'teaching', 'learn'],
  government: ['gov', 'public', 'state', 'federal', 'county', 'city', 'municipal', 'administration']
};

/**
 * Top level domains by country and industry
 */
const TLD_PATTERNS: {[key: string]: string[] | {[key: string]: string[]}} = {
  default: ['com', 'org', 'net', 'io', 'co', 'ai'],
  education: ['edu', 'org', 'com', 'net'],
  government: ['gov', 'us', 'org'],
  nonprofit: ['org', 'ngo', 'net'],
  tech: ['io', 'ai', 'tech', 'com', 'co'],
  countries: {
    us: ['com', 'net', 'org', 'us'],
    uk: ['co.uk', 'uk', 'org.uk'],
    ca: ['ca', 'com', 'org'],
    au: ['com.au', 'au', 'org.au'],
    de: ['de', 'com', 'net'],
    fr: ['fr', 'com', 'net'],
    jp: ['jp', 'co.jp', 'com'],
    cn: ['cn', 'com.cn'],
    in: ['in', 'co.in', 'com']
  }
};

/**
 * Try to guess the industry based on company name or other info
 */
function guessIndustry(companyName: string, jobTitle?: string): string {
  companyName = companyName.toLowerCase();
  const additionalInfo = (jobTitle || '').toLowerCase();
  
  // Check each industry's keywords
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (companyName.includes(keyword) || additionalInfo.includes(keyword)) {
        return industry;
      }
    }
  }
  
  return 'default';
}

/**
 * Clean and normalize domain
 */
function normalizeDomain(domain: string): string {
  // Remove any @ prefix
  if (domain.startsWith('@')) {
    domain = domain.substring(1);
  }
  
  // Ensure we have a valid domain extension
  if (!domain.includes('.')) {
    domain += '.com';
  }
  
  return domain.toLowerCase();
}

/**
 * Check if a domain exists by looking up its DNS records
 * Not 100% accurate but helps filter obvious bad domains
 */
export async function validateDomain(domain: string): Promise<boolean> {
  try {
    // Try to get domain information
    const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=MX`);
    return response.data && response.data.Status === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Format a company name to a likely domain
 * e.g. "Google Inc." -> "google.com"
 */
export function companyNameToDomain(companyName: string): string {
  if (!companyName) return '';
  
  // Clean and normalize
  let domain = companyName.toLowerCase().trim();
  
  // Remove common company type indicators and other terms - simpler approach
  domain = domain
    .replace(/inc\.?|llc|ltd\.?|corporation|corp\.?|company|co\.?/gi, '')
    .replace(/limited|group|holdings|international|intl/gi, '')
    .replace(/technologies|technology|tech|solutions|services/gi, '')
    .replace(/of america|usa|us|na|north america|worldwide|global/gi, '')
    .replace(/systems|\.|\(|\)|\"|\'|®|™|&/g, '')
    .replace(/,/g, '');
  
  // Replace special characters and extra spaces with empty string
  domain = domain.replace(/[^a-z0-9 ]/g, '').trim();
  domain = domain.replace(/\s+/g, '');
  
  // Add .com extension if domain isn't empty
  if (domain) {
    domain = domain + '.com';
  }
  
  return domain;
}

/**
 * Replace placeholders in email format template
 */
function applyEmailFormat(
  format: string, 
  firstName: string, 
  lastName: string, 
  domain: string
): string {
  const firstInitial = firstName.charAt(0);
  const lastInitial = lastName.charAt(0);
  
  return format
    .replace('{first}', firstName)
    .replace('{last}', lastName)
    .replace('{f}', firstInitial)
    .replace('{l}', lastInitial)
    .replace('{domain}', domain);
}

/**
 * Generate potential email formats for a person based on name and company domain
 */
export function generatePossibleEmails(
  firstName: string,
  lastName: string,
  domain: string,
  industry?: string
): string[] {
  if (!firstName || !lastName || !domain) {
    return [];
  }
  
  // Clean and normalize inputs
  firstName = firstName.toLowerCase().trim();
  lastName = lastName.toLowerCase().trim();
  
  // Remove any non-alphanumeric characters
  firstName = firstName.replace(/[^a-z0-9]/g, '');
  lastName = lastName.replace(/[^a-z0-9]/g, '');
  
  // Normalize domain
  domain = normalizeDomain(domain);
  
  // If industry not provided, try to guess from domain
  if (!industry) {
    industry = guessIndustry(domain);
  }
  
  // Get appropriate formats for this industry or use default
  const formats = COMMON_EMAIL_FORMATS[industry] || COMMON_EMAIL_FORMATS.default;
  
  // Generate emails using the formats
  const emails = formats.map(format => applyEmailFormat(format, firstName, lastName, domain));
  
  // Remove duplicates and return
  return [...new Set(emails)];
}

/**
 * Check if an email format is valid
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
}

/**
 * Score the likelihood of an email format being correct
 * Higher score = more likely to be correct
 */
export function scoreEmailLikelihood(
  email: string, 
  firstName: string,
  lastName: string,
  companyDomain: string,
  industry?: string
): number {
  if (!isValidEmailFormat(email)) return 0;
  
  let score = 0;
  const lowerEmail = email.toLowerCase();
  const firstLower = firstName.toLowerCase();
  const lastLower = lastName.toLowerCase();
  
  // Check if email contains parts of the name
  if (lowerEmail.includes(firstLower)) score += 2;
  if (lowerEmail.includes(lastLower)) score += 2;
  if (lowerEmail.includes(firstLower[0])) score += 1;
  
  // Prefer standard formats based on industry
  const industryKey = industry || guessIndustry(companyDomain);
  const industryFormats = COMMON_EMAIL_FORMATS[industryKey] || COMMON_EMAIL_FORMATS.default;
  
  // Give higher scores to industry-specific formats
  const normalizedDomain = normalizeDomain(companyDomain);
  
  industryFormats.forEach((format, index) => {
    const testEmail = applyEmailFormat(format, firstLower, lastLower, normalizedDomain);
    if (lowerEmail === testEmail) {
      // Award more points to formats earlier in the list (more common)
      score += 5 - Math.min(index, 4); 
    }
  });
  
  // Check domain
  if (companyDomain && lowerEmail.endsWith(normalizedDomain)) score += 3;
  
  return score;
}

/**
 * Get the best email guess with confidence score
 */
export function getBestEmailGuess(
  firstName: string,
  lastName: string,
  companyName: string,
  jobTitle?: string
): { email: string; confidence: number } {
  if (!firstName || !lastName || !companyName) {
    return { email: '', confidence: 0 };
  }
  
  // Try to determine industry
  const industry = guessIndustry(companyName, jobTitle);
  const domain = companyNameToDomain(companyName);
  
  // Generate possible emails with industry context
  const possibleEmails = generatePossibleEmails(firstName, lastName, domain, industry);
  
  let bestEmail = '';
  let bestScore = 0;
  
  possibleEmails.forEach(email => {
    const score = scoreEmailLikelihood(email, firstName, lastName, domain, industry);
    if (score > bestScore) {
      bestScore = score;
      bestEmail = email;
    }
  });
  
  // Convert score to confidence percentage
  const confidence = Math.min(bestScore / 12, 1); // Max score is around 12
  
  return {
    email: bestEmail,
    confidence
  };
}
