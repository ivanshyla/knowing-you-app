'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/apiClient'
import html2canvas from 'html2canvas'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { buildQuestionResults, computeMatchPercentage } from '@/lib/results'

export default function ResultsPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [session, setSession] = useState<SessionRecord | null>(null)
  const [questions, setQuestions] = useState<QuestionRecord[]>([])
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [ratings, setRatings] = useState<RatingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const queryParams = new URLSearchParams({ code, include: 'questions,ratings' })
        const response = await apiFetch(`/api/room/state?${queryParams.toString()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Not found')
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
        console.error('Failed to load:', error)
        setLoading(false)
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

  const totalSlides = questionResults.length + 2 // questions + insights + final
  const isInsightsSlide = currentIndex === questionResults.length
  const isFinalSlide = currentIndex === questionResults.length + 1

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < totalSlides - 1) setCurrentIndex(i => i + 1)
      if (diff < 0 && currentIndex > 0) setCurrentIndex(i => i - 1)
    }
    setTouchStart(null)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentIndex < totalSlides - 1) setCurrentIndex(i => i + 1)
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex, totalSlides])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40 animate-pulse text-center">
          <div className="text-6xl mb-4 animate-bounce">🔮</div>
          <p className="text-sm uppercase tracking-widest">{t('results.loading')}</p>
        </div>
      </div>
    )
  }

  if (!participantA || !participantB) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-center p-8">
        <div>
          <div className="text-6xl mb-4">🙈</div>
          <p className="text-white/60 mb-4">{t('results.error')}</p>
          <Link href="/" className="text-[#e94560] underline">{t('common.back')}</Link>
        </div>
      </div>
    )
  }

  const currentResult = questionResults[currentIndex]

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e94560]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Progress dots */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIndex 
                ? 'bg-white w-6' 
                : i < currentIndex 
                  ? 'bg-white/60' 
                  : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Home button */}
      <Link 
        href="/"
        className="fixed top-6 left-6 text-white/40 hover:text-white transition-colors z-50 text-sm"
      >
        ← {t('common.back')}
      </Link>

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Current slide content */}
        <div className="flex-1 flex items-center justify-center p-6 pt-16">
          {currentResult && !isInsightsSlide && !isFinalSlide && (
            <QuestionSlide
              result={currentResult}
              participantA={participantA}
              participantB={participantB}
              questionNumber={currentIndex + 1}
              totalQuestions={questionResults.length}
              t={t}
            />
          )}

          {isInsightsSlide && (
            <InsightsSlide
              topMatches={topMatches}
              biggestGaps={biggestGaps}
              participantA={participantA}
              participantB={participantB}
              t={t}
            />
          )}

          {isFinalSlide && (
            <FinalSlide
              matchPercentage={matchPercentage}
              participantA={participantA}
              participantB={participantB}
              questionResults={questionResults}
              t={t}
            />
          )}
        </div>

        {/* Navigation hint */}
        <div className="p-6 text-center text-white/30 text-xs">
          <span className="hidden md:inline">← → {t('results.useArrows') || 'Use arrows'}</span>
          <span className="md:hidden">👆 {t('results.swipe') || 'Swipe'}</span>
        </div>
      </div>
    </div>
  )
}

// Get interpretation based on gap
function getInterpretation(gap: number, t: any): { emoji: string; text: string; color: string } {
  if (gap <= 1) return { emoji: '💚', text: t('results.perfectMatch') || 'Perfect match!', color: '#4ade80' }
  if (gap <= 2) return { emoji: '💛', text: t('results.closeViews') || 'Close views', color: '#facc15' }
  if (gap <= 3) return { emoji: '🧡', text: t('results.someDifference') || 'Some difference', color: '#fb923c' }
  return { emoji: '❤️‍🔥', text: t('results.differentViews') || 'Different views!', color: '#f87171' }
}

// Animated number component
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0)
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0
      const duration = 600
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayed(Math.round(eased * value))
        if (progress < 1) requestAnimationFrame(animate)
      }
      animate()
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  
  return <span>{displayed}</span>
}

// Mirror comparison component
function MirrorComparison({ 
  person, 
  selfRating, 
  partnerRating, 
  partnerName,
  color,
  t 
}: { 
  person: ParticipantRecord
  selfRating: number
  partnerRating: number
  partnerName: string
  color: string
  t: any
}) {
  const gap = Math.abs(selfRating - partnerRating)
  const interpretation = getInterpretation(gap, t)
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 space-y-4">
      {/* Person header */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{person.emoji}</span>
        <div>
          <div className="font-black text-lg">{person.name}</div>
          <div className="text-xs text-white/40 uppercase tracking-wider">{t('results.howSeen') || 'How they are seen'}</div>
        </div>
      </div>

      {/* Visual comparison */}
      <div className="space-y-3">
        {/* Self view */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>🪞 {t('results.iThink') || 'I think'}...</span>
            <span className="font-mono font-bold text-white"><AnimatedNumber value={selfRating} /></span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${selfRating * 10}%`,
                background: color
              }}
            />
          </div>
        </div>

        {/* Partner view */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>👁️ {partnerName} {t('results.thinks') || 'thinks'}...</span>
            <span className="font-mono font-bold text-white"><AnimatedNumber value={partnerRating} delay={200} /></span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${partnerRating * 10}%`,
                background: `${color}99`
              }}
            />
          </div>
        </div>
      </div>

      {/* Gap indicator */}
      <div 
        className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
        style={{ backgroundColor: `${interpretation.color}20`, color: interpretation.color }}
      >
        <span className="text-lg">{interpretation.emoji}</span>
        <span>{interpretation.text}</span>
        {gap > 0 && <span className="opacity-60">({gap} {t('results.points') || 'pts'})</span>}
      </div>
    </div>
  )
}

// Question slide with mirror comparison
function QuestionSlide({ result, participantA, participantB, questionNumber, totalQuestions, t }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const handleShare = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0a', scale: 2 })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `kykm-${questionNumber}.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        setSaving(false)
      })
    } catch (e) {
      setSaving(false)
    }
  }

  const { AtoA, AtoB, BtoA, BtoB } = result.ratings
  const avgGapA = Math.abs(AtoA - BtoA)
  const avgGapB = Math.abs(BtoB - AtoB)
  const totalGap = (avgGapA + avgGapB) / 2

  return (
    <div className="w-full max-w-lg space-y-4 animate-fadeIn">
      {/* Question header */}
      <div className="text-center space-y-2">
        <div className="text-7xl drop-shadow-2xl animate-bounce-slow">{result.question.icon}</div>
        <h2 className="text-3xl font-black italic uppercase tracking-tight leading-tight">
          {result.question.text}
        </h2>
        <p className="text-xs text-white/30 uppercase tracking-widest">
          {questionNumber} / {totalQuestions}
        </p>
      </div>

      {/* Shareable card */}
      <div ref={cardRef} className="bg-[#0a0a0a] p-4 rounded-3xl space-y-4">
        {/* Mirror comparisons */}
        <MirrorComparison
          person={participantA}
          selfRating={AtoA}
          partnerRating={BtoA}
          partnerName={participantB.name}
          color="#e94560"
          t={t}
        />
        
        <MirrorComparison
          person={participantB}
          selfRating={BtoB}
          partnerRating={AtoB}
          partnerName={participantA.name}
          color="#4ecdc4"
          t={t}
        />

        {/* Watermark */}
        <div className="text-center text-[0.5rem] uppercase tracking-widest text-white/20 pt-2">
          knowing-you.app
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={saving}
        className="w-full py-3 rounded-2xl bg-white/10 text-white/60 text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? '...' : <>📤 {t('common.share')}</>}
      </button>
    </div>
  )
}

