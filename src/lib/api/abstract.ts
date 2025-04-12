import axios from 'axios';

interface AbstractEmailResponse {
  deliverability: string;
  quality_score: string;
  is_valid_format: {
    value: boolean;
    text: string;
  };
  // Add other relevant fields from the API response
}

interface AbstractErrorResponse {
  error?: {
    message: string;
    code: number;
  };
}

export async function verifyEmail(email: string): Promise<{
  deliverable: boolean;
  quality_score: string;
  is_valid_format: boolean;
}> {
  try {
    const response = await axios.get<AbstractEmailResponse>(
      'https://emailvalidation.abstractapi.com/v1/',
      {
        params: {
          api_key: process.env.ABSTRACT_API_KEY,
          email,
        },
      }
    );

    return {
      deliverable: response.data.deliverability === 'DELIVERABLE',
      quality_score: response.data.quality_score,
      is_valid_format: response.data.is_valid_format.value,
    };
  } catch (error) {
    console.error('Abstract API Error:', error);
    throw new Error(
      axios.isAxiosError<AbstractErrorResponse>(error)
        ? error.response?.data?.error?.message || 'Failed to verify email'
        : 'Failed to verify email'
    );
  }
}