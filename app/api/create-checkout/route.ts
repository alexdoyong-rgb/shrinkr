/**
 * POST /api/create-checkout
 *
 * Body: { fileId, fileName, originalSize, compressedSize }
 * Returns: { url } — the Stripe Checkout URL to redirect to
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { getRecord } from '@/lib/fileStore'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId, fileName, originalSize, compressedSize } = body

    if (!fileId || !fileName || !originalSize || !compressedSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the file actually exists in our store
    const record = getRecord(fileId)
    if (!record) {
      return NextResponse.json(
        { error: 'File not found or expired. Please re-upload.' },
        { status: 404 },
      )
    }

    if (!record.compressedPath) {
      return NextResponse.json(
        { error: 'File has not been compressed yet.' },
        { status: 400 },
      )
    }

    const session = await createCheckoutSession({
      fileId,
      fileName,
      originalSize,
      compressedSize,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[/api/create-checkout]', err)
    const message = err instanceof Error ? err.message : 'Failed to create checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
