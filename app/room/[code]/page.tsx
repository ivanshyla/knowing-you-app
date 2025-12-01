'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Participant, type Session } from '@/lib/supabase'
import { formatCode } from '@/lib/utils'

const EMOJIS = ['😊', '🥰', '😎', '🤗', '😇', '🤩', '😋', '🥳', '🤠', '👑', '🌟', '💫', '🔥', '💖', '🎯', '🦄']

type ViewState = 'loading' | 'join' | 'lobby' | 'live'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [myRole, setMyRole] = useState<'A' | 'B' | null>(null)
  
  // Join form state
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('😊')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadSession()
  }, [code])

  useEffect(() => {
    if (!session) return

    // Check if user already joined
    const storedRole = localStorage.getItem(`session_${code}_role`)
    if (storedRole) {
      setMyRole(storedRole as 'A' | 'B')
      setViewState(session.status === 'live' ? 'live' : 'lobby')
    } else {
      setViewState('join')
    }

    // Subscribe to participants changes
    const channel = supabase
      .channel(`room_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          loadParticipants(session.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as Session
          setSession(updated)
          if (updated.status === 'live') {
            setViewState('live')
            router.push(`/room/${code}/questions`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id])

  useEffect(() => {
    if (session) {
      loadParticipants(session.id)
    }
  }, [session])

  async function loadSession() {
    // Import demo storage
    const { getDemoSession, isDemoMode } = await import('@/lib/demo-storage')
    
    if (isDemoMode()) {
      // Demo mode - load from localStorage
      const sessionData = getDemoSession(code)
      if (sessionData) {
        setSession(sessionData)
      } else {
        alert('Комната не найдена')
        router.push('/')
      }
    } else {
      // Real Supabase mode - try to load session with retry logic
      let attempts = 0
      const maxAttempts = 3
      
      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', code)
          .single()

        if (data) {
          setSession(data)
          return
        }
        
        attempts++
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      // After all attempts failed
      alert('Комната не найдена')
      router.push('/')
    }
  }

  async function loadParticipants(sessionId: string) {
    const { getDemoParticipants, isDemoMode } = await import('@/lib/demo-storage')
    
    if (isDemoMode()) {
      const data = getDemoParticipants(sessionId)
      setParticipants(data)
    } else {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true })

      if (data) {
        setParticipants(data)
      }
    }
  }

  async function handleJoin() {
    if (!name.trim()) {
      alert('Введите ваше имя!')
      return
    }

    setJoining(true)
    try {
      const { joinDemoRoom, isDemoMode } = await import('@/lib/demo-storage')
      
      if (isDemoMode()) {
        // Demo mode - join via localStorage
        const result = joinDemoRoom(code, name, emoji)
        if (result) {
          localStorage.setItem(`session_${code}_role`, result.role)
          localStorage.setItem(`session_${code}_participant_id`, result.participantId)
          setMyRole(result.role)
          setViewState('lobby')
          // Reload participants
          if (session) {
            await loadParticipants(session.id)
          }
        } else {
          alert('Комната заполнена или не найдена')
        }
      } else {
        // Real Supabase mode
        const response = await fetch('/api/join-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, emoji }),
        })

        const data = await response.json()

        if (data.role) {
          localStorage.setItem(`session_${code}_role`, data.role)
          localStorage.setItem(`session_${code}_participant_id`, data.participantId)
          setMyRole(data.role)
          setViewState('lobby')
        } else {
          alert(data.error || 'Ошибка при присоединении')
        }
      }
    } catch (error) {
      console.error('Error joining:', error)
      alert('Ошибка при присоединении')
    } finally {
      setJoining(false)
    }
  }

  async function handleStart() {
    if (!session) return

    try {
      const { updateDemoSessionStatus, isDemoMode } = await import('@/lib/demo-storage')
      
      if (isDemoMode()) {
        updateDemoSessionStatus(session.id, 'live')
        router.push(`/room/${code}/questions`)
      } else {
        await fetch('/api/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id }),
        })
      }
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(code)
    alert('Код скопирован!')
  }

  async function handleAddBot() {
    if (!session || participants.length >= 2) return
    
    const botNames = ['Бот Алекс', 'Бот Мария', 'Бот Иван', 'Бот Катя']
    const botEmojis = ['🤖', '🎮', '👾', '🦾']
    const randomName = botNames[Math.floor(Math.random() * botNames.length)]
    const randomEmoji = botEmojis[Math.floor(Math.random() * botEmojis.length)]
    
    try {
      const { joinDemoRoom, isDemoMode } = await import('@/lib/demo-storage')
      
      if (isDemoMode()) {
        // Demo mode - add bot via localStorage
        const result = joinDemoRoom(code, randomName, randomEmoji)
        if (result) {
          // Reload participants
          await loadParticipants(session.id)
        }
      } else {
        // Real Supabase mode
        const response = await fetch('/api/join-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name: randomName, emoji: randomEmoji }),
        })
        
        if (response.ok) {
          await loadParticipants(session.id)
        }
      }
    } catch (error) {
      console.error('Error adding bot:', error)
    }
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-gray-600">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (viewState === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Присоединиться к игре 🎮
            </h1>
            <div className="text-2xl font-mono font-bold text-purple-600 mb-2">
              {formatCode(code)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ваше имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите ваше имя"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                maxLength={20}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите эмодзи
              </label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      emoji === e ? 'bg-purple-100 scale-110' : 'hover:bg-gray-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Предпросмотр:</div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{emoji}</span>
                <span className="font-semibold text-gray-800">
                  {name || 'Ваше имя'}
                </span>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining || !name.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {joining ? 'Присоединяемся...' : 'Присоединиться 🚀'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewState === 'lobby') {
    const isReady = participants.length === 2
    const participantA = participants.find(p => p.role === 'A')
    const participantB = participants.find(p => p.role === 'B')

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Лобби 🎯
            </h1>
            
            {/* Room Code */}
            <div className="inline-block bg-white rounded-xl shadow-md px-6 py-3 mb-4">
              <div className="text-sm text-gray-600 mb-1">Код комнаты:</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-mono font-bold text-purple-600">
                  {formatCode(code)}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  📋 Копировать
                </button>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Участники ({participants.length}/2)
            </h2>
            
            <div className="space-y-3">
              <ParticipantCard
                participant={participantA}
                label="Игрок 1"
                isYou={myRole === 'A'}
              />
              <ParticipantCard
                participant={participantB}
                label="Игрок 2"
                isYou={myRole === 'B'}
              />
            </div>
          </div>

          {/* Status */}
          {!isReady && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-center">
                <div className="text-yellow-800 font-medium mb-2">
                  ⏳ Ждём второго игрока...
                </div>
                <div className="text-sm text-yellow-700">
                  Поделитесь кодом комнаты с другом
                </div>
              </div>
              
              {/* Add Bot Button */}
              <button
                onClick={handleAddBot}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-6"
              >
                🤖 Добавить бота для теста
              </button>
            </>
          )}

          {/* Start Button */}
          {isReady && (
            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Начать игру! 🎮
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

function ParticipantCard({ 
  participant, 
  label, 
  isYou 
}: { 
  participant?: Participant
  label: string
  isYou: boolean
}) {
  if (!participant) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-400">
        <div className="text-3xl mb-2">👤</div>
        <div className="text-sm">{label} (ожидание...)</div>
      </div>
    )
  }

  return (
    <div className={`border-2 rounded-xl p-4 ${
      isYou ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{participant.emoji}</span>
          <div>
            <div className="font-semibold text-gray-800">
              {participant.name}
            </div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        </div>
        {isYou && (
          <div className="bg-purple-200 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
            Вы
          </div>
        )}
      </div>
    </div>
  )
}

