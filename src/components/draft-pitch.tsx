'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  type Formation,
  type PositionSlot,
  buildSlots,
  POSITION_COLOR,
} from '@/lib/formations'
import type { WCPlayer } from '@/lib/queries'
import TeamComplete from './team-complete'

function PitchSVG() {
  const s = 'rgba(255,255,255,0.18)'
  return (
    <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="pitchGradDraft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a1a" /><stop offset="30%" stopColor="#1e5218" />
          <stop offset="70%" stopColor="#1e5218" /><stop offset="100%" stopColor="#1a4a1a" />
        </linearGradient>
      </defs>
      <rect width="100" height="150" fill="url(#pitchGradDraft)" />
      <rect x="3" y="6" width="94" height="138" fill="none" stroke={s} strokeWidth="0.6" />
      <line x1="3" y1="75" x2="97" y2="75" stroke={s} strokeWidth="0.6" />
      <circle cx="50" cy="75" r="13" fill="none" stroke={s} strokeWidth="0.6" />
      <circle cx="50" cy="75" r="0.9" fill={s} />
      <rect x="24" y="6" width="52" height="22" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="36" y="6" width="28" height="9" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="22" r="0.9" fill={s} />
      <rect x="24" y="122" width="52" height="22" fill="none" stroke={s} strokeWidth="0.5" />
      <rect x="36" y="135" width="28" height="9" fill="none" stroke={s} strokeWidth="0.5" />
      <circle cx="50" cy="128" r="0.9" fill={s} />
      <path d="M3,6 Q6,6 6,9" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M97,6 Q94,6 94,9" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M3,144 Q6,144 6,141" fill="none" stroke={s} strokeWidth="0.5" />
      <path d="M97,144 Q94,144 94,141" fill="none" stroke={s} strokeWidth="0.5" />
    </svg>
  )
}

function SlotButton({ slot, filled, isSelected, isLocked, onClick }: {
  slot: PositionSlot
  filled: WCPlayer | undefined
  isSelected: boolean
  isLocked: boolean
  onClick: () => void
}) {
  const color = POSITION_COLOR[slot.position]
  return (
    <button
      style={{ top: `${slot.topPct}%`, left: `${slot.leftPct}%`, color }}
      onClick={onClick}
      disabled={isLocked}
      aria-label={`${slot.position}${filled ? ` — ${filled.fullName}` : ', empty'}`}
      aria-pressed={isSelected}
      className={[
        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center',
        'rounded-lg border-2 transition-all duration-200 cursor-pointer px-1',
        'font-body font-bold uppercase focus-visible:outline-2 focus-visible:outline-gold',
        filled ? 'w-14 h-12' : 'w-11 h-11 rounded-full',
        isLocked ? 'opacity-45 cursor-not-allowed hover:scale-100' : '',
        isSelected
          ? 'border-gold bg-gold/20 scale-110 slot-selected'
          : filled
          ? 'border-gold/70 bg-gold/10 hover:scale-105'
          : 'border-outline bg-surface-container/80 hover:border-gold/50 hover:scale-105',
      ].join(' ')}
    >
      {filled ? (
        <>
          <span className="text-gold text-[11px] font-bold leading-none">{filled.rating}</span>
          <span className="text-[7px] font-bold leading-none mt-0.5 truncate w-full text-center" style={{ color }}>
            {filled.familyName.length > 7 ? filled.familyName.slice(0, 7) + '…' : filled.familyName}
          </span>
        </>
      ) : (
        <span className="text-[9px] font-bold">{slot.position}</span>
      )}
    </button>
  )
}

function PlayerLoading() {
  return (
    <div className="flex flex-col gap-1 py-1" aria-live="polite" aria-label="Loading players">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="player-card-loading flex items-center gap-3 px-3 py-2.5 rounded-lg border border-outline-dim bg-surface-container/70"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-5 w-8 rounded bg-gold/15 shrink-0" />
          <div className="h-4 w-7 rounded bg-surface-highest/60 shrink-0" />
          <div className="h-4 flex-1 rounded bg-surface-highest/80" />
        </div>
      ))}
    </div>
  )
}

interface PlayerPanelProps {
  slot: PositionSlot
  filledSlots: Record<string, WCPlayer>
  onConfirm: (player: WCPlayer) => void
}

interface DraftPlayersResponse {
  players: WCPlayer[]
  error?: string
}

