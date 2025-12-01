import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/utils'
import { getQuestionPack } from '@/data/questionPacks'

export async function POST(request: NextRequest) {
  try {
    const { questionPack, creatorName, creatorEmoji } = await request.json()

    // Generate unique room code
    let code = generateRoomCode()
    let attempts = 0
    
    // Ensure code is unique
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('sessions')
        .select('id')
        .eq('code', code)
        .single()
      
      if (!existing) break
      code = generateRoomCode()
      attempts++
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        code,
        status: 'lobby',
        question_pack: questionPack,
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Create participant A (creator)
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        session_id: session.id,
        role: 'A',
        name: creatorName,
        emoji: creatorEmoji,
      })
      .select()
      .single()

    if (participantError) throw participantError

    // Get question pack and create questions
    const pack = getQuestionPack(questionPack)
    if (!pack) throw new Error('Invalid question pack')

    const questions = pack.questions.map((q, idx) => ({
      session_id: session.id,
      idx,
      text: q.text,
      icon: q.icon,
    }))

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questions)

    if (questionsError) throw questionsError

    return NextResponse.json({ 
      code: session.code,
      sessionId: session.id,
      participantId: participant.id,
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}



