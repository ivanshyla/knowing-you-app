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
    <main className="min-h-screen bg-[#1F313B] overflow-hidden select-none">
      {/* Gradient overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#1F313B] via-[#1F313B]/90 to-[#383852]" />

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
          
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-[2.3rem] leading-[0.85] font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">
              {t('home.title')}<br />{t('home.subtitle')}
            </h1>
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/40 font-black">
              {t('home.tagline')}
            </p>
          </div>
        </header>

        {/* CTA */}
        <div className="mt-10 space-y-4">
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
            No registration · Works on phone
          </p>
        </div>

        {/* How to play */}
        <div className="mt-10 space-y-3">
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-2xl">1️⃣</span>
            <p className="text-sm text-white/70 font-medium">Rate yourself and partner on 8 qualities</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-2xl">2️⃣</span>
            <p className="text-sm text-white/70 font-medium">Partner does the same about you</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-2xl">🪞</span>
            <p className="text-sm text-white/70 font-medium">Compare mirrors — where do you differ?</p>
          </div>
        </div>

        <section className="mt-16 space-y-10">
          <div className="px-2">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/40 font-black mb-1">PACKS</p>
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
          </div>
        </section>

        {/* Create own pack */}
        <div className="mt-4 text-center">
          <Link 
            href="/packs/create" 
            className="text-white/50 hover:text-white text-sm underline"
          >
            ✨ {t('common.createPack')}
          </Link>
        </div>

        <footer className="mt-auto pt-16 text-center">
          <p className="text-[0.5rem] text-white/20 font-bold uppercase tracking-[0.2em]">
            {t('home.footer')}
          </p>
        </footer>
      </div>
    </main>
  )
}

function PackCard({ pack, index, color }: { pack: QuestionPack; index: number; color: string }) {
  const t = useTranslations()
  const packKey = pack.id as 'couple' | 'friends' | 'work' | 'parents'
  const name = t(`packs.${packKey}.name`)
  const subtitle = t(`packs.${packKey}.subtitle`)
  const description = t(`packs.${packKey}.description`)

  return (
    <Link
      href={`/room/create?pack=${pack.id}`}
      className="group relative block rounded-[2rem] p-6 transition-all duration-300 ease-out hover:-translate-y-2"
      style={{ 
        backgroundColor: color,
        marginTop: index === 0 ? 0 : '-3rem',
        zIndex: 10 - index,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/50 font-black">{subtitle}</p>
          <h3 className="mt-1 text-2xl font-black text-white italic uppercase tracking-tight leading-none">
            {name}
          </h3>
          <p className="mt-2 text-xs text-white/60 leading-relaxed">
            {description}
          </p>
        </div>
        <span className="text-4xl drop-shadow-lg">{pack.emoji}</span>
      </div>

    </Link>
  )
}
