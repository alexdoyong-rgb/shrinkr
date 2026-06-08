import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-sm text-center animate-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-paper-warm border border-paper-border flex items-center justify-center">
          <svg className="w-7 h-7 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink mb-2">Payment cancelled</h1>
        <p className="text-ink-muted text-sm mb-8 leading-relaxed">
          No charge was made. Your compressed file is still waiting — 
          just click below to try again.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-6 py-3 rounded-2xl hover:bg-ink-soft transition-colors btn-press"
        >
          Back to Shrinkr
        </Link>

        <p className="text-xs text-ink-faint mt-6">
          Files are kept for 15 minutes after upload.
        </p>
      </div>
    </div>
  )
}
