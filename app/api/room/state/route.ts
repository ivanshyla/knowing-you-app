import { NextRequest, NextResponse } from 'next/server'
import { getRoomStateByCode } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const rawCode = request.nextUrl.searchParams.get('code')?.trim()
  if (!rawCode) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }
  // Normalize code: remove dashes and spaces
  const code = rawCode.replace(/[-\s]/g, '')

  const includeParam = request.nextUrl.searchParams.get('include') || ''
  const includeTokens = includeParam
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
  const include = {
    questions: includeTokens.includes('questions'),
    ratings: includeTokens.includes('ratings')
  }

  try {
    const state = await getRoomStateByCode(code, include)
    if (!state) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const payload: Record<string, unknown> = {
      session: state.session,
      participants: state.participants
    }

    if (include.questions) {
      payload.questions = state.questions ?? []
    }

    if (include.ratings) {
      payload.ratings = state.ratings ?? []
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error loading room state:', error)
    return NextResponse.json({ error: 'Failed to load room' }, { status: 500 })
  }
}
