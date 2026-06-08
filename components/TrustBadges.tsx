export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6">
      {[
        'Files deleted after download',
        'Stripe-secured payments',
        'No account required',
      ].map((label) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {label}
        </div>
      ))}
    </div>
  )
}
