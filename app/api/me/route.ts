import { NextRequest, NextResponse } from 'next/server'
import { createUserId, getUserIdFromRequest, USER_COOKIE } from '@/lib/auth'
import { ensureUserRecord, getUserRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

const ONE_YEAR = 60 * 60 * 24 * 365
const FREE_GAMES_LIMIT = 2

export async function GET(request: NextRequest) {
  let userId = getUserIdFromRequest(request)
  let isNew = false

  if (!userId) {
    userId = createUserId()
    isNew = true
  }

  const user = isNew ? await ensureUserRecord(userId) : ((await getUserRecord(userId)) ?? (await ensureUserRecord(userId)))

  const avgMatch = user.gamesPlayed > 0 ? Math.round(user.matchSum / user.gamesPlayed) : 0
  const gamesPurchased = user.gamesPurchased || 0
  const gamesRemaining = Math.max(0, FREE_GAMES_LIMIT - user.gamesPlayed + gamesPurchased)

  const response = NextResponse.json({
    userId: user.userId,
    isPro: user.isPro,
    gamesPlayed: user.gamesPlayed,
    gamesPurchased,
    gamesRemaining,
    totalPurchased: gamesPurchased,
    avgMatch
  })

  if (isNew) {
    response.cookies.set(USER_COOKIE, userId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR
    })
  }

  return response
}
