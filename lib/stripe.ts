/**
 * stripe.ts
 *
 * Thin wrapper around the Stripe SDK for Shrinkr.
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  appInfo: {
    name: 'Shrinkr',
    version: '0.1.0',
  },
})

const PRICE_CENTS = parseInt(process.env.PRICE_CENTS || '100', 10)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface CreateCheckoutParams {
  fileId: string
  fileName: string
  originalSize: number
  compressedSize: number
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<Stripe.Checkout.Session> {
  const { fileId, fileName, originalSize, compressedSize } = params

  const compressionPct = Math.round(((originalSize - compressedSize) / originalSize) * 100)

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: PRICE_CENTS,
          product_data: {
            name: `Download: ${fileName}`,
            description: `Compressed file — ${compressionPct}% smaller. Ready to download instantly.`,
          },
        },
      },
    ],
    metadata: {
      fileId,
      fileName,
    },
    success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/cancel`,
    allow_promotion_codes: true,
  })
}

export async function getSessionMetadata(
  sessionId: string
): Promise<{ fileId: string; fileName: string } | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') return null

    return {
      fileId: session.metadata?.fileId ?? '',
      fileName: session.metadata?.fileName ?? 'compressed-file',
    }
  } catch {
    return null
  }
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
