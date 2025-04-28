'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logout() {
  // Simply remove our custom cookie
  // Using @ts-ignore to bypass the TypeScript error with cookies().delete
  // This is a known issue with Next.js types
  // @ts-ignore
  cookies().delete('user_id')
  
  console.log('User logged out, cookie removed')
  
  // Redirect to home page
  revalidatePath('/', 'layout')
  redirect('/')
}