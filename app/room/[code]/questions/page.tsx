'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Question, type Participant, type Session, type Rating } from '@/lib/supabase'

export default function QuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [myRole, setMyRole] = useState<'A' | 'B' | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  
  // Current question ratings
  const [mySelfRating, setMySelfRating] = useState<number | null>(null)
  const [myPartnerRating, setMyPartnerRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedRole = localStorage.getItem(`session_${code}_role`)
    if (!storedRole) {
      router.push(`/room/${code}`)
      return
    }
    setMyRole(storedRole as 'A' | 'B')
    loadData()
  }, [code])

  useEffect(() => {
    if (!session) return

    // Subscribe to ratings changes
    const channel = supabase
      .channel(`questions_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          loadRatings(session.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as Session
          if (updated.status === 'done') {
            router.push(`/room/${code}/results`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id])

  useEffect(() => {
    if (session) {
      loadRatings(session.id)
    }
  }, [session])

  useEffect(() => {
    checkAndMoveToNextQuestion()
  }, [ratings, currentQuestionIdx])

  useEffect(() => {
    loadCurrentQuestionRatings()
  }, [currentQuestionIdx, ratings, myRole])

  async function loadData() {
    const { getDemoSession, getDemoQuestions, getDemoParticipants, isDemoMode } = await import('@/lib/demo-storage')
    
    if (isDemoMode()) {
      // Demo mode - load from localStorage
      const sessionData = getDemoSession(code)
      if (!sessionData) {
        router.push('/')
        return
      }

      setSession(sessionData)

      // Load questions
      const questionsData = getDemoQuestions(sessionData.id)
      setQuestions(questionsData)

      // Load participants
      const participantsData = getDemoParticipants(sessionData.id)
      setParticipants(participantsData)

      setLoading(false)
    } else {
      // Real Supabase mode
      // Load session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .single()

      if (!sessionData) {
        router.push('/')
        return
      }

      setSession(sessionData)

      // Load questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('idx', { ascending: true })

      if (questionsData) {
        setQuestions(questionsData)
      }

      // Load participants
      const { data: participantsData } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionData.id)

      if (participantsData) {
        setParticipants(participantsData)
      }

      setLoading(false)
    }
  }

  async function loadRatings(sessionId: string) {
    const { getDemoRatings, isDemoMode } = await import('@/lib/demo-storage')
    
    if (isDemoMode()) {
      const data = getDemoRatings(sessionId)
      setRatings(data)
    } else {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('session_id', sessionId)

      if (data) {
        setRatings(data)
      }
    }
  }

  function loadCurrentQuestionRatings() {
    if (!myRole || questions.length === 0) return

    const currentQuestion = questions[currentQuestionIdx]
    if (!currentQuestion) return

    // Find my ratings for this question
    const selfRating = ratings.find(
      r => r.question_id === currentQuestion.id && 
           r.rater_role === myRole && 
           r.target_role === myRole
    )
    
    const partnerRole = myRole === 'A' ? 'B' : 'A'
    const partnerRating = ratings.find(
      r => r.question_id === currentQuestion.id && 
           r.rater_role === myRole && 
           r.target_role === partnerRole
    )

    setMySelfRating(selfRating?.value || null)
    setMyPartnerRating(partnerRating?.value || null)
  }

  async function submitRating(targetRole: 'A' | 'B', value: number) {
    if (!session || !myRole || questions.length === 0) return

    const currentQuestion = questions[currentQuestionIdx]
    if (!currentQuestion) return

    try {
      const { saveDemoRating, isDemoMode } = await import('@/lib/demo-storage')
      
      if (isDemoMode()) {
        // Demo mode - save to localStorage
        saveDemoRating(session.id, currentQuestion.id, myRole, targetRole, value)
        
        // Update local state
        if (targetRole === myRole) {
          setMySelfRating(value)
        } else {
          setMyPartnerRating(value)
        }
        
        // Check if partner is a bot and auto-answer
        const partnerRole = myRole === 'A' ? 'B' : 'A'
        const partner = participants.find(p => p.role === partnerRole)
        
        if (partner && partner.name?.includes('Бот')) {
          // Bot auto-answers with random ratings after a short delay
          setTimeout(() => {
            // Bot rates itself (random 5-9)
            const botSelfRating = Math.floor(Math.random() * 5) + 5
            saveDemoRating(session.id, currentQuestion.id, partnerRole, partnerRole, botSelfRating)
            
            // Bot rates player (random 4-9)
            const botPlayerRating = Math.floor(Math.random() * 6) + 4
            saveDemoRating(session.id, currentQuestion.id, partnerRole, myRole, botPlayerRating)
            
            // Reload ratings to trigger next question
            loadRatings(session.id)
          }, 800)
        }
        
        // Reload ratings to trigger next question check
        await loadRatings(session.id)
      } else {
        // Real Supabase mode
        await fetch('/api/submit-rating', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            questionId: currentQuestion.id,
            raterRole: myRole,
            targetRole,
            value,
          }),
        })

        // Update local state
        if (targetRole === myRole) {
          setMySelfRating(value)
        } else {
          setMyPartnerRating(value)
        }
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    }
  }

  function checkAndMoveToNextQuestion() {
    if (!myRole || questions.length === 0 || !session) return

    const currentQuestion = questions[currentQuestionIdx]
    if (!currentQuestion) return

    // Check if all 4 ratings are complete for this question
    const questionRatings = ratings.filter(r => r.question_id === currentQuestion.id)
    
    if (questionRatings.length === 4) {
      // Move to next question
      if (currentQuestionIdx < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIdx(prev => prev + 1)
        }, 1000)
      } else {
        // All questions completed - mark session as done
        setTimeout(async () => {
          const { updateDemoSessionStatus, isDemoMode } = await import('@/lib/demo-storage')
          
          if (isDemoMode()) {
            updateDemoSessionStatus(session.id, 'done')
          } else {
            await supabase
              .from('sessions')
              .update({ status: 'done' })
              .eq('id', session.id)
          }
          
          router.push(`/room/${code}/results`)
        }, 1000)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-gray-600">Загрузка вопросов...</div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-gray-600">Вопросы не найдены</div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIdx]
  const partnerRole = myRole === 'A' ? 'B' : 'A'
  const me = participants.find(p => p.role === myRole)
  const partner = participants.find(p => p.role === partnerRole)

  // Check if current question is complete
  const currentQuestionRatings = ratings.filter(r => r.question_id === currentQuestion.id)
  const isQuestionComplete = currentQuestionRatings.length === 4
  const myRatingsComplete = mySelfRating !== null && myPartnerRating !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Вопрос {currentQuestionIdx + 1} из {questions.length}
            </span>
            <span className="text-sm font-medium text-purple-600">
              {Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{currentQuestion.icon}</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Rating for Self */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{me?.emoji}</span>
              <h3 className="font-semibold text-gray-800">
                Оцените себя ({me?.name})
              </h3>
            </div>
            <RatingScale
              value={mySelfRating}
              onChange={(v) => submitRating(myRole!, v)}
            />
          </div>

          {/* Rating for Partner */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{partner?.emoji}</span>
              <h3 className="font-semibold text-gray-800">
                Оцените партнёра ({partner?.name})
              </h3>
            </div>
            <RatingScale
              value={myPartnerRating}
              onChange={(v) => submitRating(partnerRole, v)}
            />
          </div>

          {/* Status */}
          {myRatingsComplete && !isQuestionComplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <div className="text-yellow-800 font-medium">
                ⏳ Ждём ответов партнёра...
              </div>
            </div>
          )}

          {isQuestionComplete && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-green-800 font-medium">
                ✅ Готово! Переходим к следующему вопросу...
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="text-center text-sm text-gray-500">
          <p>Оцените по шкале от 1 до 10</p>
          <p className="mt-1">1 = минимум, 10 = максимум</p>
        </div>
      </div>
    </div>
  )
}

function RatingScale({ 
  value, 
  onChange 
}: { 
  value: number | null
  onChange: (value: number) => void
}) {
  return (
    <div className="grid grid-cols-10 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          onClick={() => onChange(num)}
          className={`aspect-square rounded-lg font-semibold transition-all ${
            value === num
              ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white scale-110 shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  )
}


