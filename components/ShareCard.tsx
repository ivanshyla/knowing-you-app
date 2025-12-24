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

type CardType = 'main' | 'details' | 'insights'

export default function ShareCard({ 
  participantA, 
  participantB, 
  matchPercentage, 
  shareUrl,
  topMatch,
  questionResults = [],
  onClose 
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardType, setCardType] = useState<CardType>('main')
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

  // Get insights from question results
  const sortedByGap = [...questionResults].sort((a, b) => b.avgGap - a.avgGap)
  const topDifferences = sortedByGap.slice(0, 3)
  const topMatches = [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, 3)
  
  // Surprises: where partner rated higher than self
  const surprisesA = questionResults.filter(r => r.ratings.BtoA > r.ratings.AtoA).slice(0, 2)
  const surprisesB = questionResults.filter(r => r.ratings.AtoB > r.ratings.BtoB).slice(0, 2)

  const renderMainCard = () => (
    <div
      ref={cardRef}
      className="w-[600px] h-[600px] bg-[#1F313B] p-12 flex flex-col justify-between items-center text-center"
    >
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black italic tracking-tighter text-white">
          Knowing You, Knowing Me
        </h1>
        <p className="text-sm font-bold text-white/30 uppercase tracking-[0.3em]">
          Психологическое зеркало
        </p>
      </div>

      {/* Participants */}
      <div className="flex justify-around items-center w-full px-4">
        <div className="space-y-3">
          <div className="text-7xl drop-shadow-2xl">{participantA.emoji}</div>
          <div className="text-xl font-black italic text-white uppercase">
            {participantA.name}
          </div>
        </div>
        <div className="text-5xl text-white/10 font-black">💕</div>
        <div className="space-y-3">
          <div className="text-7xl drop-shadow-2xl">{participantB.emoji}</div>
          <div className="text-xl font-black italic text-white uppercase">
            {participantB.name}
          </div>
        </div>
      </div>

      {/* Match Score */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 w-full shadow-2xl space-y-2">
        <div className="text-7xl font-black italic leading-none text-[#BE4039]">
          {matchPercentage}%
        </div>
        <div className="text-[0.65rem] font-bold uppercase tracking-[0.4em] text-white/40">
          СОВПАДЕНИЕ ОБРАЗОВ
        </div>
        
        {/* Top Match */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/5 text-white">
          <span className="text-3xl drop-shadow-lg">{topMatch.question.icon}</span>
          <span className="text-sm font-bold italic opacity-80">
            Лучший матч: {topMatch.question.text}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 w-full text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/20">
        {host || 'knowing-you.app'}
      </div>
    </div>
  )

  const renderDetailsCard = () => (
    <div
      ref={cardRef}
      className="w-[600px] h-[800px] bg-[#1F313B] p-10 flex flex-col text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{participantA.emoji}</span>
          <span className="text-2xl text-white/20">×</span>
          <span className="text-4xl">{participantB.emoji}</span>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-[#BE4039] italic">{matchPercentage}%</div>
          <div className="text-[0.5rem] uppercase tracking-widest text-white/30 font-bold">совпадение</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-black italic uppercase tracking-tight">Детальное сравнение</h2>
        <p className="text-[0.6rem] text-white/30 uppercase tracking-widest font-bold mt-1">{participantA.name} × {participantB.name}</p>
      </div>

      {/* Questions Grid */}
      <div className="flex-1 space-y-3">
        {questionResults.slice(0, 6).map((result) => (
          <div key={result.question.questionId} className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{result.question.icon}</span>
              <span className="font-bold text-sm flex-1">{result.question.text}</span>
              {result.avgGap >= 3 && <span className="text-lg">⚠️</span>}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 rounded-xl p-2">
                <div className="text-[0.5rem] text-white/40 uppercase tracking-widest mb-1">{participantA.name}</div>
                <div className="flex justify-around">
                  <div>
                    <div className="text-lg font-bold">{result.ratings.AtoA}</div>
                    <div className="text-[0.45rem] text-white/30">сам</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${result.gapA >= 3 ? 'text-[#BE4039]' : ''}`}>{result.ratings.BtoA}</div>
                    <div className="text-[0.45rem] text-white/30">партнёр</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-2">
                <div className="text-[0.5rem] text-white/40 uppercase tracking-widest mb-1">{participantB.name}</div>
                <div className="flex justify-around">
                  <div>
                    <div className="text-lg font-bold">{result.ratings.BtoB}</div>
                    <div className="text-[0.45rem] text-white/30">сам</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${result.gapB >= 3 ? 'text-[#BE4039]' : ''}`}>{result.ratings.AtoB}</div>
                    <div className="text-[0.45rem] text-white/30">партнёр</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 text-center text-[0.55rem] font-black uppercase tracking-[0.3em] text-white/20">
        Knowing You, Knowing Me • {host || 'knowing-you.app'}
      </div>
    </div>
  )

  const renderInsightsCard = () => (
    <div
      ref={cardRef}
      className="w-[600px] h-[600px] bg-gradient-to-br from-[#BE4039] via-[#B94E56] to-[#784259] p-10 flex flex-col text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{participantA.emoji}</span>
          <span className="text-xl text-white/30">×</span>
          <span className="text-4xl">{participantB.emoji}</span>
        </div>
        <div className="bg-white/20 rounded-full px-4 py-2">
          <span className="text-2xl font-black italic">{matchPercentage}%</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black italic uppercase tracking-tight">🔍 Инсайты</h2>
        <p className="text-sm text-white/60 font-bold mt-2">Что мы узнали друг о друге</p>
      </div>

      {/* Insights Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4">
        {/* Best Matches */}
        <div className="bg-white/10 rounded-3xl p-5 border border-white/10">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white/80">✨ Совпали</h3>
          <div className="space-y-3">
            {topMatches.slice(0, 3).map((m) => (
              <div key={m.question.questionId} className="flex items-center gap-3">
                <span className="text-2xl">{m.question.icon}</span>
                <span className="text-sm font-bold">{m.question.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Biggest Gaps */}
        <div className="bg-white/10 rounded-3xl p-5 border border-white/10">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white/80">⚡ Разошлись</h3>
          <div className="space-y-3">
            {topDifferences.slice(0, 3).map((m) => (
              <div key={m.question.questionId} className="flex items-center gap-3">
                <span className="text-2xl">{m.question.icon}</span>
                <span className="text-sm font-bold">{m.question.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Surprises for A */}
        {surprisesA.length > 0 && (
          <div className="bg-white/10 rounded-3xl p-5 border border-white/10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-white/80">
              🎁 {participantA.name} недооценивает себя
            </h3>
            <div className="space-y-2">
              {surprisesA.map((s) => (
                <div key={s.question.questionId} className="flex items-center gap-2">
                  <span className="text-xl">{s.question.icon}</span>
                  <span className="text-xs font-bold">{s.question.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Surprises for B */}
        {surprisesB.length > 0 && (
          <div className="bg-white/10 rounded-3xl p-5 border border-white/10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-white/80">
              🎁 {participantB.name} недооценивает себя
            </h3>
            <div className="space-y-2">
              {surprisesB.map((s) => (
                <div key={s.question.questionId} className="flex items-center gap-2">
                  <span className="text-xl">{s.question.icon}</span>
                  <span className="text-xs font-bold">{s.question.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 text-center text-[0.55rem] font-black uppercase tracking-[0.3em] text-white/40">
        Knowing You, Knowing Me
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F1E24] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white italic tracking-tight">Создать карточку для соцсетей</h2>
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
              ТИП КАРТОЧКИ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCardType('main')}
                className={`py-4 px-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  cardType === 'main'
                    ? 'border-white bg-white text-gray-900 shadow-xl'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                💕 ГЛАВНАЯ
              </button>
              <button
                onClick={() => setCardType('details')}
                className={`py-4 px-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  cardType === 'details'
                    ? 'border-white bg-white text-gray-900 shadow-xl'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                📊 ДЕТАЛИ
              </button>
              <button
                onClick={() => setCardType('insights')}
                className={`py-4 px-4 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                  cardType === 'insights'
                    ? 'border-white bg-white text-gray-900 shadow-xl'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                🔍 ИНСАЙТЫ
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="mb-10 overflow-hidden rounded-[2rem] shadow-2xl border border-white/5 flex justify-center">
            <div className="transform scale-[0.55] origin-top">
              {cardType === 'main' && renderMainCard()}
              {cardType === 'details' && renderDetailsCard()}
              {cardType === 'insights' && renderInsightsCard()}
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
