'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import html2canvas from 'html2canvas'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { buildQuestionResults, computeMatchPercentage } from '@/lib/results'

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)

  const animate = useCallback(() => {
    setIsAnimating(true)
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        setIsAnimating(false)
      }
    }
    requestAnimationFrame(tick)
  }, [end, duration, start])

  return { count, animate, isAnimating }
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Wrapped-style slides
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideAnimating, setSlideAnimating] = useState(false)

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
  const topMatches = useMemo(() => [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, 3), [questionResults])
  const biggestGaps = useMemo(() => [...questionResults].sort((a, b) => b.avgGap - a.avgGap).slice(0, 3), [questionResults])
  const surprisesA = useMemo(() => 
    questionResults.filter(r => r.ratings.BtoA > r.ratings.AtoA).sort((a, b) => (b.ratings.BtoA - b.ratings.AtoA) - (a.ratings.BtoA - a.ratings.AtoA)).slice(0, 2),
    [questionResults]
  )

  const nextSlide = () => {
    if (slideAnimating) return
    setSlideAnimating(true)
    setTimeout(() => {
      setCurrentSlide(prev => Math.min(prev + 1, 5))
      setSlideAnimating(false)
    }, 300)
  }

  const prevSlide = () => {
    if (slideAnimating) return
    setSlideAnimating(true)
    setTimeout(() => {
      setCurrentSlide(prev => Math.max(prev - 1, 0))
      setSlideAnimating(false)
    }, 300)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center text-white/40 animate-pulse">
          <div className="text-6xl mb-4 animate-bounce">✨</div>
          <p className="text-sm uppercase tracking-widest font-bold">{errorMessage || 'Подготовка...'}</p>
        </div>
      </div>
    )
  }

  if (!participantA || !participantB) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-center text-white">
        <div className="space-y-6">
          <div className="text-7xl">🙈</div>
          <p className="text-white/60">Участники не найдены.</p>
          <Link href="/" className="text-[#e94560] underline">На главную</Link>
        </div>
      </div>
    )
  }

  const slides = [
    // Slide 0: Intro
    <IntroSlide key="intro" participantA={participantA} participantB={participantB} onNext={nextSlide} />,
    // Slide 1: Match percentage reveal
    <MatchRevealSlide key="match" matchPercentage={matchPercentage} participantA={participantA} participantB={participantB} onNext={nextSlide} onPrev={prevSlide} />,
    // Slide 2: Best matches
    <BestMatchesSlide key="best" topMatches={topMatches} onNext={nextSlide} onPrev={prevSlide} />,
    // Slide 3: Biggest gaps
    <BiggestGapsSlide key="gaps" biggestGaps={biggestGaps} onNext={nextSlide} onPrev={prevSlide} />,
    // Slide 4: Surprises
    <SurprisesSlide key="surprises" surprisesA={surprisesA} participantA={participantA} participantB={participantB} onNext={nextSlide} onPrev={prevSlide} />,
    // Slide 5: Final + Share
    <FinalSlide key="final" matchPercentage={matchPercentage} participantA={participantA} participantB={participantB} questionResults={questionResults} topMatches={topMatches} onPrev={prevSlide} />,
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Progress dots */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'bg-white w-8' : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Slide container */}
      <div 
        className={`transition-all duration-500 ease-out ${slideAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {slides[currentSlide]}
      </div>
    </div>
  )
}

// ===== SLIDE COMPONENTS =====

function IntroSlide({ participantA, participantB, onNext }: { participantA: ParticipantRecord; participantB: ParticipantRecord; onNext: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="text-center space-y-12">
        <div className={`transition-all duration-1000 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm uppercase tracking-[0.5em] text-white/40 mb-4">Knowing You, Knowing Me</p>
          <h1 className="text-4xl md:text-6xl font-black italic">Ваши результаты готовы</h1>
        </div>

        <div className={`flex items-center justify-center gap-8 transition-all duration-1000 delay-300 ${step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="text-center animate-float">
            <div className="text-7xl md:text-8xl mb-3">{participantA.emoji}</div>
            <div className="text-lg font-bold">{participantA.name}</div>
          </div>
          <div className="text-4xl text-white/20 animate-pulse">💕</div>
          <div className="text-center animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="text-7xl md:text-8xl mb-3">{participantB.emoji}</div>
            <div className="text-lg font-bold">{participantB.name}</div>
          </div>
        </div>

        <button
          onClick={onNext}
          className={`px-12 py-5 rounded-full bg-white text-black font-black uppercase tracking-widest text-lg transition-all duration-500 hover:scale-105 active:scale-95 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          Показать →
        </button>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

function MatchRevealSlide({ matchPercentage, participantA, participantB, onNext, onPrev }: { matchPercentage: number; participantA: ParticipantRecord; participantB: ParticipantRecord; onNext: () => void; onPrev: () => void }) {
  const { count, animate } = useAnimatedCounter(matchPercentage, 2500)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRevealed(true)
      animate()
    }, 500)
    return () => clearTimeout(timer)
  }, [animate])

  const emoji = matchPercentage >= 70 ? '💕' : matchPercentage >= 50 ? '😊' : '🤔'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#e94560]/20 via-[#0a0a0a] to-[#4ecdc4]/20 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#e94560]/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center space-y-8">
        <p className={`text-sm uppercase tracking-[0.3em] text-white/40 transition-all duration-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
          Совпадение образов
        </p>

        <div className={`transition-all duration-1000 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="text-[12rem] md:text-[16rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
            {count}%
          </div>
        </div>

        <div className={`text-8xl transition-all duration-500 delay-1000 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
          {emoji}
        </div>

        <div className="flex items-center justify-center gap-4 pt-8">
          <button onClick={onPrev} className="px-6 py-3 rounded-full bg-white/10 text-white/60 font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
            ← Назад
          </button>
          <button onClick={onNext} className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all">
            Дальше →
          </button>
        </div>
      </div>
    </div>
  )
}

function BestMatchesSlide({ topMatches, onNext, onPrev }: { topMatches: any[]; onNext: () => void; onPrev: () => void }) {
  const [visibleItems, setVisibleItems] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleItems(prev => Math.min(prev + 1, topMatches.length))
    }, 400)
    return () => clearInterval(timer)
  }, [topMatches.length])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#4ecdc4]/20 via-[#0a0a0a] to-[#0a0a0a]">
      <div className="max-w-lg w-full text-center space-y-12">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#4ecdc4] mb-2">✨ Лучшие совпадения</p>
          <h2 className="text-3xl md:text-4xl font-black italic">Вы понимаете друг друга</h2>
        </div>

        <div className="space-y-4">
          {topMatches.map((match, i) => (
            <div
              key={match.question.questionId}
              className={`flex items-center gap-4 bg-white/5 rounded-2xl p-6 border border-white/10 transition-all duration-500 ${
                i < visibleItems ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="text-5xl">{match.question.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-xl font-bold">{match.question.text}</div>
                <div className="text-sm text-white/40">Разница: {match.avgGap.toFixed(1)}</div>
              </div>
              <span className="text-3xl">🎯</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button onClick={onPrev} className="px-6 py-3 rounded-full bg-white/10 text-white/60 font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
            ← Назад
          </button>
          <button onClick={onNext} className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all">
            Дальше →
          </button>
        </div>
      </div>
    </div>
  )
}

function BiggestGapsSlide({ biggestGaps, onNext, onPrev }: { biggestGaps: any[]; onNext: () => void; onPrev: () => void }) {
  const [visibleItems, setVisibleItems] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleItems(prev => Math.min(prev + 1, biggestGaps.length))
    }, 400)
    return () => clearInterval(timer)
  }, [biggestGaps.length])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#e94560]/20 via-[#0a0a0a] to-[#0a0a0a]">
      <div className="max-w-lg w-full text-center space-y-12">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#e94560] mb-2">⚡ Зоны роста</p>
          <h2 className="text-3xl md:text-4xl font-black italic">Где вы видите по-разному</h2>
        </div>

        <div className="space-y-4">
          {biggestGaps.map((gap, i) => (
            <div
              key={gap.question.questionId}
              className={`flex items-center gap-4 bg-[#e94560]/10 rounded-2xl p-6 border border-[#e94560]/20 transition-all duration-500 ${
                i < visibleItems ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="text-5xl">{gap.question.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-xl font-bold">{gap.question.text}</div>
                <div className="text-sm text-white/40">Разрыв: {gap.avgGap.toFixed(1)}</div>
              </div>
              <span className="text-3xl">🔥</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button onClick={onPrev} className="px-6 py-3 rounded-full bg-white/10 text-white/60 font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
            ← Назад
          </button>
          <button onClick={onNext} className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all">
            Дальше →
          </button>
        </div>
      </div>
    </div>
  )
}

function SurprisesSlide({ surprisesA, participantA, participantB, onNext, onPrev }: { surprisesA: any[]; participantA: ParticipantRecord; participantB: ParticipantRecord; onNext: () => void; onPrev: () => void }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-500/20 via-[#0a0a0a] to-[#0a0a0a]">
      <div className="max-w-lg w-full text-center space-y-12">
        <div className={`transition-all duration-1000 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm uppercase tracking-[0.3em] text-purple-400 mb-2">🎁 Сюрприз</p>
          <h2 className="text-3xl md:text-4xl font-black italic">
            {participantB.name} видит в {participantA.name} больше
          </h2>
        </div>

        {surprisesA.length > 0 ? (
          <div className="space-y-4">
            {surprisesA.map((s, i) => (
              <div
                key={s.question.questionId}
                className={`bg-purple-500/10 rounded-2xl p-6 border border-purple-500/20 transition-all duration-700 ${
                  revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
                style={{ transitionDelay: `${i * 200 + 500}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{s.question.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="text-xl font-bold">{s.question.text}</div>
                    <div className="text-sm text-white/40">
                      {participantA.name} думает: {s.ratings.AtoA} → {participantB.name} видит: {s.ratings.BtoA}
                    </div>
                  </div>
                  <div className="text-3xl font-black text-green-400">+{s.ratings.BtoA - s.ratings.AtoA}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-white/40 transition-all duration-1000 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
            Нет значительных сюрпризов
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-4">
          <button onClick={onPrev} className="px-6 py-3 rounded-full bg-white/10 text-white/60 font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
            ← Назад
          </button>
          <button onClick={onNext} className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all">
            Финал →
          </button>
        </div>
      </div>
    </div>
  )
}

function FinalSlide({ matchPercentage, participantA, participantB, questionResults, topMatches, onPrev }: { matchPercentage: number; participantA: ParticipantRecord; participantB: ParticipantRecord; questionResults: any[]; topMatches: any[]; onPrev: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = 'knowing-you-result.png'
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        setDownloading(false)
      })
    } catch (error) {
      console.error(error)
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#e94560]/10 via-[#0a0a0a] to-[#4ecdc4]/10 relative overflow-hidden">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#e94560', '#4ecdc4', '#f39c12', '#9b59b6', '#3498db'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center space-y-8 max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-black italic">🎉 Готово!</h2>

        {/* Shareable Card */}
        <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl">
          <div className="w-full aspect-square bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-10 flex flex-col justify-between items-center text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Психологическое Зеркало</p>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-6xl">{participantA.emoji}</div>
                <div className="text-sm font-bold mt-2">{participantA.name}</div>
              </div>
              <div className="text-3xl text-white/20">×</div>
              <div>
                <div className="text-6xl">{participantB.emoji}</div>
                <div className="text-sm font-bold mt-2">{participantB.name}</div>
              </div>
            </div>
            <div>
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
                {matchPercentage}%
              </div>
              <div className="text-xs uppercase tracking-widest text-white/30 mt-2">совпадение</div>
            </div>
            <div className="text-[0.6rem] uppercase tracking-widest text-white/20">knowing-you.app</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-8 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
          >
            {downloading ? 'Создаём...' : '📥 Скачать картинку'}
          </button>
          <Link
            href="/"
            className="px-8 py-4 rounded-full bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
          >
            🔄 Играть ещё
          </Link>
        </div>

        <button onClick={onPrev} className="text-white/40 text-sm hover:text-white/60 transition-all">
          ← Назад к слайдам
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s linear forwards;
        }
      `}</style>
    </div>
  )
}
