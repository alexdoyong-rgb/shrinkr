'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { formatBytes, ACCEPTED_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils'
import clsx from 'clsx'

interface DropzoneProps {
  onFileDrop: (file: File) => void
  selectedFile: File | null
  isCompressing: boolean
  onClear: () => void
}

export function Dropzone({ onFileDrop, selectedFile, isCompressing, onClear }: DropzoneProps) {
  const [dropError, setDropError] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[], rejected: import('react-dropzone').FileRejection[]) => {
      setDropError(null)

      if (rejected.length > 0) {
        const err = rejected[0].errors[0]
        if (err.code === 'file-too-large') {
          setDropError('File is too large. Maximum size is 50 MB.')
        } else if (err.code === 'file-invalid-type') {
          setDropError('Unsupported file type. Try JPEG, PNG, WEBP, or PDF.')
        } else {
          setDropError('Invalid file. Please try again.')
        }
        return
      }

      if (accepted.length > 0) {
        onFileDrop(accepted[0])
      }
    },
    [onFileDrop],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled: isCompressing,
  })

  // ── Compressing state ──────────────────────────────────────────────────────
  if (isCompressing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-5 animate-in">
        <div className="relative w-14 h-14">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-paper-border" />
          {/* Spinning arc */}
          <svg className="absolute inset-0 animate-spin-slow" viewBox="0 0 56 56" fill="none">
            <circle
              cx="28" cy="28" r="26"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 124"
            />
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <p className="font-display font-semibold text-ink mb-1 animate-pulse-soft">Compressing…</p>
          <p className="text-sm text-ink-muted">Optimizing your file, hang tight.</p>
        </div>

        <div className="w-48 progress-bar h-1">
          <div className="progress-bar-fill h-full" />
        </div>
      </div>
    )
  }

  // ── File selected state ────────────────────────────────────────────────────
  if (selectedFile) {
    const ext = selectedFile.name.split('.').pop()?.toUpperCase() ?? 'FILE'
    const isImage = selectedFile.type.startsWith('image/')

    return (
      <div className="flex items-center gap-4 p-4 bg-paper-warm rounded-2xl border border-paper-border animate-scale-in">
        {/* File type icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-paper-border flex items-center justify-center shadow-subtle">
          {isImage ? (
            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{selectedFile.name}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            <span className="size-pill bg-paper-border text-ink-muted">{ext}</span>
            <span className="ml-2">{formatBytes(selectedFile.size)}</span>
          </p>
        </div>

        {/* Clear button */}
        <button
          onClick={onClear}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-paper-border hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
          aria-label="Remove file"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  // ── Empty drop zone ────────────────────────────────────────────────────────
  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none',
          'py-14 px-6 text-center',
          isDragActive
            ? 'border-brand bg-brand-faint'
            : 'border-paper-border hover:border-brand/40 hover:bg-paper-warm',
        )}
      >
        <input {...getInputProps()} />

        {/* Upload icon */}
        <div
          className={clsx(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200',
            isDragActive ? 'bg-brand text-white scale-110' : 'bg-paper-warm text-ink-muted',
          )}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        {isDragActive ? (
          <div>
            <p className="font-display font-semibold text-brand text-lg mb-1">Drop it here</p>
            <p className="text-sm text-brand/70">Release to upload</p>
          </div>
        ) : (
          <div>
            <p className="font-display font-semibold text-ink text-lg mb-1">Drop your file here</p>
            <p className="text-sm text-ink-muted mb-4">or click to browse</p>

            <div className="flex flex-wrap justify-center gap-1.5">
              {['JPG', 'PNG', 'WEBP', 'PDF'].map((type) => (
                <span key={type} className="size-pill bg-paper-warm border border-paper-border text-ink-muted">
                  {type}
                </span>
              ))}
              <span className="size-pill bg-paper-warm border border-paper-border text-ink-faint">
                up to 50 MB
              </span>
            </div>
          </div>
        )}
      </div>

      {dropError && (
        <p className="mt-3 text-xs text-red-600 text-center animate-fade-in">
          {dropError}
        </p>
      )}
    </div>
  )
}
