'use client'

import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Share } from '@capacitor/share'
import { isCapacitor } from '@/lib/capacitor'
import type { ParticipantRecord } from '@/lib/models'
import type { QuestionResult } from '@/lib/results'

type ShareCardProps = {
  participantA: ParticipantRecord
  participantB: ParticipantRecord
  matchPercentage: number
  shareUrl?: string
  topMatch: {
    question: { text: string; icon: string }
    avgGap: number
  }
  questionResults?: QuestionResult[]
  onClose: () => void
}

type CardType = 'bars' | 'mirror' | 'radar'

export default function ShareCard({ 
  participantA, 
  participantB, 
  matchPercentage, 
  shareUrl,
  questionResults = [],
  onClose 
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardType, setCardType] = useState<CardType>('bars')
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const host = typeof window !== 'undefined' ? window.location.host : ''

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareLink = async () => {
    if (!shareUrl) return
    try {
      if (isCapacitor()) {
        await Share.share({
          title: 'Knowing You, Knowing Me — результат',
          text: 'Смотри наш результат 👇',
          url: shareUrl,
          dialogTitle: 'Поделиться результатом'
        })
        return
      }
      if (navigator.share) {
        await navigator.share({
          title: 'Knowing You, Knowing Me — результат',
          text: 'Смотри наш результат 👇',
          url: shareUrl
        })
        return
      }
    } catch (error) {
      console.warn('Share cancelled/failed:', error)
    }
    await copyText(shareUrl)
  }

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
          link.download = `knowing-you-${cardType}.png`
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

  // Comparison Bars Card - visual bars comparing ratings
  const renderBarsCard = () => (
    <div
      ref={cardRef}
      className="w-[600px] h-[800px] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 flex flex-col text-white"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-4 mb-3">
          <span className="text-5xl">{participantA.emoji}</span>
          <div className="text-3xl font-black text-[#e94560] italic">{matchPercentage}%</div>
          <span className="text-5xl">{participantB.emoji}</span>
        </div>
        <h1 className="text-xl font-black italic uppercase tracking-tight">Психологическое Зеркало</h1>
        <p className="text-xs text-white/40 uppercase tracking-widest mt-1">{participantA.name} × {participantB.name}</p>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-4">
        {questionResults.slice(0, 8).map((result) => (
          <div key={result.question.questionId} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{result.question.icon}</span>
              <span className="text-sm font-bold flex-1">{result.question.text}</span>
              {result.avgGap >= 3 && <span className="text-xs bg-[#e94560]/20 text-[#e94560] px-2 py-0.5 rounded-full font-bold">GAP</span>}
            </div>
            
            {/* Visual Bars */}
            <div className="space-y-1">
              {/* A's perception */}
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] w-16 text-right text-white/50">{participantA.name}</span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-l-full flex items-center justify-end pr-1"
                    style={{ width: `${result.ratings.AtoA * 10}%` }}
                  >
                    <span className="text-[0.5rem] font-bold">{result.ratings.AtoA}</span>
                  </div>
                </div>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4ecdc4] to-[#44a08d] rounded-l-full flex items-center justify-end pr-1"
                    style={{ width: `${result.ratings.AtoB * 10}%` }}
                  >
                    <span className="text-[0.5rem] font-bold">{result.ratings.AtoB}</span>
                  </div>
                </div>
                <span className="text-[0.6rem] w-16 text-white/50">{participantB.name}</span>
              </div>
              
              {/* B's perception */}
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] w-16 text-right text-white/30">партнёр</span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-[#e94560]/50 to-[#ff6b6b]/50 rounded-l-full flex items-center justify-end pr-1"
                    style={{ width: `${result.ratings.BtoA * 10}%` }}
                  >
                    <span className="text-[0.5rem] font-bold">{result.ratings.BtoA}</span>
                  </div>
                </div>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4ecdc4]/50 to-[#44a08d]/50 rounded-l-full flex items-center justify-end pr-1"
                    style={{ width: `${result.ratings.BtoB * 10}%` }}
                  >
                    <span className="text-[0.5rem] font-bold">{result.ratings.BtoB}</span>
                  </div>
                </div>
                <span className="text-[0.6rem] w-16 text-white/30">партнёр</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b]" />
          <span className="text-[0.6rem] text-white/40">сам о себе</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#e94560]/50 to-[#ff6b6b]/50" />
          <span className="text-[0.6rem] text-white/40">партнёр о тебе</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 text-center text-[0.5rem] font-bold uppercase tracking-[0.3em] text-white/20">
        knowing-you.app
      </div>
    </div>
  )

  // Mirror Card - side by side comparison
  const renderMirrorCard = () => (
    <div
      ref={cardRef}
      className="w-[600px] h-[600px] bg-[#0d0d0d] p-8 flex flex-col text-white relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/20 via-transparent to-[#4ecdc4]/20" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black italic uppercase tracking-tight">🪞 Зеркало Восприятия</h1>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4] mt-2">
            {matchPercentage}%
          </div>
        </div>

        {/* Two columns - A and B */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Column A */}
          <div className="bg-gradient-to-b from-[#e94560]/20 to-transparent rounded-3xl p-4 border border-[#e94560]/20">
            <div className="text-center mb-4">
              <span className="text-4xl">{participantA.emoji}</span>
              <div className="text-sm font-black uppercase mt-1">{participantA.name}</div>
            </div>
            
            <div className="space-y-2">
              {questionResults.slice(0, 5).map((r) => (
                <div key={r.question.questionId} className="flex items-center gap-2">
                  <span className="text-lg">{r.question.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[0.6rem] text-white/40 mb-0.5">
                      <span>я</span>
                      <span>партнёр</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-5 bg-white/5 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-black">{r.ratings.AtoA}</span>
                      </div>
                      <div className={`flex-1 h-5 rounded-lg flex items-center justify-center ${r.gapA >= 3 ? 'bg-[#e94560]/30' : 'bg-white/5'}`}>
                        <span className="text-sm font-black">{r.ratings.BtoA}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column B */}
          <div className="bg-gradient-to-b from-[#4ecdc4]/20 to-transparent rounded-3xl p-4 border border-[#4ecdc4]/20">
            <div className="text-center mb-4">
              <span className="text-4xl">{participantB.emoji}</span>
              <div className="text-sm font-black uppercase mt-1">{participantB.name}</div>
            </div>
            
            <div className="space-y-2">
              {questionResults.slice(0, 5).map((r) => (
                <div key={r.question.questionId} className="flex items-center gap-2">
                  <span className="text-lg">{r.question.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[0.6rem] text-white/40 mb-0.5">
                      <span>я</span>
                      <span>партнёр</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-5 bg-white/5 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-black">{r.ratings.BtoB}</span>
                      </div>
                      <div className={`flex-1 h-5 rounded-lg flex items-center justify-center ${r.gapB >= 3 ? 'bg-[#4ecdc4]/30' : 'bg-white/5'}`}>
                        <span className="text-sm font-black">{r.ratings.AtoB}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-[0.55rem] font-bold uppercase tracking-[0.3em] text-white/20">
          Knowing You, Knowing Me
        </div>
      </div>
    </div>
  )

  // Radar-style card with circular visualization
  const renderRadarCard = () => {
    const questions = questionResults.slice(0, 6)
    const angleStep = 360 / questions.length
    
    return (
      <div
        ref={cardRef}
        className="w-[600px] h-[600px] bg-gradient-to-br from-[#1F313B] via-[#2a3f4d] to-[#1F313B] p-8 flex flex-col text-white relative"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center items-center gap-4">
            <span className="text-4xl">{participantA.emoji}</span>
            <span className="text-2xl text-white/20">×</span>
            <span className="text-4xl">{participantB.emoji}</span>
          </div>
          <div className="text-5xl font-black text-[#BE4039] italic mt-2">{matchPercentage}%</div>
          <p className="text-[0.6rem] text-white/30 uppercase tracking-widest mt-1">совпадение образов</p>
        </div>

        {/* Circular Radar */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Background circles */}
          <div className="absolute w-64 h-64 border border-white/5 rounded-full" />
          <div className="absolute w-48 h-48 border border-white/5 rounded-full" />
          <div className="absolute w-32 h-32 border border-white/10 rounded-full" />
          
          {/* Question points */}
          {questions.map((q, i) => {
            const angle = (angleStep * i - 90) * (Math.PI / 180)
            const radius = 120
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            
            // Calculate dot positions based on ratings
            const selfRadius = (q.ratings.AtoA / 10) * 100
            const partnerRadius = (q.ratings.BtoA / 10) * 100
            const selfX = Math.cos(angle) * selfRadius
            const selfY = Math.sin(angle) * selfRadius
            const partnerX = Math.cos(angle) * partnerRadius
            const partnerY = Math.sin(angle) * partnerRadius
            
            return (
              <div key={q.question.questionId}>
                {/* Question icon at edge */}
                <div 
                  className="absolute text-2xl"
                  style={{ 
                    left: `calc(50% + ${x}px - 14px)`,
                    top: `calc(50% + ${y}px - 14px)`
                  }}
                >
                  {q.question.icon}
                </div>
                
                {/* Self rating dot */}
                <div 
                  className="absolute w-3 h-3 bg-[#BE4039] rounded-full shadow-lg shadow-[#BE4039]/50"
                  style={{ 
                    left: `calc(50% + ${selfX}px - 6px)`,
                    top: `calc(50% + ${selfY}px - 6px)`
                  }}
                />
                
                {/* Partner rating dot */}
                <div 
                  className="absolute w-3 h-3 bg-[#4ecdc4] rounded-full shadow-lg shadow-[#4ecdc4]/50"
                  style={{ 
                    left: `calc(50% + ${partnerX}px - 6px)`,
                    top: `calc(50% + ${partnerY}px - 6px)`
                  }}
                />
              </div>
            )
          })}
          
          {/* Center */}
          <div className="absolute w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-lg">🎯</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#BE4039]" />
            <span className="text-xs text-white/40">{participantA.name} о себе</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4ecdc4]" />
            <span className="text-xs text-white/40">{participantB.name} о {participantA.name}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-[0.5rem] font-bold uppercase tracking-[0.3em] text-white/20">
          knowing-you.app
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F1E24] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white italic tracking-tight">Карточка для соцсетей</h2>
            <button
              onClick={onClose}
              className="text-white/20 hover:text-white transition-all text-3xl"
            >
              ×
            </button>
          </div>

          {/* Card Type Selector */}
          <div className="mb-8">
            <label className="block text-[0.65rem] font-bold text-white/40 uppercase tracking-widest mb-4 ml-1">
              СТИЛЬ ГРАФИКИ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCardType('bars')}
                className={`py-4 px-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  cardType === 'bars'
                    ? 'border-white bg-white text-gray-900 shadow-xl'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                📊 БАРЫ
              </button>
              <button
                onClick={() => setCardType('mirror')}
                className={`py-4 px-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  cardType === 'mirror'
                    ? 'border-white bg-white text-gray-900 shadow-xl'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                🪞 ЗЕРКАЛО
              </button>
              <button
                onClick={() => setCardType('radar')}
                className={`py-4 px-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  cardType === 'radar'
                    ? 'border-white bg-white text-gray-900 shadow-xl'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                🎯 РАДАР
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="mb-10 overflow-hidden rounded-[2rem] shadow-2xl border border-white/5 flex justify-center bg-black/50">
            <div className={`transform ${cardType === 'bars' ? 'scale-[0.45]' : 'scale-[0.55]'} origin-top`}>
              {cardType === 'bars' && renderBarsCard()}
              {cardType === 'mirror' && renderMirrorCard()}
              {cardType === 'radar' && renderRadarCard()}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-white text-gray-900 py-6 rounded-full font-black uppercase tracking-widest shadow-xl hover:shadow-white/10 transition-all active:scale-95 disabled:opacity-20"
            >
              {downloading ? 'СОЗДАЁМ...' : 'СКАЧАТЬ КАРТИНКУ 📥'}
            </button>

            {shareUrl && (
              <button
                onClick={shareLink}
                className="w-full border-2 border-white/10 bg-white/5 text-white py-6 rounded-full font-black uppercase tracking-widest shadow-lg hover:bg-white/10 transition-all active:scale-95"
              >
                {copied ? 'ССЫЛКА СКОПИРОВАНА ✅' : 'ПОДЕЛИТЬСЯ ССЫЛКОЙ 🔗'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
