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
      // Detect language from locale cookie or browser
      const localeCookie = document.cookie.match(/locale=([^;]+)/)
      const language = localeCookie?.[1] || (navigator.language.startsWith('ru') ? 'ru' : 'en')
      
      // Generate questions with AI
      const genRes = await apiFetch('/api/packs/generate', {
        method: 'POST',
        body: JSON.stringify({ theme: topic, language })
      })
      
      if (!genRes.ok) {
        throw new Error('Generation failed')
      }
      
      const genData = await genRes.json()
      
      // Save pack and go to create room
      const saveRes = await apiFetch('/api/packs/save', {
        method: 'POST',
        body: JSON.stringify({
          name: gameName.trim() || topic.trim(),
          questions: genData.questions
        })
      })
      
      if (!saveRes.ok) {
        throw new Error('Save failed')
      }
      
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
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm font-bold transition-all">
            ← {t('common.back')}
          </Link>
          <h1 className="text-xl font-black uppercase tracking-widest">{t('customPack.title')}</h1>
          <div className="w-16" />
        </div>

        {/* Main card */}
        <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-[2rem] p-8 border border-purple-500/20 backdrop-blur-sm mb-8">
          {/* AI icon */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4 animate-bounce">🤖</div>
            <h2 className="text-2xl font-black">{t('customPack.aiTitle')}</h2>
            <p className="text-white/50 mt-2">{t('customPack.aiSubtitle')}</p>
          </div>
          
          {/* Topic input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-widest mb-2 ml-1">
                {t('customPack.topicLabel')}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('customPack.topicPlaceholder')}
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                disabled={generating}
              />
            </div>

            {/* Game name (optional) */}
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-widest mb-2 ml-1">
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

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={createGame}
          disabled={generating || !topic.trim()}
          className="w-full py-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black uppercase tracking-widest text-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
        >
          {generating ? (
            <>
              <span className="animate-spin">⏳</span>
              {t('customPack.generating')}
            </>
          ) : (
            <>
              <span className="text-2xl">✨</span>
              {t('customPack.create')}
            </>
          )}
        </button>

        <p className="text-center text-xs text-white/30 mt-6">
          {t('customPack.hint')}
        </p>
      </div>
    </div>
  )
}
