'use client'

import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import type { ParticipantRecord } from '@/lib/models'

type ShareCardProps = {
  participantA: ParticipantRecord
  participantB: ParticipantRecord
  matchPercentage: number
  topMatch: {
    question: { text: string; icon: string }
    avgGap: number
  }
  onClose: () => void
}

type Theme = 'cute' | 'funny' | 'neutral'

export default function ShareCard({ 
  participantA, 
  participantB, 
  matchPercentage, 
  topMatch,
  onClose 
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<Theme>('cute')
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
          link.download = 'knowing-you-knowing-me.png'
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

  const themes = {
    cute: {
      bg: 'bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200',
      accent: 'text-pink-600',
      emoji: '💕',
    },
    funny: {
      bg: 'bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200',
      accent: 'text-orange-600',
      emoji: '🤪',
    },
    neutral: {
      bg: 'bg-gradient-to-br from-gray-200 via-blue-200 to-purple-200',
      accent: 'text-blue-600',
      emoji: '🧠',
    },
  }

  const currentTheme = themes[theme]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Создать картинку</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Theme Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите тему:
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('cute')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  theme === 'cute'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                💘 Милая
              </button>
              <button
                onClick={() => setTheme('funny')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  theme === 'funny'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                🤪 Весёлая
              </button>
              <button
                onClick={() => setTheme('neutral')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  theme === 'neutral'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                🧠 Нейтральная
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="mb-6 overflow-hidden rounded-xl">
            <div
              ref={cardRef}
              className={`${currentTheme.bg} p-8 aspect-square flex flex-col justify-between`}
              style={{ width: '600px', height: '600px' }}
            >
              {/* Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Knowing You, Knowing Me
                </h1>
                <p className="text-lg text-gray-700">
                  Насколько хорошо мы знаем друг друга?
                </p>
              </div>

              {/* Participants */}
              <div className="flex justify-around items-center my-8">
                <div className="text-center">
                  <div className="text-6xl mb-2">{participantA.emoji}</div>
                  <div className="text-xl font-semibold text-gray-800">
                    {participantA.name}
                  </div>
                </div>
                <div className="text-5xl">{currentTheme.emoji}</div>
                <div className="text-center">
                  <div className="text-6xl mb-2">{participantB.emoji}</div>
                  <div className="text-xl font-semibold text-gray-800">
                    {participantB.name}
                  </div>
                </div>
              </div>

              {/* Match Score */}
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center">
                <div className={`text-6xl font-bold ${currentTheme.accent} mb-2`}>
                  {matchPercentage}%
                </div>
                <div className="text-xl text-gray-800 mb-3">Совместимость</div>
                
                {/* Top Match */}
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <span className="text-2xl">{topMatch.question.icon}</span>
                  <span className="text-sm">
                    Лучшее совпадение: {topMatch.question.text}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-gray-700 text-sm">
                Попробуйте сами → knowing-you.app
              </div>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {downloading ? 'Создаём...' : 'Скачать картинку 📥'}
          </button>
        </div>
      </div>
    </div>
  )
}




