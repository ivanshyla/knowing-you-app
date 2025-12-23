import { NextRequest, NextResponse } from 'next/server'
import { fetchParticipants, fetchQuestions, fetchRatings, fetchSessionById } from '@/lib/sessionStore'
import { buildQuestionResults, computeMatchPercentage, pickTopDifferences, pickTopMatches } from '@/lib/results'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  try {
    const session = await fetchSessionById(sessionId)
    if (!session || session.status !== 'done') {
      return NextResponse.json({ error: 'Session not found or not finished' }, { status: 404 })
    }

    const [participants, questions, ratings] = await Promise.all([
      fetchParticipants(sessionId),
      fetchQuestions(sessionId),
      fetchRatings(sessionId)
    ])

    const participantA = participants.find((p) => p.role === 'A')
    const participantB = participants.find((p) => p.role === 'B')

    if (!participantA || !participantB) {
      return NextResponse.json({ error: 'Participants not found' }, { status: 404 })
    }

    const questionResults = buildQuestionResults(questions, ratings)
    const matchPercentage = computeMatchPercentage(questionResults)
    const topMatches = pickTopMatches(questionResults, 3)
    const topDifferences = pickTopDifferences(questionResults, 3)

    return NextResponse.json({
      session,
      participantA,
      participantB,
      matchPercentage,
      topMatches,
      topDifferences,
      questionResults: questionResults.slice(0, 8) // Limit for speed if needed
    })
  } catch (error) {
    console.error('Error fetching share details:', error)
    return NextResponse.json({ error: 'Failed to load details' }, { status: 500 })
  }
}

