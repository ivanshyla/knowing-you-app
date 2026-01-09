import { NextRequest, NextResponse } from 'next/server'
import { createUserId, getUserIdFromRequest, USER_COOKIE } from '@/lib/auth'
import { createSessionRecord, createUserSessionLink, ensureUserRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let userId = getUserIdFromRequest(request)
    let shouldSetCookie = false
    if (!userId) {
      userId = createUserId()
      shouldSetCookie = true
    }

    await ensureUserRecord(userId)

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

    const response = NextResponse.json({ code, sessionId, participantId })
    if (shouldSetCookie) {
      response.cookies.set(USER_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
    }
    return response
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
