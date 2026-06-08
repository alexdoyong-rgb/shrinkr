'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { formatBytes, ACCEPTED_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils'

interface DropzoneProps {
  onFileDrop: (file: File) => void
  selectedFile: File | null
  isCompressing: boolean
  onClear: () => void
}

export function Dropzone({ onFileDrop, selectedFile, isCompressing, onClear }: DropzoneProps) {
  const [dropError, setDropError] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setDropError(null)
      if (rejected.length > 0) {
        const code = rejected[0].errors[0]?.code
        if (code === 'file-too-large') setDropError('File too large. Max 50 MB.')
        else if (code === 'file-invalid-type') setDropError('Unsupported type. Try JPEG, PNG, WEBP, or PDF.')
        else setDropError('Invalid file. Please try again.')
        return
      }
      if (accepted.length > 0) onFileDrop(accepted[0])
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

  if (isCompressing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center">
          <p className="font-semibold text-gray-900 mb-1">Compressing…</p>
          <p className="text-sm text-gray-500">Optimizing your file, hang tight.</p>
        </div>
      </div>
    )
  }

  if (selectedFile) {
    const ext = selectedFile.name.split('.').pop()?.toUpperCase() ?? 'FILE'
    const isImage = selectedFile.type.startsWith('image/')
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          {isImage ? (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full mr-2">{ext}</span>
            {formatBytes(selectedFile.size)}
          </p>
        </div>
        <button
          onClick={onClear}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer py-14 px-6 text-center ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${
          isDragActive ? 'bg-blue-500 text-white scale-110' : 'bg-gray-100 text-gray-400'
        }`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        {isDragActive ? (
          <p className="font-semibold text-blue-600 text-lg">Drop it here!</p>
        ) : (
          <div>
            <p className="font-semibold text-gray-900 text-lg mb-1">Drop your file here</p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['JPG', 'PNG', 'WEBP', 'PDF'].map((t) => (
                <span key={t} className="text-xs bg-gray-100 border border-gray-200 text-gray-500 px-2 py-1 rounded-full">{t}</span>
              ))}
              <span className="text-xs bg-gray-100 border border-gray-200 text-gray-400 px-2 py-1 rounded-full">up to 50 MB</span>
            </div>
          </div>
        )}
      </div>
      {dropError && <p className="mt-3 text-xs text-red-600 text-center">{dropError}</p>}
    </div>
  )
}
