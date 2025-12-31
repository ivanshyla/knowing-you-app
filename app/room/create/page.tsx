'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QUESTION_PACKS } from '@/data/questionPacks'
import { apiFetch } from '@/lib/apiClient'

const EMOJIS = ['🫦', '🔥', '😎', '👑', '🦄', '😈', '💘', '🤫', '🤍', '🫶', '💋', '🌶️']

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-white/40">Загрузка...</div>}>
      <CreateRoomContent />
    </Suspense>
  )
}

function CreateRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packId = searchParams.get('pack') || 'romance'
  const pack = QUESTION_PACKS[packId] || Object.values(QUESTION_PACKS)[0]
  
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🫦')
  const [loading, setLoading] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Введите имя')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await apiFetch('/api/create-room', {
        method: 'POST',
        body: JSON.stringify({
          questionPack: pack.id,
          creatorName: name.trim(),
          creatorEmoji: emoji
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 402) {
          router.push('/account')
          return
        }
        setError(data.error || 'Ошибка создания')
        return
      }
      
      localStorage.setItem('kykm_last_code', data.code)
      localStorage.setItem(`session_${data.code}_id`, data.sessionId)
      localStorage.setItem(`session_${data.code}_role`, 'A')
      
      router.push(`/room/${data.code}`)
    } catch (e) {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm font-bold transition-all">
            ← Назад
          </Link>
        </div>

        {/* Pack Info */}
        <div 
          className="rounded-3xl p-6 mb-6"
          style={{ backgroundColor: '#BE4039' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">{pack.emoji}</span>
            <div>
              <p className="text-[0.6rem] uppercase tracking-widest text-white/60">{pack.subtitle}</p>
              <h1 className="text-2xl font-black italic uppercase">{pack.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/80">{pack.description}</p>
          
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="mt-4 text-xs text-white/60 hover:text-white/80 underline"
          >
            {showQuestions ? 'Скрыть вопросы' : `Показать ${pack.questions.length} вопросов`}
          </button>
        </div>

        {/* Questions Preview */}
        {showQuestions && (
          <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-white/10 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {pack.questions.map((q, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span>{q.icon}</span>
                  <span className="text-white/70">{q.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Name Input */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-6">
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">
            Твоё имя
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как тебя зовут?"
            className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-lg font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 mb-4"
            autoFocus
          />
          
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-3">
            Твой аватар
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  emoji === e 
                    ? 'bg-white/20 ring-2 ring-white/40 scale-110' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="w-full py-5 rounded-full bg-gradient-to-r from-[#e94560] to-[#BE4039] text-white font-black uppercase tracking-widest text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-red-900/30"
        >
          {loading ? 'Создаём...' : '🚀 Создать комнату'}
        </button>

        <p className="text-center text-xs text-white/30 mt-4">
          Партнёр присоединится по коду
        </p>
      </div>
    </div>
  )
}
