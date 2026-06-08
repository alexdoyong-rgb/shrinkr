/**
 * GET /api/download?session_id=...
 *
 * Verifies Stripe payment then streams the compressed file.
 * File is deleted after download.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getSessionMetadata } from '@/lib/stripe'
import { getCompressedPath, getRecord, deleteRecord } from '@/lib/fileStore'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    // Verify payment via Stripe
    const meta = await getSessionMetadata(sessionId)

    if (!meta) {
      return NextResponse.json(
        { error: 'Payment not verified or session expired.' },
        { status: 403 },
      )
    }

    const { fileId, fileName } = meta

    const record = getRecord(fileId)
    if (!record) {
      return NextResponse.json(
        { error: 'File expired. Files are only kept for 15 minutes after upload.' },
        { status: 404 },
      )
    }

    const compressedPath = getCompressedPath(fileId)
    if (!compressedPath) {
      return NextResponse.json({ error: 'Compressed file not found.' }, { status: 404 })
    }

    // Check file exists on disk
    if (!fs.existsSync(compressedPath)) {
      return NextResponse.json({ error: 'File missing from disk.' }, { status: 404 })
    }

    // Stream the file
    const fileStream = fs.createReadStream(compressedPath)
    const stat = fs.statSync(compressedPath)

    // Determine content-type and clean download name
    const contentType = record.mimeType
    const downloadName = getDownloadName(fileName, record.mimeType)

    // Schedule deletion after response
    fileStream.on('end', () => {
      deleteRecord(fileId).catch(console.error)
    })

    // @ts-expect-error — ReadableStream from Node fs works here
    return new NextResponse(fileStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    console.error('[/api/download]', err)
    const message = err instanceof Error ? err.message : 'Download failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getDownloadName(originalName: string, mimeType: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '') // strip extension
  if (mimeType === 'image/png') return `${base}_shrinkr.webp` // we convert PNG→webp
  if (mimeType === 'image/jpeg') return `${base}_shrinkr.jpg`
  if (mimeType === 'image/webp') return `${base}_shrinkr.webp`
  if (mimeType === 'application/pdf') return `${base}_shrinkr.pdf`
  return `${base}_shrinkr`
}
