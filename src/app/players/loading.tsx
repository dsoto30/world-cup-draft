export default function PlayersLoading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-outline-dim border-t-gold animate-spin" />
        <p className="text-on-surface-muted font-body text-xs uppercase tracking-widest">
          Loading Players
        </p>
      </div>
    </div>
  )
}