const AWARD_ICON: Record<string, string> = {
  'Golden Ball': '⭐',
  'Silver Ball': '🥈',
  'Bronze Ball': '🥉',
  'Golden Boot': '👟',
  'Silver Boot': '🥈',
  'Bronze Boot': '🥉',
  'Golden Glove': '🧤',
  'Best Young Player': '🌟',
}

const TEAM_FLAG: Record<string, string> = {
  ALG: '🇩🇿', AGO: '🇦🇴', ARE: '🇦🇪', ARG: '🇦🇷', AUS: '🇦🇺', AUT: '🇦🇹',
  BEL: '🇧🇪', BIH: '🇧🇦', BOL: '🇧🇴', BRA: '🇧🇷', BGR: '🇧🇬', BUL: '🇧🇬',
  CAN: '🇨🇦', CHE: '🇨🇭', CHI: '🇨🇱', CHL: '🇨🇱', CHN: '🇨🇳', CIV: '🇨🇮',
  CMR: '🇨🇲', COD: '🇨🇩', COL: '🇨🇴', CRC: '🇨🇷', CRI: '🇨🇷', CRO: '🇭🇷',
  CSK: '🇨🇿',
  CUB: '🇨🇺', CZE: '🇨🇿', DDR: '🇩🇪', DEN: '🇩🇰', DEU: '🇩🇪', DNK: '🇩🇰',
  DZA: '🇩🇿', ECU: '🇪🇨', EGY: '🇪🇬', ENG: '🏴', ESP: '🇪🇸', FRA: '🇫🇷',
  FRG: '🇩🇪', GER: '🇩🇪', GHA: '🇬🇭', GRC: '🇬🇷', GRE: '🇬🇷', HND: '🇭🇳',
  HON: '🇭🇳', HRV: '🇭🇷', HTI: '🇭🇹', HUN: '🇭🇺', IDN: '🇮🇩', IRL: '🇮🇪',
  IRN: '🇮🇷', IRQ: '🇮🇶', ISL: '🇮🇸', ISR: '🇮🇱', ITA: '🇮🇹', JAM: '🇯🇲',
  JPN: '🇯🇵', KOR: '🇰🇷', KSA: '🇸🇦', KUW: '🇰🇼', KWT: '🇰🇼', MAR: '🇲🇦',
  MEX: '🇲🇽', NED: '🇳🇱', NGA: '🇳🇬', NLD: '🇳🇱',
  NIR: '🇬🇧', NOR: '🇳🇴', NZL: '🇳🇿', PAN: '🇵🇦', PAR: '🇵🇾', PER: '🇵🇪',
  POL: '🇵🇱', POR: '🇵🇹', PRK: '🇰🇵', PRT: '🇵🇹', PRY: '🇵🇾', QAT: '🇶🇦',
  ROU: '🇷🇴', RSA: '🇿🇦', RUS: '🇷🇺', SAU: '🇸🇦', SCG: '🇷🇸', SCO: '🏴',
  SEN: '🇸🇳', SLV: '🇸🇻', SRB: '🇷🇸', SUI: '🇨🇭', SUN: '🇷🇺', SVK: '🇸🇰',
  SVN: '🇸🇮', SWE: '🇸🇪', TCH: '🇨🇿', TGO: '🇹🇬', TOG: '🇹🇬', TRI: '🇹🇹',
  TTO: '🇹🇹', TUN: '🇹🇳', TUR: '🇹🇷', UAE: '🇦🇪', UKR: '🇺🇦', URS: '🇷🇺',
  URU: '🇺🇾', URY: '🇺🇾', USA: '🇺🇸', WAL: '🏴', YUG: '🇷🇸', ZAF: '🇿🇦',
}

const TEAM_FLAG_IMAGE: Record<string, string> = {
  ENG: '/flags/gb-eng.svg',
  WAL: '/flags/gb-wls.svg',
}

function getFlag(teamCode: string, teamName: string): string {
  const normalizedName = teamName.toLowerCase()
  if (normalizedName.includes('west germany') || normalizedName.includes('germany')) return '🇩🇪'
  if (normalizedName.includes('netherlands')) return '🇳🇱'
  if (normalizedName.includes('uruguay')) return '🇺🇾'
  return TEAM_FLAG[teamCode.toUpperCase()] ?? '🏳'
}

