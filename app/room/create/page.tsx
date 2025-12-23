'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { QUESTION_PACKS } from '@/data/questionPacks'

const EMOJIS = ['🫦', '🔥', '😎', '👑', '🦄', '😈', '💘', '🤫', '🤍', '🫶', '💋', '🌶️', '🎯', '🪩', '🥂', '⚡']
const STACK_COLORS = ['#1F313B', '#383852', '#784259', '#B94E56', '#BE4039', '#863536'] as const

export default function CreateRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1F313B] text-sm uppercase tracking-[0.4em] text-white/60">
          Грузим комнату...
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
      router.push(`/room/${data.code}`)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Ошибка создания комнаты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1F313B] px-4 py-10 text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff5f6d22,transparent_60%)]" />
      <div aria-hidden="true" className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-[#BE4039]/25 blur-[140px]" />
      <div aria-hidden="true" className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#383852]/30 blur-[180px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">Шаг 1</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">
            Соберите комнату <span className="text-white/70">для двоих</span>
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Выберите тему, оставьте своё имя и эмодзи — мы создадим приватный код. Вопросы острые, ответы остаются только у вас.
          </p>
        </header>

        {paywall && (
          <section className="rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Лимит free</p>
            <h2 className="mt-2 text-2xl font-semibold">Нужен PRO</h2>
            <p className="mt-2 text-sm text-white/70">
              {paywallMessage || 'Вы уже сыграли 1 раз бесплатно. Оформите подписку $9 и играйте без ограничений.'}
            </p>
            <Link
              href="/account"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#BE4039] via-[#B94E56] to-[#863536] px-10 py-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_35px_rgba(0,0,0,0.5)]"
            >
              Перейти к подписке →
            </Link>
          </section>
        )}

        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <div className="mb-5 flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/60">
            <span>Наборы вопросов</span>
            <span>{packs.length} тем</span>
          </div>
          <div className="flex flex-col gap-4">
            {packs.map((pack, index) => {
              const baseColor = STACK_COLORS[index % STACK_COLORS.length]
              const accentColor = lightenColor(baseColor, 20)
              const isSelected = selectedPack === pack.id

              return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPack(pack.id)}
                  className={`relative w-full rounded-[2rem] px-5 py-5 text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    isSelected
                      ? 'scale-[1.04] ring-4 ring-white/70 shadow-[0_35px_65px_rgba(0,0,0,0.55)]'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                style={{
                    backgroundImage: `linear-gradient(135deg, ${baseColor}, ${accentColor})`,
                    border: isSelected ? '1px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                    boxShadow: isSelected ? `0 35px 70px ${hexToRgba(baseColor, 0.65)}` : `0 12px 25px ${hexToRgba('#000000', 0.2)}`
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{pack.emoji}</div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-[0.4em] text-white/70">{pack.subtitle}</div>
                    <h3 className="text-xl font-semibold">{pack.name}</h3>
                    <p className="text-sm text-white/80">{pack.description}</p>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">{pack.questions.length} вопросов</p>
                  </div>
                </div>
              </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <div className="mb-6 text-left text-xs uppercase tracking-[0.4em] text-white/60">Ваш образ</div>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/80">Имя в игре</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Твоё имя"
                maxLength={20}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-white/80">Эмодзи-настроение</label>
              <div className="grid grid-cols-8 gap-2 sm:grid-cols-8">
                {EMOJIS.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setEmoji(icon)}
                    className={`rounded-2xl border border-white/10 bg-white/10 py-2 text-2xl transition-all duration-200 ${
                      emoji === icon ? 'scale-110 border-white/70 bg-white/20 shadow-lg' : 'hover:border-white/30'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/10 px-5 py-4 text-sm text-white/80">
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-white/60">Предпросмотр</div>
              <div className="flex items-center gap-3 text-lg font-semibold">
                <span className="text-4xl">{emoji}</span>
                <span>{name || 'Ваше имя'}</span>
                <span className="text-sm text-white/50">· {packs.find((pack) => pack.id === selectedPack)?.name ?? 'Тема'}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !selectedPack}
            className="w-full rounded-full bg-gradient-to-r from-[#BE4039] via-[#B94E56] to-[#863536] px-10 py-5 text-center text-lg font-semibold uppercase tracking-[0.35em] text-white shadow-[0_25px_45px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {loading ? 'Создаём...' : 'Получить код'}
          </button>
          <p className="text-center text-xs text-white/60">Ссылка работает сразу, данные хранятся только у вас.</p>
          <Link href="/account" className="text-center text-sm font-semibold text-white/70 underline-offset-4 hover:text-white">
            Аккаунт и подписка →
          </Link>
          <Link href="/" className="text-center text-sm font-semibold text-white/70 underline-offset-4 hover:text-white">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '')
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lightenColor(hex: string, percent: number) {
  const sanitized = hex.replace('#', '')
  const r = parseInt(sanitized.substring(0, 2), 16)
  const g = parseInt(sanitized.substring(2, 4), 16)
  const b = parseInt(sanitized.substring(4, 6), 16)
  const adjustChannel = (channel: number) => {
    const amount = Math.round(255 * (percent / 100))
    return Math.max(0, Math.min(255, channel + amount))
  }
  const [nr, ng, nb] = [adjustChannel(r), adjustChannel(g), adjustChannel(b)]
  return `#${[nr, ng, nb].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}


