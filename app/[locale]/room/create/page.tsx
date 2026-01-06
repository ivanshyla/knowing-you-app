'use client'

import { Link } from '@/i18n/routing'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { QUESTION_PACKS } from '@/data/questionPacks'
import { apiFetch } from '@/lib/apiClient'

const EMOJIS = ['🫦', '🔥', '😎', '👑', '🦄', '😈', '💘', '🤫', '🤍', '🫶', '💋', '🌶️']
const STACK_COLORS = ['#BE4039', '#B94E56', '#784259', '#383852', '#1F313B', '#683536'] as const

type CustomPack = {
  id: string
  name: string
  emoji: string
  subtitle: string
  description: string
  questions: { text: string; icon: string }[]
}

export default function CreateRoomPage() {
  const t = useTranslations()
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1F313B] text-sm uppercase tracking-[0.4em] text-white/40">
          {t('common.loading')}
        </div>
      }
    >
      <CreateRoomContent />
    </Suspense>
  )
}

function CreateRoomContent() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packs = Object.values(QUESTION_PACKS)
  const defaultPack = packs[0]?.id ?? ''
  
  const [selectedPack, setSelectedPack] = useState(defaultPack)
  const [customPack, setCustomPack] = useState<CustomPack | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('👑')
  const [loading, setLoading] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  const packFromQuery = searchParams.get('pack')
  const isCustomPack = packFromQuery?.startsWith('custom_') || selectedPack.startsWith('custom_')

  useEffect(() => {
    if (packFromQuery) {
      // Handle custom packs
      if (packFromQuery.startsWith('custom_')) {
        setSelectedPack(packFromQuery)
        
        // Load custom pack from sessionStorage
        const stored = sessionStorage.getItem(`custom_pack_${packFromQuery}`)
        if (stored) {
          try {
            const questions = JSON.parse(stored)
            const packName = packFromQuery.replace('custom_', '').replace(/_/g, ' ')
            setCustomPack({
              id: packFromQuery,
              name: packName || 'Custom Game',
              emoji: '✨',
              subtitle: 'AI Generated',
              description: 'Your custom question pack',
              questions: questions.map((q: any) => ({ 
                text: q.text || q, 
                icon: q.icon || '❓' 
              }))
            })
          } catch (e) {
            console.error('Failed to load custom pack:', e)
          }
        }
      } 
      // Handle regular packs
      else if (QUESTION_PACKS[packFromQuery]) {
        setSelectedPack(packFromQuery)
      }
    }
  }, [packFromQuery])

  const currentPack = isCustomPack ? null : QUESTION_PACKS[selectedPack]
  const packKey = selectedPack as 'romantic' | 'everyday' | 'intimacy' | 'character' | 'friends' | 'office' | 'sport' | 'club'
  
  // Get pack display info
  let packName, packSubtitle, packDescription, packEmoji, packQuestions
  
  if (isCustomPack && customPack) {
    packName = customPack.name
    packSubtitle = customPack.subtitle
    packDescription = customPack.description
    packEmoji = customPack.emoji
    packQuestions = customPack.questions
  } else if (currentPack) {
    try {
      packName = t(`packs.${packKey}.name`)
      packSubtitle = t(`packs.${packKey}.subtitle`)
      packDescription = t(`packs.${packKey}.description`)
    } catch {
      packName = currentPack.name
      packSubtitle = currentPack.subtitle
      packDescription = currentPack.description
    }
    packEmoji = currentPack.emoji
    packQuestions = currentPack.questions
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      alert(t('create.enterName'))
      return
    }

    setLoading(true)
    try {
      // Prepare request body
      const body: Record<string, any> = {
        questionPack: selectedPack,
        creatorName: name.trim(),
        creatorEmoji: emoji
      }

      // Add custom questions if it's a custom pack
      if (isCustomPack && customPack) {
        body.customQuestions = customPack.questions
      }

      const response = await apiFetch('/api/create-room', {
        method: 'POST',
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 402) {
          router.push('/account')
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
      alert(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  // Show loading if custom pack is expected but not loaded yet
  if (packFromQuery?.startsWith('custom_') && !customPack) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1F313B] text-sm uppercase tracking-[0.4em] text-white/40">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#1F313B] text-white font-sans">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#BE4039]/30 via-[#383852]/50 to-[#1F313B] opacity-90"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <Link 
          href="/" 
          className="text-white/50 hover:text-white text-sm font-bold transition-all mb-8"
        >
          ← {t('common.back')}
        </Link>

        {/* Selected Pack Card */}
        {(currentPack || customPack) && (
          <div 
            className="rounded-[2.5rem] px-8 py-8 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
            style={{ backgroundColor: STACK_COLORS[0] }}
          >
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <span className="text-5xl drop-shadow-2xl">{packEmoji}</span>
                <div className="flex-1">
                  <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50 font-black">{packSubtitle}</p>
                  <h2 className="text-2xl font-black leading-none italic uppercase tracking-tight mt-1">{packName}</h2>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-white/70 font-medium leading-snug">{packDescription}</p>
              
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="mt-4 text-[0.7rem] text-white/50 hover:text-white underline underline-offset-4 transition-all"
              >
                {showQuestions ? t('create.hideQuestions') : t('create.showQuestions')}
              </button>
              
              {showQuestions && packQuestions && (
                <div className="mt-4 space-y-2">
                  {packQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <span>{q.icon}</span>
                      <span>{q.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="mt-8 space-y-6">
          <div className="space-y-3">
            <label className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-2">{t('create.yourName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('create.namePlaceholder')}
              className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-white/5 bg-white/5 text-white font-bold focus:border-white/40 focus:bg-white/10 outline-none transition-all text-lg shadow-inner"
              maxLength={20}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-2">{t('create.yourAvatar')}</label>
            <div className="grid grid-cols-6 gap-3">
              {EMOJIS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setEmoji(icon)}
                  className={`flex items-center justify-center rounded-xl aspect-square text-2xl transition-all ${
                    emoji === icon ? 'bg-white/20 scale-110 ring-2 ring-white/40' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-bold uppercase tracking-[0.15em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.4)] transition-all active:scale-95 disabled:opacity-40 mt-6"
          >
            {loading ? t('common.loading') : t('create.start')}
          </button>
        </div>
      </div>
    </div>
  )
}
