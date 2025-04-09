'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logout() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  // Sign out from Supabase
  const { error } = await supabase.auth.signOut()

  // Clear auth cookies manually
  const cookieOptions = {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0
  }

  // Clear all relevant cookies
  ;['sb-access-token', 'sb-refresh-token'].forEach(name => {
    cookieStore.set(name, '', cookieOptions)
  })

  if (error) {
    console.error('Logout error:', error)
    return { error: error.message }
  }

  redirect('/')
}