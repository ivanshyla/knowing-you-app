'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ParticipantRecord, SessionRecord } from '@/lib/models'
import { getGapMessage, RESULT_MESSAGES } from '@/lib/utils'
import { apiFetch } from '@/lib/apiClient'

type ShareDetails = {
  session: SessionRecord
  participantA: ParticipantRecord
  participantB: ParticipantRecord
  matchPercentage: number
  topMatches: any[]
  topDifferences: any[]
}

export default function ShareResultPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [data, setData] = useState<ShareDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/share/details?sessionId=${sessionId}`)
        if (!res.ok) throw new Error('Результат не найден')
        const details = await res.json()
        setData(details)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">📊</div>
          <p>Загружаем результат...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">🙈</div>
          <p>{error || 'Что-то пошло не так'}</p>
          <Link href="/" className="mt-4 inline-block text-purple-600 underline">На главную</Link>
        </div>
      </div>
    )
  }

  const { participantA, participantB, matchPercentage, topMatches, topDifferences } = data
  const message = matchPercentage >= 70 
    ? RESULT_MESSAGES.highMatch[0] 
    : matchPercentage >= 40 
      ? RESULT_MESSAGES.mediumMatch[0] 
      : RESULT_MESSAGES.lowMatch[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Результат по ссылке</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900">Совпадения 🎉</h1>
          <p className="mt-2 text-gray-600">{message}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="text-6xl mb-4">{matchPercentage >= 70 ? '💕' : matchPercentage >= 40 ? '😊' : '🤔'}</div>
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            {matchPercentage}%
          </div>
          <p className="mt-2 text-sm uppercase tracking-[0.4em] text-gray-500">совместимость</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-around">
          <ParticipantPill name={participantA.name} emoji={participantA.emoji} />
          <div className="text-4xl text-gray-400 text-center">💞</div>
          <ParticipantPill name={participantB.name} emoji={participantB.emoji} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Совпадения</h3>
            <div className="space-y-3">
              {topMatches.map((result: any, idx: number) => (
                <ResultRow
                  key={result.question.questionId}
                  badge={idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  icon={result.question.icon}
                  question={result.question.text}
                  description={`${getGapMessage(result.avgGap)} · разница ${result.avgGap.toFixed(1)}`}
                  tone="positive"
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🤔 Контрасты</h3>
            <div className="space-y-3">
              {topDifferences.map((result: any) => (
                <ResultRow
                  key={result.question.questionId}
                  icon={result.question.icon}
                  question={result.question.text}
                  description={`${getGapMessage(result.avgGap)} · разница ${result.avgGap.toFixed(1)}`}
                  tone="warning"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-xl">
          <p className="text-sm text-gray-700">
            Хотите сыграть вдвоём? Создайте комнату, отправьте ссылку другу и пройдите вопросы за 5–10 минут.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-semibold text-white shadow-xl"
          >
            Запустить игру →
          </Link>
        </div>
      </div>
    </div>
  )
}

function ParticipantPill({ name, emoji }: { name: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-5xl">{emoji}</div>
      <p className="text-lg font-semibold text-gray-900">{name}</p>
    </div>
  )
}

function ResultRow({
  icon,
  question,
  description,
  badge,
  tone
}: {
  icon: string
  question: string
  description: string
  badge?: string
  tone: 'positive' | 'warning'
}) {
  const toneClasses =
    tone === 'positive'
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-orange-50 border-orange-200 text-orange-900'

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
