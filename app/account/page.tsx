'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'

type UserData = {
  gamesPlayed: number
  gamesRemaining: number
  totalPurchased: number
}

export default function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const res = await apiFetch('/api/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    setPurchasing(true)
    try {
      const res = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ package: '10_games' })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        alert('Ошибка создания платежа')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка')
    } finally {
      setPurchasing(false)
    }
  }

  const FREE_GAMES = 2

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-white/40 hover:text-white/60 transition-all">
            ← Назад
          </Link>
          <h1 className="text-xl font-black uppercase tracking-widest">Аккаунт</h1>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl animate-pulse">⏳</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl p-8 border border-white/10">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎮</div>
                <div>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#4ecdc4]">
                    {user?.gamesRemaining ?? FREE_GAMES}
                  </div>
                  <div className="text-sm text-white/40 uppercase tracking-widest mt-2">
                    игр осталось
                  </div>
                </div>
                <div className="text-xs text-white/30 pt-4">
                  Сыграно: {user?.gamesPlayed ?? 0} | Куплено: {user?.totalPurchased ?? 0}
                </div>
              </div>
            </div>

            {/* Purchase */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic">+10 игр</h2>
                  <p className="text-white/40 text-sm mt-2">Пополни баланс и играй дальше</p>
                </div>

                <div className="text-4xl font-black text-[#4ecdc4]">$1</div>

                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-5 rounded-full bg-gradient-to-r from-[#e94560] to-[#4ecdc4] text-white font-black uppercase tracking-widest text-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {purchasing ? 'Загрузка...' : 'Купить'}
                </button>

                <p className="text-[0.6rem] text-white/20 uppercase tracking-widest">
                  Безопасная оплата через Stripe
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="text-center text-xs text-white/30 space-y-2">
              <p>Первые {FREE_GAMES} игры бесплатно</p>
              <p>Баланс не сгорает</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


