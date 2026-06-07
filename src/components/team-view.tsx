import Link from 'next/link'
import { type Formation, type PositionSlot, type Position, POSITION_COLOR } from '@/lib/formations'

const POSITION_ORDER: Position[] = ['FWD', 'MD', 'DF', 'GK']

interface SlimPlayer {
  rating: number
  position: Position
}

function PitchSVG() {
  const s = 'rgba(255,255,255,0.18)'
  return (
    <svg
      viewBox="0 0 100 150"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="pitchGradView" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a1a" />
          <stop offset="30%" stopColor="#1e5218" />
          <stop offset="70%" stopColor="#1e5218" />
          <stop offset="100%" stopColor="#1a4a1a" />
        </linearGradient>
      </defs>
      <rect width="100" height="150" fill="url(#pitchGradView)" />
      <rect x="3" y="6" width="94" height="138" fill="none" stroke={s} strokeWidth="0.6" />
      <line x1="3" y1="75" x2="97" y2="75" stroke={s} strokeWidth="0.6" />
      <circle cx="50" cy="75" r="13" fill="none" stroke={s} strokeWidth="0.6" />
      <circle cx="50" cy="75" r="0.9" fill={s} />
      <rect x="24" y="6" width="52" height="22" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="36" y="6" width="28" height="9" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="24" y="122" width="52" height="22" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="36" y="135" width="28" height="9" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M3,6 Q6,6 6,9" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M97,6 Q94,6 94,9" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M3,144 Q6,144 6,141" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M97,144 Q94,144 94,141" fill="none" stroke={s} strokeWidth="0.5" />
    </svg>
  )
}

interface Props {
  formation: Formation
  slots: PositionSlot[]
  players: Record<string, SlimPlayer>
  overall: number
}

export default function TeamView({ formation, slots, players, overall }: Props) {
  const grouped = POSITION_ORDER.reduce<Record<Position, number[]>>(
    (acc, pos) => ({ ...acc, [pos]: [] }),
    { GK: [], DF: [], MD: [], FWD: [] }
  )
  slots.forEach((s) => {
    const r = players[s.id]?.rating
    if (r != null) grouped[s.position].push(r)
  })

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 gap-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <p className="text-on-surface-muted font-body text-xs uppercase tracking-widest">
          World Cup Legends Draft
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-gold uppercase tracking-tight">
          Shared Squad
        </h1>
      </header>

      {/* Overall badge */}
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-gold/30 bg-surface-container"
        style={{ boxShadow: '0 0 24px 2px rgba(242,202,80,0.1)' }}
      >
        <div className="text-center">
          <div
            className="font-display font-extrabold leading-none"
            style={{ fontSize: '3.5rem', color: '#f2ca50' }}
          >
            {overall}
          </div>
          <div className="text-on-surface-muted font-body text-[10px] uppercase tracking-widest">
            OVR
          </div>
        </div>
        <div className="border-l border-outline-dim pl-4">
          <div className="text-on-surface-muted font-body text-xs uppercase tracking-widest mb-1">
            Formation
          </div>
          <div className="font-display text-2xl font-bold text-on-surface">{formation.label}</div>
        </div>
      </div>

      {/* Pitch + roster */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-3xl">
        {/* Pitch */}
        <div className="flex-1 flex justify-center">
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-2xl"
            style={{ maxWidth: '340px', aspectRatio: '2/3' }}
          >
            <PitchSVG />
            {slots.map((slot) => {
              const player = players[slot.id]
              const color = POSITION_COLOR[slot.position]
              return (
                <div
                  key={slot.id}
                  style={{
                    top: `${slot.topPct}%`,
                    left: `${slot.leftPct}%`,
                    color,
                    borderColor: '#d4af3766',
                    backgroundColor: 'rgba(212,175,55,0.12)',
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-11 h-11 rounded-full border-2 font-body"
                  aria-label={`${slot.position}: ${player?.rating ?? '?'}`}
                >
                  <span className="text-gold text-sm font-bold leading-none">{player?.rating}</span>
                  <span className="text-[8px] font-bold" style={{ color }}>
                    {slot.position}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Roster + CTA */}
        <div className="flex flex-col gap-4 lg:w-64">
          <div className="rounded-xl border border-outline-dim bg-surface-container p-4 space-y-3">
            <h2 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider">
              Lineup
            </h2>
            {POSITION_ORDER.filter((pos) => grouped[pos].length > 0).map((pos) => (
              <div key={pos} className="flex items-center gap-3">
                <span
                  className="w-9 text-center text-xs font-bold uppercase py-0.5 rounded border shrink-0"
                  style={{
                    color: POSITION_COLOR[pos],
                    borderColor: `${POSITION_COLOR[pos]}44`,
                    backgroundColor: `${POSITION_COLOR[pos]}11`,
                  }}
                >
                  {pos}
                </span>
                <div className="flex flex-wrap gap-1">
                  {grouped[pos].map((rating, i) => (
                    <span key={i} className="text-gold font-display font-bold text-sm">
                      {rating}
                      {i < grouped[pos].length - 1 && (
                        <span className="text-outline-dim mx-1">·</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="w-full py-3 rounded font-body font-bold text-sm uppercase tracking-widest text-center bg-gold text-[#3c2f00] hover:bg-gold-bright transition-colors"
            style={{ boxShadow: '0 4px 20px rgba(242,202,80,0.2)' }}
          >
            Build Your Own Squad →
          </Link>
        </div>
      </div>
    </div>
  )
}
