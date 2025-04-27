import { Lead, LeadStatus, PhoneData } from '@/app/types/lead';

/**
 * Converts a PDL person object to our Lead model
 */
export function pdlPersonToLead(person: any): Lead {
  const email = person.emails && person.emails.length > 0 
    ? person.emails[0].address 
    : '';
    
  const lead: Lead = {
    first_name: person.name?.first || '',
    last_name: person.name?.last || '',
    email: email,
    position: person.job_title || null,
    company: person.company?.name || person.job_company_name || '',
    domain: person.company?.website || person.job_company_website || '',
    status: 'unverified' as LeadStatus,
    company_data: {
      name: person.company?.name || person.job_company_name || '',
      industry: person.company?.industry || person.job_company_industry || '',
      size: person.company?.size?.toString() || person.job_company_employee_count?.toString() || '',
      location: {
        country: person.location_country || person.location?.country || '',
        locality: person.location_locality || person.location?.locality || ''
      },
      linkedin_url: person.company?.linkedin_url
    },
    profile_data: {
      summary: person.summary || '',
      experiences: person.experience?.map((exp: any) => ({
        company: exp.company?.name || '',
        title: exp.title || '',
        duration: `${exp.start_date || ''} - ${exp.end_date || 'Present'}`
      })) || [],
      education: person.education?.map((edu: any) => ({
        school: edu.school?.name || '',
        degree: edu.degree?.name || ''
      })) || []
    },
    linkedin_url: person.linkedin_url || null
  };
  
  // Add phone info if available
  if (person.phone_numbers && person.phone_numbers.length > 0) {
    lead.phone_number = person.phone_numbers[0];
    
    // Use the PhoneData structure consistently with Apollo implementation
    lead.phone_data = {
      type: 'unknown',
      country_code: '',
      verified: false,
      source: 'pdl'
    };
  } else if (person.phones && person.phones.length > 0) {
    lead.phone_number = person.phones[0].number;
    
    // Use the PhoneData structure consistently with Apollo implementation
    lead.phone_data = {
      type: 'unknown',
      country_code: '',
      verified: false,
      source: 'pdl'
    };
  } else if (person.phone) {
    // Handle the phone property we added in pdlService.ts
    lead.phone_number = person.phone;
    
    // Use the PhoneData structure consistently with Apollo implementation
    lead.phone_data = {
      type: 'unknown',
      country_code: '',
      verified: false,
      source: 'pdl'
    };
  }
  
  return lead;
}
