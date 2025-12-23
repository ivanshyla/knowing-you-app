'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { Share } from '@capacitor/share'
import { isCapacitor } from '@/lib/capacitor'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { getGapMessage, getRandomMessage, RESULT_MESSAGES } from '@/lib/utils'
import ShareCard from '@/components/ShareCard'
import { buildQuestionResults, computeMatchPercentage, pickTopDifferences, pickTopMatches } from '@/lib/results'

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
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const queryParams = new URLSearchParams({ code, include: 'questions,ratings' })
        const response = await apiFetch(`/api/room/state?${queryParams.toString()}`, { cache: 'no-store' })

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const participantA = participants.find((p) => p.role === 'A')
  const participantB = participants.find((p) => p.role === 'B')

  const questionResults = useMemo(() => buildQuestionResults(questions, ratings), [questions, ratings])

  const matchPercentage = useMemo(() => {
    return computeMatchPercentage(questionResults)
  }, [questionResults])

  const topMatches = useMemo(() => pickTopMatches(questionResults, 3), [questionResults])

  const topDifferences = useMemo(() => pickTopDifferences(questionResults, 3), [questionResults])

  const shareUrl = useMemo(() => {
    if (!session || !origin) return ''
    return `${origin}/share/${session.id}`
  }, [origin, session])

  const copyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy share link:', error)
      window.prompt('Скопируйте ссылку:', shareUrl)
    }
  }

  const shareResult = async () => {
    if (!shareUrl) return
    try {
      if (isCapacitor()) {
        await Share.share({
          title: 'Knowing You, Knowing Me — результат',
          text: 'Посмотри наш результат 👇',
          url: shareUrl,
          dialogTitle: 'Поделиться результатом'
        })
        return
      }
      if (navigator.share) {
        await navigator.share({
          title: 'Knowing You, Knowing Me — результат',
          text: 'Посмотри наш результат 👇',
          url: shareUrl
        })
        return
      }
    } catch (error) {
      // ignore and fallback to copy
      console.warn('Share cancelled/failed:', error)
    }
    await copyShareLink()
  }

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

        <div className="rounded-3xl bg-white p-6 shadow-xl space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Поделиться</h3>
          <p className="text-sm text-gray-600">
            Ссылка ведёт на публичную страницу результата (секретный id, не код комнаты).
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={shareResult}
              disabled={!shareUrl}
              className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-semibold text-white shadow-xl disabled:opacity-50"
            >
              Поделиться ссылкой 📤
            </button>
            <button
              onClick={copyShareLink}
              disabled={!shareUrl}
              className="flex-1 rounded-full border border-gray-200 bg-white py-4 text-lg font-semibold text-gray-900 shadow-sm disabled:opacity-50"
            >
              {copied ? 'Скопировано ✅' : 'Копировать ссылку 🔗'}
            </button>
          </div>
          <button
            onClick={() => setShowShareCard(true)}
            className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 py-4 text-lg font-semibold text-white shadow-xl"
          >
            Создать шэр-картинку 📸
          </button>
        </div>

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
          shareUrl={shareUrl || undefined}
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

