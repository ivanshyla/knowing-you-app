import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { fetchSessionByCode, fetchParticipants, fetchQuestions, fetchRatings } from '@/lib/sessionStore'
import { buildQuestionResults, computeMatchPercentage } from '@/lib/results'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  let matchPercent = 0
  let nameA = 'Player 1'
  let nameB = 'Player 2'
  let emojiA = '💜'
  let emojiB = '💙'

  if (code) {
    try {
      const session = await fetchSessionByCode(code)
      if (session && session.status === 'done') {
        const [participants, questions, ratings] = await Promise.all([
          fetchParticipants(session.id),
          fetchQuestions(session.id),
          fetchRatings(session.id)
        ])
        
        const pA = participants.find(p => p.role === 'A')
        const pB = participants.find(p => p.role === 'B')
        
        if (pA && pB) {
          nameA = pA.name
          nameB = pB.name
          emojiA = pA.emoji
          emojiB = pB.emoji
          
          const results = buildQuestionResults(questions, ratings)
          matchPercent = computeMatchPercentage(results)
        }
      }
    } catch (e) {
      console.error('OG image error:', e)
    }
  }

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: 60,
        position: 'relative',
      }}>
        {/* Glow effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(233,69,96,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: '25%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(78,205,196,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        {/* Top label */}
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 28,
          textTransform: 'uppercase',
          letterSpacing: 8,
          marginBottom: 50,
        }}>
          Perception Mirror
        </div>

        {/* Players with heart */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 50,
          marginBottom: 50,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 100 }}>{emojiA}</div>
            <div style={{ color: 'white', fontSize: 36, fontWeight: 'bold', marginTop: 10 }}>{nameA}</div>
          </div>
          
          <div style={{ fontSize: 80 }}>💕</div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 100 }}>{emojiB}</div>
            <div style={{ color: 'white', fontSize: 36, fontWeight: 'bold', marginTop: 10 }}>{nameB}</div>
          </div>
        </div>

        {/* Match percentage */}
        {matchPercent > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 40,
          }}>
            <div style={{
              fontSize: 140,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #e94560, #4ecdc4)',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1,
            }}>
              {matchPercent}%
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 32,
              textTransform: 'uppercase',
              letterSpacing: 6,
            }}>
              Match
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(90deg, #e94560, #BE4039)',
          color: 'white',
          padding: '24px 80px',
          borderRadius: 100,
          fontSize: 32,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 4,
          marginTop: 20,
        }}>
          kykmgame.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
