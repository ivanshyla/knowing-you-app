import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

    const body = await request.json()
    const topic = String(body?.topic || '').trim()
    if (!topic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 })

    const prompt = `Создай 10 вопросов для игры "Психологическое зеркало" на тему: "${topic}"

Правила: два человека оценивают себя и партнёра по шкале 1-10. Потом сравнивают.

Формат - JSON массив: [{"text": "Вопрос?", "icon": "💕"}]

Требования:
- Вопросы про личные качества, привычки, предпочтения
- Интересные для обсуждения в паре
- Каждый с подходящим эмодзи
- На русском

Верни ТОЛЬКО JSON массив.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1000
      })
    })

    if (!response.ok) return NextResponse.json({ error: 'AI failed' }, { status: 500 })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    let questions
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      questions = JSON.parse(jsonStr)
    } catch (e) {
      return NextResponse.json({ error: 'Parse error' }, { status: 500 })
    }

    return NextResponse.json({
      packName: topic.charAt(0).toUpperCase() + topic.slice(1),
      questions: questions.slice(0, 10)
    })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
