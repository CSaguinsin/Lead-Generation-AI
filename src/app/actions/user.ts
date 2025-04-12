'use server';

import { createClient } from '@/utils/supabase/server';

export type UserProfile = {
  full_name: string;
  email: string;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  // Get the current user from the auth session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Fetch the user's profile from the user_clients table
  const { data, error } = await supabase
    .from('user_clients')
    .select('full_name, email')
    .eq('auth_user_id', user.id)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return {
    full_name: data.full_name,
    email: data.email
  };
}
