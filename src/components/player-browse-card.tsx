import type { WCPlayer } from '@/lib/queries'
import type { Position } from '@/lib/formations'

const RARITY_BG: Record<string, string> = {
  legendary: 'linear-gradient(160deg, rgba(120,80,0,0.85) 0%, rgba(60,40,0,0.5) 40%, rgba(35,31,23,0.95) 100%)',
  rare:       'linear-gradient(160deg, rgba(70,70,85,0.85) 0%, rgba(45,45,60,0.5) 40%, rgba(35,31,23,0.95) 100%)',
  uncommon:   'linear-gradient(160deg, rgba(90,55,15,0.85) 0%, rgba(55,30,10,0.5) 40%, rgba(35,31,23,0.95) 100%)',
  common:     'linear-gradient(160deg, rgba(45,42,33,0.95) 0%, rgba(35,31,23,0.98) 100%)',
}

function getRarity(rating: number): string {
  if (rating >= 88) return 'legendary'
  if (rating >= 79) return 'rare'
  if (rating >= 70) return 'uncommon'
  return 'common'
}

const POSITION_COLOR: Record<Position, string> = {
  GK: '#f2ca50', DF: '#86d89d', MD: '#d0c5af', FWD: '#ffbfb8',
}

const AWARD_ICON: Record<string, string> = {
  'Golden Ball':      '⭐',
  'Golden Boot':      '👟',
  'Golden Glove':     '🧤',
  'Best Young Player':'🌟',
}

function Silhouette() {
  return (
    <svg viewBox="0 0 60 80" className="w-14 h-16 opacity-20" fill="currentColor" aria-hidden>
      <circle cx="30" cy="16" r="12" />
      <path d="M8 80c0-17 9-30 22-30s22 13 22 30" />
    </svg>
  )
}

export default function PlayerBrowseCard({ player }: { player: WCPlayer }) {
  const rarity = getRarity(player.rating)
  const posColor = POSITION_COLOR[player.position]

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden border border-outline-dim transition-all duration-200"
      style={{ background: RARITY_BG[rarity] }}
    >
      {/* Top: rating + position + award badges */}
      <div className="flex items-start justify-between px-4 pt-4 pb-0">
        <div>
          <div className="font-display font-extrabold leading-none" style={{ fontSize: '2.5rem', color: '#f2ca50' }}>
            {player.rating}
          </div>
          <span
            className="inline-block mt-1 px-2 py-px text-[10px] font-bold uppercase rounded border"
            style={{ color: posColor, borderColor: `${posColor}55` }}
          >
            {player.position}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 mt-1">
          {player.wonTournament && (
            <span className="text-xs" title="World Cup Winner">🏆</span>
          )}
          {player.awards.map((award) => (
            <span key={award} className="text-xs" title={award}>
              {AWARD_ICON[award] ?? '★'}
            </span>
          ))}
        </div>
      </div>

      {/* Silhouette */}
      <div className="flex justify-center py-3 text-on-surface">
        <Silhouette />
      </div>

      {/* Player name */}
      <div className="px-4 pb-2 text-center">
        <p className="font-display font-bold text-on-surface text-base uppercase tracking-tight leading-tight truncate">
          {player.familyName}
        </p>
        {player.givenName && player.givenName !== 'not applicable' && (
          <p className="text-on-surface-muted text-xs truncate">{player.givenName}</p>
        )}
      </div>

      {/* Stats row */}
      {/* Footer: nation + year */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="font-body font-bold text-on-surface-muted text-xs uppercase">
          {player.teamCode}
        </span>
        {player.tournamentYear && (
          <span className="text-on-surface-muted text-xs">{player.tournamentYear}</span>
        )}
      </div>
    </div>
  )
}
