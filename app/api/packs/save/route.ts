import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { saveCustomPack } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const name = String(body?.name || '').trim()
    const questions = body?.questions

    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    if (!Array.isArray(questions) || questions.length < 5) {
      return NextResponse.json({ error: 'Need 5+ questions' }, { status: 400 })
    }

    const valid = questions
      .filter((q: any) => q?.text?.trim())
      .slice(0, 15)
      .map((q: any) => ({ text: String(q.text).trim(), icon: String(q.icon || '💭') }))

    if (valid.length < 5) return NextResponse.json({ error: 'Need 5+ valid' }, { status: 400 })

    const packId = await saveCustomPack({ userId, name, questions: valid })
    return NextResponse.json({ packId })
  } catch (error) {
    console.error('Save pack error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
