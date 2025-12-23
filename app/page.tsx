'use client'

import Link from 'next/link'
import { QUESTION_PACKS, type QuestionPack } from '@/data/questionPacks'

const STACK_COLORS = ['#1F313B', '#383852', '#784259', '#B94E56', '#BE4039', '#863536'] as const

const STEPS = [
  { icon: '🗝️', title: 'Создаёшь комнату', text: 'Один код, мгновенное подключение. Никто лишний.' },
  { icon: '👀', title: 'Отвечаете вдвоём', text: 'Каждый оценивает себя и партнёра по тем же вопросам.' },
  { icon: '📊', title: 'Сверяем образ', text: 'Система сопоставляет ответы — вы видите, где ожидания совпали, а где нет.' }
] as const

const FEATURES = [
  { title: 'Без фильтров', text: 'Темы про страсть, брак, быт и дружбу.' },
  { title: '5 минут на запуск', text: 'Одно касание — и можно играть с телефона.' },
  { title: 'Честная аналитика', text: 'Сразу видно, где вы совпали, а где нет.' },
  { title: 'Комната на двоих', text: 'Только ваш код, никакой регистрации.' }
] as const

export default function HomePage() {
  const packs = Object.values(QUESTION_PACKS)
  const stackPacks = packs.slice(0, STACK_COLORS.length)
  const totalQuestions = packs.reduce((sum, pack) => sum + pack.questions.length, 0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1F313B] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff5f6d33,transparent_60%)]"
      />
      <div aria-hidden="true" className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#BE4039]/30 blur-[140px]" />
      <div aria-hidden="true" className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#383852]/40 blur-[160px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10">
        <header className="space-y-4 text-center">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.5em] text-white/60">18+ формат</div>
            <Link
              href="/account"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80"
            >
              Аккаунт
            </Link>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white">
            Knowing You, Knowing Me
          </h1>
          <p className="text-base text-white/80">
            Смелая карточная игра для пар и друзей. Короткие раунды, честные ответы и мгновенное сравнение образов.
          </p>
        </header>

        <div className="mt-8 space-y-3">
          <Link
            href="/room/create"
            className="block w-full rounded-full bg-gradient-to-r from-[#BE4039] via-[#B94E56] to-[#863536] px-10 py-5 text-center text-lg font-semibold uppercase tracking-[0.2em] text-white shadow-[0_25px_45px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:-translate-y-1"
          >
            Запустить новую игру →
          </Link>
          <p className="text-center text-xs text-white/60">
            Без регистрации · работает на телефоне
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          <StatBadge label="Темы" value={`${packs.length}`} />
          <StatBadge label="Вопросов" value={`${totalQuestions}+`} />
          <StatBadge label="Минуты" value="5-10" />
        </div>

        <section className="mt-12 space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Moodboard</p>
            <h2 className="text-2xl font-semibold">Темы для быстрого старта</h2>
          </div>
          <CardStack packs={stackPacks} />
          <PaletteLegend colors={STACK_COLORS} />
        </section>

        <section className="mt-12 rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Как начать</p>
            <h2 className="text-2xl font-semibold text-white">Три шага до честного разговора</h2>
          </div>
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <StepCard key={step.title} step={step} index={index} />
            ))}
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-3">
          {FEATURES.map((feature) => (
            <FeaturePill key={feature.title} feature={feature} />
          ))}
        </section>

        <footer className="mt-10 text-center text-xs text-white/60">
          Сделано для тех, кто говорит правду и любит смелые вечера.
        </footer>
      </div>
    </div>
  )
}

function CardStack({ packs }: { packs: QuestionPack[] }) {
  return (
    <div className="relative space-y-0">
      {packs.map((pack, index) => (
        <PackCard key={pack.id} pack={pack} index={index} color={STACK_COLORS[index % STACK_COLORS.length]} />
      ))}
    </div>
  )
}

function PackCard({ pack, index, color }: { pack: QuestionPack; index: number; color: string }) {
  const accent = lightenColor(color, 18)
  const shadow = hexToRgba(color, 0.45)
  const chips = pack.questions.slice(0, 3)

  return (
    <Link
      href={`/room/create?pack=${pack.id}`}
      className={`block rounded-[2.5rem] px-6 py-6 text-white transition-all duration-500 ${
        index === 0 ? '' : '-mt-8'
      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}, ${accent})`,
        boxShadow: `0 30px 60px ${shadow}`,
        zIndex: STACK_COLORS.length - index
      }}
      aria-label={`Начать игру с паком ${pack.name}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/70">{pack.subtitle}</p>
          <h3 className="text-2xl font-semibold">{pack.name}</h3>
        </div>
        <span className="text-5xl">{pack.emoji}</span>
      </div>
      <p className="mt-3 text-sm text-white/85">{pack.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem]">
        {chips.map((question) => (
          <span key={question.text} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-white/90">
            <span>{question.icon}</span>
            {question.text}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-white/70">
        <span>{pack.questions.length} вопросов</span>
        <span className="tracking-[0.35em]">{color.toUpperCase()}</span>
      </div>
    </Link>
  )
}

function PaletteLegend({ colors }: { colors: readonly string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-center text-[0.65rem] uppercase tracking-[0.4em] text-white/60 sm:grid-cols-3">
      {colors.map((color) => (
        <div
          key={color}
          className="rounded-full border border-white/10 px-3 py-3"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {color}
        </div>
      ))}
    </div>
  )
}

function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  return (
    <div className="flex items-start gap-4 rounded-[1.8rem] border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-semibold">
        {index + 1 < 10 ? `0${index + 1}` : index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{step.icon}</span>
          <h3 className="text-lg font-semibold">{step.title}</h3>
        </div>
        <p className="mt-1 text-sm text-white/80">{step.text}</p>
      </div>
    </div>
  )
}

function FeaturePill({ feature }: { feature: typeof FEATURES[number] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left backdrop-blur">
      <p className="text-sm font-semibold text-white">{feature.title}</p>
      <p className="text-xs text-white/70">{feature.text}</p>
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur">
      <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/60">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '')
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lightenColor(hex: string, percent: number) {
  const sanitized = hex.replace('#', '')
  const r = parseInt(sanitized.substring(0, 2), 16)
  const g = parseInt(sanitized.substring(2, 4), 16)
  const b = parseInt(sanitized.substring(4, 6), 16)

  const adjustChannel = (channel: number) => {
    const amount = Math.round(255 * (percent / 100))
    return Math.max(0, Math.min(255, channel + amount))
  }

  const [nr, ng, nb] = [adjustChannel(r), adjustChannel(g), adjustChannel(b)]
  return `#${[nr, ng, nb].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}
