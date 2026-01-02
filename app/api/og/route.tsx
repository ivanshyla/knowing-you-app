import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { fetchParticipants, fetchQuestions, fetchRatings, fetchSessionById } from '@/lib/sessionStore'
import { buildQuestionResults, computeMatchPercentage, pickTopMatches } from '@/lib/results'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const session = await fetchSessionById(sessionId)
  if (!session || session.status !== 'done') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [participants, questions, ratings] = await Promise.all([
    fetchParticipants(sessionId),
    fetchQuestions(sessionId),
    fetchRatings(sessionId)
  ])

  const participantA = participants.find((p) => p.role === 'A')
  const participantB = participants.find((p) => p.role === 'B')

  if (!participantA || !participantB) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const questionResults = buildQuestionResults(questions, ratings)
  const matchPercentage = computeMatchPercentage(questionResults)
  const topMatch = pickTopMatches(questionResults, 1)[0]

  // Exact brand colors from the palette image
  const bg = '#1F313B' // Dark teal/blue from the top of stack
  const accent = '#BE4039' // Bright red from the stack

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: bg,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#FFFFFF', fontStyle: 'italic', letterSpacing: '-2px' }}>Knowing You, Knowing Me</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '6px' }}>Психологическое зеркало</div>
          </div>
          <div
            style={{
              padding: '14px 28px',
              borderRadius: 24,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 22,
              fontWeight: 900,
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '2px'
            }}
          >
            18+
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: 140, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>{participantA.emoji}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', fontStyle: 'italic', textTransform: 'uppercase' }}>{participantA.name}</div>
          </div>

          <div style={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.05)', fontWeight: 900, fontStyle: 'italic' }}>×</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: 140, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>{participantB.emoji}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', fontStyle: 'italic', textTransform: 'uppercase' }}>{participantB.name}</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '50px',
            borderRadius: 50,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            width: '100%',
            boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ fontSize: 110, fontWeight: 900, color: accent, fontStyle: 'italic', lineHeight: 1, letterSpacing: '-4px' }}>
            {matchPercentage}%
          </div>
          <div style={{ fontSize: 22, letterSpacing: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: 900 }}>
            разрыв восприятия
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}
