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

  const bg =
    matchPercentage >= 70
      ? 'linear-gradient(135deg, #FBCFE8 0%, #DDD6FE 50%, #BFDBFE 100%)'
      : matchPercentage >= 40
        ? 'linear-gradient(135deg, #FEF3C7 0%, #FED7AA 45%, #FECACA 100%)'
        : 'linear-gradient(135deg, #E5E7EB 0%, #DBEAFE 45%, #DDD6FE 100%)'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          backgroundImage: bg,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: '#111827' }}>Knowing You, Knowing Me</div>
            <div style={{ fontSize: 22, color: 'rgba(17, 24, 39, 0.75)' }}>Результат игры</div>
          </div>
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.9)',
              fontSize: 18,
              color: 'rgba(17, 24, 39, 0.65)'
            }}
          >
            18+
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: 84 }}>{participantA.emoji}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', color: 'rgba(17,24,39,0.55)' }}>
                игрок 1
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>{participantA.name}</div>
            </div>
          </div>

          <div style={{ fontSize: 52, color: 'rgba(17, 24, 39, 0.35)' }}>×</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: 84 }}>{participantB.emoji}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', color: 'rgba(17,24,39,0.55)' }}>
                игрок 2
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#111827' }}>{participantB.name}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '26px 28px',
              borderRadius: 28,
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.95)',
              flex: 1
            }}
          >
            <div style={{ fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', color: 'rgba(17,24,39,0.55)' }}>
              совместимость
            </div>
            <div style={{ fontSize: 92, fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>
              {matchPercentage}%
            </div>
            <div style={{ fontSize: 20, color: 'rgba(17,24,39,0.75)' }}>
              {topMatch ? `Лучшее совпадение: ${topMatch.question.icon} ${topMatch.question.text}` : 'Сыграйте, чтобы увидеть совпадения'}
            </div>
          </div>

          <div style={{ fontSize: 18, color: 'rgba(17,24,39,0.55)' }}>Откройте ссылку и сыграйте сами</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}



