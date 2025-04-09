import { logout } from './actions'
import { NextResponse } from 'next/server'

export async function POST(req: globalThis.Request) {
  await logout()
  return NextResponse.redirect(new URL('/', new URL(req.url).origin))
}