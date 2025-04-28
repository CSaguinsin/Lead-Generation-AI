// utils/supabase/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/confirm']
  
  // Skip authentication check for public routes
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return response
  }

  // Check for our custom auth cookie
  const userId = request.cookies.get('user_id')?.value
  
  if (!userId) {
    console.log('No user_id cookie found, redirecting to login')
    // No auth token found, redirect to login
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  console.log('User ID cookie found:', userId)
  
  // Create a Supabase client for database operations
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  try {
    // Verify the user exists in the user_clients table with this ID
    const { data: userClient, error } = await supabase
      .from('user_clients')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();
    
    if (error || !userClient) {
      console.error('User not found in user_clients table:', error);
      // User not found in user_clients table, redirect to login
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log('User found:', userClient.full_name)
    
    // Add user info to request headers for use in server components
    request.headers.set('x-user-id', userClient.id)
    request.headers.set('x-user-email', userClient.email)
    request.headers.set('x-user-name', userClient.full_name)
  } catch (error) {
    console.error('Error verifying user:', error)
    // Error checking user, redirect to login
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}