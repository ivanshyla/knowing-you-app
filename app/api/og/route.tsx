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
  let biggestGapQuestion = ''
  let gapValue = 0

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
          let gapDirection = ''
          
          results.forEach((r: any) => {
            const gapA = Math.abs(r.selfA - r.partnerViewA)
            const gapB = Math.abs(r.selfB - r.partnerViewB)
            
            if (gapA > maxGap) {
              maxGap = gapA
              whoHasGap = nameA
              gapDirection = r.selfA > r.partnerViewA ? 'higher' : 'lower'
              biggestGapQuestion = r.short || r.question.substring(0, 25) + '...'
            }
            if (gapB > maxGap) {
              maxGap = gapB
              whoHasGap = nameB
              gapDirection = r.selfB > r.partnerViewB ? 'higher' : 'lower'
              biggestGapQuestion = r.short || r.question.substring(0, 25) + '...'
            }
          })
          
          gapValue = maxGap
          
          if (maxGap >= 4) {
            insight = gapDirection === 'higher' 
              ? `${whoHasGap} sees themselves differently!`
              : `Hidden qualities discovered!`
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: isStory ? 60 : 40,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-15%',
          width: '50%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(190,64,57,0.3) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-15%',
          width: '50%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.2) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          width: '100%',
        }}>
          {/* Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: isStory ? 50 : 25,
          }}>
            <span style={{ fontSize: isStory ? 50 : 32 }}>🪞</span>
            <span style={{
              fontSize: isStory ? 28 : 20,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 6,
              textTransform: 'uppercase'
            }}>Perception Mirror</span>
            <span style={{ fontSize: isStory ? 50 : 32 }}>🪞</span>
          </div>

          {hasData ? (
            <>
              {/* Players row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isStory ? 50 : 35,
                marginBottom: isStory ? 50 : 25,
                width: '100%',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: isStory ? 90 : 55 }}>{emojiA}</div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: isStory ? 28 : 20, 
                    fontWeight: 'bold', 
                    marginTop: 8 
                  }}>{nameA}</div>
                </div>
                
                <div style={{ 
                  fontSize: isStory ? 50 : 35,
                  opacity: 0.6,
                }}>💕</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: isStory ? 90 : 55 }}>{emojiB}</div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: isStory ? 28 : 20, 
                    fontWeight: 'bold', 
                    marginTop: 8 
                  }}>{nameB}</div>
                </div>
              </div>

              {/* Insight box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: isStory ? 40 : 20,
                padding: isStory ? '25px 45px' : '15px 35px',
                background: 'linear-gradient(135deg, rgba(233,69,96,0.25), rgba(78,205,196,0.2))',
                borderRadius: 50,
                border: '2px solid rgba(255,255,255,0.12)',
              }}>
                <span style={{ fontSize: isStory ? 40 : 28 }}>{insightEmoji}</span>
                <span style={{
                  fontSize: isStory ? 26 : 18,
                  fontWeight: 600,
                  color: 'white',
                }}>{insight}</span>
              </div>

              {/* Biggest gap teaser */}
              {biggestGapQuestion && gapValue >= 2 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: isStory ? 18 : 14,
                  marginBottom: isStory ? 40 : 15,
                }}>
                  <span>Biggest gap:</span>
                  <span style={{ 
                    color: '#facc15', 
                    fontWeight: 'bold',
                    padding: '4px 12px',
                    background: 'rgba(250,204,21,0.12)',
                    borderRadius: 15,
                  }}>{biggestGapQuestion}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: isStory ? 100 : 60, marginBottom: isStory ? 40 : 20 }}>💕</div>
              <div style={{
                fontSize: isStory ? 42 : 28,
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                marginBottom: 12,
              }}>
                How do you really see each other?
              </div>
              <div style={{
                fontSize: isStory ? 22 : 16,
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                marginBottom: isStory ? 50 : 25,
              }}>
                Discover perception gaps in your relationship
              </div>
            </>
          )}

          {/* CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #e94560, #BE4039)',
            color: 'white',
            padding: isStory ? '22px 55px' : '14px 40px',
            borderRadius: 50,
            fontSize: isStory ? 22 : 16,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 3,
            boxShadow: '0 12px 35px rgba(233,69,96,0.35)',
          }}>
            kykmgame.com
          </div>
        </div>
      </div>
    ),
    { width, height }
  )
}
