import { NextRequest, NextResponse } from 'next/server'
import { createUserId, getUserIdFromRequest, USER_COOKIE } from '@/lib/auth'
import { createSessionRecord, createUserSessionLink, ensureUserRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

// FREE LIMIT: 2 games, then need to buy
const FREE_GAMES_LIMIT = 2

export async function POST(request: NextRequest) {
  console.log('[create-room] v4 - 2 free games limit')
  try {
    let userId = getUserIdFromRequest(request)
    let shouldSetCookie = false
    if (!userId) {
      userId = createUserId()
      shouldSetCookie = true
      console.log('[create-room] New user:', userId)
    }

    const user = await ensureUserRecord(userId)
    const gamesRemaining = FREE_GAMES_LIMIT - (user.gamesPlayed || 0) + (user.gamesPurchased || 0)
    console.log('[create-room] User stats:', { 
      userId, 
      gamesPlayed: user.gamesPlayed, 
      gamesPurchased: user.gamesPurchased,
      gamesRemaining 
    })

    // Paywall temporarily disabled for testing
    // if (gamesRemaining <= 0) {
    //   return NextResponse.json({ 
    //     error: 'Лимит исчерпан. Купите игры в аккаунте.',
    //     gamesRemaining: 0
    //   }, { status: 402 })
    // }

    const body = await request.json()
    const questionPack = String(body?.questionPack || '')
    const creatorName = String(body?.creatorName || '').trim()
    const creatorEmoji = String(body?.creatorEmoji || '').trim() || '🫦'

    if (!questionPack || !creatorName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { code, sessionId, participantId } = await createSessionRecord({
      questionPack,
      creatorName,
      creatorEmoji,
      creatorUserId: userId
    })

    await createUserSessionLink({
      userId,
      sessionId,
      createdAt: new Date().toISOString(),
      code,
      role: 'A',
      participantName: creatorName,
      participantEmoji: creatorEmoji
    })

    console.log('[create-room] Room created:', { code, sessionId })

    const response = NextResponse.json({ code, sessionId, participantId })
    if (shouldSetCookie) {
      response.cookies.set(USER_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
    return response
  } catch (error) {
    console.error('[create-room] Error:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
