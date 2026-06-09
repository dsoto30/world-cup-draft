function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded bg-surface-container animate-pulse ${className ?? ''}`}
    />
  )
}

export default function ViewLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 gap-8 bg-surface">
      {/* Header */}
      <div className="text-center space-y-2">
        <SkeletonBlock className="h-3 w-36 mx-auto" />
        <SkeletonBlock className="h-8 w-48 mx-auto" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-3xl">
        {/* Pitch skeleton */}
        <div className="flex-1 flex justify-center">
          <div
            className="relative w-full rounded-xl overflow-hidden bg-surface-container animate-pulse"
            style={{ maxWidth: '360px', aspectRatio: '2/3' }}
          />
        </div>

        {/* Sidebar skeleton */}
        <aside className="lg:w-[360px] flex flex-col gap-5">
          {/* Overall + formation card */}
          <div className="flex items-center gap-5 p-5 rounded-xl border border-gold/20 bg-surface-container">
            <div className="space-y-2">
              <SkeletonBlock className="h-16 w-14" />
              <SkeletonBlock className="h-2 w-12" />
            </div>
            <div className="flex-1 border-l border-outline-dim pl-5 space-y-2">
              <SkeletonBlock className="h-2 w-16" />
              <SkeletonBlock className="h-7 w-20" />
            </div>
          </div>

          {/* Player roster rows */}
          <div className="rounded-xl border border-outline-dim bg-surface-container overflow-hidden">
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <SkeletonBlock className="h-4 w-6 shrink-0" />
                <SkeletonBlock className="h-3 w-7 shrink-0" />
                <SkeletonBlock className="h-3 flex-1" />
                <SkeletonBlock className="h-3 w-12 shrink-0" />
              </div>
            ))}
          </div>

          {/* CTA */}
          <SkeletonBlock className="h-10 w-full rounded" />
        </aside>
      </div>
    </div>
  )
}
