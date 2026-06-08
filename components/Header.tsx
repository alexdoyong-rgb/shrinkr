import Link from 'next/link'

export function Header() {
  return (
    <header className="w-full px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
      <Link href="/" className="flex items-center gap-2.5 group">
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center group-hover:bg-ink-soft transition-colors">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
        </div>
        <span className="font-display font-bold text-lg text-ink tracking-tight">Shrinkr</span>
      </Link>

      <div className="flex items-center gap-1 text-xs text-ink-muted">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        Secure · No signup
      </div>
    </header>
  )
}