// Insights slide
function InsightsSlide({ topMatches, biggestGaps, participantA, participantB, t }: any) {
  return (
    <div className="w-full max-w-lg space-y-8 animate-fadeIn">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-black italic uppercase">{t('results.insights')}</h2>
      </div>

      {/* Perfect matches */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#4ade80] flex items-center gap-2">
          💚 {t('results.whereMatched')}
        </h3>
        <div className="space-y-2">
          {topMatches.map((r: any, i: number) => (
            <div 
              key={r.question.questionId}
              className="bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-2xl p-4 flex items-center gap-3 animate-slideIn"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-2xl">{r.question.icon}</span>
              <span className="font-bold flex-1">{r.question.text}</span>
              <span className="text-[#4ade80] text-sm font-mono">±{r.avgGap.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Biggest gaps */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#f87171] flex items-center gap-2">
          ❤️‍🔥 {t('results.whereDiffered')}
        </h3>
        <div className="space-y-2">
          {biggestGaps.map((r: any, i: number) => (
            <div 
              key={r.question.questionId}
              className="bg-[#f87171]/10 border border-[#f87171]/20 rounded-2xl p-4 flex items-center gap-3 animate-slideIn"
              style={{ animationDelay: `${(i + topMatches.length) * 100}ms` }}
            >
              <span className="text-2xl">{r.question.icon}</span>
              <span className="font-bold flex-1">{r.question.text}</span>
              <span className="text-[#f87171] text-sm font-mono">±{r.avgGap.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Final slide with confetti and share buttons
function FinalSlide({ matchPercentage, participantA, participantB, questionResults, t }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [confetti, setConfetti] = useState<any[]>([])
  const [showNumber, setShowNumber] = useState(false)

  useEffect(() => {
    // Delay showing number for dramatic effect
    const timeout = setTimeout(() => setShowNumber(true), 500)
    
    // Create confetti
    const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`,
      color: ['#e94560', '#4ecdc4', '#facc15', '#a855f7', '#22d3ee'][Math.floor(Math.random() * 5)]
    }))
    setConfetti(newConfetti)
    
    return () => clearTimeout(timeout)
  }, [])

  const handleShare = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0a', scale: 2 })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `kykm-result.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        setSaving(false)
      })
    } catch (e) {
      setSaving(false)
    }
  }

  const shareToSocial = (platform: string) => {
    const text = `${participantA.name} & ${participantB.name}: ${matchPercentage}% match! 🪞 knowing-you.app`
    const url = 'https://knowing-you.app'
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    }
    
    if (urls[platform]) window.open(urls[platform], '_blank')
    else handleShare() // Instagram/Bluesky = download image
  }

  const biggestGap = useMemo(() => 
    [...questionResults].sort((a: any, b: any) => b.avgGap - a.avgGap)[0], 
    [questionResults]
  )

  return (
    <div className="w-full max-w-lg space-y-6 animate-fadeIn relative">
      {/* Confetti */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="fixed w-3 h-3 rounded-full animate-confetti pointer-events-none"
          style={{ 
            left: c.left, 
            top: '-20px',
            backgroundColor: c.color,
            animationDelay: c.delay,
            animationDuration: c.duration
          }}
        />
      ))}

      {/* Result card */}
      <div ref={cardRef} className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 rounded-3xl text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#e94560]/20 to-[#4ecdc4]/20 animate-pulse" />
        
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-6">{t('results.perceptionMirror')}</p>
          
          {/* Participants */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="text-center">
              <div className="text-5xl mb-2">{participantA.emoji}</div>
              <div className="text-sm font-bold">{participantA.name}</div>
            </div>
            <div className="text-3xl animate-pulse">💕</div>
            <div className="text-center">
              <div className="text-5xl mb-2">{participantB.emoji}</div>
              <div className="text-sm font-bold">{participantB.name}</div>
            </div>
          </div>

          {/* Big percentage */}
          <div className={`transition-all duration-1000 ${showNumber ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="text-8xl font-black bg-gradient-to-r from-[#e94560] to-[#4ecdc4] bg-clip-text text-transparent">
              {showNumber && <AnimatedNumber value={matchPercentage} />}%
            </div>
            <p className="text-sm uppercase tracking-widest text-white/60 mt-2">{t('results.match')}</p>
          </div>

          {/* Biggest gap insight */}
          {biggestGap && biggestGap.avgGap >= 2 && (
            <div className="mt-6 p-4 bg-white/5 rounded-2xl">
              <p className="text-xs uppercase tracking-widest text-yellow-400 mb-2">🔥 {t('results.biggestGap')}</p>
              <p className="font-bold">{biggestGap.question.icon} {biggestGap.question.text}</p>
            </div>
          )}

          {/* Watermark */}
          <div className="text-[0.5rem] uppercase tracking-widest text-white/20 mt-6">
            knowing-you.app
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => shareToSocial('twitter')} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-2xl">
          𝕏
        </button>
        <button onClick={() => shareToSocial('facebook')} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-2xl">
          📘
        </button>
        <button onClick={() => shareToSocial('telegram')} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-2xl">
          💬
        </button>
        <button onClick={handleShare} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-2xl">
          📥
        </button>
      </div>

      {/* Play again */}
      <Link
        href="/"
        className="block w-full py-4 rounded-2xl bg-gradient-to-r from-[#e94560] to-[#4ecdc4] text-white font-bold uppercase tracking-widest text-center hover:scale-105 transition-all"
      >
        🔄 {t('common.play')}
      </Link>
    </div>
  )
}
