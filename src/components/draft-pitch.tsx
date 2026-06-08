'use client'

import { useState, useEffect, useCallback } from 'react'
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
  showRatingsDuringSelection: boolean
  onConfirm: (player: WCPlayer) => void
}

interface RandomTeamContext {
  tournamentId: string
  tournamentYear: number
  teamId: string
  teamName: string
  teamCode: string
}

interface RandomTeamResponse {
  players: WCPlayer[]
  total: number
  context: RandomTeamContext | null
}

function PlayerPanel({ slot, filledSlots, showRatingsDuringSelection, onConfirm }: PlayerPanelProps) {
  const [players, setPlayers]       = useState<WCPlayer[]>([])
  const [total, setTotal]           = useState(0)
  const [context, setContext]       = useState<RandomTeamContext | null>(null)
  const [loading, setLoading]       = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchRandomTeam = useCallback(
    async (pos: string) => {
      setLoading(true)
      setSelectedId(null)
      try {
        const res = await fetch(`/api/players?mode=randomTeam&position=${pos}`)
        const data = (await res.json()) as RandomTeamResponse
        setPlayers(data.players)
        setTotal(data.total)
        setContext(data.context)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRandomTeam(slot.position)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [slot.id, slot.position, fetchRandomTeam])

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

      {/* Random squad context */}
      <div className="shrink-0 rounded-lg border border-outline-dim bg-surface-container/60 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-muted">
              Random World Cup Squad
            </p>
            <p className="mt-1 font-display text-base font-bold uppercase text-on-surface">
              {context ? `${context.tournamentYear} ${context.teamName}` : 'Drawing squad...'}
            </p>
            <p className="text-xs text-on-surface-muted">
              {total} {slot.position} option{total === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {/* Player rows */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <PlayerLoading />
        ) : players.length === 0 ? (
          <p className="text-center text-on-surface-muted text-sm py-8">No players found</p>
        ) : (
          <div className="flex flex-col gap-1" role="listbox" aria-label="Available players">
            {players.map((player) => {
              const isChosen = selectedId === player.playerId
              const isAlreadyPicked = pickedPlayerIds.has(player.playerId)
              const posColor = POSITION_COLOR[player.position]
              const AWARD_ICON: Record<string, string> = {
                'Golden Ball': '⭐', 'Golden Boot': '👟',
                'Golden Glove': '🧤', 'Best Young Player': '🌟',
              }
              return (
                <button
                  key={player.playerId}
                  role="option"
                  aria-selected={isChosen}
                  aria-disabled={isAlreadyPicked}
                  disabled={isAlreadyPicked}
                  onClick={() => setSelectedId(player.playerId)}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-left',
                    isAlreadyPicked
                      ? 'border-outline-dim bg-surface-high/45 opacity-45 cursor-not-allowed'
                      : isChosen
                      ? 'border-gold bg-gold/10'
                      : 'border-outline-dim hover:border-gold/40 hover:bg-surface-container/60',
                  ].join(' ')}
                  style={isChosen ? { boxShadow: '0 0 0 1px #f2ca50' } : undefined}
                >
                  <span className="font-display font-bold text-gold text-sm w-7 text-right shrink-0">
                    {showRatingsDuringSelection ? player.rating : '?'}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase w-7 shrink-0 text-center"
                    style={{ color: posColor }}
                  >
                    {player.position}
                  </span>
                  <span className="font-body text-on-surface text-sm flex-1 truncate">
                    {player.fullName}
                  </span>
                  {isAlreadyPicked && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-muted shrink-0">
                      Picked
                    </span>
                  )}
                  {player.awards.length > 0 && (
                    <span className="flex gap-0.5 shrink-0">
                      {player.awards.map((award) => (
                        <span key={award} className="text-xs" title={award}>
                          {AWARD_ICON[award] ?? '★'}
                        </span>
                      ))}
                    </span>
                  )}
                  {player.wonTournament && player.awards.length === 0 && (
                    <span className="text-xs shrink-0" title="World Cup Winner">🏆</span>
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
  showRatingsDuringSelection,
}: {
  formation: Formation
  showRatingsDuringSelection: boolean
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
                showRatingsDuringSelection={showRatingsDuringSelection}
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
