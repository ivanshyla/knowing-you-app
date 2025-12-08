import { NextRequest, NextResponse } from 'next/server'
import { createSessionRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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
      creatorEmoji
    })

    return NextResponse.json({ code, sessionId, participantId })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
