/**
 * POST /api/compress
 *
 * Accepts multipart form with:
 *   - file: the file to compress
 *   - targetBytes: desired output size in bytes (as string)
 *
 * Returns JSON: { fileId, originalSize, compressedSize, compressionRatio, fileName, mimeType }
 */

import { NextRequest, NextResponse } from 'next/server'
import { compressFile } from '@/lib/compression'
import {
  storeUpload,
  storeCompressed,
  getCompressedOutputPath,
  getRecord,
} from '@/lib/fileStore'
import { ACCEPTED_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const targetBytesStr = formData.get('targetBytes') as string | null

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!targetBytesStr || isNaN(Number(targetBytesStr))) {
      return NextResponse.json({ error: 'Invalid targetBytes' }, { status: 400 })
    }

    const targetBytes = parseInt(targetBytesStr, 10)
    const mimeType = file.type

    if (!Object.keys(ACCEPTED_TYPES).includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Accepted: JPEG, PNG, WEBP, PDF` },
        { status: 400 },
      )
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum is 50 MB.' },
        { status: 400 },
      )
    }
    if (file.size <= targetBytes) {
      return NextResponse.json(
        { error: 'File is already smaller than or equal to the target size.' },
        { status: 400 },
      )
    }

    // Store original
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileId = await storeUpload(buffer, file.name, mimeType, targetBytes)

    const record = getRecord(fileId)
    if (!record) throw new Error('Failed to store upload')

    const outputPath = getCompressedOutputPath(fileId, mimeType)

    // Compress
    const result = await compressFile({
      inputPath: record.originalPath,
      outputPath,
      targetBytes,
      mimeType,
    })

    await storeCompressed(fileId, outputPath)

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
