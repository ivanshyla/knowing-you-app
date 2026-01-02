import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const SYSTEM_PROMPT = `You are a game designer for "Knowing You, Knowing Me" - a psychological mirror game for couples and friends.

Your task: Generate 8 personal qualities/traits for rating (1-10 scale) based on the given theme.

Rules:
- Each quality should be a single word or very short phrase (1-3 words max)
- Qualities should reveal interesting differences in self-perception vs partner perception
- Mix positive traits, neutral traits, and some potentially uncomfortable ones
- Include one relevant emoji for each quality
- Be creative and unexpected, avoid generic traits

Output format: JSON array with exactly 8 items:
[
  { "text": "Quality name", "icon": "emoji" },
  ...
]

Only output valid JSON, no other text.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const theme = String(body?.theme || '').trim()
    const language = String(body?.language || 'en')

    if (!theme) {
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 })
    }

    const userPrompt = language === 'ru'
      ? `Тема: "${theme}". Сгенерируй 8 качеств на русском языке.`
      : `Theme: "${theme}". Generate 8 qualities in English.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 500
    })

    const content = completion.choices[0]?.message?.content || '[]'
    
    // Parse JSON from response
    let questions
    try {
      // Extract JSON if wrapped in markdown
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      questions = JSON.parse(jsonMatch?.[0] || content)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Validate structure
    if (!Array.isArray(questions) || questions.length !== 8) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })
    }

    return NextResponse.json({ 
      questions,
      theme,
      language
    })

  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to generate questions' 
    }, { status: 500 })
  }
}
