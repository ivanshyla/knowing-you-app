'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'

const ICONS = ['💭', '🔥', '💕', '🎯', '⚡', '🌟', '🎭', '💎', '🌈', '🦋']

type Question = { text: string; icon: string }

export default function CreatePackPage() {
  const router = useRouter()
  const [packName, setPackName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([{ text: '', icon: '💭' }])
  const [aiTopic, setAiTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const addQuestion = () => {
    if (questions.length >= 15) return
    setQuestions([...questions, { text: '', icon: ICONS[questions.length % ICONS.length] }])
  }

  const updateQuestion = (index: number, text: string) => {
    const updated = [...questions]
    updated[index].text = text
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const generateWithAI = async () => {
    if (!aiTopic.trim()) { alert('Введите тему'); return }
    setGenerating(true)
    try {
      const res = await apiFetch('/api/packs/generate', {
        method: 'POST',
        body: JSON.stringify({ topic: aiTopic })
      })
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions)
        if (data.packName) setPackName(data.packName)
      } else {
        alert('Ошибка генерации')
      }
    } catch (e) { alert('Ошибка') }
    finally { setGenerating(false) }
  }

  const savePack = async () => {
    if (!packName.trim()) { alert('Введите название'); return }
    const valid = questions.filter(q => q.text.trim())
    if (valid.length < 5) { alert('Минимум 5 вопросов'); return }
    setSaving(true)
    try {
      const res = await apiFetch('/api/packs/save', {
        method: 'POST',
        body: JSON.stringify({ name: packName, questions: valid })
      })
      if (res.ok) {
        const data = await res.json()
        router.push('/room/create?pack=' + data.packId)
      } else { alert('Ошибка сохранения') }
    } catch (e) { alert('Ошибка') }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm font-bold">← Назад</Link>
          <h1 className="text-xl font-black uppercase tracking-widest">Свой набор</h1>
          <div className="w-16" />
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl p-6 border border-purple-500/30 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-lg font-black">AI Генерация</h2>
              <p className="text-xs text-white/50">Напиши тему — получи 10 вопросов</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Например: путешествия..."
              className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none"
            />
            <button
              onClick={generateWithAI}
              disabled={generating}
              className="px-6 py-3 bg-purple-500 rounded-xl font-bold text-sm hover:bg-purple-600 disabled:opacity-50"
            >
              {generating ? '...' : '✨'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Название</label>
          <input
            type="text"
            value={packName}
            onChange={(e) => setPackName(e.target.value)}
            placeholder="Например: Наши мечты"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg font-bold placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs text-white/40 uppercase tracking-widest">Вопросы ({questions.length}/15)</label>
            <button onClick={addQuestion} disabled={questions.length >= 15} className="text-xs text-white/40 hover:text-white/60 disabled:opacity-30">+ Добавить</button>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-2xl">{q.icon}</span>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  placeholder={'Вопрос ' + (i + 1) + '...'}
                  className="flex-1 bg-transparent placeholder:text-white/30 focus:outline-none"
                />
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(i)} className="text-white/20 hover:text-white/50 text-lg">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={savePack}
          disabled={saving || questions.filter(q => q.text.trim()).length < 5}
          className="w-full py-5 rounded-full bg-gradient-to-r from-[#e94560] to-[#4ecdc4] font-black uppercase tracking-widest text-lg hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? 'Сохраняем...' : '💾 Сохранить и играть'}
        </button>
        <p className="text-center text-xs text-white/30 mt-4">Минимум 5 вопросов</p>
      </div>
    </div>
  )
}
