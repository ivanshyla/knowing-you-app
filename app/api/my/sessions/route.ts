import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { listUserSessions } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ sessions: [] })
  }

  try {
    const sessions = await listUserSessions(userId)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error listing user sessions:', error)
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
}
