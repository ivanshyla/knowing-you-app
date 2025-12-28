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
              className="block w-full rounded-full bg-[#BE4039] py-5 text-center text-lg font-black uppercase text-white"
            >
              {t('common.play')} →
            </Link>
          )}
        </div>

        <section className="mt-10 flex-1">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">PACKS</p>
          <h2 className="text-xl font-black text-white italic uppercase mb-6">{t('home.choosePack')}</h2>
          
          <div className="space-y-3">
            {stackPacks.map((pack, index) => (
              <PackCard 
                key={pack.id} 
                pack={pack} 
                color={STACK_COLORS[index % STACK_COLORS.length]} 
              />
            ))}
            
            <Link
              href="/packs/create"
              className="block rounded-2xl border-2 border-dashed border-white/30 p-4 text-center hover:border-white/50 hover:bg-white/5 transition-all"
            >
              <span className="text-white/60 font-medium">✨ {t('common.createPack')}</span>
            </Link>
          </div>
        </section>

        <footer className="pt-8 text-center">
          <p className="text-[0.5rem] text-white/20 uppercase tracking-widest">{t('home.footer')}</p>
        </footer>
      </div>
    </main>
  )
}

function PackCard({ pack, color }: { pack: QuestionPack; color: string }) {
  const t = useTranslations()
  const packKey = pack.id as 'romantic' | 'everyday' | 'intimacy' | 'character'
  
  let name, description
  try {
    name = t(`packs.${packKey}.name`)
    description = t(`packs.${packKey}.description`)
  } catch {
    name = pack.name
    description = pack.description
  }

  return (
    <Link
      href={`/room/create?pack=${pack.id}`}
      className="block rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{pack.emoji}</span>
        <div className="flex-1">
          <h3 className="text-lg font-black text-white uppercase">{name}</h3>
          <p className="text-sm text-white/70">{description}</p>
        </div>
      </div>
    </Link>
  )
}
