'use client'

import { formatBytes, compressionPercent } from '@/lib/utils'
import type { CompressionResult as CompressionResultType } from '@/lib/types'

interface CompressionResultProps {
  result: CompressionResultType
  onCheckout: () => void
  onReset: () => void
  isCheckingOut: boolean
}

export function CompressionResult({ result, onCheckout, onReset, isCheckingOut }: CompressionResultProps) {
  const pct = compressionPercent(result.originalSize, result.compressedSize)
  const compressedBar = Math.round((result.compressedSize / result.originalSize) * 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Compression complete</p>
          <p className="text-xs text-gray-500">{result.fileName}</p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Before</span>
            <span className="text-sm text-gray-500">{formatBytes(result.originalSize)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-gray-300 rounded-full w-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">After</span>
            <span className="text-sm font-semibold text-green-600">{formatBytes(result.compressedSize)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${compressedBar}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center pt-1">
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-800">{pct}% smaller</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">saved {formatBytes(result.originalSize - result.compressedSize)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={isCheckingOut}
        className="w-full flex items-center justify-center gap-2.5 bg-blue-600 text-white font-bold text-base px-6 py-4 rounded-2xl hover:bg-blue-700 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
      >
        {isCheckingOut ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Redirecting to checkout…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download for $1.00
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Secure payment via Stripe · No account required · Instant download
      </p>

      <div className="text-center">
        <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
          Compress a different file
        </button>
      </div>
    </div>
  )
}