function getFlagImage(teamCode: string, teamName: string): string | undefined {
  const normalizedName = teamName.toLowerCase()
  if (normalizedName.includes('england')) return TEAM_FLAG_IMAGE.ENG
  if (normalizedName.includes('wales')) return TEAM_FLAG_IMAGE.WAL
  return TEAM_FLAG_IMAGE[teamCode.toUpperCase()]
}

function FlagMark({ teamCode, teamName }: { teamCode: string; teamName: string }) {
  const imageSrc = getFlagImage(teamCode, teamName)
  if (imageSrc) {
    return (
      <span
        aria-label={`${teamName} flag`}
        role="img"
        className="h-4 w-6 rounded-[2px] bg-cover bg-center"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
    )
  }

  return <span className="text-lg leading-none">{getFlag(teamCode, teamName)}</span>
}

function getRatingTier(rating: number): {
  label: string
  className: string
  style?: CSSProperties
} {
  if (rating >= 92) {
    return {
      label: 'Icon',
      className: 'border-[#f7e7a4]/70 bg-[#f7e7a4]/15 text-[#fff6d6]',
      style: { boxShadow: 'inset 0 0 18px rgba(255,246,214,0.08)' },
    }
  }
  if (rating >= 87) {
    return {
      label: 'Legend',
      className: 'border-[#5d9cec]/60 bg-[#123b6d]/55 text-[#d8eaff]',
    }
  }
  return {
    label: 'Hero',
    className: 'border-[#ef5959]/60 bg-[#681d1d]/55 text-[#ffe0dd]',
  }
}

