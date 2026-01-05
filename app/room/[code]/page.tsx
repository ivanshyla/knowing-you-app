'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ParticipantRecord } from '@/lib/models'
import { apiFetch } from '@/lib/apiClient'
import { formatCode } from '@/lib/utils'
import Link from 'next/link'

const EMOJIS = ['😊', '🥰', '😎', '🤗', '😇', '🤩', '😋', '🥳', '🤠', '👑', '🌟', '💫']

type ViewState = 'loading' | 'join' | 'lobby'

export default function RoomPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [myRole, setMyRole] = useState<'A' | 'B' | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [joining, setJoining] = useState(false)
  const [pollingError, setPollingError] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
      const storedRole = localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null
      const storedSessionId = localStorage.getItem(`session_${code}_session_id`)
      if (storedRole) setMyRole(storedRole)
      if (storedSessionId) setSessionId(storedSessionId)
    }
  }, [code])

  const loadState = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({ code })
      const response = await apiFetch(`/api/room/state?${queryParams.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        if (response.status === 404) {
          setPollingError(t('lobby.roomNotFound'))
          setViewState('loading')
        }
        return
      }

      const data = await response.json()
      setParticipants(data.participants ?? [])
      setSessionId(data.session.id)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`session_${code}_session_id`, data.session.id)
      }
      
      setPollingError(null)

      // Check if user has already joined this room
      const storedRole = typeof window !== 'undefined' 
        ? localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null 
        : null
      const storedParticipantId = typeof window !== 'undefined'
        ? localStorage.getItem(`session_${code}_participant_id`)
        : null

      // If game is live or done, only redirect if user has a participantId (they've joined)
      if (data.session.status === 'live') {
        if (storedRole && storedParticipantId) {
          router.push(`/room/${code}/questions`)
          return
        }
        // User hasn't joined yet - show join form
        setMyRole(null)
        setViewState('join')
        return
      }

      if (data.session.status === 'done') {
        if (storedRole && storedParticipantId) {
          router.push(`/room/${code}/results`)
          return
        }
        // User hasn't joined - they can't view results, show error
        setPollingError('Game has already ended')
        return
      }

      // Game is waiting - show join form or lobby
      setMyRole(storedRole)
      setViewState(storedRole ? 'lobby' : 'join')
    } catch (error) {
      console.error('Failed to load room state:', error)
      setPollingError(t('lobby.connectionError'))
    }
  }, [code, router, t])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      await loadState()
    }
    tick()
    const interval = setInterval(tick, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [loadState])

  const handleJoin = useCallback(async () => {
    if (!name.trim()) {
      alert(t('create.enterName'))
      return
    }

    setJoining(true)
    try {
      const response = await apiFetch('/api/join-room', {
        method: 'POST',
        body: JSON.stringify({ code, name: name.trim(), emoji })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to join')
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`session_${code}_role`, data.role)
        localStorage.setItem(`session_${code}_participant_id`, data.participantId)
        localStorage.setItem(`session_${code}_session_id`, data.sessionId)
        localStorage.setItem('kykm_last_code', code)
      }
      setMyRole(data.role)
      setSessionId(data.sessionId)
      
      // If game already started, go directly to questions
      if (data.sessionStatus === 'live') {
        router.push(`/room/${code}/questions`)
        return
      }
      
      setViewState('lobby')
      await loadState()
    } catch (error) {
      console.error('Error joining room:', error)
      alert(t('common.error'))
    } finally {
      setJoining(false)
    }
  }, [code, emoji, loadState, name, t])

  const handleStart = useCallback(async () => {
    if (!sessionId) return

    try {
      const response = await apiFetch('/api/start-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data?.error || t('common.error'))
        return
      }

      router.push(`/room/${code}/questions`)
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }, [code, router, sessionId, t])

  const inviteUrl = useMemo(() => (origin ? `${origin}/room/${code}` : ''), [code, origin])

  const handleCopyInvite = useCallback(async () => {
    const url = inviteUrl || `${window.location.origin}/room/${code}`
    if (!url) return
    
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2500)
    } catch (error) {
      console.error('Failed to copy:', error)
      window.prompt(t('lobby.copyLink'), url)
    }
  }, [inviteUrl, code, t])

  const handleInviteShare = useCallback(async () => {
    if (!inviteUrl) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Knowing You, Knowing Me',
          text: t('lobby.shareText'),
          url: inviteUrl
        })
        return
      }
    } catch (error) {
      console.warn('Share cancelled/failed:', error)
    }
    await handleCopyInvite()
  }, [handleCopyInvite, inviteUrl, t])

  const isReady = useMemo(() => participants.length === 2, [participants])
  const participantA = useMemo(() => participants.find((p) => p.role === 'A'), [participants])
  const participantB = useMemo(() => participants.find((p) => p.role === 'B'), [participants])

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[#1F313B] flex items-center justify-center px-4">
        <div className="text-center text-white/40 animate-pulse">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-sm uppercase tracking-widest font-black italic">{pollingError || t('lobby.searching')}</p>
        </div>
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
          className="text-white/50 hover:text-white text-sm font-bold transition-all mb-6"
        >
          ← {t('common.back')}
        </Link>

        <header className="text-center space-y-4">
          {viewState === 'join' && (
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white italic uppercase">
              {t('lobby.join')}
            </h1>
          )}
          
          {viewState === 'lobby' && (
            <button
              onClick={handleCopyInvite}
              className={`w-full py-5 px-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${
                copyStatus === 'copied' 
                  ? 'bg-white/10 text-white/60 border border-white/20' 
                  : 'bg-gradient-to-r from-[#4ecdc4] to-[#44a08d] text-white hover:scale-[1.02] active:scale-[0.98] shadow-emerald-900/30'
              }`}
            >
              {copyStatus === 'copied' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t('common.copied')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {t('lobby.copyInvite')}
                </span>
              )}
            </button>
          )}
          
          {pollingError && <p className="mt-4 text-sm text-[#BE4039] font-bold italic uppercase tracking-widest">{pollingError}</p>}
        </header>

        {viewState === 'join' ? (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-sm shadow-2xl">
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
              onClick={handleJoin}
              disabled={joining || !name.trim()}
              className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-bold uppercase tracking-[0.15em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.4)] transition-all active:scale-95 disabled:opacity-40"
            >
              {joining ? t('common.loading') : t('lobby.joinGame')}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="rounded-[2.5rem] bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-sm space-y-6">
              <h2 className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold text-center">
                {t('lobby.players')} ({participants.length}/2)
              </h2>
              <div className="space-y-4">
                <ParticipantCard participant={participantA} label={t('lobby.player1')} isYou={myRole === 'A'} youLabel={t('lobby.you')} />
                <ParticipantCard participant={participantB} label={t('lobby.player2')} isYou={myRole === 'B'} youLabel={t('lobby.you')} waiting={t('lobby.waiting')} />
              </div>
            </div>

            <div className="space-y-6">
              {!isReady && (
                <div className="rounded-[2rem] border-2 border-[#BE4039]/20 bg-[#BE4039]/5 p-6 text-center shadow-lg backdrop-blur-sm">
                  <p className="font-bold text-[#BE4039] text-sm uppercase tracking-widest italic">{t('lobby.waitingPartner')}</p>
                  <p className="text-xs text-white/40 mt-2 font-medium leading-relaxed">{t('lobby.canStartAlone')}</p>
                </div>
              )}

              {/* Anyone can start the game (async mode) */}
              {myRole && (
                <button
                  onClick={handleStart}
                  className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-bold uppercase tracking-[0.15em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.4)] transition-all active:scale-95"
                >
                  {t('lobby.startGame')} {isReady ? '' : '(1/2)'}
                </button>
              )}

              {isReady && (
                <div className="rounded-[2rem] border-2 border-emerald-500/20 bg-emerald-500/5 p-6 text-center shadow-lg backdrop-blur-sm">
                  <p className="font-bold text-emerald-500 text-sm uppercase tracking-widest italic">{t('lobby.allReady')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ParticipantCard({
  participant,
  label,
  isYou,
  youLabel,
  waiting
}: {
  participant?: ParticipantRecord
  label: string
  isYou: boolean
  youLabel: string
  waiting?: string
}) {
  if (!participant) {
    return (
      <div className="rounded-[1.5rem] border-2 border-dashed border-white/10 bg-white/2 p-6 text-center opacity-40 shadow-inner">
        <div className="text-4xl mb-2 grayscale">👤</div>
        <div className="text-[0.6rem] font-bold uppercase tracking-widest">{waiting || 'Waiting...'}</div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-[1.5rem] border-2 p-6 transition-all shadow-xl ${
        isYou ? 'border-[#BE4039] bg-[#BE4039]/10' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className="text-5xl drop-shadow-2xl">{participant.emoji}</span>
          <div className="space-y-1">
            <p className="text-lg font-bold text-white leading-tight italic uppercase tracking-tight">{participant.name}</p>
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/40 font-bold">{label}</p>
          </div>
        </div>
        {isYou && (
          <span className="rounded-full bg-white/10 border border-white/10 px-4 py-2 text-[0.55rem] font-black text-[#BE4039] uppercase tracking-widest shadow-sm">
            {youLabel}
          </span>
        )}
      </div>
    </div>
  )
}
