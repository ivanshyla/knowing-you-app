import { NextRequest, NextResponse } from 'next/server'
import { createUserId, getUserIdFromRequest, USER_COOKIE } from '@/lib/auth'
import { ensureUserRecord, getUserRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let userId = getUserIdFromRequest(request)
  let shouldSetCookie = false
  if (!userId) {
    userId = createUserId()
    shouldSetCookie = true
  }

  await ensureUserRecord(userId)
  const user = await getUserRecord(userId)

  const response = NextResponse.json({
    userId,
    email: user?.email ?? null,
    isPro: user?.isPro ?? false,
    gamesPlayed: user?.gamesPlayed ?? 0,
    matchSum: user?.matchSum ?? 0,
    stripeStatus: user?.stripeStatus ?? null
  })

  if (shouldSetCookie) {
    response.cookies.set(USER_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  return response
}



