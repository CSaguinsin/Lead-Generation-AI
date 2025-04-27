import { Lead, LeadStatus } from '@/app/types/lead';

/**
 * Converts a People Data Labs person object to our application's Lead format
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
    company: person.company?.name || '',
    domain: person.company?.website || '',
    status: 'unverified' as LeadStatus,
    company_data: {
      name: person.company?.name,
      industry: person.company?.industry,
      size: person.company?.size?.toString(),
      location: {
        country: person.location?.country || '',
        locality: person.location?.locality || ''
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
  
  return lead;
}

/**
 * Maps job level selection to PDL-compatible title strings
 */
export const mapJobLevelToTitle = (jobLevel: string): string => {
  const jobLevelMap: Record<string, string> = {
    'c_suite': 'Chief,CEO,CTO,CFO,COO,CMO,CHRO,CIO',
    'vp': 'Vice President,VP,SVP,EVP',
    'director': 'Director,Head of',
    'manager': 'Manager,Lead',
    'senior': 'Senior,Principal,Staff',
    'entry': 'Junior,Associate,Assistant'
  };
  
  return jobLevelMap[jobLevel] || '';
};

/**
 * Maps company size selection to PDL-compatible size range
 */
export const mapCompanySizeToRange = (companySize: string): string => {
  const companyRangeMap: Record<string, string> = {
    '1-10': 'job_company_employee_count:1-10',
    '11-50': 'job_company_employee_count:11-50',
    '51-200': 'job_company_employee_count:51-200', 
    '201-500': 'job_company_employee_count:201-500',
    '501-1000': 'job_company_employee_count:501-1000',
    '1001-5000': 'job_company_employee_count:1001-5000',
    '5001-10000': 'job_company_employee_count:5001-10000',
    '10001+': 'job_company_employee_count:10001-1000000' // Using a large upper bound for 10001+
  };
  
  return companyRangeMap[companySize] || '';
};
