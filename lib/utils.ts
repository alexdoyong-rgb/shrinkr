/**
 * Format bytes to a human-readable string.
 * e.g. 1500000 → "1.5 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))
  return `${value} ${sizes[i]}`
}

/**
 * Convert MB to bytes.
 */
export function mbToBytes(mb: number): number {
  return Math.round(mb * 1024 * 1024)
}

/**
 * Convert bytes to MB.
 */
export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024)
}

/**
 * Calculate compression ratio as a percentage reduction.
 * e.g. original=10MB, compressed=2MB → 80
 */
export function compressionPercent(original: number, compressed: number): number {
  if (original === 0) return 0
  return Math.round(((original - compressed) / original) * 100)
}

/**
 * Accepted file types and their labels.
 */
export const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
}

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export const PRESET_TARGETS: Record<string, { label: string; description: string; bytes: number }> = {
  email: {
    label: 'Email ready',
    description: 'Under 5 MB — works with Gmail, Outlook, Apple Mail',
    bytes: 5 * 1024 * 1024,
  },
  ultra: {
    label: 'Ultra light',
    description: 'Under 1 MB — Discord, Slack, web forms',
    bytes: 1 * 1024 * 1024,
  },
  custom: {
    label: 'Custom size',
    description: 'You pick the target size',
    bytes: 0, // filled in dynamically
  },
}

/**
 * Estimate the compressed size based on file type and target.
 * This is a rough heuristic shown to the user BEFORE actual compression.
 */
export function estimateCompressedSize(
  originalBytes: number,
  targetBytes: number,
  mimeType: string,
): number {
  if (originalBytes <= targetBytes) return originalBytes

  // PDFs compress less predictably
  if (mimeType === 'application/pdf') {
    const ratio = targetBytes / originalBytes
    // PDFs typically achieve ~60-80% of target ratio due to embedded assets
    return Math.round(targetBytes * (0.9 + Math.random() * 0.15))
  }

  // Images: sharp can usually hit within ~10% of target
  return Math.round(targetBytes * (0.88 + Math.random() * 0.1))
}
