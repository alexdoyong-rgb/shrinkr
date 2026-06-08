'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'downloading' | 'done' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found.')
      setStatus('error')
      return
    }

    const triggerDownload = async () => {
      setStatus('downloading')
      try {
        const res = await fetch(`/api/download?session_id=${sessionId}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Download failed.')
          setStatus('error')
          return
        }

        // Stream download to browser
        const blob = await res.blob()
        const contentDisposition = res.headers.get('content-disposition') ?? ''
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        const filename = match?.[1] ?? 'compressed-file'

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)

        setStatus('done')
      } catch {
        setError('Download failed. Please contact support.')
        setStatus('error')
      }
    }

    triggerDownload()
  }, [sessionId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-md">
        {status === 'loading' || status === 'downloading' ? (
          <div className="text-center animate-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-faint flex items-center justify-center">
              <svg className="w-7 h-7 text-brand animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">
              {status === 'loading' ? 'Verifying payment…' : 'Preparing download…'}
            </h1>
            <p className="text-ink-muted text-sm">Your file will download automatically.</p>

            <div className="mt-6 progress-bar h-1.5 w-48 mx-auto">
              <div className="progress-bar-fill h-full" />
            </div>
          </div>
        ) : status === 'done' ? (
          <div className="text-center animate-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success-faint flex items-center justify-center animate-bounce-soft">
              <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-display text-3xl font-bold text-ink mb-2">Download started!</h1>
            <p className="text-ink-muted mb-8">
              Your compressed file should be in your downloads folder.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-6 py-3 rounded-2xl hover:bg-ink-soft transition-colors btn-press"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Compress another file
            </Link>
          </div>
        ) : (
          <div className="text-center animate-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Something went wrong</h1>
            <p className="text-ink-muted text-sm mb-6">{error}</p>
            <p className="text-xs text-ink-faint mb-6">
              Your payment was processed. Please contact{' '}
              <a href="mailto:support@shrinkr.app" className="text-brand underline">
                support@shrinkr.app
              </a>{' '}
              with your session ID: <span className="font-mono">{sessionId}</span>
            </p>
            <Link
              href="/"
              className="text-sm text-brand underline underline-offset-2"
            >
              Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
