/**
 * fileStore.ts
 *
 * In-memory + filesystem store for temporary files.
 * Files are stored in /tmp/shrinkr/ and auto-expire after 15 minutes.
 *
 * PRODUCTION SWAP: Replace readFile/writeFile calls with AWS S3 put/get/delete.
 */

import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const TMP_DIR = path.join(process.env.TMPDIR || '/tmp', 'shrinkr')
const FILE_TTL_MS = 15 * 60 * 1000 // 15 minutes

interface FileRecord {
  fileId: string
  originalPath: string
  compressedPath?: string
  expiresAt: number
  mimeType: string
  fileName: string
  targetBytes: number
}

declare global {
  // eslint-disable-next-line no-var
  var __shrinkrStore: Map<string, FileRecord> | undefined
}

function getStore(): Map<string, FileRecord> {
  if (!global.__shrinkrStore) {
    global.__shrinkrStore = new Map()
  }
  return global.__shrinkrStore
}

async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true })
  } catch {
    // already exists
  }
}

export async function storeUpload(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  targetBytes: number,
): Promise<string> {
  await ensureTmpDir()
  const fileId = uuidv4()
  const ext = path.extname(originalName) || mimeTypeToExt(mimeType)
  const filePath = path.join(TMP_DIR, `${fileId}_original${ext}`)

  await fs.writeFile(filePath, buffer)

  getStore().set(fileId, {
    fileId,
    originalPath: filePath,
    expiresAt: Date.now() + FILE_TTL_MS,
    mimeType,
    fileName: originalName,
    targetBytes,
  })

  scheduleCleanup(fileId)

  return fileId
}

export async function storeCompressed(
  fileId: string,
  compressedPath: string,
): Promise<void> {
  const record = getStore().get(fileId)
  if (!record) throw new Error(`Unknown fileId: ${fileId}`)
  record.compressedPath = compressedPath
}

export function getRecord(fileId: string): FileRecord | undefined {
  return getStore().get(fileId)
}

export function getCompressedPath(fileId: string): string | undefined {
  return getStore().get(fileId)?.compressedPath
}

export function getCompressedOutputPath(fileId: string, mimeType: string): string {
  const ext = mimeTypeToExt(mimeType)
  return path.join(TMP_DIR, `${fileId}_compressed${ext}`)
}

export async function deleteRecord(fileId: string): Promise<void> {
  const record = getStore().get(fileId)
  if (!record) return

  const paths = [record.originalPath, record.compressedPath].filter(Boolean) as string[]
  await Promise.all(
    paths.map((p) => fs.unlink(p).catch(() => {}))
  )

  getStore().delete(fileId)
}

function scheduleCleanup(fileId: string) {
  setTimeout(() => deleteRecord(fileId), FILE_TTL_MS + 1000)
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

export async function purgeExpired(): Promise<void> {
  const store = getStore()
  const now = Date.now()
  for (const [id, record] of Array.from(store.entries())) {
    if (record.expiresAt < now) {
      await deleteRecord(id)
    }
  }
}
