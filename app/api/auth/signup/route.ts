import { NextRequest, NextResponse } from 'next/server'
import { createUserId, getUserIdFromRequest, USER_COOKIE } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { attachEmailAndPasswordToUser, ensureUserRecord, getUserIdByEmail } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !email.includes('@') || password.length < 6) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
    }

    const existing = await getUserIdByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    let userId = getUserIdFromRequest(request)
    let shouldSetCookie = false
    if (!userId) {
      userId = createUserId()
      shouldSetCookie = true
    }

    await ensureUserRecord(userId)
    const { salt, hash } = hashPassword(password)
    await attachEmailAndPasswordToUser({ userId, email, passwordSalt: salt, passwordHash: hash })

    const response = NextResponse.json({ success: true, userId })
    if (shouldSetCookie) {
      response.cookies.set(USER_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
    return response
  } catch (error: any) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    console.error('Error signing up:', error)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }
}



