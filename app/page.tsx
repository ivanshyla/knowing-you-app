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
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-2xl">1️⃣</span>
            <p className="text-sm text-white/70 font-medium">{t('home.step1')}</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-2xl">2️⃣</span>
            <p className="text-sm text-white/70 font-medium">{t('home.step2')}</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-2xl">🪞</span>
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
              className="block rounded-[2.5rem] px-8 py-8 text-white transition-all duration-500 -mt-16 shadow-[0_25px_60px_rgba(0,0,0,0.5)] active:scale-[0.98] hover:translate-y-[-50px] hover:z-50 relative group border-2 border-dashed border-white/30 hover:border-white/60"
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
  const packKey = pack.id as 'romantic' | 'everyday' | 'intimacy' | 'character' | 'friends' | 'office' | 'sport' | 'club'
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
        isFirst ? '' : '-mt-16'
      } shadow-[0_25px_60px_rgba(0,0,0,0.5)] active:scale-[0.98] hover:translate-y-[-50px] hover:z-50 relative group overflow-hidden`}
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
        
        <div className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {pack.questions.slice(0, 2).map((q) => (
              <span key={q.text} className="text-[0.55rem] font-black uppercase tracking-widest text-white bg-black/40 px-3 py-1 rounded-lg">
                {q.icon} {q.text}
              </span>
            ))}
          </div>
          <span className="text-[0.6rem] font-black text-white bg-black/40 uppercase tracking-widest px-3 py-1 rounded-lg">{pack.questions.length} {t('common.questions')}</span>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    </Link>
  )
}
