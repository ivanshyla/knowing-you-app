'use client'

import Link from 'next/link'
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
        setErrorMessage('Не удалось загрузить результат.')
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

  const surprises = useMemo(() => {
    return questionResults
      .filter(r => (participantA?.role === 'A' ? r.ratings.BtoA > r.ratings.AtoA : r.ratings.AtoB > r.ratings.BtoB))
      .sort((a, b) => (participantA?.role === 'A' ? b.ratings.BtoA - b.ratings.AtoA : b.ratings.AtoB - b.ratings.BtoB))
      .slice(0, 3)
  }, [questionResults, participantA])

  const blindSpots = useMemo(() => {
    return [...questionResults].sort((a, b) => Math.max(b.gapA, b.gapB) - Math.max(a.gapA, a.gapB)).slice(0, 3)
  }, [questionResults])

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
      <div className="min-h-screen bg-[#1F313B] flex items-center justify-center px-4">
        <div className="text-center text-white/40 animate-pulse">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[0.65rem] uppercase font-black tracking-widest italic">{errorMessage || 'Считаем совпадения...'}</p>
        </div>
      </div>
    )
  }

  if (!participantA || !participantB) {
    return (
      <div className="min-h-screen bg-[#1F313B] flex items-center justify-center px-4 text-center">
        <div className="space-y-6">
          <div className="text-7xl grayscale opacity-30 drop-shadow-2xl">🙈</div>
          <p className="text-white/60 font-bold text-lg">Участники не найдены.</p>
          <Link href="/" className="inline-block text-[#BE4039] underline uppercase tracking-[0.3em] font-black text-xs transition-all hover:opacity-80">На главную</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1F313B] text-white py-12 px-6 overflow-x-hidden">
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-gradient-to-b from-[#BE4039]/20 via-[#383852]/40 to-[#1F313B] pointer-events-none" 
      />
      <div className="relative z-10 max-w-2xl mx-auto space-y-10 pb-12">
        <div className="text-center space-y-2">
          <p className="text-[0.65rem] uppercase tracking-[0.5em] text-white/40 font-bold italic">ИТОГИ</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white italic uppercase">Результаты 🎉</h1>
          <p className="text-white/60 font-medium px-8 leading-relaxed mt-4">{message}</p>
        </div>

        <div className="rounded-[3rem] bg-white/5 border border-white/10 p-12 text-center shadow-2xl backdrop-blur-md">
          <div className="text-8xl mb-8 drop-shadow-2xl">{matchPercentage >= 70 ? '💕' : matchPercentage >= 40 ? '😊' : '🤔'}</div>
          <div className="text-8xl font-black text-white italic leading-none tracking-tighter">
            {matchPercentage}%
          </div>
          <p className="mt-6 text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-black">совпадение образов</p>
        </div>

        <div className="rounded-[2.5rem] bg-white/5 border border-white/10 p-10 shadow-xl backdrop-blur-sm flex flex-col gap-10 md:flex-row md:items-center md:justify-around shadow-inner">
          <ParticipantPill name={participantA.name} emoji={participantA.emoji} />
          <div className="text-5xl text-white/10 text-center italic font-black">×</div>
          <ParticipantPill name={participantB.name} emoji={participantB.emoji} />
        </div>

        {surprises.length > 0 && (
          <div className="rounded-[2.5rem] bg-gradient-to-br from-[#BE4039] via-[#B94E56] to-[#784259] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-2xl font-black italic mb-2 text-center uppercase tracking-tighter">Сюрприз ✨</h3>
            <p className="text-xs text-white/70 font-bold uppercase tracking-[0.2em] mb-8 text-center">Где тебя ценят выше, чем ты сам</p>
            <div className="grid gap-4">
              {surprises.map(s => (
                <div key={s.question.questionId} className="flex items-center gap-5 bg-white/10 rounded-[1.5rem] p-5 border border-white/10 shadow-lg backdrop-blur-sm">
                  <span className="text-4xl drop-shadow-lg">{s.question.icon}</span>
                  <span className="font-black text-lg italic">{s.question.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8">
          <SectionBlock title="🎯 Совпадения" description="Где ваши образы совпали идеально">
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
          </SectionBlock>

          <SectionBlock title="👁️ Различия" description="Где ваше восприятие разошлось">
            {topDifferences.map((result: any) => (
              <ResultRow
                key={result.question.questionId}
                icon={result.question.icon}
                question={result.question.text}
                description={`Разрыв восприятия: ${result.avgGap.toFixed(1)}`}
                tone="warning"
              />
            ))}
          </SectionBlock>
        </div>

        {/* Детальная разбивка по всем вопросам */}
        <div className="rounded-[2.5rem] bg-white/2 border border-white/5 p-10 space-y-8 shadow-xl backdrop-blur-sm">
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">📋 Все вопросы</h3>
            <p className="text-[0.6rem] text-white/30 uppercase tracking-[0.2em] font-black">Детальное сравнение оценок</p>
          </div>
          
          <div className="space-y-6">
            {questionResults.map((result) => (
              <DetailedQuestionCard
                key={result.question.questionId}
                question={result.question}
                ratings={result.ratings}
                gapA={result.gapA}
                gapB={result.gapB}
                participantA={participantA}
                participantB={participantB}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[3rem] bg-white/5 border border-white/10 p-12 shadow-2xl backdrop-blur-md space-y-10">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Поделиться</h3>
            <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Ведёт на публичную страницу</p>
          </div>
          <div className="grid gap-5">
            <button
              onClick={shareResult}
              disabled={!shareUrl}
              className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-black uppercase tracking-[0.15em] text-white shadow-xl shadow-red-950/50 transition-all active:scale-95 disabled:opacity-40"
            >
              ПОДЕЛИТЬСЯ ССЫЛКОЙ 📤
            </button>
            <button
              onClick={copyShareLink}
              disabled={!shareUrl}
              className="w-full rounded-full border-2 border-white/10 bg-white/5 py-6 text-sm font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-40"
            >
              {copied ? 'СКОПИРОВАНА ✅' : 'КОПИРОВАТЬ ССЫЛКУ 🔗'}
            </button>
            <button
              onClick={() => setShowShareCard(true)}
              className="w-full rounded-full bg-white text-gray-900 py-6 text-sm font-black uppercase tracking-widest shadow-2xl shadow-white/10 transition-all active:scale-95"
            >
              СОЗДАТЬ КАРТИНКУ 📸
            </button>
          </div>
        </div>

        <div className="text-center pb-12">
          <Link href="/" className="text-[0.65rem] font-black text-white/20 hover:text-white/40 uppercase tracking-[0.4em] transition-all">
            ИГРАТЬ СНОВА
          </Link>
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

function SectionBlock({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="rounded-[2.5rem] bg-white/2 border border-white/5 p-10 space-y-8 shadow-xl backdrop-blur-sm">
      <div className="space-y-2">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter">{title}</h3>
        <p className="text-[0.6rem] text-white/30 uppercase tracking-[0.2em] font-black">{description}</p>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function ParticipantPill({ name, emoji }: { name: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-7xl drop-shadow-2xl">{emoji}</div>
      <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{name}</p>
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
      ? 'border-[#BE4039]/20 bg-[#BE4039]/5 text-white'
      : 'border-white/10 bg-white/5 text-white/80'

  return (
    <div className={`rounded-[2rem] border-2 ${toneClasses} p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-5">
        <div className="text-5xl drop-shadow-lg">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-lg leading-tight truncate italic uppercase tracking-tight">{question}</p>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/30 mt-2">{description}</p>
        </div>
        {badge && <div className="text-4xl drop-shadow-2xl">{badge}</div>}
      </div>
    </div>
  )
}

function DetailedQuestionCard({
  question,
  ratings,
  gapA,
  gapB,
  participantA,
  participantB
}: {
  question: QuestionRecord
  ratings: { AtoA: number; AtoB: number; BtoA: number; BtoB: number }
  gapA: number
  gapB: number
  participantA: ParticipantRecord
  participantB: ParticipantRecord
}) {
  const maxGap = Math.max(gapA, gapB)
  const hasSignificantGap = maxGap >= 3
  
  return (
    <div className={`rounded-[2rem] border-2 p-6 transition-all ${
      hasSignificantGap 
        ? 'border-[#BE4039]/30 bg-[#BE4039]/5' 
        : 'border-white/10 bg-white/5'
    }`}>
      {/* Заголовок вопроса */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl">{question.icon}</span>
        <h4 className="font-black text-lg italic uppercase tracking-tight flex-1">{question.text}</h4>
        {hasSignificantGap && <span className="text-2xl">⚠️</span>}
      </div>
      
      {/* Сетка оценок */}
      <div className="grid grid-cols-2 gap-4">
        {/* Блок для участника A */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{participantA.emoji}</span>
            <span className="text-sm font-bold uppercase tracking-wide text-white/60">{participantA.name}</span>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <div className="text-[0.6rem] text-white/40 uppercase tracking-widest font-bold mb-1">Сам о себе</div>
            <div className="text-3xl font-black text-white">{ratings.AtoA}</div>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <div className="text-[0.6rem] text-white/40 uppercase tracking-widest font-bold mb-1">{participantB.name} о нём</div>
            <div className={`text-3xl font-black ${gapA >= 3 ? 'text-[#BE4039]' : 'text-white'}`}>
              {ratings.BtoA}
              {gapA >= 2 && (
                <span className="text-sm ml-2 text-white/40">
                  ({ratings.BtoA > ratings.AtoA ? '+' : ''}{ratings.BtoA - ratings.AtoA})
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Блок для участника B */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{participantB.emoji}</span>
            <span className="text-sm font-bold uppercase tracking-wide text-white/60">{participantB.name}</span>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <div className="text-[0.6rem] text-white/40 uppercase tracking-widest font-bold mb-1">Сам о себе</div>
            <div className="text-3xl font-black text-white">{ratings.BtoB}</div>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <div className="text-[0.6rem] text-white/40 uppercase tracking-widest font-bold mb-1">{participantA.name} о нём</div>
            <div className={`text-3xl font-black ${gapB >= 3 ? 'text-[#BE4039]' : 'text-white'}`}>
              {ratings.AtoB}
              {gapB >= 2 && (
                <span className="text-sm ml-2 text-white/40">
                  ({ratings.AtoB > ratings.BtoB ? '+' : ''}{ratings.AtoB - ratings.BtoB})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Индикатор разрыва */}
      {hasSignificantGap && (
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#BE4039]">
            Разрыв восприятия: {maxGap.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  )
}
