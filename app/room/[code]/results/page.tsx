'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { calculateGap, getGapMessage, getRandomMessage, RESULT_MESSAGES } from '@/lib/utils'
import ShareCard from '@/components/ShareCard'

type QuestionResult = {
  question: QuestionRecord
  ratings: {
    AtoA: number
    AtoB: number
    BtoA: number
    BtoB: number
  }
  avgGap: number
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [session, setSession] = useState<SessionRecord | null>(null)
  const [questions, setQuestions] = useState<QuestionRecord[]>([])
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [ratings, setRatings] = useState<RatingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareCard, setShowShareCard] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const query = new URLSearchParams({ code, include: 'questions,ratings' })
        const response = await fetch(`/api/room/state?${query.toString()}`, { cache: 'no-store' })

        if (!response.ok) {
          throw new Error('Комната не найдена')
        }

        const data = await response.json()
        if (data.session.status !== 'done') {
          router.push(`/room/${code}`)
          return
        }

        setSession(data.session)
        setQuestions(data.questions ?? [])
        setParticipants(data.participants ?? [])
        setRatings(data.ratings ?? [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load results:', error)
        setErrorMessage('Не удалось загрузить результат. Попробуйте обновить страницу.')
      }
    }

    load()
  }, [code, router])

  const participantA = participants.find((p) => p.role === 'A')
  const participantB = participants.find((p) => p.role === 'B')

  const questionResults = useMemo<QuestionResult[]>(() => {
    if (!questions.length) return []
    return questions.map((question) => {
      const qRatings = ratings.filter((rating) => rating.questionId === question.questionId)
      const AtoA = qRatings.find((r) => r.raterRole === 'A' && r.targetRole === 'A')?.value ?? 0
      const AtoB = qRatings.find((r) => r.raterRole === 'A' && r.targetRole === 'B')?.value ?? 0
      const BtoA = qRatings.find((r) => r.raterRole === 'B' && r.targetRole === 'A')?.value ?? 0
      const BtoB = qRatings.find((r) => r.raterRole === 'B' && r.targetRole === 'B')?.value ?? 0

      const gap = (calculateGap(AtoA, BtoA) + calculateGap(BtoB, AtoB)) / 2

      return {
        question,
        ratings: { AtoA, AtoB, BtoA, BtoB },
        avgGap: gap
      }
    })
  }, [questions, ratings])

  const matchPercentage = useMemo(() => {
    if (!questionResults.length) return 0
    const totalGap = questionResults.reduce((acc, item) => acc + item.avgGap, 0) / questionResults.length
    return Math.max(0, Math.round(100 - (totalGap / 10) * 100))
  }, [questionResults])

  const topMatches = useMemo(
    () => [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, 3),
    [questionResults]
  )

  const topDifferences = useMemo(
    () => [...questionResults].sort((a, b) => b.avgGap - a.avgGap).slice(0, 3),
    [questionResults]
  )

  const message = useMemo(() => {
    if (matchPercentage >= 70) return getRandomMessage(RESULT_MESSAGES.highMatch)
    if (matchPercentage >= 40) return getRandomMessage(RESULT_MESSAGES.mediumMatch)
    return getRandomMessage(RESULT_MESSAGES.lowMatch)
  }, [matchPercentage])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">📊</div>
          <p>{errorMessage || 'Считаем совпадения...'}</p>
        </div>
      </div>
    )
  }

  if (!participantA || !participantB) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">🙈</div>
          <p>Участники не найдены. Вернитесь на главную.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Итоги</p>
          <h1 className="text-4xl font-bold text-gray-900 mt-2">Совпадения 🎉</h1>
          <p className="text-gray-600 mt-2">{message}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="text-6xl mb-4">{matchPercentage >= 70 ? '💕' : matchPercentage >= 40 ? '😊' : '🤔'}</div>
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            {matchPercentage}%
          </div>
          <p className="mt-2 text-sm uppercase tracking-[0.4em] text-gray-500">совместимость</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-around">
          <ParticipantPill participant={participantA} />
          <div className="text-4xl text-gray-400 text-center">💞</div>
          <ParticipantPill participant={participantB} />
        </div>

        {questionResults.length > 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Сравнение первых 8 вопросов</h2>
            <div className="grid gap-3">
              {questionResults.slice(0, 8).map((result) => (
                <div key={result.question.questionId} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{result.question.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{result.question.text}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        Разница: {result.avgGap.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Совпадения</h3>
            <div className="space-y-3">
              {topMatches.map((result, idx) => (
                <ResultCard
                  key={result.question.questionId}
                  question={result.question.text}
                  icon={result.question.icon}
                  description={`${getGapMessage(result.avgGap)} · разница ${result.avgGap.toFixed(1)}`}
                  badge={idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  tone="positive"
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🤔 Контрасты</h3>
            <div className="space-y-3">
              {topDifferences.map((result) => (
                <ResultCard
                  key={result.question.questionId}
                  question={result.question.text}
                  icon={result.question.icon}
                  description={`${getGapMessage(result.avgGap)} · разница ${result.avgGap.toFixed(1)}`}
                  tone="warning"
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowShareCard(true)}
          className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-semibold text-white shadow-xl"
        >
          Создать шэр-картинку 📸
        </button>

        <div className="text-center">
          <a href="/" className="text-sm font-semibold text-gray-700 underline">
            Играть снова
          </a>
        </div>
      </div>

      {showShareCard && topMatches[0] && (
        <ShareCard
          participantA={participantA}
          participantB={participantB}
          matchPercentage={matchPercentage}
          topMatch={{
            question: {
              text: topMatches[0].question.text,
              icon: topMatches[0].question.icon ?? '❓'
            },
            avgGap: topMatches[0].avgGap
          }}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  )
}

function ParticipantPill({ participant }: { participant: ParticipantRecord }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-5xl">{participant.emoji}</div>
      <p className="text-lg font-semibold text-gray-900">{participant.name}</p>
    </div>
  )
}

function ResultCard({
  question,
  icon,
  description,
  badge,
  tone = 'neutral'
}: {
  question: string
  icon: string
  description: string
  badge?: string
  tone?: 'positive' | 'warning' | 'neutral'
}) {
  const toneClasses =
    tone === 'positive'
      ? 'bg-green-50 border-green-200 text-green-900'
      : tone === 'warning'
        ? 'bg-orange-50 border-orange-200 text-orange-900'
        : 'bg-gray-50 border-gray-200 text-gray-900'

  return (
    <div className={`rounded-2xl border ${toneClasses} p-4`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <p className="font-semibold">{question}</p>
          <p className="text-sm opacity-80">{description}</p>
        </div>
        {badge && <div className="text-2xl">{badge}</div>}
      </div>
    </div>
  )
}

