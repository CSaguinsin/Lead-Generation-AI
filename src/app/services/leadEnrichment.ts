// services/leadEnrichment.ts
import { findEmail } from "@/lib/api/hunter";
import { verifyEmail } from "@/lib/api/abstract";
import { getCompanyData, findPersonWithPDL } from "@/lib/api/pdl";
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
      // First try to get LinkedIn profile data from PDL
      const pdlPersonData = await findPersonWithPDL({
        firstName,
        lastName,
        company: companyName,
        email: emailData.email,
        linkedin_url: emailData.linkedin_url
      });
      
      if (pdlPersonData && (pdlPersonData.experience || pdlPersonData.education)) {
        // Transform PDL data to match our profile structure
        profileData = {
          summary: pdlPersonData.summary || '',
          experiences: pdlPersonData.experience?.map((exp: any) => ({
            company: exp.company?.name || '',
            title: exp.title || '',
            duration: `${exp.start_date || ''} - ${exp.end_date || 'Present'}`
          })) || [],
          education: pdlPersonData.education?.map((edu: any) => ({
            school: edu.school?.name || '',
            degree: edu.degree?.name || ''
          })) || []
        };
      } else {
        // Fallback to Proxycurl if PDL doesn't have profile data
        profileData = await getLinkedInProfile(emailData.linkedin_url);
      }
    } catch (error) {
      console.error('LinkedIn profile enrichment failed:', error);
      // Try Proxycurl as fallback if PDL fails
      try {
        profileData = await getLinkedInProfile(emailData.linkedin_url);
      } catch (fallbackError) {
        console.error('Fallback LinkedIn profile enrichment failed:', fallbackError);
      }
    }
  }

  // Step 5: Find phone number using PDL instead of Apollo
  let phoneData = null;
  try {
    const pdlPersonData = await findPersonWithPDL({
      firstName,
      lastName,
      company: companyName,
      email: emailData.email,
      domain
    });
    
    if (pdlPersonData?.phone) {
      phoneData = {
        number: pdlPersonData.phone,
        phone_data: {
          type: 'unknown',
          country_code: '',
          verified: false,
          source: 'pdl'
        }
      };
    }
  } catch (error) {
    console.error('Phone number discovery with PDL failed:', error);
  }

  return {
    contact: {
      firstName,
      lastName,
      email: emailData.email,
      position: emailData.position ?? undefined,
      emailQuality,
      linkedinUrl: emailData.linkedin_url ?? undefined,
      phoneNumber: phoneData?.number,
      phoneType: phoneData?.phone_data?.type,
      phoneCountry: phoneData?.phone_data?.country_code
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