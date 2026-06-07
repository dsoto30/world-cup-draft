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
import PlayerCard from './player-card'
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

function SlotButton({ slot, filled, isSelected, onClick }: {
  slot: PositionSlot; filled: WCPlayer | undefined; isSelected: boolean; onClick: () => void
}) {
  const color = POSITION_COLOR[slot.position]
  return (
    <button
      style={{ top: `${slot.topPct}%`, left: `${slot.leftPct}%`, color }}
      onClick={onClick}
      aria-label={`${slot.position}${filled ? ` — ${filled.fullName}` : ', empty'}`}
      aria-pressed={isSelected}
      className={[
        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center',
        'w-11 h-11 rounded-full border-2 transition-all duration-200 cursor-pointer',
        'font-body text-[9px] font-bold uppercase focus-visible:outline-2 focus-visible:outline-gold',
        isSelected
          ? 'border-gold bg-gold/20 scale-110 slot-selected'
          : filled
          ? 'border-gold/70 bg-gold/10 hover:scale-105'
          : 'border-outline bg-surface-container/80 hover:border-gold/50 hover:scale-105',
      ].join(' ')}
    >
      {filled ? (
        <>
          <span className="text-gold text-sm font-bold leading-none">{filled.rating}</span>
          <span className="text-[8px] font-bold" style={{ color }}>{slot.position}</span>
        </>
      ) : (
        <span className="font-bold">{slot.position}</span>
      )}
    </button>
  )
}

interface PlayerPanelProps {
  slot: PositionSlot
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

function PlayerPanel({ slot, onConfirm }: PlayerPanelProps) {
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

  const selectedPlayer = players.find((p) => p.playerId === selectedId)
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
          <button
            type="button"
            onClick={() => fetchRandomTeam(slot.position)}
            disabled={loading}
            className="shrink-0 rounded border border-gold/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold transition-colors hover:border-gold hover:text-gold-bright disabled:opacity-40 cursor-pointer"
          >
            Reroll
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-gold animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <p className="text-center text-on-surface-muted text-sm py-8">No players found</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5" role="listbox" aria-label="Available players">
            {players.map((player) => {
              const isChosen = selectedId === player.playerId
              return (
                <button
                  key={player.playerId}
                  role="option"
                  aria-selected={isChosen}
                  onClick={() => setSelectedId(player.playerId)}
                  className={[
                    'rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer text-left h-full',
                    isChosen
                      ? 'border-gold scale-[1.02]'
                      : 'border-outline-dim hover:border-gold/40',
                  ].join(' ')}
                  style={isChosen ? { boxShadow: '0 0 0 2px #f2ca50, 0 4px 20px rgba(242,202,80,0.2)' } : undefined}
                >
                  <PlayerCard player={player} />
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

export default function DraftPitch({ formation }: { formation: Formation }) {
  const slots = buildSlots(formation)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [filledSlots, setFilledSlots]        = useState<Record<string, WCPlayer>>({})
  const [showComplete, setShowComplete]      = useState(false)
  const [autoComplete, setAutoComplete]      = useState(true)

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null
  const filledCount  = Object.keys(filledSlots).length

  function handleConfirmPick(player: WCPlayer) {
    if (!selectedSlotId) return
    const next = { ...filledSlots, [selectedSlotId]: player }
    setFilledSlots(next)
    setSelectedSlotId(null)
    if (Object.keys(next).length === slots.length && autoComplete) {
      setTimeout(() => setShowComplete(true), 350)
    }
  }

  function handleReset() {
    setFilledSlots({})
    setSelectedSlotId(null)
    setShowComplete(false)
    setAutoComplete(true)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-outline-dim bg-surface-container shrink-0">
        <Link href="/"
          className="font-display text-base font-bold text-on-surface uppercase tracking-tight hover:text-gold transition-colors">
          ← WC Legends Draft
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/players"
            className="text-on-surface-muted hover:text-gold text-xs font-bold uppercase tracking-widest transition-colors hidden sm:block">
            Player DB
          </Link>
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
          <button onClick={handleReset}
            className="text-on-surface-muted hover:text-on-surface text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer">
            Reset
          </button>
        </div>
      </div>

      {showComplete ? (
        <TeamComplete
          formation={formation}
          filledSlots={filledSlots}
          slots={slots}
          onEdit={() => { setShowComplete(false); setAutoComplete(false) }}
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
                  onClick={() => setSelectedSlotId(slot.id)}
                />
              ))}
            </div>
          </div>

          {/* Player panel */}
          <aside className="lg:w-[360px] flex flex-col gap-3 min-h-0" aria-label="Player selection">
            {selectedSlot ? (
              <PlayerPanel slot={selectedSlot} onConfirm={handleConfirmPick} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-outline-dim bg-surface-container/30 p-8 text-center min-h-[200px]">
                <div className="w-14 h-14 rounded-full border-2 border-outline-dim flex items-center justify-center">
                  <span className="text-outline text-xl font-bold leading-none">+</span>
                </div>
                <p className="text-on-surface-muted font-body text-sm leading-relaxed">
                  Tap a position slot on the pitch to pick a player
                </p>
                <Link href="/players"
                  className="text-gold text-xs font-bold uppercase tracking-widest hover:text-gold-bright transition-colors">
                  Browse Player Database →
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
