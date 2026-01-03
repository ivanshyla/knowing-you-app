'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { QUESTION_PACKS, type QuestionPack } from '@/data/questionPacks'

const STACK_COLORS = ['#BE4039', '#B94E56', '#784259', '#383852', '#1F313B', '#683536'] as const

export default function HomePage() {
  const t = useTranslations()
  const packs = Object.values(QUESTION_PACKS)
  const stackPacks = packs.slice(0, 8)
  const [lastCode, setLastCode] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('kykm_last_room')
    if (stored) setLastCode(stored)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#1F313B] text-white font-sans">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#BE4039]/30 via-[#383852]/50 to-[#1F313B] opacity-90"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10">
        <header className="space-y-6 text-center pt-4">
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <Link
              href="/account"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.6rem] font-black uppercase tracking-widest text-white/80 hover:bg-white/10 transition-all"
            >
              {t('common.account')}
            </Link>
          </div>
          
          <div className="space-y-2 pt-2 text-center">
            <h1 className="text-5xl font-black leading-[0.85] tracking-tighter text-white italic uppercase inline-block">
              {t('home.title')}<br/>
              <span className="text-[#BE4039]">{t('home.subtitle')}</span>
            </h1>
            <p className="text-base text-white/60 font-bold leading-tight pt-8">
              {t('home.tagline')}
            </p>
          </div>
        </header>

        <div className="mt-12 space-y-4">
          {lastCode ? (
            <Link
              href={`/room/${lastCode}`}
              className="block w-full rounded-full bg-white text-gray-900 px-8 py-6 text-center text-xl font-black uppercase tracking-[0.1em] shadow-2xl transition-all active:scale-95"
            >
              {t('common.continue')} ⚡
            </Link>
          ) : (
            <Link
              href="/room/create"
              className="block w-full rounded-full bg-[#BE4039] px-8 py-6 text-center text-xl font-black uppercase tracking-[0.1em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.4)] transition-all active:scale-95"
            >
              {t('common.play')} →
            </Link>
          )}
          
          <p className="text-center text-[0.65rem] text-white/30 font-bold uppercase tracking-[0.2em]">
            {t('home.noRegistration')}
          </p>
        </div>

        {/* КАК ИГРАТЬ */}
        <div className="mt-10 space-y-3">
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10 group hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BE4039] to-[#8B2E2A] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-sm text-white/70 font-medium">{t('home.step1')}</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10 group hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#784259] to-[#5a3145] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/70 font-medium">{t('home.step2')}</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10 group hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#383852] to-[#252536] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent animate-pulse" />
              <svg className="w-5 h-5 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/70 font-medium">{t('home.step3')}</p>
          </div>
        </div>

        <section className="mt-16 space-y-10">
          <div className="px-2">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/40 font-black mb-1">{t('home.moodboard')}</p>
            <h2 className="text-3xl font-black text-white italic uppercase leading-none tracking-tighter">{t('home.choosePack')}</h2>
          </div>
          
          <div className="relative space-y-0 pb-20">
            {stackPacks.map((pack, index) => (
              <PackCard 
                key={pack.id} 
                pack={pack} 
                index={index} 
                color={STACK_COLORS[index % STACK_COLORS.length]} 
              />
            ))}
            
            {/* Create Your Own Pack */}
            <Link
              href="/packs/create"
              className="block rounded-[2.5rem] px-8 py-6 text-white transition-all duration-500 mt-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] active:scale-[0.98] hover:translate-y-[-10px] hover:z-50 relative group border-2 border-dashed border-white/30 hover:border-white/60"
              style={{
                backgroundColor: '#1F313B',
                zIndex: 18
              }}
            >
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl">✨</span>
                <span className="text-xl font-black text-white/70 group-hover:text-white uppercase tracking-wide">
                  {t('common.createPack')}
                </span>
              </div>
            </Link>
          </div>
        </section>

        <footer className="mt-auto text-center py-12 space-y-3">
          <p className="text-[0.7rem] text-white/40 font-bold uppercase tracking-[0.15em] italic">
            {t('home.madeWith')}
          </p>
          <p className="text-[0.5rem] text-white/10 font-black uppercase tracking-[0.4em]">
            {t('home.footer')}
          </p>
        </footer>
      </div>
    </div>
  )
}

function PackCard({ pack, index, color }: { pack: QuestionPack; index: number; color: string }) {
  const t = useTranslations()
  const packKey = pack.id as 'romantic' | 'everyday' | 'intimacy' | 'character' | 'friends' | 'office' | 'sport' | 'club' | 'parents'
  const isFirst = index === 0
  
  let name, subtitle, description
  try {
    name = t(`packs.${packKey}.name`)
    subtitle = t(`packs.${packKey}.subtitle`)
    description = t(`packs.${packKey}.description`)
  } catch {
    name = pack.name
    subtitle = pack.subtitle
    description = pack.description
  }

  return (
    <Link
      href={`/room/create?pack=${pack.id}`}
      className={`block rounded-[2.5rem] px-8 py-10 text-white transition-all duration-500 ${
        isFirst ? '' : '-mt-6'
      } shadow-[0_25px_60px_rgba(0,0,0,0.5)] active:scale-[0.98] hover:translate-y-[-20px] hover:z-50 relative group overflow-hidden`}
      style={{
        backgroundColor: color,
        zIndex: 10 + index
      }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50 font-black">{subtitle}</p>
            <h3 className="text-3xl font-black leading-none italic uppercase tracking-tight">{name}</h3>
          </div>
          <span className="text-6xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{pack.emoji}</span>
        </div>
        
        <p className="mt-6 text-sm text-white/70 font-medium leading-snug pr-8">{description}</p>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    </Link>
  )
}
