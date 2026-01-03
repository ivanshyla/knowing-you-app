'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { apiFetch } from '@/lib/apiClient'

type RatingTarget = 'A' | 'B'

export default function QuestionsPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [session, setSession] = useState<SessionRecord | null>(null)
  const [questions, setQuestions] = useState<QuestionRecord[]>([])
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [ratings, setRatings] = useState<RatingRecord[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [myRole, setMyRole] = useState<'A' | 'B' | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [waitingForPartner, setWaitingForPartner] = useState(false)
  
  const currentQuestion = questions[currentQuestionIdx]
  const partnerRole: RatingTarget | null = myRole === 'A' ? 'B' : myRole === 'B' ? 'A' : null
  const me = participants.find((p) => p.role === myRole)
  const partner = participants.find((p) => p.role === partnerRole)

  const currentRatings = useMemo(() => {
    if (!currentQuestion) return []
    return ratings.filter((rating) => rating.questionId === currentQuestion.questionId)
  }, [ratings, currentQuestion])

  const mySelfRating = useMemo(() => {
    if (!myRole) return null
    return (
      currentRatings.find(
        (rating) => rating.raterRole === myRole && rating.targetRole === myRole
      )?.value ?? null
    )
  }, [currentRatings, myRole])

  const myPartnerRating = useMemo(() => {
    if (!myRole || !partnerRole) return null
    return (
      currentRatings.find(
        (rating) => rating.raterRole === myRole && rating.targetRole === partnerRole
      )?.value ?? null
    )
  }, [currentRatings, myRole, partnerRole])

  const myRatingsComplete = mySelfRating !== null && myPartnerRating !== null

  const redirectToLobby = useCallback(() => {
    router.push(`/room/${code}`)
  }, [code, router])

  const redirectToResults = useCallback(() => {
    router.push(`/room/${code}/results`)
  }, [code, router])

  const loadInitialState = useCallback(async () => {
    try {
      const query = new URLSearchParams({ code, include: 'questions,ratings' })
      const response = await apiFetch(`/api/room/state?${query.toString()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Комната недоступна')

      const data = await response.json()
      if (data.session.status === 'lobby') {
        redirectToLobby()
        return
      }

      if (data.session.status === 'done') {
        redirectToResults()
        return
      }

      setSession(data.session)
      setQuestions(data.questions ?? [])
      setParticipants(data.participants ?? [])
      setRatings(data.ratings ?? [])
      
      if (data.questions && data.ratings && myRole) {
        let firstUnansweredIdx = 0
        for (let i = 0; i < data.questions.length; i++) {
          const q = data.questions[i]
          const hasSelf = data.ratings.some((r: any) => r.questionId === q.questionId && r.raterRole === myRole && r.targetRole === myRole)
          const hasPartner = data.ratings.some((r: any) => r.questionId === q.questionId && r.raterRole === myRole && r.targetRole !== myRole)
          if (!hasSelf || !hasPartner) {
            firstUnansweredIdx = i
            break
          }
          if (i === data.questions.length - 1) {
            setWaitingForPartner(true)
          }
        }
        setCurrentQuestionIdx(firstUnansweredIdx)
      }

      setErrorMessage(null)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load questions:', error)
      setErrorMessage('Не удалось загрузить вопросы.')
    }
  }, [code, myRole, redirectToLobby, redirectToResults])

  useEffect(() => {
    const storedRole = localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null
    if (!storedRole) {
      redirectToLobby()
      return
    }
    setMyRole(storedRole)
  }, [code, redirectToLobby])

  useEffect(() => {
    if (myRole) loadInitialState()
  }, [myRole, loadInitialState])

  useEffect(() => {
    if (!session || waitingForPartner) return

    let cancelled = false
    const poll = async () => {
      try {
        const query = new URLSearchParams({ code })
        const response = await apiFetch(`/api/room/state?${query.toString()}`, { cache: 'no-store' })
        if (!response.ok || cancelled) return
        const data = await response.json()
        if (data.session.status === 'done') {
          redirectToResults()
        }
      } catch (error) {
        console.error('Failed to poll status:', error)
      }
    }

    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [code, redirectToResults, session, waitingForPartner])

  useEffect(() => {
    if (!myRatingsComplete || waitingForPartner) return

    if (currentQuestionIdx < questions.length - 1) {
      const timer = setTimeout(() => setCurrentQuestionIdx((prev) => prev + 1), 600)
      return () => clearTimeout(timer)
    } else {
      setWaitingForPartner(true)
      checkIfBothFinished()
    }
  }, [myRatingsComplete, currentQuestionIdx, questions.length, waitingForPartner])

  const checkIfBothFinished = async () => {
    try {
      const query = new URLSearchParams({ code, include: 'ratings' })
      const response = await apiFetch(`/api/room/state?${query.toString()}`, { cache: 'no-store' })
      const data = await response.json()
      
      const totalRequired = questions.length * 4
      if (data.ratings?.length >= totalRequired) {
        await apiFetch('/api/finish-session', {
          method: 'POST',
          body: JSON.stringify({ sessionId: session?.id })
        })
        redirectToResults()
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!waitingForPartner) return
    const interval = setInterval(checkIfBothFinished, 3000)
    return () => clearInterval(interval)
  }, [waitingForPartner, questions.length, session])

  const submitRating = async (targetRole: RatingTarget, value: number) => {
    if (!session || !currentQuestion || !myRole) return
    setSubmitting(true)
    try {
      const response = await apiFetch('/api/submit-rating', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.questionId,
          raterRole: myRole,
          targetRole,
          value
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || 'Не удалось сохранить')
      }

      const ratingKey = `${currentQuestion.questionId}#${myRole}#${targetRole}`
      setRatings((prev) => {
        const next = prev.filter((rating) => rating.ratingKey !== ratingKey)
        next.push({
          sessionId: session.id,
          ratingKey,
          questionId: currentQuestion.questionId,
          raterRole: myRole,
          targetRole,
          value,
          createdAt: new Date().toISOString()
        })
        return [...next]
      })
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Ошибка сохранения.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F313B] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm italic">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (waitingForPartner) {
    return (
      <div className="min-h-screen bg-[#1F313B] text-white py-12 px-6 flex items-center justify-center">
        <div 
          aria-hidden="true" 
          className="fixed inset-0 bg-gradient-to-b from-[#BE4039]/20 via-[#383852]/40 to-[#1F313B] pointer-events-none" 
        />
        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-[3rem] p-12 shadow-2xl text-center space-y-8 backdrop-blur-md">
          <div className="text-8xl drop-shadow-2xl">🎉</div>
          <h2 className="text-4xl font-bold leading-tight italic uppercase tracking-tighter">{t('game.youDone')}</h2>
          <p className="text-white/60 font-medium text-lg px-4">{t('game.waitingPartnerMessage')}</p>
          <div className="py-6 px-8 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-4 shadow-inner">
            <div className="h-3 w-3 rounded-full bg-[#BE4039] animate-bounce shadow-lg shadow-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-[#BE4039] animate-bounce [animation-delay:0.2s] shadow-lg shadow-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-[#BE4039] animate-bounce [animation-delay:0.4s] shadow-lg shadow-red-500/50" />
            <span className="text-white/80 font-black text-sm tracking-widest uppercase ml-2">{t('game.waiting')}</span>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-[0.65rem] font-bold text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-all italic"
          >
            {t('common.backToHome')}
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round(((currentQuestionIdx + 1) / questions.length) * 100)

  return (
    <div className="min-h-screen bg-[#1F313B] text-white py-10 px-6">
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-gradient-to-b from-[#BE4039]/20 via-[#383852]/40 to-[#1F313B] pointer-events-none" 
      />
      <div className="relative z-10 max-w-md mx-auto space-y-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[0.6rem] font-black uppercase tracking-[0.4em] text-white/40 italic">
            <span>ВОПРОС {currentQuestionIdx + 1} / {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/5 p-1 shadow-inner border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#BE4039] via-[#EC4899] to-[#784259] transition-all duration-700 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-[3rem] bg-white/5 border border-white/10 p-10 shadow-2xl backdrop-blur-md space-y-12">
          <div className="text-center space-y-6">
            <div className="text-8xl drop-shadow-2xl">{currentQuestion.icon}</div>
            <h2 className="text-3xl font-black leading-tight text-white italic uppercase tracking-tighter">{currentQuestion.text}</h2>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl drop-shadow-lg shrink-0">{me?.emoji || '👤'}</span>
                <p className="text-[0.65rem] font-black text-white/40 uppercase tracking-[0.3em]">{t('game.aboutYou')}</p>
              </div>
              <RatingScale value={mySelfRating} disabled={submitting} onChange={(value) => submitRating(myRole!, value)} color="#BE4039" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl drop-shadow-lg shrink-0">{partner?.emoji || '❔'}</span>
                <p className="text-[0.65rem] font-black text-white/40 uppercase tracking-[0.3em]">{t('game.aboutThem')} <span className="text-white font-black italic">{partner?.name || t('results.them')}</span>?</p>
              </div>
              <RatingScale
                value={myPartnerRating}
                disabled={submitting}
                onChange={(value) => submitRating(partnerRole!, value)}
                color="#EC4899"
              />
            </div>
          </div>
        </div>

        <p className="text-center text-[0.6rem] font-bold text-white/20 uppercase tracking-[0.4em] italic">{t('game.scale')}</p>
      </div>
    </div>
  )
}

function RatingScale({
  value,
  onChange,
  disabled,
  color = '#BE4039'
}: {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  color?: string
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {Array.from({ length: 10 }, (_, idx) => idx + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          className={`h-14 rounded-2xl font-black text-xl transition-all active:scale-90 shadow-lg ${
            value === score
              ? 'text-white scale-110 ring-2 ring-white shadow-2xl'
              : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white/60'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          style={value === score ? { backgroundColor: color } : {}}
        >
          {score}
        </button>
      ))}
    </div>
  )
}
