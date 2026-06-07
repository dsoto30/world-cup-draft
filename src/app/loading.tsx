export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-outline-dim border-t-gold animate-spin" />
        <p className="text-on-surface-muted font-body text-sm uppercase tracking-widest">
          Loading
        </p>
      </div>
    </div>
  )
}
