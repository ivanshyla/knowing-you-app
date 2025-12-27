import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { setUserStripeStatus } from '@/lib/sessionStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getStripeSigHeader(request: NextRequest): string {
  const v = request.headers.get('stripe-signature')
  if (!v) throw new Error('Missing stripe-signature header')
  return v
}

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  // Stripe-Signature: t=...,v1=...,v1=...
  const parts = header.split(',').map((p) => p.trim())
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2)
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))

  if (!timestamp || signatures.length === 0) return false

  const signedPayload = `${timestamp}.${payload}`
  const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex')

  return signatures.some((sig) => {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  })
}

function isProStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
    }

    const sigHeader = getStripeSigHeader(request)
    const payload = await request.text()

    if (!verifyStripeSignature(payload, sigHeader, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(payload)
    const type = String(event?.type || '')
    const dataObject = event?.data?.object ?? null

    // We rely on metadata.userId (set during checkout session creation)
    const metadataUserId =
      (dataObject?.metadata?.userId as string | undefined) ||
      (dataObject?.subscription_details?.metadata?.userId as string | undefined) ||
      (dataObject?.client_reference_id as string | undefined)

    if (!metadataUserId) {
      return NextResponse.json({ received: true, skipped: true })
    }

    if (type === 'checkout.session.completed') {
      const customerId = dataObject?.customer as string | undefined
      const subscriptionId = dataObject?.subscription as string | undefined
      await setUserStripeStatus({
        userId: metadataUserId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeStatus: 'active',
        isPro: true
      })
    }

    if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
      const status = dataObject?.status as string | undefined
      const subscriptionId = dataObject?.id as string | undefined
      const customerId = dataObject?.customer as string | undefined
      await setUserStripeStatus({
        userId: metadataUserId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeStatus: status,
        isPro: isProStatus(status)
      })
    }

    if (type === 'customer.subscription.deleted') {
      const status = dataObject?.status as string | undefined
      const subscriptionId = dataObject?.id as string | undefined
      const customerId = dataObject?.customer as string | undefined
      await setUserStripeStatus({
        userId: metadataUserId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeStatus: status ?? 'canceled',
        isPro: false
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}



