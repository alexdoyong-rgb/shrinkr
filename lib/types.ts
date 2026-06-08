export type FileType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'

export type TargetPreset = 'email' | 'ultra' | 'custom'

export interface UploadedFile {
  id: string
  name: string
  type: FileType
  originalSize: number
  tempPath: string
}

export interface CompressionResult {
  fileId: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  targetSize: number
  downloadToken: string // used after payment
  mimeType: string
  fileName: string
}

export interface CheckoutSession {
  sessionId: string
  url: string
}

export type CompressionStage =
  | 'idle'
  | 'uploading'
  | 'compressing'
  | 'done'
  | 'error'

export interface AppState {
  stage: CompressionStage
  file: File | null
  targetPreset: TargetPreset
  customSizeMB: number
  result: CompressionResult | null
  error: string | null
  uploadProgress: number
}
