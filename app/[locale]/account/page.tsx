'use client'

import { Link } from '@/i18n/routing'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/apiClient'

type UserData = {
  gamesPlayed: number
  avgMatch: number
}

export default function AccountPage() {
  const t = useTranslations()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

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
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#BE4039] to-[#8B2E2A] flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <div>
                  <div className="text-6xl font-black text-white">
                    {user?.gamesPlayed ?? 0}
                  </div>
                  <div className="text-[0.65rem] text-white/40 uppercase tracking-[0.3em] mt-2 font-bold">
                    {t('account.gamesPlayed')}
                  </div>
                </div>

                {(user?.avgMatch ?? 0) > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-4xl font-black text-[#4ecdc4]">
                      {user?.avgMatch}%
                    </div>
                    <div className="text-[0.65rem] text-white/40 uppercase tracking-[0.3em] mt-2 font-bold">
                      {t('account.avgMatch')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Free badge */}
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#44a08d]/20 border border-[#4ecdc4]/30 rounded-[2rem] p-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-[#4ecdc4] font-black uppercase tracking-widest text-sm">
                {t('account.freeForever')}
              </p>
              <p className="text-white/40 text-xs mt-2">
                {t('account.noLimits')}
              </p>
            </div>

            {/* Play button */}
            <Link
              href="/room/create"
              className="block w-full py-5 rounded-full bg-[#BE4039] text-white font-black uppercase tracking-widest text-lg text-center shadow-[0_20px_50px_rgba(190,64,57,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('common.play')} →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
