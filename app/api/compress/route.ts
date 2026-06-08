import { NextRequest, NextResponse } from 'next/server'
import { compressFile } from '@/lib/compression'
import { storeUpload, storeCompressed, getOriginalPath, getCompressedOutputPath } from '@/lib/fileStore'
import { ACCEPTED_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils'
import fs from 'fs/promises'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_SIZE = 30 * 1024 * 1024 // 30MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const targetBytesStr = formData.get('targetBytes') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!targetBytesStr || isNaN(Number(targetBytesStr))) return NextResponse.json({ error: 'Invalid targetBytes' }, { status: 400 })

    const targetBytes = parseInt(targetBytesStr, 10)
    const mimeType = file.type

    if (!Object.keys(ACCEPTED_TYPES).includes(mimeType)) {
      return NextResponse.json({ error: `Unsupported file type. Accepted: JPEG, PNG, WEBP, PDF` }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum is 30 MB.' }, { status: 400 })
    }
    if (file.size <= targetBytes) {
      return NextResponse.json({ error: 'File is already smaller than the target size.' }, { status: 400 })
    }

    // Store original in Redis
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileId = await storeUpload(buffer, file.name, mimeType, targetBytes)

    // Get tmp path for compression
    const original = await getOriginalPath(fileId)
    if (!original) throw new Error('Failed to retrieve uploaded file')

    const outputPath = getCompressedOutputPath(fileId, mimeType)

    // Compress
    const result = await compressFile({
      inputPath: original.path,
      outputPath,
      targetBytes,
      mimeType,
    })

    // Read compressed file and store in Redis
    const compressedBuffer = await fs.readFile(outputPath)
    await storeCompressed(fileId, compressedBuffer)

    // Clean up tmp files
    await fs.unlink(original.path).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})

    const compressionRatio = Math.round(
      ((result.originalSize - result.compressedSize) / result.originalSize) * 100,
    )

    return NextResponse.json({
      fileId,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio,
      fileName: file.name,
      mimeType,
    })
  } catch (err: unknown) {
    console.error('[/api/compress]', err)
    const message = err instanceof Error ? err.message : 'Compression failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
