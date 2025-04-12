import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}