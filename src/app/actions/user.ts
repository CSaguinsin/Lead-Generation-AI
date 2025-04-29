'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  // Get the user ID from the cookie instead of using Supabase Auth
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    return null;
  }
  
  // Fetch the user's profile from the user_clients table using the cookie user ID
  const { data, error } = await supabase
    .from('user_clients')
    .select('id, full_name, email')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email
  };
}
