'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import html2canvas from 'html2canvas'
import type { ParticipantRecord, QuestionRecord, RatingRecord, SessionRecord } from '@/lib/models'
import { buildQuestionResults, computeMatchPercentage } from '@/lib/results'


// Share helper
async function shareImage(cardRef: React.RefObject<HTMLDivElement | null>, filename: string, setSaving: (v: boolean) => void) {
  if (!cardRef.current) return
  setSaving(true)
  try {
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0a', scale: 2 })
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve))
    if (!blob) { setSaving(false); return }
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Knowing You, Knowing Me', text: 'My result 🪞' })
    } else {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = filename
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
  } catch (e) { console.error('Share failed:', e) }
  setSaving(false)
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
  const [currentIndex, setCurrentIndex] = useState(0)

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
  const topMatches = useMemo(() => [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, 2), [questionResults])
  const biggestGaps = useMemo(() => [...questionResults].sort((a, b) => b.avgGap - a.avgGap).slice(0, 2), [questionResults])

  const totalSlides = questionResults.length + 3 // questions + insights + final
  const isInsightsSlide = currentIndex === questionResults.length
  const isFinalSlide = currentIndex === questionResults.length + 1
  const isAllResultsSlide = currentIndex === questionResults.length + 2

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40 animate-pulse text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-sm uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    )
  }

  if (!participantA || !participantB) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-center p-8">
        <div>
          <div className="text-6xl mb-4">🙈</div>
          <p className="text-white/60 mb-4">Participants not found</p>
          <Link href="/" className="text-[#e94560] underline">Home</Link>
        </div>
      </div>
    )
  }

  const currentResult = questionResults[currentIndex]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#e94560] to-[#4ecdc4] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
        />
      </div>

      {/* Slide counter */}
      <div className="fixed top-4 right-4 text-xs text-white/30 font-mono z-50">
        {currentIndex + 1} / {totalSlides}
      </div>

      <div className="min-h-screen flex flex-col">
        {/* Current slide content */}
        <div className="flex-1 flex items-center justify-center p-6">
          {currentResult && !isInsightsSlide && !isFinalSlide && !isAllResultsSlide && (
            <QuestionSlide
              result={currentResult}
              participantA={participantA}
              participantB={participantB}
              questionNumber={currentIndex + 1}
              totalQuestions={questionResults.length}
            />
          )}

          {isInsightsSlide && (
            <InsightsSlide
              topMatches={topMatches}
              biggestGaps={biggestGaps}
              participantA={participantA}
              participantB={participantB}
            />
          )}

          {isFinalSlide && (
            <FinalSlide
              matchPercentage={matchPercentage}
              participantA={participantA}
              participantB={participantB}
              questionResults={questionResults}
            />
          )}

          {isAllResultsSlide && (
            <AllResultsSlide
              questionResults={questionResults}
              participantA={participantA}
              participantB={participantB}
              matchPercentage={matchPercentage}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 flex justify-center gap-4">
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              className="px-8 py-4 rounded-full bg-white/10 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all"
            >
              ← Back
            </button>
          )}
          {currentIndex < totalSlides - 1 ? (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="px-8 py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all"
            >
              Дальше →
            </button>
          ) : (
            <Link
              href="/"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#e94560] to-[#4ecdc4] text-white font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all"
            >
              🔄 Играть ещё
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Question slide with ratings comparison
function QuestionSlide({ result, participantA, participantB, questionNumber, totalQuestions }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const handleShare = () => shareImage(cardRef, `kykm.png`, setSaving); const _unused = async () => {
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

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Shareable card */}
      <div ref={cardRef} className="bg-[#0a0a0a] p-8 rounded-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{result.question.icon}</div>
          <h2 className="text-2xl font-black italic uppercase">{result.question.text}</h2>
          <p className="text-xs text-white/30 mt-2 uppercase tracking-widest">Question {questionNumber} of {totalQuestions}</p>
        </div>

        {/* Ratings visualization */}
        <div className="space-y-6">
          {/* A's perspective */}
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{participantA.emoji}</span>
              <span className="font-bold">{participantA.name}</span>
            </div>
            <div className="space-y-2">
              <RatingBar label="о себе" value={AtoA} color="#e94560" />
              <RatingBar label={`о ${participantB.name}`} value={AtoB} color="#e94560" opacity={0.5} />
            </div>
          </div>

          {/* B's perspective */}
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{participantB.emoji}</span>
              <span className="font-bold">{participantB.name}</span>
            </div>
            <div className="space-y-2">
              <RatingBar label="о себе" value={BtoB} color="#4ecdc4" />
              <RatingBar label={`о ${participantA.name}`} value={BtoA} color="#4ecdc4" opacity={0.5} />
            </div>
          </div>

          {/* Gap indicator */}
          {result.avgGap >= 2 && (
            <div className="text-center py-2">
              <span className="text-xs uppercase tracking-widest text-[#e94560]">
                ⚡ Разрыв восприятия: {result.avgGap.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="text-center mt-6 text-[0.5rem] uppercase tracking-widest text-white/20">
          knowing-you.app
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={saving}
        className="w-full py-3 rounded-full bg-white/10 text-white/60 text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
      >
        {saving ? '...' : '📤 Share'}
      </button>
    </div>
  )
}

function RatingBar({ label, value, color, opacity = 1 }: { label: string; value: number; color: string; opacity?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-24">{label}</span>
      <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${value * 10}%`, 
            backgroundColor: color,
            opacity 
          }}
        />
      </div>
      <span className="text-lg font-black w-8 text-right">{value}</span>
    </div>
  )
}

function InsightsSlide({ topMatches, biggestGaps, participantA, participantB }: any) {
  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <h2 className="text-3xl font-black italic uppercase">🔍 Инсайты</h2>
      
      <div className="space-y-4">
        <div className="bg-[#4ecdc4]/10 border border-[#4ecdc4]/30 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-widest text-[#4ecdc4] mb-4">✨ Где совпали</h3>
          {topMatches.map((m: any) => (
            <div key={m.question.questionId} className="flex items-center gap-3 py-2">
              <span className="text-3xl">{m.question.icon}</span>
              <span className="font-bold">{m.question.text}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#e94560]/10 border border-[#e94560]/30 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-widest text-[#e94560] mb-4">⚡ Где разошлись</h3>
          {biggestGaps.map((m: any) => (
            <div key={m.question.questionId} className="flex items-center gap-3 py-2">
              <span className="text-3xl">{m.question.icon}</span>
              <span className="font-bold">{m.question.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FinalSlide({ matchPercentage, participantA, participantB, questionResults }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const handleShare = () => shareImage(cardRef, `kykm.png`, setSaving); const _unused = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = 'kykm-result.png'
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

  return (
    <div className="w-full max-w-md space-y-6">
      <div ref={cardRef} className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-10 rounded-3xl text-center">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-6">Психологическое зеркало</p>
        
        <div className="flex justify-center items-center gap-6 mb-6">
          <div>
            <div className="text-5xl">{participantA.emoji}</div>
            <div className="text-sm font-bold mt-2">{participantA.name}</div>
          </div>
          <div className="text-2xl text-white/20">💕</div>
          <div>
            <div className="text-5xl">{participantB.emoji}</div>
            <div className="text-sm font-bold mt-2">{participantB.name}</div>
          </div>
        </div>

        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
          {matchPercentage}%
        </div>
        <p className="text-xs uppercase tracking-widest text-white/40 mt-2">совпадение</p>

        <div className="text-[0.5rem] uppercase tracking-widest text-white/20 mt-8">
          knowing-you.app
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={saving}
        className="w-full py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
      >
        {saving ? '...' : '📤 Share'}
      </button>
    </div>
  )
}

function AllResultsSlide({ questionResults, participantA, participantB, matchPercentage }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const handleShare = () => shareImage(cardRef, `kykm.png`, setSaving); const _unused = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0a', scale: 2 })
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = 'kykm-all-results.png'
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

  return (
    <div className="w-full max-w-lg space-y-6">
      <div ref={cardRef} className="bg-[#0a0a0a] p-6 rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{participantA.emoji}</span>
            <span className="text-sm font-bold">{participantA.name}</span>
          </div>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
            {matchPercentage}%
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{participantB.name}</span>
            <span className="text-2xl">{participantB.emoji}</span>
          </div>
        </div>

        {/* All questions */}
        <div className="space-y-3">
          {questionResults.map((r: any) => (
            <div key={r.question.questionId} className="flex items-center gap-2 text-sm">
              <span className="text-lg">{r.question.icon}</span>
              <span className="flex-1 text-white/70 truncate">{r.question.text}</span>
              <div className="flex items-center gap-1">
                <span className="text-[#e94560] font-bold">{r.ratings.AtoA}</span>
                <span className="text-white/20">/</span>
                <span className="text-[#4ecdc4] font-bold">{r.ratings.BtoB}</span>
              </div>
              {r.avgGap >= 2 && <span className="text-[#e94560] text-xs">⚡</span>}
            </div>
          ))}
        </div>

        <div className="text-center mt-6 text-[0.5rem] uppercase tracking-widest text-white/20">
          knowing-you.app
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={saving}
        className="w-full py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
      >
        {saving ? '...' : '📤 Share'}
      </button>
    </div>
  )
}
