'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type SignupState = {
  error: string | null;
};

export async function signup(prevState: SignupState, formData: FormData): Promise<SignupState> {
  const supabase = await createClient();
  
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    full_name: formData.get('name') as string,
  };

  // Password confirmation check
  const confirmPassword = formData.get('confirm-password') as string;
  if (rawData.password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  // Terms agreement check
  const termsAgreed = formData.get('terms');
  if (!termsAgreed) {
    return { error: 'You must agree to the terms' };
  }

  // 1. Create auth user
  const { data: authData, error: authError } = 
    await supabase.auth.signUp({
      email: rawData.email,
      password: rawData.password,
    });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Create profile in public table
  const { error: profileError } = await supabase
    .from('user_clients')
    .insert({
      auth_user_id: authData.user?.id,
      email: rawData.email,
      full_name: rawData.full_name,
    });

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}