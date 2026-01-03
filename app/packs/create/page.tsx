'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/apiClient'

export default function CreatePackPage() {
  const t = useTranslations()
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [gameName, setGameName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const createGame = async () => {
    if (!topic.trim()) {
      setError(t('customPack.enterTopic'))
      return
    }
    
    setError('')
    setGenerating(true)
    
    try {
      const localeCookie = document.cookie.match(/locale=([^;]+)/)
      const language = localeCookie?.[1] || (navigator.language.startsWith('ru') ? 'ru' : 'en')
      
      const genRes = await apiFetch('/api/packs/generate', {
        method: 'POST',
        body: JSON.stringify({ theme: topic, language })
      })
      
      if (!genRes.ok) throw new Error('Generation failed')
      
      const genData = await genRes.json()
      
      const saveRes = await apiFetch('/api/packs/save', {
        method: 'POST',
        body: JSON.stringify({
          name: gameName.trim() || topic.trim(),
          questions: genData.questions
        })
      })
      
      if (!saveRes.ok) throw new Error('Save failed')
      
      const saveData = await saveRes.json()
      router.push(`/room/create?pack=${saveData.packId}`)
      
    } catch (e) {
      console.error(e)
      setError(t('customPack.error'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#1F313B] text-white font-sans">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#BE4039]/30 via-[#383852]/50 to-[#1F313B] opacity-90"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm font-bold transition-all">
            ← {t('common.back')}
          </Link>
          <h1 className="text-lg font-black uppercase tracking-widest">{t('customPack.title')}</h1>
          <div className="w-12" />
        </div>

        {/* Main card */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-sm shadow-2xl">
          {/* AI icon */}
          <div className="text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-black uppercase tracking-wider">{t('customPack.aiTitle')}</h2>
            <p className="text-white/50 text-sm mt-2">{t('customPack.aiSubtitle')}</p>
          </div>
          
          {/* Topic input */}
          <div className="space-y-4">
            <div>
              <label className="block text-[0.65rem] text-white/40 uppercase tracking-[0.3em] mb-2 ml-1 font-bold">
                {t('customPack.topicLabel')}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('customPack.topicPlaceholder')}
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#BE4039]/50 transition-all"
                disabled={generating}
              />
            </div>

            <div>
              <label className="block text-[0.65rem] text-white/40 uppercase tracking-[0.3em] mb-2 ml-1 font-bold">
                {t('customPack.nameLabel')} <span className="text-white/20">({t('customPack.optional')})</span>
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder={t('customPack.namePlaceholder')}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                disabled={generating}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#BE4039]/20 border border-[#BE4039]/30 rounded-xl text-[#BE4039] text-sm text-center font-bold">
              {error}
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={createGame}
          disabled={generating || !topic.trim()}
          className="mt-8 w-full py-5 rounded-full bg-[#BE4039] text-white font-black uppercase tracking-widest text-lg shadow-[0_20px_50px_rgba(190,64,57,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
        >
          {generating ? (
            <>
              <span className="animate-spin">⏳</span>
              {t('customPack.generating')}
            </>
          ) : (
            <>
              ✨ {t('customPack.create')}
            </>
          )}
        </button>

        <p className="text-center text-[0.65rem] text-white/30 font-bold uppercase tracking-[0.2em] mt-4">
          {t('customPack.hint')}
        </p>
      </div>
    </div>
  )
}
