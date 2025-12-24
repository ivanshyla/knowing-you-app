'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QUESTION_PACKS } from '@/data/questionPacks'
import { apiFetch } from '@/lib/apiClient'

const EMOJIS = ['🫦', '🔥', '😎', '👑', '🦄', '😈', '💘', '🤫', '🤍', '🫶', '💋', '🌶️', '🎯', '🪩', '🥂', '⚡']
const STACK_COLORS = ['#1F313B', '#383852', '#784259', '#B94E56', '#BE4039', '#683536'] as const

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1F313B] text-sm uppercase tracking-[0.4em] text-white/40">
          Подготовка...
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  )
}

function CreateRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packs = Object.values(QUESTION_PACKS)
  const defaultPack = packs[0]?.id ?? ''
  
  const [selectedPack, setSelectedPack] = useState(defaultPack)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🫦')
  const [loading, setLoading] = useState(false)
  const [paywall, setPaywall] = useState(false)
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null)

  const packFromQuery = searchParams.get('pack')

  useEffect(() => {
    if (packFromQuery && QUESTION_PACKS[packFromQuery]) {
      setSelectedPack(packFromQuery)
    }
  }, [packFromQuery])

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Введите ваше имя!')
      return
    }

    setLoading(true)
    setPaywall(false)
    setPaywallMessage(null)
    try {
      const response = await apiFetch('/api/create-room', {
        method: 'POST',
        body: JSON.stringify({
          questionPack: selectedPack,
          creatorName: name.trim(),
          creatorEmoji: emoji
        })
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 402) {
          setPaywall(true)
          setPaywallMessage(data?.error || 'Нужна подписка')
          return
        }
        throw new Error(data?.error || 'Failed to create room')
      }

      localStorage.setItem(`session_${data.code}_role`, 'A')
      localStorage.setItem(`session_${data.code}_participant_id`, data.participantId)
      localStorage.setItem(`session_${data.code}_session_id`, data.sessionId)
      localStorage.setItem(`kykm_last_code`, data.code)
      router.push(`/room/${data.code}`)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Ошибка создания комнаты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1F313B] text-white py-12 px-6">
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-gradient-to-b from-[#BE4039]/20 via-[#383852]/40 to-[#1F313B] pointer-events-none" 
      />
      
      <div className="relative z-10 mx-auto max-w-md space-y-10">
        <header className="text-center space-y-2">
          <p className="text-[0.65rem] uppercase tracking-[0.5em] text-white/40 font-bold italic">ШАГ 1 ИЗ 2</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white italic">Создание игры</h1>
          <p className="text-sm text-white/60 font-medium">Выберите тему и настройте свой профиль</p>
        </header>

        {paywall && (
          <section className="rounded-[2.5rem] bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-md">
            <p className="text-[0.65rem] uppercase tracking-widest text-[#BE4039] font-bold mb-2">ЛИМИТ ДОСТИГНУТ</p>
            <h2 className="text-2xl font-bold">Нужен PRO-аккаунт</h2>
            <p className="mt-2 text-sm text-white/60 font-medium leading-relaxed">
              {paywallMessage || 'Для создания новой игры требуется подписка $9.'}
            </p>
            <Link
              href="/account"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-[#BE4039] py-5 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-red-950/50"
            >
              Подробнее о подписке →
            </Link>
          </section>
        )}

        <section className="space-y-4">
          <label className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-4 text-white/40">ВЫБЕРИТЕ ТЕМУ</label>
          <div className="grid gap-3">
            {packs.map((pack, idx) => {
              const isSelected = selectedPack === pack.id
              const packColor = STACK_COLORS[idx % STACK_COLORS.length]
              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`flex items-center gap-5 p-6 rounded-[2rem] text-left transition-all ${
                    isSelected 
                      ? 'ring-2 ring-white shadow-2xl scale-[1.02]' 
                      : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-100'
                  }`}
                  style={isSelected ? { backgroundColor: packColor } : {}}
                >
                  <span className="text-4xl drop-shadow-lg">{pack.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white leading-tight truncate italic">{pack.name}</p>
                    <p className="text-[0.65rem] text-white/60 font-bold uppercase tracking-tighter mt-1">{pack.subtitle}</p>
                  </div>
                  {isSelected && <div className="h-3 w-3 rounded-full bg-white shadow-sm" />}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white/5 border border-white/10 p-8 space-y-8 backdrop-blur-sm shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-2">ВАШЕ ИМЯ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас называть?"
                maxLength={20}
                className="w-full rounded-[1.5rem] border-2 border-white/5 bg-white/5 px-6 py-5 text-white font-bold placeholder:text-white/20 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-all text-lg shadow-inner"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-2">ЭМОДЗИ-ОБРАЗ</label>
              <div className="grid grid-cols-8 gap-3">
                {EMOJIS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setEmoji(icon)}
                    className={`flex items-center justify-center rounded-xl aspect-square text-2xl transition-all ${
                      emoji === icon ? 'bg-white/20 scale-125 shadow-lg' : 'bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6 pt-4 pb-12">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !selectedPack}
            className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-bold uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.3)] transition-transform active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? 'СОЗДАЁМ...' : 'ПОЛУЧИТЬ КОД →'}
          </button>
          
          <div className="flex flex-col items-center gap-4">
            <Link href="/account" className="text-[0.65rem] font-bold text-white/40 hover:text-white uppercase tracking-[0.3em] transition-all">
              АККАУНТ И СТАТИСТИКА
            </Link>
            <Link href="/" className="text-[0.65rem] font-bold text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-all">
              ← НА ГЛАВНУЮ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
