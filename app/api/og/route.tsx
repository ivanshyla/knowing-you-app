import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { fetchSessionByCode, fetchParticipants, fetchQuestions, fetchRatings } from '@/lib/sessionStore'
import { buildQuestionResults } from '@/lib/results'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const format = searchParams.get('format') // 'og' (1200x630) or 'story' (1080x1920)

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
          
          // Find biggest perception gap
          const results = buildQuestionResults(questions, ratings)
          
          // Calculate gaps for each person
          let maxGap = 0
          let whoHasGap = ''
          let gapDirection = ''
          
          results.forEach((r: any) => {
            // Gap for A: how A sees self vs how B sees A
            const gapA = Math.abs(r.selfA - r.partnerViewA)
            // Gap for B: how B sees self vs how A sees B
            const gapB = Math.abs(r.selfB - r.partnerViewB)
            
            if (gapA > maxGap) {
              maxGap = gapA
              whoHasGap = nameA
              gapDirection = r.selfA > r.partnerViewA ? 'higher' : 'lower'
              biggestGapQuestion = r.short || r.question.substring(0, 30)
            }
            if (gapB > maxGap) {
              maxGap = gapB
              whoHasGap = nameB
              gapDirection = r.selfB > r.partnerViewB ? 'higher' : 'lower'
              biggestGapQuestion = r.short || r.question.substring(0, 30)
            }
          })
          
          gapValue = maxGap
          
          // Generate insight based on gap
          if (maxGap >= 4) {
            insight = gapDirection === 'higher' 
              ? `${whoHasGap} sees themselves differently than their partner does!`
              : `${whoHasGap}'s partner sees hidden qualities!`
            insightEmoji = '🔥'
          } else if (maxGap >= 2) {
            insight = `Interesting perception differences discovered!`
            insightEmoji = '👀'
          } else {
            insight = `${nameA} & ${nameB} truly know each other!`
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
  const height = isStory ? 630 : 630

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
        padding: 50,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '45%',
          height: '70%',
          background: 'radial-gradient(circle, rgba(190,64,57,0.35) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-25%',
          right: '-10%',
          width: '50%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.25) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
          {/* Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: hasData ? 20 : 30,
          }}>
            <span style={{ fontSize: 40 }}>🪞</span>
            <span style={{
              fontSize: 28,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: 8,
              textTransform: 'uppercase'
            }}>Perception Mirror</span>
            <span style={{ fontSize: 40 }}>🪞</span>
          </div>

          {/* Players */}
          {hasData ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 40,
                marginBottom: 30,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 70 }}>{emojiA}</div>
                  <div style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 8 }}>{nameA}</div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  padding: '15px 25px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 20,
                }}>
                  <span style={{ fontSize: 35 }}>💕</span>
                  <span style={{ 
                    fontSize: 14, 
                    color: 'rgba(255,255,255,0.5)', 
                    marginTop: 5,
                    textTransform: 'uppercase',
                    letterSpacing: 2 
                  }}>vs</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 70 }}>{emojiB}</div>
                  <div style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 8 }}>{nameB}</div>
                </div>
              </div>

              {/* Insight - the key viral element */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                marginBottom: 25,
                padding: '20px 40px',
                background: 'linear-gradient(135deg, rgba(233,69,96,0.2), rgba(78,205,196,0.2))',
                borderRadius: 100,
                border: '2px solid rgba(255,255,255,0.15)',
              }}>
                <span style={{ fontSize: 35 }}>{insightEmoji}</span>
                <span style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'white',
                  textAlign: 'center',
                }}>{insight}</span>
              </div>

              {/* Biggest gap teaser */}
              {biggestGapQuestion && gapValue >= 2 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 16,
                }}>
                  <span>Biggest gap:</span>
                  <span style={{ 
                    color: '#facc15', 
                    fontWeight: 'bold',
                    padding: '4px 12px',
                    background: 'rgba(250,204,21,0.15)',
                    borderRadius: 20,
                  }}>{biggestGapQuestion}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 70, marginBottom: 25 }}>💕</div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                marginBottom: 15,
              }}>
                How do you really see each other?
              </div>
              <div style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
              }}>
                Discover perception gaps in your relationship
              </div>
            </>
          )}

          {/* CTA */}
          <div style={{
            marginTop: hasData ? 25 : 35,
            background: 'linear-gradient(135deg, #e94560, #BE4039)',
            color: 'white',
            padding: '16px 50px',
            borderRadius: 100,
            fontSize: 18,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 3,
            boxShadow: '0 15px 40px rgba(233,69,96,0.4)',
          }}>
            kykmgame.com
          </div>
        </div>
      </div>
    ),
    { width, height }
  )
}
