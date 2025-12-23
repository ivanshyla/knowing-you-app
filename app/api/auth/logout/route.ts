import { NextResponse } from 'next/server'
import { USER_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(USER_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}



