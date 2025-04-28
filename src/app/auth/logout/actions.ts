'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logout() {
  // Simply remove our custom cookie
  // Get the cookies instance and await it
  const cookieStore = await cookies()
  cookieStore.delete('user_id')
  
  console.log('User logged out, cookie removed')
  
  // Redirect to home page
  revalidatePath('/', 'layout')
  redirect('/')
}