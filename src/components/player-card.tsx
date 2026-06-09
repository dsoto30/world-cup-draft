import type { WCPlayer } from '@/lib/queries'
import type { Position } from '@/lib/formations'

const RARITY_BG: Record<string, string> = {
  legendary: 'linear-gradient(160deg, rgba(120,80,0,0.9) 0%, rgba(60,40,0,0.6) 50%, rgba(35,31,23,0.95) 100%)',
  rare:       'linear-gradient(160deg, rgba(70,70,85,0.9) 0%, rgba(45,45,60,0.6) 50%, rgba(35,31,23,0.95) 100%)',
  uncommon:   'linear-gradient(160deg, rgba(90,55,15,0.9) 0%, rgba(55,30,10,0.6) 50%, rgba(35,31,23,0.95) 100%)',
  common:     'linear-gradient(160deg, rgba(45,42,33,0.95) 0%, rgba(35,31,23,0.98) 100%)',
}

function getRarity(rating: number): string {
  if (rating >= 88) return 'legendary'
  if (rating >= 79) return 'rare'
  if (rating >= 70) return 'uncommon'
  return 'common'
}

const POSITION_BADGE_COLOR: Record<Position, string> = {
  GK:  '#f2ca50',
  DF:  '#86d89d',
  MD:  '#d0c5af',
  FWD: '#ffbfb8',
}

function PlayerSilhouette() {
  return (
    <svg viewBox="0 0 48 60" className="w-12 h-14 opacity-20" fill="currentColor" aria-hidden>
      <circle cx="24" cy="13" r="10" />
      <path d="M6 60c0-14 7-24 18-24s18 10 18 24" />
    </svg>
  )
}

export default function PlayerCard({ player }: { player: WCPlayer }) {
  const rarity = getRarity(player.rating)
  const badgeColor = POSITION_BADGE_COLOR[player.position]
  const hasAward = player.awards.length > 0

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-lg border border-outline-dim h-full"
      style={{ background: RARITY_BG[rarity] }}
    >
      {/* Award ribbon */}
      {hasAward && (
        <div
          className="absolute top-0 right-0 text-[8px] font-bold px-1.5 py-0.5 rounded-bl"
          style={{ background: 'rgba(242,202,80,0.25)', color: '#f2ca50', borderLeft: '1px solid #f2ca5044', borderBottom: '1px solid #f2ca5044' }}
        >
          ★
        </div>
      )}

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
      <div className="flex justify-center py-2 text-on-surface">
        <PlayerSilhouette />
      </div>

      {/* Name / stats */}
      <div className="px-3 pb-3 pt-1.5 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-on-surface text-xs font-bold uppercase truncate leading-tight">
          {player.familyName}
        </p>
        {player.givenName && player.givenName !== 'not applicable' && (
          <p className="text-on-surface-muted text-[10px] truncate leading-tight">{player.givenName}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-on-surface-muted text-[9px] font-bold">{player.teamCode}</span>
          {player.wonTournament && (
            <>
              <span className="text-outline-dim text-[9px]">·</span>
              <span className="text-[9px]" style={{ color: '#f2ca50' }}>🏆</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
