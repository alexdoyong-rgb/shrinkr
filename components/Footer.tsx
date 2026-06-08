export function Footer() {
  return (
    <footer className="w-full px-6 py-6 mt-8 border-t border-paper-border">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint">
        <p>© {new Date().getFullYear()} Shrinkr. Files auto-delete after 15 minutes.</p>
        <div className="flex items-center gap-4">
          <a href="mailto:support@shrinkr.app" className="hover:text-ink-muted transition-colors">
            Support
          </a>
          <a href="/privacy" className="hover:text-ink-muted transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  )
}
