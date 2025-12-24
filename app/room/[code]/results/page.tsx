'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import html2canvas from 'html2canvas'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { buildQuestionResults, computeMatchPercentage } from '@/lib/results'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [session, setSession] = useState<SessionRecord | null>(null)
  const [questions, setQuestions] = useState<QuestionRecord[]>([])
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [ratings, setRatings] = useState<RatingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  const participantA = participants.find((p) => p.role === 'A')
  const participantB = participants.find((p) => p.role === 'B')

  const questionResults = useMemo(() => buildQuestionResults(questions, ratings), [questions, ratings])
  const matchPercentage = useMemo(() => computeMatchPercentage(questionResults), [questionResults])

  // Insights
  const sortedByGap = useMemo(() => [...questionResults].sort((a, b) => b.avgGap - a.avgGap), [questionResults])
  const topMatches = useMemo(() => [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, 3), [questionResults])
  const biggestGaps = useMemo(() => sortedByGap.slice(0, 3), [sortedByGap])
  
  // Where partner rated higher than self
  const surprisesA = useMemo(() => 
    questionResults.filter(r => r.ratings.BtoA > r.ratings.AtoA).sort((a, b) => (b.ratings.BtoA - b.ratings.AtoA) - (a.ratings.BtoA - a.ratings.AtoA)).slice(0, 2),
    [questionResults]
  )
  const surprisesB = useMemo(() => 
    questionResults.filter(r => r.ratings.AtoB > r.ratings.BtoB).sort((a, b) => (b.ratings.AtoB - b.ratings.BtoB) - (a.ratings.AtoB - a.ratings.BtoB)).slice(0, 2),
    [questionResults]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
        <div className="text-center text-white/40 animate-pulse">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[0.65rem] uppercase font-black tracking-widest italic">{errorMessage || 'Загружаем результаты...'}</p>
        </div>
      </div>
    )
  }

  if (!participantA || !participantB) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 text-center">
        <div className="space-y-6">
          <div className="text-7xl grayscale opacity-30">🙈</div>
          <p className="text-white/60 font-bold text-lg">Участники не найдены.</p>
          <Link href="/" className="inline-block text-[#e94560] underline uppercase tracking-[0.3em] font-black text-xs">На главную</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0d0d0d] py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.5em] text-white/30 font-bold mb-4">Психологическое зеркало</p>
          
          <div className="flex justify-center items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-6xl mb-2">{participantA.emoji}</div>
              <div className="text-sm font-black uppercase">{participantA.name}</div>
            </div>
            <div className="text-4xl text-white/10">×</div>
            <div className="text-center">
              <div className="text-6xl mb-2">{participantB.emoji}</div>
              <div className="text-sm font-black uppercase">{participantB.name}</div>
            </div>
          </div>

          <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4] italic">
            {matchPercentage}%
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-2">совпадение образов</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        
        {/* ===== SECTION 1: ALL RESULTS ===== */}
        <section>
          <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">📋 Все ответы</h2>
          <p className="text-sm text-white/40 mb-8">Полная разбивка по каждому вопросу</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-2 text-white/40 font-bold uppercase text-xs">Вопрос</th>
                  <th className="text-center py-4 px-2 text-[#e94560] font-bold uppercase text-xs" colSpan={2}>{participantA.name}</th>
                  <th className="text-center py-4 px-2 text-[#4ecdc4] font-bold uppercase text-xs" colSpan={2}>{participantB.name}</th>
                  <th className="text-center py-4 px-2 text-white/40 font-bold uppercase text-xs">Разрыв</th>
                </tr>
                <tr className="border-b border-white/5 text-[0.6rem] text-white/30">
                  <th></th>
                  <th className="py-2">о себе</th>
                  <th className="py-2">партнёр</th>
                  <th className="py-2">о себе</th>
                  <th className="py-2">партнёр</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {questionResults.map((result) => {
                  const hasGap = result.avgGap >= 3
                  return (
                    <tr key={result.question.questionId} className={`border-b border-white/5 ${hasGap ? 'bg-[#e94560]/5' : ''}`}>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{result.question.icon}</span>
                          <span className="font-bold">{result.question.text}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className="text-xl font-black">{result.ratings.AtoA}</span>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className={`text-xl font-black ${result.gapA >= 3 ? 'text-[#e94560]' : 'text-white/60'}`}>
                          {result.ratings.BtoA}
                          {result.gapA >= 2 && (
                            <span className="text-xs ml-1 text-white/30">
                              ({result.ratings.BtoA > result.ratings.AtoA ? '+' : ''}{result.ratings.BtoA - result.ratings.AtoA})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className="text-xl font-black">{result.ratings.BtoB}</span>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className={`text-xl font-black ${result.gapB >= 3 ? 'text-[#4ecdc4]' : 'text-white/60'}`}>
                          {result.ratings.AtoB}
                          {result.gapB >= 2 && (
                            <span className="text-xs ml-1 text-white/30">
                              ({result.ratings.AtoB > result.ratings.BtoB ? '+' : ''}{result.ratings.AtoB - result.ratings.BtoB})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-center py-4 px-2">
                        {hasGap ? (
                          <span className="bg-[#e94560]/20 text-[#e94560] px-3 py-1 rounded-full text-xs font-bold">
                            {result.avgGap.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-white/20 text-xs">{result.avgGap.toFixed(1)}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== SECTION 2: INSIGHTS ===== */}
        <section>
          <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">🔍 Инсайты</h2>
          <p className="text-sm text-white/40 mb-8">Что мы узнали</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Best Matches */}
            <div className="bg-gradient-to-br from-[#4ecdc4]/10 to-transparent rounded-3xl p-6 border border-[#4ecdc4]/20">
              <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className="text-2xl">✨</span> Где совпали
              </h3>
              <div className="space-y-3">
                {topMatches.map((m) => (
                  <div key={m.question.questionId} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">{m.question.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold">{m.question.text}</div>
                      <div className="text-xs text-white/40">Разница: {m.avgGap.toFixed(1)}</div>
                    </div>
                    <span className="text-2xl">🎯</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Biggest Gaps */}
            <div className="bg-gradient-to-br from-[#e94560]/10 to-transparent rounded-3xl p-6 border border-[#e94560]/20">
              <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Где разошлись
              </h3>
              <div className="space-y-3">
                {biggestGaps.map((m) => (
                  <div key={m.question.questionId} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <span className="text-2xl">{m.question.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold">{m.question.text}</div>
                      <div className="text-xs text-white/40">Разрыв: {m.avgGap.toFixed(1)}</div>
                    </div>
                    <span className="text-2xl">🔥</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Surprises for A */}
            {surprisesA.length > 0 && (
              <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl p-6 border border-purple-500/20">
                <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎁</span> {participantA.name} недооценивает себя
                </h3>
                <div className="space-y-3">
                  {surprisesA.map((s) => (
                    <div key={s.question.questionId} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <span className="text-2xl">{s.question.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold">{s.question.text}</div>
                        <div className="text-xs text-white/40">
                          Сам: {s.ratings.AtoA} → Партнёр видит: {s.ratings.BtoA}
                        </div>
                      </div>
                      <span className="text-green-400 font-bold">+{s.ratings.BtoA - s.ratings.AtoA}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Surprises for B */}
            {surprisesB.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-3xl p-6 border border-amber-500/20">
                <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎁</span> {participantB.name} недооценивает себя
                </h3>
                <div className="space-y-3">
                  {surprisesB.map((s) => (
                    <div key={s.question.questionId} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <span className="text-2xl">{s.question.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold">{s.question.text}</div>
                        <div className="text-xs text-white/40">
                          Сам: {s.ratings.BtoB} → Партнёр видит: {s.ratings.AtoB}
                        </div>
                      </div>
                      <span className="text-green-400 font-bold">+{s.ratings.AtoB - s.ratings.BtoB}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== SECTION 3: SHARE CARDS ===== */}
        <section>
          <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">📤 Поделиться</h2>
          <p className="text-sm text-white/40 mb-8">Скачай карточку и отправь в соцсети</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: Main Result */}
            <ShareableCard
              id="main"
              title="Главный результат"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 flex flex-col justify-between items-center text-center">
                <div>
                  <h1 className="text-lg font-black italic text-white/80">Психологическое Зеркало</h1>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl">{participantA.emoji}</div>
                    <div className="text-xs font-bold uppercase mt-2 text-white">{participantA.name}</div>
                  </div>
                  <div className="text-3xl text-white/20">×</div>
                  <div className="text-center">
                    <div className="text-5xl">{participantB.emoji}</div>
                    <div className="text-xs font-bold uppercase mt-2 text-white">{participantB.name}</div>
                  </div>
                </div>
                <div>
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
                    {matchPercentage}%
                  </div>
                  <div className="text-[0.5rem] uppercase tracking-widest text-white/30 mt-1">совпадение</div>
                </div>
                <div className="text-[0.5rem] uppercase tracking-widest text-white/20">knowing-you.app</div>
              </div>
            </ShareableCard>

            {/* Card 2: Top Insight */}
            <ShareableCard
              id="insight"
              title="Главный инсайт"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-[#e94560] to-[#4ecdc4] p-8 flex flex-col justify-between text-white">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{participantA.emoji}</span>
                  <span className="text-xl text-white/50">×</span>
                  <span className="text-3xl">{participantB.emoji}</span>
                  <div className="ml-auto bg-white/20 rounded-full px-3 py-1 text-sm font-bold">{matchPercentage}%</div>
                </div>
                
                <div className="text-center space-y-4">
                  {biggestGaps[0] && (
                    <>
                      <div className="text-6xl">{biggestGaps[0].question.icon}</div>
                      <div className="text-2xl font-black italic uppercase">{biggestGaps[0].question.text}</div>
                      <div className="text-sm text-white/80">Самый большой разрыв восприятия</div>
                    </>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs uppercase tracking-widest text-white/50">Психологическое Зеркало</div>
                </div>
              </div>
            </ShareableCard>

            {/* Card 3: Comparison Bars */}
            <ShareableCard
              id="bars"
              title="Сравнение оценок"
            >
              <div className="w-full aspect-[4/5] bg-[#0d0d0d] p-6 flex flex-col text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{participantA.emoji}</span>
                    <span className="text-lg text-white/20">×</span>
                    <span className="text-2xl">{participantB.emoji}</span>
                  </div>
                  <div className="text-2xl font-black text-[#e94560]">{matchPercentage}%</div>
                </div>
                
                <div className="flex-1 space-y-3">
                  {questionResults.slice(0, 5).map((r) => (
                    <div key={r.question.questionId} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span>{r.question.icon}</span>
                        <span className="text-white/60">{r.question.text}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b]"
                            style={{ width: `${r.ratings.AtoA * 10}%` }}
                          />
                        </div>
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#4ecdc4] to-[#44a08d]"
                            style={{ width: `${r.ratings.BtoB * 10}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-4 pt-4 text-[0.5rem] text-white/30">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#e94560]" />
                    <span>{participantA.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#4ecdc4]" />
                    <span>{participantB.name}</span>
                  </div>
                </div>
              </div>
            </ShareableCard>

            {/* Card 4: Story format */}
            <ShareableCard
              id="story"
              title="Для сторис"
            >
              <div className="w-full aspect-[9/16] bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 flex flex-col justify-between text-white text-center">
                <div>
                  <p className="text-[0.5rem] uppercase tracking-widest text-white/30">Knowing You, Knowing Me</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-center items-center gap-4">
                    <div className="text-5xl">{participantA.emoji}</div>
                    <div className="text-2xl text-white/20">💕</div>
                    <div className="text-5xl">{participantB.emoji}</div>
                  </div>
                  
                  <div>
                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
                      {matchPercentage}%
                    </div>
                    <div className="text-xs uppercase tracking-widest text-white/40 mt-2">совпадение</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-bold text-white/60">Лучший матч:</div>
                    {topMatches[0] && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">{topMatches[0].question.icon}</span>
                        <span className="font-bold">{topMatches[0].question.text}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-[0.5rem] uppercase tracking-widest text-white/20">knowing-you.app</div>
              </div>
            </ShareableCard>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-12">
          <Link href="/" className="text-sm font-bold text-white/20 hover:text-white/40 uppercase tracking-widest transition-all">
            ← Играть снова
          </Link>
        </div>
      </div>
    </div>
  )
}

// Shareable Card Component with download button
function ShareableCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!cardRef.current) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `knowing-you-${id}.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        setDownloading(false)
      })
    } catch (error) {
      console.error('Error generating image:', error)
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white/60">{title}</h3>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {downloading ? '...' : '📥 Скачать'}
        </button>
      </div>
      <div ref={cardRef} className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {children}
      </div>
    </div>
  )
}
