import type { Player } from '@/lib/players'
import type { Position } from '@/lib/formations'

const RARITY_BG: Record<string, string> = {
  legendary: 'linear-gradient(160deg, rgba(120,80,0,0.8) 0%, rgba(60,40,0,0.6) 50%, rgba(35,31,23,0.9) 100%)',
  rare: 'linear-gradient(160deg, rgba(80,80,90,0.8) 0%, rgba(50,50,60,0.6) 50%, rgba(35,31,23,0.9) 100%)',
  uncommon: 'linear-gradient(160deg, rgba(100,60,20,0.8) 0%, rgba(60,35,10,0.6) 50%, rgba(35,31,23,0.9) 100%)',
  common: 'linear-gradient(160deg, rgba(45,42,33,0.9) 0%, rgba(35,31,23,0.95) 100%)',
}

const POSITION_BADGE_COLOR: Record<Position, string> = {
  GK: '#f2ca50',
  DF: '#86d89d',
  MD: '#d0c5af',
  FWD: '#ffbfb8',
}

function getRarity(rating: number): string {
  if (rating >= 90) return 'legendary'
  if (rating >= 85) return 'rare'
  if (rating >= 80) return 'uncommon'
  return 'common'
}

function PlayerSilhouette() {
  return (
    <svg viewBox="0 0 48 60" className="w-12 h-14 opacity-20" fill="currentColor" aria-hidden>
      <circle cx="24" cy="13" r="10" />
      <path d="M6 60c0-14 7-24 18-24s18 10 18 24" />
    </svg>
  )
}

export default function PlayerCard({ player }: { player: Player }) {
  const rarity = getRarity(player.rating)
  const badgeColor = POSITION_BADGE_COLOR[player.position]

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-lg border border-outline-dim"
      style={{ background: RARITY_BG[rarity] }}
    >
      {/* Rating + position */}
      <div className="px-3 pt-3 pb-1">
        <div className="font-display text-3xl font-bold leading-none" style={{ color: '#f2ca50' }}>
          {player.rating}
        </div>
        <span
          className="inline-block mt-1 px-1.5 py-px text-[10px] font-bold uppercase rounded border"
          style={{ color: badgeColor, borderColor: `${badgeColor}66` }}
        >
          {player.position}
        </span>
      </div>

      {/* Silhouette */}
      <div className="flex justify-center py-3 text-on-surface">
        <PlayerSilhouette />
      </div>

      {/* Name / info */}
      <div
        className="px-3 pb-3 pt-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-on-surface text-xs font-bold truncate">{player.name}</p>
        <p className="text-on-surface-muted text-[10px] truncate">
          {player.club} &bull; {player.nation}
        </p>
      </div>
    </div>
  )
}
