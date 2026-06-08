/**
 * POST /api/webhook
 *
 * Stripe webhook endpoint.
 * Currently logs payment.intent.succeeded events.
 * Extend this for email receipts, analytics, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'

export const runtime = 'nodejs'

// Stripe requires the raw body
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  try {
    const payload = Buffer.from(await request.arrayBuffer())
    const event = constructWebhookEvent(payload, signature)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('[webhook] Payment completed:', {
          sessionId: session.id,
          fileId: session.metadata?.fileId,
          amount: session.amount_total,
        })
        // TODO: send receipt email, log to analytics, etc.
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object
        console.log('[webhook] Session expired:', session.id)
        // Could clean up the file early here
        break
      }

      default:
        // Ignore unhandled events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('[/api/webhook]', err)
    const message = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