function PlayerPanel({ slot, filledSlots, onConfirm }: PlayerPanelProps) {
  const [players, setPlayers]       = useState<WCPlayer[]>([])
  const [loading, setLoading]       = useState(false)
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchDraftPlayers = useCallback(
    async (pos: string) => {
      setLoading(true)
      setSelectedId(null)
      setLoadError(null)
      try {
        const res = await fetch(`/api/players?mode=randomLegends&position=${pos}`)
        const data = (await res.json()) as DraftPlayersResponse
        if (!res.ok) {
          setPlayers([])
          setLoadError(data.error ?? 'Player pool unavailable')
          return
        }
        setPlayers(data.players)
        setLoadError(data.error ?? null)
      } catch {
        setPlayers([])
        setLoadError('Player pool unavailable')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchDraftPlayers(slot.position)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [slot.id, slot.position, fetchDraftPlayers])

  const pickedPlayerIds = new Set(
    Object.entries(filledSlots)
      .filter(([slotId]) => slotId !== slot.id)
      .map(([, player]) => player.playerId),
  )
  const selectedPlayer = players.find((p) => p.playerId === selectedId && !pickedPlayerIds.has(p.playerId))
  const color = POSITION_COLOR[slot.position]

  return (
    <>
      {/* Panel header */}
      <div className="flex items-center gap-3 shrink-0">
        <h2 className="font-display text-lg font-bold text-on-surface uppercase">Select a Player</h2>
        <span className="px-2 py-0.5 rounded text-xs font-bold border"
          style={{ color, borderColor: `${color}55` }}>
          {slot.position}
        </span>
      </div>

      {/* Player rows */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <PlayerLoading />
        ) : loadError ? (
          <p className="text-center text-on-surface-muted text-sm py-8">{loadError}</p>
        ) : players.length === 0 ? (
          <p className="text-center text-on-surface-muted text-sm py-8">No players found</p>
        ) : (
          <div className="flex flex-col gap-1" role="listbox" aria-label="Available players">
            {players.map((player) => {
              const isChosen = selectedId === player.playerId
              const isAlreadyPicked = pickedPlayerIds.has(player.playerId)
              const tier = getRatingTier(player.rating)
              return (
                <button
                  key={player.playerId}
                  role="option"
                  aria-selected={isChosen}
                  aria-disabled={isAlreadyPicked}
                  disabled={isAlreadyPicked}
                  onClick={() => setSelectedId(player.playerId)}
                  className={[
                    'grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_3.25rem_auto] items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-left',
                    tier.className,
                    isAlreadyPicked
                      ? 'opacity-45 cursor-not-allowed'
                      : isChosen
                      ? 'border-gold'
                      : 'hover:border-gold/50',
                  ].join(' ')}
                  style={isChosen ? { ...tier.style, boxShadow: '0 0 0 1px #f2ca50' } : tier.style}
                >
                  <span className="flex items-center" title={player.teamName}>
                    <FlagMark teamCode={player.teamCode} teamName={player.teamName} />
                  </span>
                  <span className="font-display font-bold text-sm text-right">
                    {player.rating}
                  </span>
                  <span className="font-body text-sm truncate" title={`${player.fullName} · ${tier.label}`}>
                    {player.fullName}
                  </span>
                  <span className="text-xs text-right font-bold tabular-nums">
                    {player.tournamentYear ?? 'WC'}
                  </span>
                  <span className="flex justify-end gap-0.5 min-w-5">
                    {player.wonTournament && (
                      <span className="text-xs" title="World Cup Winner">🏆</span>
                    )}
                    {player.awards.map((award) => (
                      <span key={award} className="text-xs" title={award}>
                        {AWARD_ICON[award] ?? '★'}
                      </span>
                    ))}
                  </span>
                  {isAlreadyPicked && (
                    <span className="col-span-5 text-[10px] font-bold uppercase tracking-wider text-on-surface-muted">
                      Picked
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm */}
      <button
        onClick={() => selectedPlayer && onConfirm(selectedPlayer)}
        disabled={!selectedPlayer}
        className={[
          'w-full py-3 rounded font-body font-bold text-sm uppercase tracking-widest transition-all duration-200 shrink-0',
          selectedPlayer
            ? 'bg-gold text-[#3c2f00] hover:bg-gold-bright cursor-pointer'
            : 'bg-surface-high text-on-surface-muted cursor-not-allowed opacity-60',
        ].join(' ')}
      >
        Confirm Pick
      </button>
    </>
  )
}

export default function DraftPitch({
  formation,
}: {
  formation: Formation
}) {
  const slots = buildSlots(formation)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [filledSlots, setFilledSlots]        = useState<Record<string, WCPlayer>>({})
  const [showComplete, setShowComplete]      = useState(false)

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null
  const filledCount  = Object.keys(filledSlots).length

  function handleConfirmPick(player: WCPlayer) {
    if (!selectedSlotId) return
    const isDuplicatePick = Object.entries(filledSlots).some(
      ([slotId, pickedPlayer]) => slotId !== selectedSlotId && pickedPlayer.playerId === player.playerId,
    )
    if (isDuplicatePick) return

    const next = { ...filledSlots, [selectedSlotId]: player }
    setFilledSlots(next)
    setSelectedSlotId(null)
    if (Object.keys(next).length === slots.length) {
      setTimeout(() => setShowComplete(true), 350)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-outline-dim bg-surface-container shrink-0">
        <Link href="/formations"
          className="font-display text-base font-bold text-on-surface uppercase tracking-tight hover:text-gold transition-colors">
          ← WC Legends Draft
        </Link>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full border border-gold/40 bg-gold/10 text-gold text-sm font-bold">
            {formation.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!showComplete && (
            <span className="text-on-surface-muted text-xs font-body hidden sm:block">
              {filledCount}/{slots.length}
            </span>
          )}
        </div>
      </div>

      {showComplete ? (
        <TeamComplete
          formation={formation}
          filledSlots={filledSlots}
          slots={slots}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Pitch */}
          <div className="flex-1 flex items-start justify-center">
            <div className="relative w-full rounded-xl overflow-hidden shadow-2xl"
              style={{ maxWidth: '380px', aspectRatio: '2/3' }}>
              <PitchSVG />
              {slots.map((slot) => (
                <SlotButton
                  key={slot.id}
                  slot={slot}
                  filled={filledSlots[slot.id]}
                  isSelected={selectedSlotId === slot.id}
                  isLocked={selectedSlotId !== null && selectedSlotId !== slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                />
              ))}
            </div>
          </div>

          {/* Player panel */}
          <aside className="lg:w-[360px] flex flex-col gap-3 min-h-0" aria-label="Player selection">
            {selectedSlot ? (
              <PlayerPanel
                slot={selectedSlot}
                filledSlots={filledSlots}
                onConfirm={handleConfirmPick}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-outline-dim bg-surface-container/30 p-8 text-center min-h-[200px]">
                <div className="w-14 h-14 rounded-full border-2 border-outline-dim flex items-center justify-center">
                  <span className="text-outline text-xl font-bold leading-none">+</span>
                </div>
                <p className="text-on-surface-muted font-body text-sm leading-relaxed">
                  Tap a position slot on the pitch to pick a player
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
