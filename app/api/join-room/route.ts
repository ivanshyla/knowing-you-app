import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { code, name, emoji } = await request.json()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check existing participants
    const { data: existingParticipants } = await supabase
      .from('participants')
      .select('role')
      .eq('session_id', session.id)

    // Determine role (if A exists, become B)
    let role: 'A' | 'B' = 'A'
    if (existingParticipants && existingParticipants.length > 0) {
      const hasA = existingParticipants.some(p => p.role === 'A')
      const hasB = existingParticipants.some(p => p.role === 'B')
      
      if (hasA && hasB) {
        return NextResponse.json(
          { error: 'Room is full' },
          { status: 400 }
        )
      }
      
      role = hasA ? 'B' : 'A'
    }

    // Create participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        role,
        name,
        emoji,
      })
      .select()
      .single()

    if (participantError) throw participantError

    return NextResponse.json({
      sessionId: session.id,
      participantId: participant.id,
      role,
    })
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}



