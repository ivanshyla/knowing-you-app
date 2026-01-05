import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { fetchSessionByCode, fetchParticipants, fetchQuestions, fetchRatings } from '@/lib/sessionStore'
import { buildQuestionResults } from '@/lib/results'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const format = searchParams.get('format')

  let nameA = ''
  let nameB = ''
  let hasData = false
  let insight = ''

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
        
        if (pA && pB && ratings.length > 0) {
          nameA = pA.name
          nameB = pB.name
          hasData = true
          
          const results = buildQuestionResults(questions, ratings)
          
          let maxGap = 0
          let whoHasGap = ''
          
          results.forEach((r: any) => {
            const gapA = Math.abs(r.selfA - r.partnerViewA)
            const gapB = Math.abs(r.selfB - r.partnerViewB)
            
            if (gapA > maxGap) {
              maxGap = gapA
              whoHasGap = nameA
            }
            if (gapB > maxGap) {
              maxGap = gapB
              whoHasGap = nameB
            }
          })
          
          if (maxGap >= 4) {
            insight = `${whoHasGap} sees themselves differently`
          } else if (maxGap >= 2) {
            insight = `Interesting perception gaps discovered`
          } else {
            insight = `They truly know each other`
          }
        }
      }
    } catch (e) {
      console.error('[OG] Error:', e)
    }
  }

  const isStory = format === 'story'
  const width = isStory ? 1080 : 1200
  const height = isStory ? 1920 : 630

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(160deg, #1F313B 0%, #2a1a35 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: 50,
      }}>
        {/* Simple title */}
        <div style={{
          fontSize: isStory ? 32 : 24,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 6,
          marginBottom: hasData ? 30 : 40,
          textTransform: 'uppercase',
        }}>
          Perception Mirror
        </div>

        {hasData ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Names */}
            <div style={{
              fontSize: isStory ? 56 : 42,
              fontWeight: 700,
              color: 'white',
              marginBottom: 25,
            }}>
              {nameA} & {nameB}
            </div>

            {/* Insight - simple text */}
            <div style={{
              fontSize: isStory ? 28 : 22,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 40,
            }}>
              {insight}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: isStory ? 48 : 36,
              fontWeight: 700,
              color: 'white',
              marginBottom: 15,
              textAlign: 'center',
            }}>
              How well do you know each other?
            </div>
            <div style={{
              fontSize: isStory ? 24 : 18,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 40,
            }}>
              Discover perception gaps
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{
          background: '#BE4039',
          color: 'white',
          padding: isStory ? '18px 50px' : '14px 40px',
          borderRadius: 8,
          fontSize: isStory ? 20 : 16,
          fontWeight: 600,
          letterSpacing: 2,
        }}>
          kykmgame.com
        </div>
      </div>
    ),
    { width, height }
  )
}
