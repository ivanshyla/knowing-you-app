'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { ParticipantRecord } from '@/lib/models'
import { apiFetch } from '@/lib/apiClient'
import { formatCode } from '@/lib/utils'
import { Share } from '@capacitor/share'
import { isCapacitor } from '@/lib/capacitor'
import Link from 'next/link'

const EMOJIS = ['😊', '🥰', '😎', '🤗', '😇', '🤩', '😋', '🥳', '🤠', '👑', '🌟', '💫', '🔥', '💖', '🎯', '🦄']

type ViewState = 'loading' | 'join' | 'lobby'

export default function RoomPage() {
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
          setPollingError('Комната не найдена')
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

      if (data.session.status === 'live') {
        router.push(`/room/${code}/questions`)
        return
      }

      if (data.session.status === 'done') {
        router.push(`/room/${code}/results`)
        return
      }

      if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null
        setMyRole(storedRole)
        setViewState(storedRole ? 'lobby' : 'join')
      }
    } catch (error) {
      console.error('Failed to load room state:', error)
      setPollingError('Не удаётся обновить комнату')
    }
  }, [code, router])

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
      alert('Введите ваше имя!')
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
      setViewState('lobby')
      await loadState()
    } catch (error) {
      console.error('Error joining room:', error)
      alert('Не получилось зайти. Попробуйте ещё раз.')
    } finally {
      setJoining(false)
    }
  }, [code, emoji, loadState, name])

  const handleStart = useCallback(async () => {
    if (!sessionId) return

    try {
      const response = await apiFetch('/api/start-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data?.error || 'Ошибка старта')
        return
      }

      router.push(`/room/${code}/questions`)
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }, [code, router, sessionId])

  const inviteUrl = useMemo(() => (origin ? `${origin}/room/${code}` : ''), [code, origin])

  const handleCopyInvite = useCallback(async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to copy invite link:', error)
      alert('Не удалось скопировать. Пожалуйста, скопируйте URL вручную.')
    }
  }, [inviteUrl])

  const handleInviteShare = useCallback(async () => {
    if (!inviteUrl) return
    try {
      if (isCapacitor()) {
        await Share.share({
          title: 'Knowing You, Knowing Me — приглашение',
          text: 'Заходи в комнату и сыграем 👇',
          url: inviteUrl,
          dialogTitle: 'Пригласить друга'
        })
        return
      }
      if (navigator.share) {
        await navigator.share({
          title: 'Knowing You, Knowing Me — приглашение',
          text: 'Заходи в комнату и сыграем 👇',
          url: inviteUrl
        })
        return
      }
    } catch (error) {
      console.warn('Share cancelled/failed:', error)
    }
    await handleCopyInvite()
  }, [handleCopyInvite, inviteUrl])

  const isReady = useMemo(() => participants.length === 2, [participants])
  const participantA = useMemo(() => participants.find((p) => p.role === 'A'), [participants])
  const participantB = useMemo(() => participants.find((p) => p.role === 'B'), [participants])

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[#1F313B] flex items-center justify-center px-4">
        <div className="text-center text-white/40 animate-pulse">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-sm uppercase tracking-widest font-black italic">{pollingError || 'Ищем комнату...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1F313B] text-white py-12 px-6 overflow-x-hidden">
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-gradient-to-b from-[#BE4039]/30 via-[#383852]/50 to-[#1F313B] pointer-events-none opacity-90" 
      />
      <div className="relative z-10 max-w-md mx-auto space-y-10">
        <header className="text-center space-y-4">
          <p className="text-[0.65rem] uppercase tracking-[0.5em] text-white/40 font-bold italic">КОМНАТА</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white italic uppercase">
            {viewState === 'join' ? 'Присоединиться' : 'Лобби v2.2 🎯'}
          </h1>
          
          {viewState === 'join' ? (
            <div className="text-3xl font-bold text-white/90 font-mono mt-6 bg-white/5 py-4 px-8 rounded-2xl inline-block border border-white/10 shadow-inner">
              {formatCode(code)}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 bg-white/5 px-8 py-5 rounded-[2rem] border border-white/10 shadow-inner backdrop-blur-sm">
                <span className="text-[0.65rem] uppercase tracking-widest text-white/40 font-black">КОД:</span>
                <span className="text-3xl font-bold font-mono text-white tracking-widest italic">{formatCode(code)}</span>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopyStatus('copied');
                      setTimeout(() => setCopyStatus('idle'), 2000);
                    }}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xl shadow-lg relative"
                    title="Копировать код"
                  >
                    📋
                    {copyStatus === 'copied' && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-[0.6rem] font-bold px-2 py-1 rounded shadow-xl animate-bounce">OK!</div>
                    )}
                  </button>
                  <button
                    onClick={handleInviteShare}
                    className="p-3 rounded-xl bg-[#BE4039] hover:bg-[#BE4039]/80 transition-all text-xl shadow-lg shadow-red-950/20"
                    title="Поделиться ссылкой"
                  >
                    📤
                  </button>
                </div>
              </div>
              {inviteUrl && (
                <button
                  onClick={handleCopyInvite}
                  className="text-[0.65rem] font-bold text-white/40 hover:text-white uppercase tracking-[0.3em] transition-all italic h-8"
                >
                  {copyStatus === 'copied' ? 'ССЫЛКА СКОПИРОВАНА ✅' : 'КОПИРОВАТЬ ССЫЛКУ-ПРИГЛАШЕНИЕ 🔗'}
                </button>
              )}
            </div>
          )}
          {pollingError && <p className="mt-4 text-sm text-[#BE4039] font-bold italic uppercase tracking-widest">{pollingError}</p>}
        </header>

        {viewState === 'join' ? (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-sm shadow-2xl">
            <div className="space-y-3">
              <label className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-2">ВАШЕ ИМЯ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Твоё имя"
                className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-white/5 bg-white/5 text-white font-bold focus:border-white/40 focus:bg-white/10 outline-none transition-all text-lg shadow-inner"
                maxLength={20}
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

            <button
              onClick={handleJoin}
              disabled={joining || !name.trim()}
              className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-bold uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.3)] transition-transform active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {joining ? 'ВХОДИМ...' : 'ВОЙТИ В ИГРУ'}
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="rounded-[2.5rem] bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-sm space-y-6">
              <h2 className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40 font-bold ml-2 text-center">УЧАСТНИКИ ({participants.length}/2)</h2>
              <div className="space-y-4">
                <ParticipantCard participant={participantA} label="ИГРОК 1" isYou={myRole === 'A'} />
                <ParticipantCard participant={participantB} label="ИГРОК 2" isYou={myRole === 'B'} />
              </div>
            </div>

            <div className="space-y-6 pb-12">
              {!isReady && (
                <div className="rounded-[2rem] border-2 border-[#BE4039]/20 bg-[#BE4039]/5 p-6 text-center shadow-lg backdrop-blur-sm">
                  <p className="font-bold text-[#BE4039] text-sm uppercase tracking-widest italic">Ждём партнёра</p>
                  <p className="text-xs text-white/40 mt-2 font-medium leading-relaxed">Вы можете начать игру в одиночку, партнер присоединится по коду позже.</p>
                </div>
              )}

              {myRole === 'A' && (
                <button
                  onClick={handleStart}
                  className="w-full rounded-full bg-[#BE4039] py-6 text-xl font-bold uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.3)] transition-all active:scale-95"
                >
                  НАЧАТЬ ИГРУ {isReady ? '' : '(1/2)'}
                </button>
              )}

              {isReady && myRole === 'B' && (
                <div className="rounded-[2rem] border-2 border-emerald-500/20 bg-emerald-500/5 p-6 text-center shadow-lg backdrop-blur-sm">
                  <p className="font-bold text-emerald-500 text-sm uppercase tracking-widest italic">Всё готово</p>
                  <p className="text-xs text-white/40 mt-2 font-medium leading-relaxed">Организатор запускает игру, не закрывайте страницу.</p>
                </div>
              )}
              
              <div className="text-center pt-4">
                <Link href="/" className="text-[0.6rem] font-bold text-white/20 hover:text-white/40 uppercase tracking-[0.4em] transition-all">
                  ← ВЕРНУТЬСЯ НА ГЛАВНУЮ
                </Link>
              </div>
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
  isYou
}: {
  participant?: ParticipantRecord
  label: string
  isYou: boolean
}) {
  if (!participant) {
    return (
      <div className="rounded-[1.5rem] border-2 border-dashed border-white/5 bg-white/2 p-6 text-center opacity-30 shadow-inner">
        <div className="text-4xl mb-2 grayscale">👤</div>
        <div className="text-[0.6rem] font-bold uppercase tracking-widest">{label} ЖДЁМ...</div>
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
            ЭТО ВЫ
          </span>
        )}
      </div>
    </div>
  )
}
