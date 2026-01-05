import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { fetchSessionByCode, fetchParticipants, fetchQuestions, fetchRatings } from '@/lib/sessionStore'
import { buildQuestionResults, computeMatchPercentage } from '@/lib/results'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const format = searchParams.get('format') // 'og' (1200x630) or 'story' (1080x1920)

  let matchPercent = 0
  let nameA = ''
  let nameB = ''
  let emojiA = '💜'
  let emojiB = '💙'
  let hasData = false

  if (code) {
    try {
      const session = await fetchSessionByCode(code)
      console.log('[OG] Session for code', code, ':', session?.id, session?.status)
      
      if (session && session.status === 'done') {
        const [participants, questions, ratings] = await Promise.all([
          fetchParticipants(session.id),
          fetchQuestions(session.id),
          fetchRatings(session.id)
        ])
        
        console.log('[OG] Participants:', participants.length, 'Questions:', questions.length, 'Ratings:', ratings.length)
        
        const pA = participants.find(p => p.role === 'A')
        const pB = participants.find(p => p.role === 'B')
        
        if (pA && pB && ratings.length > 0) {
          nameA = pA.name
          nameB = pB.name
          emojiA = pA.emoji
          emojiB = pB.emoji
          hasData = true
          
          const results = buildQuestionResults(questions, ratings)
          matchPercent = computeMatchPercentage(results)
          console.log('[OG] Match:', matchPercent, '%')
        }
      }
    } catch (e) {
      console.error('[OG] Error:', e)
    }
  }

  const isStory = format === 'story'
  const width = isStory ? 1080 : 1200
  const height = isStory ? 1920 : 630

  // Viral message based on match percentage
  let viralText = 'How well do you know each other?'
  if (hasData && matchPercent > 0) {
    if (matchPercent >= 80) viralText = 'We really know each other! 🔥'
    else if (matchPercent >= 60) viralText = 'Pretty good match! 💪'
    else if (matchPercent >= 40) viralText = 'Room for discovery! 👀'
    else viralText = 'Lots to learn! 😅'
  }

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: isStory ? 80 : 50,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(233,69,96,0.4) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.4) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        
        {/* Floating hearts */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', fontSize: 40, opacity: 0.3 }}>💕</div>
        <div style={{ position: 'absolute', top: '25%', right: '15%', fontSize: 30, opacity: 0.2 }}>✨</div>
        <div style={{ position: 'absolute', bottom: '20%', left: '15%', fontSize: 35, opacity: 0.25 }}>💫</div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}>
          {/* Players */}
          {hasData ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isStory ? 60 : 40,
              marginBottom: isStory ? 60 : 30,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: isStory ? 120 : 80 }}>{emojiA}</div>
                <div style={{ color: 'white', fontSize: isStory ? 36 : 28, fontWeight: 'bold', marginTop: 10 }}>{nameA}</div>
              </div>
              
              <div style={{ fontSize: isStory ? 80 : 50 }}>💕</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: isStory ? 120 : 80 }}>{emojiB}</div>
                <div style={{ color: 'white', fontSize: isStory ? 36 : 28, fontWeight: 'bold', marginTop: 10 }}>{nameB}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: isStory ? 100 : 80, marginBottom: 30 }}>🪞💕🪞</div>
          )}

          {/* Match percentage - big and bold */}
          {hasData && matchPercent > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: isStory ? 50 : 20,
            }}>
              <div style={{
                fontSize: isStory ? 200 : 120,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1,
                letterSpacing: '-0.05em',
              }}>
                {matchPercent}%
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: isStory ? 32 : 24,
                textTransform: 'uppercase',
                letterSpacing: isStory ? 12 : 8,
                marginTop: 10,
              }}>
                Match
              </div>
            </div>
          ) : (
            <div style={{
              fontSize: isStory ? 60 : 48,
              fontWeight: 900,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: 30,
            }}>
              Perception Mirror
            </div>
          )}

          {/* Viral text */}
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: isStory ? 40 : 28,
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: isStory ? 60 : 30,
          }}>
            {viralText}
          </div>

          {/* CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #e94560, #BE4039)',
            color: 'white',
            padding: isStory ? '30px 80px' : '20px 60px',
            borderRadius: 100,
            fontSize: isStory ? 32 : 24,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 4,
            boxShadow: '0 20px 60px rgba(233,69,96,0.5)',
          }}>
            Play at kykmgame.com
          </div>
        </div>
      </div>
    ),
    { width, height }
  )
}
