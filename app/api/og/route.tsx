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
  let emojiA = '💜'
  let emojiB = '💙'
  let hasData = false
  let insight = ''
  let insightEmoji = '🪞'

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
          emojiA = pA.emoji
          emojiB = pB.emoji
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
            insight = `${whoHasGap} sees themselves differently!`
            insightEmoji = '🔥'
          } else if (maxGap >= 2) {
            insight = `Interesting perception gaps!`
            insightEmoji = '👀'
          } else {
            insight = `They truly know each other!`
            insightEmoji = '💕'
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
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: 40,
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: hasData ? 30 : 40,
        }}>
          <span style={{ fontSize: 32, marginRight: 10 }}>🪞</span>
          <span style={{
            fontSize: 18,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 5,
          }}>PERCEPTION MIRROR</span>
          <span style={{ fontSize: 32, marginLeft: 10 }}>🪞</span>
        </div>

        {hasData ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Players */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 30,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 30 }}>
                <span style={{ fontSize: 60 }}>{emojiA}</span>
                <span style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>{nameA}</span>
              </div>
              
              <span style={{ fontSize: 40, opacity: 0.5 }}>💕</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 30 }}>
                <span style={{ fontSize: 60 }}>{emojiB}</span>
                <span style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>{nameB}</span>
              </div>
            </div>

            {/* Insight */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px 35px',
              background: 'rgba(233,69,96,0.2)',
              borderRadius: 50,
              marginBottom: 25,
            }}>
              <span style={{ fontSize: 28, marginRight: 12 }}>{insightEmoji}</span>
              <span style={{ fontSize: 20, fontWeight: 600, color: 'white' }}>{insight}</span>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 70, marginBottom: 25 }}>💕</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 10 }}>
              How do you really see each other?
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
              Discover perception gaps in your relationship
            </span>
          </div>
        )}

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #e94560, #BE4039)',
          color: 'white',
          padding: '14px 40px',
          borderRadius: 50,
          fontSize: 16,
          fontWeight: 'bold',
          letterSpacing: 3,
          marginTop: hasData ? 0 : 30,
        }}>
          KYKMGAME.COM
        </div>
      </div>
    ),
    { width, height }
  )
}
