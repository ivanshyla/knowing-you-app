import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// In-memory storage for custom packs (in production, use DynamoDB)
const customPacks = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, questions } = body

    if (!name || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid pack data' }, { status: 400 })
    }

    const packId = `custom_${crypto.randomUUID().slice(0, 8)}`
    
    const pack = {
      id: packId,
      name,
      emoji: '✨',
      subtitle: 'Custom',
      description: name,
      questions: questions.map((q: any, i: number) => ({
        text: q.text,
        icon: q.icon || '❓',
        category: 'custom'
      })),
      createdAt: new Date().toISOString()
    }

    customPacks.set(packId, pack)

    // Also store in global for room creation to access
    if (typeof global !== 'undefined') {
      (global as any).customPacks = (global as any).customPacks || new Map()
      ;(global as any).customPacks.set(packId, pack)
    }

    return NextResponse.json({ packId, pack })

  } catch (error: any) {
    console.error('Save pack error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to save pack' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const packId = searchParams.get('id')

  if (!packId) {
    return NextResponse.json({ error: 'Pack ID required' }, { status: 400 })
  }

  const pack = customPacks.get(packId) || (global as any)?.customPacks?.get(packId)
  
  if (!pack) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
  }

  return NextResponse.json({ pack })
}
