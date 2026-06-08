'use client'

import { formatBytes, compressionPercent } from '@/lib/utils'
import type { CompressionResult as CompressionResultType } from '@/lib/types'

interface CompressionResultProps {
  result: CompressionResultType
  onCheckout: () => void
  onReset: () => void
  isCheckingOut: boolean
}

export function CompressionResult({
  result,
  onCheckout,
  onReset,
  isCheckingOut,
}: CompressionResultProps) {
  const pct = compressionPercent(result.originalSize, result.compressedSize)
  const originalBar = 100
  const compressedBar = Math.round((result.compressedSize / result.originalSize) * 100)

  return (
    <div className="animate-in space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-success-faint flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="font-display font-semibold text-ink text-sm">Compression complete</p>
          <p className="text-xs text-ink-muted">{result.fileName}</p>
        </div>
      </div>

      {/* Before / After visualization */}
      <div className="p-4 bg-paper-warm rounded-2xl border border-paper-border space-y-4">
        {/* Before */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Before</span>
            <span className="font-mono text-sm text-ink-muted">{formatBytes(result.originalSize)}</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="comparison-bar bg-paper-border"
              style={{ width: `${originalBar}%` }}
            />
          </div>
        </div>

        {/* After */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-success uppercase tracking-wide">After</span>
            <span className="font-mono text-sm font-semibold text-success">{formatBytes(result.compressedSize)}</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="comparison-bar"
              style={{
                width: `${compressedBar}%`,
                background: 'linear-gradient(90deg, #16A34A, #22C55E)',
              }}
            />
          </div>
        </div>

        {/* Savings badge */}
        <div className="flex items-center justify-center pt-1">
          <div className="inline-flex items-center gap-1.5 bg-white border border-paper-border rounded-full px-3 py-1.5 shadow-subtle">
            <svg className="w-3.5 h-3.5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-ink">
              {pct}% smaller
            </span>
            <span className="text-xs text-ink-muted">·</span>
            <span className="text-xs text-ink-muted">
              saved {formatBytes(result.originalSize - result.compressedSize)}
            </span>
          </div>
        </div>
      </div>

      {/* Download CTA */}
      <div className="animate-in animate-in-delay-1">
        <button
          onClick={onCheckout}
          disabled={isCheckingOut}
          className="btn-press w-full flex items-center justify-center gap-2.5 bg-brand text-white font-display font-bold text-base px-6 py-4 rounded-2xl hover:bg-brand-dark transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed shadow-card relative overflow-hidden group"
        >
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

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

        <p className="text-center text-xs text-ink-faint mt-3">
          Secure payment via Stripe · No account required · Instant download
        </p>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="text-xs text-ink-faint hover:text-ink-muted transition-colors underline underline-offset-2"
        >
          Compress a different file
        </button>
      </div>
    </div>
  )
}
