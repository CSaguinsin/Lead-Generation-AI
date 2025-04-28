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
  
  // Get the current user from the auth session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session || !session.user) {
    return null;
  }
  
  // Fetch the user's profile from the user_clients table
  // In our simplified system, we're using the user's ID directly
  const { data, error } = await supabase
    .from('user_clients')
    .select('id, full_name, email')
    .eq('id', session.user.id)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user profile:', error);
    
    // Try fetching by auth_user_id as fallback (for backward compatibility)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('user_clients')
      .select('id, full_name, email')
      .eq('auth_user_id', session.user.id)
      .single();
      
    if (fallbackError || !fallbackData) {
      console.error('Error fetching user profile (fallback):', fallbackError);
      return null;
    }
    
    return {
      id: fallbackData.id,
      full_name: fallbackData.full_name,
      email: fallbackData.email
    };
  }
  
  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email
  };
}
