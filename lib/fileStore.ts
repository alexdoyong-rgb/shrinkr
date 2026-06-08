/**
 * fileStore.ts — Upstash Redis backend
 *
 * Files are stored as base64 in Redis with a 15-minute TTL.
 * This works across serverless function instances on Netlify.
 */

import { Redis } from '@upstash/redis'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const FILE_TTL_SECONDS = 15 * 60 // 15 minutes
const TMP_DIR = path.join(process.env.TMPDIR || '/tmp', 'shrinkr')

interface FileRecord {
  fileId: string
  originalBase64: string
  compressedBase64?: string
  mimeType: string
  fileName: string
  targetBytes: number
  expiresAt: number
}

async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true })
  } catch {}
}

/**
 * Store uploaded file in Redis and return fileId.
 */
export async function storeUpload(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  targetBytes: number,
): Promise<string> {
  const fileId = uuidv4()

  const record: FileRecord = {
    fileId,
    originalBase64: buffer.toString('base64'),
    mimeType,
    fileName: originalName,
    targetBytes,
    expiresAt: Date.now() + FILE_TTL_SECONDS * 1000,
  }

  await redis.set(`shrinkr:${fileId}`, JSON.stringify(record), { ex: FILE_TTL_SECONDS })

  return fileId
}

/**
 * Store the compressed file buffer in Redis.
 */
export async function storeCompressed(fileId: string, compressedBuffer: Buffer): Promise<void> {
  const raw = await redis.get<string>(`shrinkr:${fileId}`)
  if (!raw) throw new Error(`File not found: ${fileId}`)

  const record: FileRecord = typeof raw === 'string' ? JSON.parse(raw) : raw
  record.compressedBase64 = compressedBuffer.toString('base64')

  await redis.set(`shrinkr:${fileId}`, JSON.stringify(record), { ex: FILE_TTL_SECONDS })
}

/**
 * Get original file as a tmp path for compression.
 */
export async function getOriginalPath(fileId: string): Promise<{ path: string; mimeType: string; fileName: string; targetBytes: number } | null> {
  const raw = await redis.get<string>(`shrinkr:${fileId}`)
  if (!raw) return null

  const record: FileRecord = typeof raw === 'string' ? JSON.parse(raw) : raw

  await ensureTmpDir()
  const ext = mimeTypeToExt(record.mimeType)
  const tmpPath = path.join(TMP_DIR, `${fileId}_original${ext}`)
  await fs.writeFile(tmpPath, Buffer.from(record.originalBase64, 'base64'))

  return {
    path: tmpPath,
    mimeType: record.mimeType,
    fileName: record.fileName,
    targetBytes: record.targetBytes,
  }
}

/**
 * Get compressed file as Buffer for download.
 */
export async function getCompressedBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
  const raw = await redis.get<string>(`shrinkr:${fileId}`)
  if (!raw) return null

  const record: FileRecord = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!record.compressedBase64) return null

  return {
    buffer: Buffer.from(record.compressedBase64, 'base64'),
    mimeType: record.mimeType,
    fileName: record.fileName,
  }
}

/**
 * Delete record from Redis.
 */
export async function deleteRecord(fileId: string): Promise<void> {
  await redis.del(`shrinkr:${fileId}`)
}

/**
 * Check if a record exists.
 */
export async function recordExists(fileId: string): Promise<boolean> {
  const exists = await redis.exists(`shrinkr:${fileId}`)
  return exists === 1
}

function mimeTypeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  }
  return map[mimeType] ?? ''
}

// Legacy exports for compatibility
export function getRecord(fileId: string) { return null }
export function getCompressedPath(fileId: string) { return undefined }
export function getCompressedOutputPath(fileId: string, mimeType: string): string {
  const ext = mimeTypeToExt(mimeType)
  return path.join(process.env.TMPDIR || '/tmp', 'shrinkr', `${fileId}_compressed${ext}`)
}
export async function purgeExpired() {}
