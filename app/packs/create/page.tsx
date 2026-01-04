'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/apiClient'

// Animated AI brain icon
function AIBrainIcon({ animate = false }: { animate?: boolean }) {
  return (
    <div className={`relative w-20 h-20 mx-auto ${animate ? 'animate-pulse' : ''}`}>
      <svg viewBox="0 0 80 80" className="w-full h-full">
        {/* Brain outline */}
        <defs>
          <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BE4039" />
            <stop offset="100%" stopColor="#784259" />
          </linearGradient>
        </defs>
        
        {/* Outer glow */}
        <circle cx="40" cy="40" r="35" fill="none" stroke="url(#brainGrad)" strokeWidth="2" opacity="0.3">
          {animate && <animate attributeName="r" values="32;38;32" dur="2s" repeatCount="indefinite" />}
        </circle>
        
        {/* Main circle */}
        <circle cx="40" cy="40" r="28" fill="url(#brainGrad)" opacity="0.9" />
        
        {/* Neural network nodes */}
        <g fill="white" opacity="0.9">
          <circle cx="40" cy="32" r="3">
            {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />}
          </circle>
          <circle cx="32" cy="42" r="2.5">
            {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.3s" repeatCount="indefinite" />}
          </circle>
          <circle cx="48" cy="42" r="2.5">
            {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.6s" repeatCount="indefinite" />}
          </circle>
          <circle cx="40" cy="50" r="2">
            {animate && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="0.9s" repeatCount="indefinite" />}
          </circle>
        </g>
        
        {/* Connection lines */}
        <g stroke="white" strokeWidth="1.5" opacity="0.6">
          <line x1="40" y1="32" x2="32" y2="42">
            {animate && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />}
          </line>
          <line x1="40" y1="32" x2="48" y2="42">
            {animate && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" begin="0.2s" repeatCount="indefinite" />}
          </line>
          <line x1="32" y1="42" x2="40" y2="50">
            {animate && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" begin="0.4s" repeatCount="indefinite" />}
          </line>
          <line x1="48" y1="42" x2="40" y2="50">
            {animate && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" begin="0.6s" repeatCount="indefinite" />}
          </line>
        </g>
      </svg>
      
      {/* Orbiting particles when animating */}
      {animate && (
        <div className="absolute inset-0">
          <div className="absolute w-2 h-2 bg-white/60 rounded-full animate-orbit-1" style={{ top: '10%', left: '50%' }} />
          <div className="absolute w-1.5 h-1.5 bg-[#BE4039]/80 rounded-full animate-orbit-2" style={{ top: '50%', left: '85%' }} />
          <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-orbit-3" style={{ top: '80%', left: '30%' }} />
        </div>
      )}
    </div>
  )
}

// Sparkle icon for button
function SparkleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  )
}

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
      
      // Generate questions
      const genRes = await apiFetch('/api/packs/generate', {
        method: 'POST',
        body: JSON.stringify({ theme: topic, language })
      })
      
      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Generation failed')
      }
      
      const genData = await genRes.json()
      
      // Save pack
      const saveRes = await apiFetch('/api/packs/save', {
        method: 'POST',
        body: JSON.stringify({
          name: gameName.trim() || topic.trim(),
          questions: genData.questions
        })
      })
      
      if (!saveRes.ok) throw new Error('Save failed')
      
      const saveData = await saveRes.json()
      
      // Create room directly with this pack
      const roomRes = await apiFetch('/api/create-room', {
        method: 'POST',
        body: JSON.stringify({
          packId: saveData.packId,
          customQuestions: saveData.pack.questions
        })
      })
      
      if (!roomRes.ok) throw new Error('Room creation failed')
      
      const roomData = await roomRes.json()
      router.push(`/room/${roomData.code}`)
      
    } catch (e: any) {
      console.error(e)
      setError(e.message || t('customPack.error'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#1F313B] text-white font-sans">
      <style jsx>{`
        @keyframes orbit-1 {
          0% { transform: rotate(0deg) translateX(35px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(35px) rotate(-360deg); }
        }
        @keyframes orbit-2 {
          0% { transform: rotate(120deg) translateX(30px) rotate(-120deg); }
          100% { transform: rotate(480deg) translateX(30px) rotate(-480deg); }
        }
        @keyframes orbit-3 {
          0% { transform: rotate(240deg) translateX(25px) rotate(-240deg); }
          100% { transform: rotate(600deg) translateX(25px) rotate(-600deg); }
        }
        .animate-orbit-1 { animation: orbit-1 3s linear infinite; }
        .animate-orbit-2 { animation: orbit-2 4s linear infinite; }
        .animate-orbit-3 { animation: orbit-3 2.5s linear infinite; }
      `}</style>
      
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#BE4039]/30 via-[#383852]/50 to-[#1F313B] opacity-90"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm font-bold transition-all">
            <svg className="w-5 h-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')}
          </Link>
          <h1 className="text-lg font-black uppercase tracking-widest">{t('customPack.title')}</h1>
          <div className="w-16" />
        </div>

        {/* Main card */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-sm shadow-2xl">
          {/* AI icon */}
          <div className="text-center">
            <AIBrainIcon animate={generating} />
            <h2 className="text-xl font-black uppercase tracking-wider mt-4">{t('customPack.aiTitle')}</h2>
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
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('customPack.generating')}
            </>
          ) : (
            <>
              <SparkleIcon />
              {t('customPack.create')}
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
