// services/leadEnrichment.ts
import { findEmail } from "@/lib/api/hunter";
import { verifyEmail } from "@/lib/api/abstract";
import { getCompanyData } from "@/lib/api/pdl";
import { getLinkedInProfile } from "@/lib/api/proxycurl";
import { EnrichedLead } from "@/app/types/lead";

export async function enrichLead(
  firstName: string,
  lastName: string,
  domain: string,
  companyName?: string
): Promise<EnrichedLead> {
  // Step 1: Find email address
  const emailData = await findEmail(firstName, lastName, domain, companyName);
  
  // Step 2: Verify email quality
  const emailQuality = await verifyEmail(emailData.email);

  // Step 3: Get company data
  const companyData = await getCompanyData(domain);

  // Step 4: Get LinkedIn profile if available
  let profileData;
  if (emailData.linkedin_url) {
    try {
      profileData = await getLinkedInProfile(emailData.linkedin_url);
    } catch (error) {
      console.error('LinkedIn profile enrichment failed:', error);
    }
  }

  return {
    contact: {
      firstName,
      lastName,
      email: emailData.email,
      position: emailData.position ?? undefined, // Convert null to undefined
      emailQuality,
      linkedinUrl: emailData.linkedin_url ?? undefined // Convert null to undefined
    },
    company: {
      name: companyData.name || companyName || '',
      domain,
      industry: companyData.industry,
      size: companyData.size,
      location: companyData.location
    },
    profile: profileData
  };
}