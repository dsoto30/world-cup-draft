'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <h2 className="font-display text-2xl font-bold text-on-surface uppercase tracking-tight">
          Something went wrong
        </h2>
        <p className="text-on-surface-muted font-body text-sm">{error.message}</p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-gold text-[#3c2f00] font-body font-bold text-sm uppercase tracking-widest rounded hover:bg-gold-bright transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
