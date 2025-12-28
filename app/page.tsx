'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { QUESTION_PACKS, type QuestionPack } from '@/data/questionPacks'

const STACK_COLORS = ['#BE4039', '#B94E56', '#784259', '#383852'] as const

export default function HomePage() {
  const t = useTranslations()
  const packs = Object.values(QUESTION_PACKS)
  const stackPacks = packs.slice(0, 4)
  const [lastCode, setLastCode] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('kykm_last_room')
    if (stored) setLastCode(stored)
  }, [])

  return (
    <main className="min-h-screen bg-[#1F313B] overflow-hidden select-none">
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#1F313B] via-[#1F313B]/90 to-[#383852]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        <header className="space-y-4 text-center pt-2">
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <Link href="/account" className="text-xs text-white/50 hover:text-white">
              {t('common.account')}
            </Link>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
              {t('home.title')}<br />{t('home.subtitle')}
            </h1>
            <p className="text-xs text-white/40">{t('home.tagline')}</p>
          </div>
        </header>

        <div className="mt-8">
          {lastCode ? (
            <Link
              href={`/room/${lastCode}`}
              className="block w-full rounded-full bg-white text-gray-900 py-5 text-center text-lg font-black uppercase"
            >
              {t('common.continue')} ⚡
            </Link>
          ) : (
            <Link
              href="/room/create"
              className="block w-full rounded-full bg-[#BE4039] py-5 text-center text-lg font-black uppercase text-white shadow-[0_15px_40px_rgba(190,64,57,0.4)]"
            >
              {t('common.play')} →
            </Link>
          )}
        </div>

        <section className="mt-12 flex-1">
          <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/40 font-black mb-1">PACKS</p>
          <h2 className="text-2xl font-black text-white italic uppercase mb-6">{t('home.choosePack')}</h2>
          
          {/* Stacked cards */}
          <div className="relative pb-20">
            {stackPacks.map((pack, index) => (
              <PackCard 
                key={pack.id} 
                pack={pack}
                index={index}
                color={STACK_COLORS[index % STACK_COLORS.length]} 
              />
            ))}
            
            {/* Create Your Pack */}
            <Link
              href="/packs/create"
              className="relative block rounded-[2rem] p-5 border-2 border-dashed border-white/30 hover:border-white/50 hover:bg-white/5 transition-all"
              style={{ marginTop: '-2rem', zIndex: 6 }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">✨</span>
                <span className="text-base font-bold text-white/70 uppercase">{t('common.createPack')}</span>
              </div>
            </Link>
          </div>
        </section>

        <footer className="pt-6 text-center">
          <p className="text-[0.5rem] text-white/20 uppercase tracking-widest">{t('home.footer')}</p>
        </footer>
      </div>
    </main>
  )
}

function PackCard({ pack, index, color }: { pack: QuestionPack; index: number; color: string }) {
  const t = useTranslations()
  const packKey = pack.id as 'romantic' | 'everyday' | 'intimacy' | 'character'
  
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
      className="group relative block rounded-[2rem] p-6 transition-all duration-300 ease-out hover:-translate-y-4"
      style={{ 
        backgroundColor: color,
        marginTop: index === 0 ? 0 : '-2.5rem',
        zIndex: 10 - index,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-white/60 font-bold">{subtitle}</p>
          <h3 className="mt-1 text-2xl font-black text-white italic uppercase tracking-tight leading-none">
            {name}
          </h3>
          <p className="mt-2 text-sm text-white/70 leading-snug">
            {description}
          </p>
        </div>
        <span className="text-4xl">{pack.emoji}</span>
      </div>
    </Link>
  )
}
