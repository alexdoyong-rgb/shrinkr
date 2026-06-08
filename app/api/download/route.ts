import { NextRequest, NextResponse } from 'next/server'
import { getSessionMetadata } from '@/lib/stripe'
import { getCompressedBuffer, deleteRecord } from '@/lib/fileStore'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    // Verify payment
    const meta = await getSessionMetadata(sessionId)
    if (!meta) {
      return NextResponse.json({ error: 'Payment not verified or session expired.' }, { status: 403 })
    }

    const { fileId, fileName } = meta

    // Get compressed file from Redis
    const fileData = await getCompressedBuffer(fileId)
    if (!fileData) {
      return NextResponse.json(
        { error: 'File expired. Files are kept for 15 minutes after upload. Please compress again.' },
        { status: 404 }
      )
    }

    const downloadName = getDownloadName(fileName, fileData.mimeType)

    // Delete from Redis after download
    await deleteRecord(fileId)

    return new NextResponse(new Uint8Array(fileData.buffer), {
      status: 200,
      headers: {
        'Content-Type': fileData.mimeType,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': fileData.buffer.length.toString(),
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
  const base = originalName.replace(/\.[^/.]+$/, '')
  if (mimeType === 'image/png') return `${base}_shrinkr.webp`
  if (mimeType === 'image/jpeg') return `${base}_shrinkr.jpg`
  if (mimeType === 'image/webp') return `${base}_shrinkr.webp`
  if (mimeType === 'application/pdf') return `${base}_shrinkr.pdf`
  return `${base}_shrinkr`
}
