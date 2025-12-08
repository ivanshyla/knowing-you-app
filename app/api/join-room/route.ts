import { NextRequest, NextResponse } from 'next/server'
import { addParticipantRecord, fetchParticipants, fetchSessionByCode } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body?.code || '')
    const name = String(body?.name || '').trim()
    const emoji = String(body?.emoji || '').trim() || '😊'

    if (!code || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const session = await fetchSessionByCode(code)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'done') {
      return NextResponse.json({ error: 'Session already finished' }, { status: 400 })
    }

    const participants = await fetchParticipants(session.id)
    if (participants.length >= 2) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    const hasA = participants.some((p) => p.role === 'A')
    const role: 'A' | 'B' = hasA ? 'B' : 'A'

    const participant = await addParticipantRecord({
      sessionId: session.id,
      role,
      name,
      emoji
    })

    return NextResponse.json({
      sessionId: session.id,
      participantId: participant.participantId,
      role
    })
  } catch (error: any) {
    if (error?.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Slot already taken' }, { status: 409 })
    }

    console.error('Error joining room:', error)
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
