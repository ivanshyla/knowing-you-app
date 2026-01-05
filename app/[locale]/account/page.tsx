'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/apiClient'

type UserData = {
  gamesPlayed: number
  gamesRemaining: number
  totalPurchased: number
}

export default function AccountPage() {
  const t = useTranslations()
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
        alert(t('common.error'))
      }
    } catch (e) {
      console.error(e)
      alert(t('common.error'))
    } finally {
      setPurchasing(false)
    }
  }

  const FREE_GAMES = 2

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
          <h1 className="text-lg font-black uppercase tracking-widest">{t('common.account')}</h1>
          <div className="w-12" />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl animate-pulse">⏳</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#BE4039] to-[#8B2E2A] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-5xl font-black text-white">
                    {user?.gamesRemaining ?? FREE_GAMES}
                  </div>
                  <div className="text-[0.65rem] text-white/40 uppercase tracking-[0.3em] mt-2 font-bold">
                    {t('account.gamesRemaining')}
                  </div>
                </div>
                <div className="text-xs text-white/30 pt-4">
                  {t('account.played')}: {user?.gamesPlayed ?? 0} | {t('account.purchased')}: {user?.totalPurchased ?? 0}
                </div>
              </div>
            </div>

            {/* Purchase */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider">+10 {t('account.games')}</h2>
                  <p className="text-white/40 text-sm mt-2">{t('account.refillBalance')}</p>
                </div>

                <div className="text-4xl font-black text-[#BE4039]">$1</div>

                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-5 rounded-full bg-[#BE4039] text-white font-black uppercase tracking-widest text-lg shadow-[0_20px_50px_rgba(190,64,57,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {purchasing ? t('common.loading') : t('account.buy')}
                </button>

                <p className="text-[0.6rem] text-white/20 uppercase tracking-widest">
                  {t('account.securePayment')}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="text-center text-[0.65rem] text-white/30 space-y-2 font-bold uppercase tracking-wider">
              <p>{t('account.firstFree', { count: FREE_GAMES })}</p>
              <p>{t('account.noExpiry')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
