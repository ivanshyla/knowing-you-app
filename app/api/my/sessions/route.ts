import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { listUserSessions } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const sessions = await listUserSessions(userId)
  const sorted = [...sessions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return NextResponse.json({ sessions: sorted })
}


