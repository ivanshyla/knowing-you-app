import { NextRequest, NextResponse } from 'next/server'
import { fetchQuestions, fetchSessionById, saveRatingRecord } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionId = String(body?.sessionId || '')
    const questionId = String(body?.questionId || '')
    const raterRole = body?.raterRole === 'B' ? 'B' : 'A'
    const targetRole = body?.targetRole === 'A' ? 'A' : body?.targetRole === 'B' ? 'B' : null
    const value = Number(body?.value)

    if (!sessionId || !questionId || !targetRole) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!Number.isInteger(value) || value < 1 || value > 10) {
      return NextResponse.json({ error: 'Value must be 1-10' }, { status: 400 })
    }

    const session = await fetchSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'live') {
      return NextResponse.json({ error: 'Session is not live' }, { status: 400 })
    }

    const questions = await fetchQuestions(sessionId)
    const target = questions.find((q) => q.questionId === questionId)
    if (!target) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    await saveRatingRecord({
      sessionId,
      questionId,
      raterRole,
      targetRole,
      value
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving rating:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}

