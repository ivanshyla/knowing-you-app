import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PRICE_10_GAMES = 100 // $1.00 in cents

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-12-15.clover' })

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '10 игр — Knowing You, Knowing Me',
              description: 'Пакет из 10 игр',
            },
            unit_amount: PRICE_10_GAMES,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/account?success=1`,
      cancel_url: `${origin}/account?canceled=1`,
      metadata: {
        userId,
        package: '10_games',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
