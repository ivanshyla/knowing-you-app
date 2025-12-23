'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { UserSessionRecord } from '@/lib/models'
import AccountClient from './ui'
import { apiFetch } from '@/lib/apiClient'

type UserData = {
  userId: string | null
  email: string | null
  isPro: boolean
  gamesPlayed: number
  avgMatch: number
  stripeStatus: string | null
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sessions, setSessions] = useState<UserSessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [meRes, sessionsRes] = await Promise.all([
          apiFetch('/api/auth/me'),
          apiFetch('/api/my/sessions')
        ])
        
        const me = await meRes.json()
        const sessData = await sessionsRes.json()
        
        setUserData({
          userId: me.userId,
          email: me.email,
          isPro: me.isPro,
          gamesPlayed: me.gamesPlayed,
          avgMatch: me.gamesPlayed > 0 ? Math.round(me.matchSum / me.gamesPlayed) : 0,
          stripeStatus: me.stripeStatus
        })
        setSessions(sessData.sessions || [])
      } catch (error) {
        console.error('Failed to load account data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-500 uppercase tracking-[0.4em] text-sm">Грузим аккаунт...</div>
      </div>
    )
  }

  if (!userData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-10 px-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Аккаунт</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Профиль и статистика</h1>
            <p className="mt-2 text-sm text-gray-600">
              {userData.email ? `Вы вошли как ${userData.email}` : 'Сейчас вы в гостевом режиме. Создайте аккаунт, чтобы сохранять историю.'}
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-gray-700 underline">
            На главную
          </Link>
        </header>

        <AccountClient user={userData} />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Игры" value={`${userData.gamesPlayed}`} />
          <StatCard label="Средний матч" value={`${userData.avgMatch}%`} />
          <StatCard label="Статус" value={userData.isPro ? 'PRO' : 'Free'} />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">История игр</h2>
          <p className="mt-1 text-sm text-gray-600">Появляется после того, как вы сыграли с включённым аккаунтом.</p>

          <div className="mt-4 space-y-3">
            {sessions.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                Пока пусто. Сыграйте ещё раз — и результат сохранится здесь.
              </div>
            )}
            {sessions.slice(0, 20).map((s) => (
              <div key={`${s.userId}-${s.sessionId}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {s.participantEmoji} {s.participantName || 'Вы'}{' '}
                      <span className="text-gray-400">×</span>{' '}
                      {s.partnerEmoji} {s.partnerName || 'Партнёр'}
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                      {s.finishedAt ? 'завершено' : 'в процессе'} · {s.code ? `код ${s.code}` : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                      {typeof s.matchPercentage === 'number' ? `${s.matchPercentage}%` : '—'}
                    </p>
                    {s.topMatchText && (
                      <p className="text-xs text-gray-600">
                        {s.topMatchIcon} {s.topMatchText}
                      </p>
                    )}
                    <Link className="text-xs font-semibold text-gray-700 underline" href={`/share/${s.sessionId}`}>
                      ссылка на результат
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl">
      <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
