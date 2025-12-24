import { NextRequest, NextResponse } from 'next/server'
import { fetchParticipants, fetchSessionById, updateSessionStatus } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionId = String(body?.sessionId || '')

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    const session = await fetchSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'live') {
      return NextResponse.json({ success: true })
    }

    const participants = await fetchParticipants(sessionId)
    if (participants.length < 1) {
      return NextResponse.json({ error: 'Room is empty' }, { status: 400 })
    }

    await updateSessionStatus(sessionId, 'live')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error starting session:', error)
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }
}
