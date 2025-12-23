import { NextRequest, NextResponse } from 'next/server'
import { fetchSessionById, finalizeSessionAndUpdateStats, updateSessionStatus } from '@/lib/sessionStore'

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

    await updateSessionStatus(sessionId, 'done')
    await finalizeSessionAndUpdateStats(sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error finishing session:', error)
    return NextResponse.json({ error: 'Failed to finish session' }, { status: 500 })
  }
}

