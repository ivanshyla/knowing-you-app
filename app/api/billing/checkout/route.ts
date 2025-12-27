import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { ensureUserRecord, getUserRecord, setUserStripeStatus } from '@/lib/sessionStore'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function stripeFetch(path: string, body: URLSearchParams) {
  const key = requireEnv('STRIPE_SECRET_KEY')
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = data?.error?.message || 'Stripe error'
    throw new Error(msg)
  }
  return data
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const appBaseUrl = requireEnv('APP_BASE_URL').replace(/\/+$/, '')
    const priceId = requireEnv('STRIPE_PRICE_ID')

    await ensureUserRecord(userId)
    const user = await getUserRecord(userId)
    const email = user?.email

    let customerId = user?.stripeCustomerId
    if (!customerId) {
      const created = await stripeFetch(
        '/customers',
        new URLSearchParams({
          ...(email ? { email } : {}),
          'metadata[userId]': userId
        })
      )
      customerId = created.id
      await setUserStripeStatus({ userId, stripeCustomerId: customerId })
    }
    if (!customerId) {
      throw new Error('Unable to create Stripe customer')
    }

    const sessionParams = new URLSearchParams()
    sessionParams.set('mode', 'subscription')
    sessionParams.set('customer', customerId)
    sessionParams.set('line_items[0][price]', priceId)
    sessionParams.set('line_items[0][quantity]', '1')
    sessionParams.set('success_url', `${appBaseUrl}/account?checkout=success`)
    sessionParams.set('cancel_url', `${appBaseUrl}/account?checkout=cancel`)
    sessionParams.set('client_reference_id', userId)
    sessionParams.set('subscription_data[metadata][userId]', userId)

    const session = await stripeFetch('/checkout/sessions', sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to start checkout' }, { status: 500 })
  }
}

