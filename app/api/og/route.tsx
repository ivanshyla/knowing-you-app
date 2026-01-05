import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { fetchSessionByCode, fetchParticipants } from '@/lib/sessionStore'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const format = searchParams.get('format')

  let nameA = ''
  let nameB = ''
  let hasData = false

  if (code) {
    try {
      const session = await fetchSessionByCode(code)
      
      if (session && session.status === 'done') {
        const participants = await fetchParticipants(session.id)
        const pA = participants.find(p => p.role === 'A')
        const pB = participants.find(p => p.role === 'B')
        
        if (pA && pB) {
          nameA = pA.name
          nameB = pB.name
          hasData = true
        }
      }
    } catch (e) {
      console.error('[OG] Error:', e)
    }
  }

  const isStory = format === 'story'
  const width = isStory ? 1080 : 1200
  const height = isStory ? 1920 : 630

  const title = hasData ? `${nameA} & ${nameB}` : 'How well do you know each other?'

  return new ImageResponse(
    (
      <div style={{
        background: '#1F313B',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <span style={{
          fontSize: 20,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: 4,
          marginBottom: 25,
        }}>
          PERCEPTION MIRROR
        </span>

        <span style={{
          fontSize: hasData ? 38 : 32,
          fontWeight: 700,
          color: 'white',
          marginBottom: 30,
          textAlign: 'center',
        }}>
          {title}
        </span>

        <span style={{
          background: '#BE4039',
          color: 'white',
          padding: '12px 35px',
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 600,
        }}>
          kykmgame.com
        </span>
      </div>
    ),
    { width, height }
  )
}
