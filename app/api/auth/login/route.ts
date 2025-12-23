import { NextRequest, NextResponse } from 'next/server'
import { USER_COOKIE } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
import { ensureUserRecord, getUserIdByEmail, getUserRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !email.includes('@') || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const userId = await getUserIdByEmail(email)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await ensureUserRecord(userId)
    const user = await getUserRecord(userId)
    if (!user?.passwordSalt || !user.passwordHash) {
      return NextResponse.json({ error: 'Account not set up' }, { status: 400 })
    }

    const ok = verifyPassword(password, user.passwordSalt, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, userId })
    response.cookies.set(USER_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    return response
  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 })
  }
}



