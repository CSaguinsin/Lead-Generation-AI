'use server';

import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
};

/**
 * Registers a new user
 */
export async function registerUser(email: string, password: string, fullName: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = await createClient();

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('user_clients')
    .select('email')
    .eq('email', email)
    .single();

  if (existingUser) {
    return { user: null, error: 'User with this email already exists' };
  }

  if (checkError && checkError.code !== 'PGRST116') {
    return { user: null, error: checkError.message };
  }

  // Generate a unique ID for the user
  const userId = uuidv4();

  // Create user directly in user_clients table
  const { error: insertError } = await supabase
    .from('user_clients')
    .insert({
      id: userId,
      email: email,
      full_name: fullName,
      password: password, // Note: In a production app, this should be hashed
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    return { user: null, error: insertError.message };
  }

  // Create a new auth user
  const authUser: AuthUser = {
    id: userId,
    email: email,
    fullName: fullName,
  };

  return { user: authUser, error: null };
}

/**
 * Authenticates a user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = await createClient();

  // Check if user exists in user_clients table
  const { data: user, error } = await supabase
    .from('user_clients')
    .select('id, email, full_name')
    .eq('email', email)
    .eq('password', password) // Note: In a production app, passwords should be hashed
    .single();

  if (error || !user) {
    return { user: null, error: 'Invalid email or password' };
  }

  // Create the auth user object
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
  };

  // Store session data in the database
  const sessionId = uuidv4();
  const { error: sessionError } = await supabase
    .from('user_sessions')
    .insert({
      id: sessionId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    });

  if (sessionError) {
    console.error('Error creating session:', sessionError);
  }

  return { user: authUser, error: null };
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  
  try {
    // Get the user ID from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    // Get the user from the user_clients table
    const { data, error } = await supabase
      .from('user_clients')
      .select('id, email, full_name')
      .eq('id', session.user.id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Logs out the current user
 */
export async function logoutUser() {
  const supabase = await createClient();
  
  try {
    // Sign out using Supabase auth
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}
