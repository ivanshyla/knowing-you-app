'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'

type RatingTarget = 'A' | 'B'

export default function QuestionsPage() {
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
  const completedQuestionsRef = useRef<Set<string>>(new Set())

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

  const isQuestionComplete = currentRatings.length === 4
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
      if (!response.ok) {
        throw new Error('Комната недоступна')
      }

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
      setCurrentQuestionIdx(0)
      completedQuestionsRef.current.clear()
      setErrorMessage(null)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load questions:', error)
      setErrorMessage('Не удалось загрузить вопросы. Попробуйте обновить страницу.')
    }
  }, [code, redirectToLobby, redirectToResults])

  useEffect(() => {
    const storedRole = localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null
    if (!storedRole) {
      redirectToLobby()
      return
    }
    setMyRole(storedRole)
    loadInitialState()
  }, [code, loadInitialState, redirectToLobby])

  useEffect(() => {
    if (!session) return

    let cancelled = false
    const poll = async () => {
      try {
        const query = new URLSearchParams({ code, include: 'ratings' })
        const response = await apiFetch(`/api/room/state?${query.toString()}`, { cache: 'no-store' })
        if (!response.ok || cancelled) return
        const data = await response.json()
        setRatings(data.ratings ?? [])
        if (data.session.status === 'done') {
          redirectToResults()
        }
      } catch (error) {
        console.error('Failed to poll ratings:', error)
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [code, redirectToResults, session])

  useEffect(() => {
    if (!session || !currentQuestion) return
    if (!isQuestionComplete) return
    if (completedQuestionsRef.current.has(currentQuestion.questionId)) return

    completedQuestionsRef.current.add(currentQuestion.questionId)

    if (currentQuestionIdx < questions.length - 1) {
      const timer = setTimeout(() => setCurrentQuestionIdx((prev) => prev + 1), 1000)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(async () => {
      try {
        await apiFetch('/api/finish-session', {
          method: 'POST',
          body: JSON.stringify({ sessionId: session.id })
        })
      } catch (error) {
        console.error('Failed to finish session:', error)
      } finally {
        redirectToResults()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [
    currentQuestion,
    currentQuestionIdx,
    isQuestionComplete,
    questions.length,
    redirectToResults,
    session
  ])

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
        return next
      })
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Не удалось сохранить ответ. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">🌒</div>
          <p>{errorMessage || 'Загружаем вопросы...'}</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion || !myRole || !partnerRole || !me || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">🙈</div>
          <p>Что-то пошло не так. Вернитесь в комнату.</p>
        </div>
      </div>
    )
  }

  const progress = Math.round(((currentQuestionIdx + 1) / questions.length) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Вопрос {currentQuestionIdx + 1} из {questions.length}
            </span>
            <span className="font-semibold text-purple-600">{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{currentQuestion.icon}</div>
            <h2 className="text-2xl font-semibold text-gray-900">{currentQuestion.text}</h2>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{me.emoji}</span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Вы о себе</p>
                <p className="font-semibold text-gray-900">{me.name}</p>
              </div>
            </div>
            <RatingScale value={mySelfRating} disabled={submitting} onChange={(value) => submitRating(myRole, value)} />
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{partner.emoji}</span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Вы о партнёре</p>
                <p className="font-semibold text-gray-900">{partner.name}</p>
              </div>
            </div>
            <RatingScale
              value={myPartnerRating}
              disabled={submitting}
              onChange={(value) => submitRating(partnerRole, value)}
            />
          </div>

          {myRatingsComplete && !isQuestionComplete && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-900">
              Ждём ответы второго игрока...
            </div>
          )}

          {isQuestionComplete && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-green-900">
              Ответы собраны! Перелистываем...
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">Шкала от 1 (минимум) до 10 (максимум)</p>
      </div>
    </div>
  )
}

function RatingScale({
  value,
  onChange,
  disabled
}: {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-10 gap-2">
      {Array.from({ length: 10 }, (_, idx) => idx + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          className={`aspect-square rounded-xl font-semibold transition ${
            value === score
              ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {score}
        </button>
      ))}
    </div>
  )
}

