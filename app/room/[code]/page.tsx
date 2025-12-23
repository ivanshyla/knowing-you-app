'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Share } from '@capacitor/share'
import { isCapacitor } from '@/lib/capacitor'
import type { ParticipantRecord } from '@/lib/models'
import { apiFetch } from '@/lib/apiClient'
import { formatCode } from '@/lib/utils'

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
  const [copiedInvite, setCopiedInvite] = useState(false)

  useEffect(() => {
    const storedRole = localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null
    const storedSessionId = localStorage.getItem(`session_${code}_session_id`)
    if (storedRole) setMyRole(storedRole)
    if (storedSessionId) setSessionId(storedSessionId)
  }, [code])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

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
      localStorage.setItem(`session_${code}_session_id`, data.session.id)
      setPollingError(null)

      if (data.session.status === 'live') {
        router.push(`/room/${code}/questions`)
        return
      }

      if (data.session.status === 'done') {
        router.push(`/room/${code}/results`)
        return
      }

      const storedRole = localStorage.getItem(`session_${code}_role`) as 'A' | 'B' | null
      setMyRole(storedRole)
      setViewState(storedRole ? 'lobby' : 'join')
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

      localStorage.setItem(`session_${code}_role`, data.role)
      localStorage.setItem(`session_${code}_participant_id`, data.participantId)
      localStorage.setItem(`session_${code}_session_id`, data.sessionId)
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

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
  }, [code])

  const inviteUrl = useMemo(() => (origin ? `${origin}/room/${code}` : ''), [code, origin])

  const handleCopyInvite = useCallback(async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedInvite(true)
      window.setTimeout(() => setCopiedInvite(false), 1500)
    } catch (error) {
      console.error('Failed to copy invite link:', error)
      window.prompt('Скопируйте ссылку:', inviteUrl)
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center text-gray-700">
          <div className="text-4xl mb-3">⏳</div>
          <p>{pollingError || 'Ищем комнату...'}</p>
        </div>
      </div>
    )
  }

  if (viewState === 'join') {
    const roomFull = participants.length >= 2
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Комната</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Присоединиться 🎮</h1>
            <div className="text-2xl font-mono font-bold text-purple-600 mb-2">{formatCode(code)}</div>
            {pollingError && <p className="text-sm text-red-500">{pollingError}</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ваше имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Ася"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                maxLength={20}
                disabled={roomFull}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Эмодзи-настроение</label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJIS.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setEmoji(icon)}
                    disabled={roomFull}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      emoji === icon ? 'bg-purple-100 scale-110 shadow' : 'bg-gray-100 hover:bg-gray-200'
                    } ${roomFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Предпросмотр</p>
              <div className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <span className="text-3xl">{emoji}</span>
                <span>{name || 'Ваше имя'}</span>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining || !name.trim() || roomFull}
              className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 py-4 text-white font-semibold shadow-lg transition hover:opacity-90 disabled:opacity-40"
            >
              {roomFull ? 'Комната заполнена' : joining ? 'Подключаемся...' : 'Войти в игру'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Комната</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Лобби 🎯</h1>
          <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-3 shadow">
            <div className="text-sm text-gray-500">Код:</div>
            <div className="text-2xl font-mono font-semibold text-purple-600">{formatCode(code)}</div>
            <button
              onClick={handleCopyCode}
              className="text-sm rounded-full border border-purple-100 px-3 py-1 text-purple-600"
            >
              📋
            </button>
            <button
              onClick={handleInviteShare}
              className="text-sm rounded-full border border-purple-100 px-3 py-1 text-purple-600"
              title="Поделиться ссылкой"
            >
              📤
            </button>
          </div>
          {inviteUrl && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <button
                onClick={handleCopyInvite}
                className="text-xs rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm"
              >
                {copiedInvite ? 'Ссылка скопирована ✅' : 'Копировать ссылку-приглашение 🔗'}
              </button>
            </div>
          )}
          {pollingError && <p className="mt-2 text-sm text-red-500">{pollingError}</p>}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Участники ({participants.length}/2)</h2>
          <div className="space-y-3">
            <ParticipantCard participant={participantA} label="Игрок 1" isYou={myRole === 'A'} />
            <ParticipantCard participant={participantB} label="Игрок 2" isYou={myRole === 'B'} />
          </div>
        </div>

        {!isReady && (
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 text-center text-yellow-900">
            <p className="font-semibold">Ждём второго игрока</p>
            <p className="text-sm text-yellow-800 mt-1">Поделитесь кодом — комната живёт пока вы здесь.</p>
          </div>
        )}

        {isReady && myRole === 'A' && (
          <button
            onClick={handleStart}
            className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-lg font-semibold text-white shadow-xl"
          >
            Начать игру
          </button>
        )}

        {isReady && myRole === 'B' && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-center text-green-900">
            <p className="font-semibold">Всё готово</p>
            <p className="text-sm mt-1">Организатор запускает игру, не закрывайте страницу.</p>
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
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 text-center text-gray-400">
        <div className="text-3xl mb-1">👤</div>
        <div className="text-sm">{label} ждём...</div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        isYou ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{participant.emoji}</span>
          <div>
            <p className="font-semibold text-gray-900">{participant.name}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{label}</p>
          </div>
        </div>
        {isYou && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-600 shadow">
            это вы
          </span>
        )}
      </div>
    </div>
  )
}
