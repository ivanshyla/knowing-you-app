'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { QUESTION_PACKS, type QuestionPack } from '@/data/questionPacks'

const STACK_COLORS = ['#BE4039', '#B94E56', '#784259', '#383852', '#1F313B', '#683536', '#4A3728', '#2D4A3E'] as const

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
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#1F313B] via-[#1F313B]/90 to-[#383852]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-6">
        <header className="space-y-3 text-center pt-2">
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <Link href="/account" className="text-xs text-white/50 hover:text-white">
              {t('common.account')}
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              {t('home.title')}<br />{t('home.subtitle')}
            </h1>
            <p className="text-[0.65rem] text-white/40 mt-1">{t('home.tagline')}</p>
          </div>
        </header>

        <div className="mt-6">
          {lastCode ? (
            <Link
              href={`/room/${lastCode}`}
              className="block w-full rounded-full bg-white text-gray-900 py-4 text-center text-base font-black uppercase"
            >
              {t('common.continue')} ⚡
            </Link>
          ) : (
            <Link
              href="/room/create"
              className="block w-full rounded-full bg-[#BE4039] py-4 text-center text-base font-black uppercase text-white shadow-[0_15px_40px_rgba(190,64,57,0.4)]"
            >
              {t('common.play')} →
            </Link>
          )}
        </div>

        <section className="mt-8 flex-1">
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/40 font-bold mb-1">PACKS</p>
          <h2 className="text-xl font-black text-white italic uppercase mb-4">{t('home.choosePack')}</h2>
          
          {/* Stacked cards - each shows title visibly */}
          <div className="relative">
            {stackPacks.map((pack, index) => (
              <PackCard 
                key={pack.id} 
                pack={pack}
                index={index}
                total={stackPacks.length}
                color={STACK_COLORS[index % STACK_COLORS.length]} 
              />
            ))}
            
            {/* Create Your Pack */}
            <Link
              href="/packs/create"
              className="relative block rounded-[1.5rem] py-3 px-5 border-2 border-dashed border-white/30 hover:border-white/50 hover:bg-white/5 transition-all"
              style={{ marginTop: '0.5rem', zIndex: 1 }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">✨</span>
                <span className="text-sm font-bold text-white/60 uppercase">{t('common.createPack')}</span>
              </div>
            </Link>
          </div>
        </section>

        <footer className="pt-4 text-center">
          <p className="text-[0.45rem] text-white/20 uppercase tracking-widest">{t('home.footer')}</p>
        </footer>
      </div>
    </main>
  )
}

function PackCard({ pack, index, total, color }: { pack: QuestionPack; index: number; total: number; color: string }) {
  const t = useTranslations()
  const packKeys = ['romantic', 'everyday', 'intimacy', 'character', 'friends', 'office', 'sport', 'club'] as const
  const packKey = packKeys.includes(pack.id as any) ? pack.id : 'romantic'
  
  let name, subtitle
  try {
    name = t(`packs.${packKey}.name`)
    subtitle = t(`packs.${packKey}.subtitle`)
  } catch {
    name = pack.name
    subtitle = pack.subtitle || ''
  }

  // First card full height, others peek from behind
  const isFirst = index === 0
  
  return (
    <Link
      href={`/room/create?pack=${pack.id}`}
      className="group relative block rounded-[1.5rem] transition-all duration-300 ease-out hover:-translate-y-8 hover:z-50"
      style={{ 
        backgroundColor: color,
        marginTop: isFirst ? 0 : '-4.5rem',
        zIndex: total - index,
        padding: isFirst ? '1.25rem' : '0.75rem 1.25rem',
        paddingBottom: isFirst ? '5rem' : '0.75rem',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[0.5rem] uppercase tracking-[0.2em] text-white/50 font-bold">{subtitle}</p>
          <h3 className="text-lg font-black text-white italic uppercase tracking-tight leading-tight truncate">
            {name}
          </h3>
        </div>
        <span className="text-2xl flex-shrink-0">{pack.emoji}</span>
      </div>
    </Link>
  )
}
