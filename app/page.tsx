'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { QUESTION_PACKS, type QuestionPack } from '@/data/questionPacks'

// Твоя фирменная палитра
const STACK_COLORS = ['#BE4039', '#B94E56', '#784259', '#383852', '#1F313B', '#683536'] as const

export default function HomePage() {
  const packs = Object.values(QUESTION_PACKS)
  const stackPacks = packs.slice(0, 8)
  const [lastCode, setLastCode] = useState<string | null>(null)

  useEffect(() => {
    setLastCode(localStorage.getItem('kykm_last_code'))
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
            <p className="text-[0.6rem] uppercase tracking-[0.5em] text-white/40 font-black">18+ ФОРМАТ</p>
            <Link
              href="/account"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.6rem] font-black uppercase tracking-widest text-white/80 hover:bg-white/10 transition-all"
            >
              Аккаунт
            </Link>
          </div>
          
          <div className="space-y-2 pt-2 text-center">
            <h1 className="text-5xl font-black leading-[0.85] tracking-tighter text-white italic uppercase inline-block">
              Knowing You,<br/>
              <span className="text-[#BE4039]">Knowing Me</span>
            </h1>
            <p className="text-base text-white/60 font-bold leading-tight pt-8">
              Психологическая игра-зеркало для двоих.
            </p>
          </div>
        </header>

        <div className="mt-12 space-y-4">
          {lastCode ? (
            <Link
              href={`/room/${lastCode}`}
              className="block w-full rounded-full bg-white text-gray-900 px-8 py-6 text-center text-xl font-black uppercase tracking-[0.1em] shadow-2xl transition-all active:scale-95"
            >
              Продолжить игру ⚡
            </Link>
          ) : (
            <Link
              href="/room/create"
              className="block w-full rounded-full bg-[#BE4039] px-8 py-6 text-center text-xl font-black uppercase tracking-[0.1em] text-white shadow-[0_20px_50px_rgba(190,64,57,0.4)] transition-all active:scale-95"
            >
              Начать игру →
            </Link>
          )}
          
          <p className="text-center text-[0.65rem] text-white/30 font-bold uppercase tracking-[0.2em]">
            Без регистрации · работает на телефоне
          </p>
        </div>

        {/* ПРИНЦИП ИГРЫ + КОЛИЧЕСТВО ВОПРОСОВ (БЕЗ 64+) */}
        <div className="mt-12 grid grid-cols-3 gap-3">
          <StatBadge label="РАУНД" value="10 ВОПР." />
          <StatBadge label="ПРИНЦИП" value="СЕБЯ И ЕЁ" />
          <StatBadge label="ИТОГ" value="ЗЕРКАЛО" />
        </div>

        <section className="mt-24 space-y-10">
          <div className="px-2">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/40 font-black mb-1">MOODBOARD</p>
            <h2 className="text-3xl font-black text-white italic uppercase leading-none tracking-tighter">Темы для старта</h2>
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

        <footer className="mt-auto text-center py-12 space-y-3">
          <p className="text-[0.7rem] text-white/40 font-bold uppercase tracking-[0.15em] italic">
            Сделано с помощью вайбкода в Варшаве
          </p>
          <p className="text-[0.5rem] text-white/10 font-black uppercase tracking-[0.4em]">
            KNOWING YOU, KNOWING ME &copy; 2025
          </p>
        </footer>
      </div>
    </div>
  )
}

function PackCard({ pack, index, color }: { pack: QuestionPack; index: number; color: string }) {
  const isFirst = index === 0;
  
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
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/50 font-black">{pack.subtitle}</p>
            <h3 className="text-3xl font-black leading-none italic uppercase tracking-tight">{pack.name}</h3>
          </div>
          <span className="text-6xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{pack.emoji}</span>
        </div>
        
        <p className="mt-6 text-sm text-white/70 font-medium leading-snug pr-8">{pack.description}</p>
        
        <div className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {pack.questions.slice(0, 2).map((q) => (
              <span key={q.text} className="text-[0.55rem] font-black uppercase tracking-widest text-white bg-black/40 px-3 py-1 rounded-lg">
                {q.icon} {q.text}
              </span>
            ))}
          </div>
          <span className="text-[0.6rem] font-black text-white bg-black/40 uppercase tracking-widest">{pack.questions.length} ВОПРОСОВ</span>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    </Link>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 text-center shadow-inner backdrop-blur-sm">
      <p className="text-[0.5rem] uppercase tracking-widest text-white/30 font-black mb-2">{label}</p>
      <p className="text-[0.75rem] font-black text-white leading-none tracking-widest uppercase italic">{value}</p>
    </div>
  )
}
