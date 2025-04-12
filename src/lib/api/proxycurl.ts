import axios from 'axios';

interface ProxycurlProfile {
  full_name: string;
  occupation: string;
  headline: string;
  summary: string;
  experiences: Array<{
    company: string;
    title: string;
    duration: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
  }>;
  // Add other relevant fields
}

export async function getLinkedInProfile(
  profileUrl: string
): Promise<ProxycurlProfile> {
  try {
    const response = await axios.get<ProxycurlProfile>(
      'https://nubela.co/proxycurl/api/v2/linkedin',
      {
        params: {
          url: profileUrl,
          use_cache: 'if-present',
        },
        headers: {
          Authorization: `Bearer ${process.env.PROXYCURL_API_KEY as string}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Proxycurl API Error:', error);
    throw new Error(
      axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to fetch LinkedIn profile'
        : 'Failed to fetch LinkedIn profile'
    );
  }
}