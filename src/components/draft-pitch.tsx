'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  type Formation,
  type PositionSlot,
  buildSlots,
  POSITION_COLOR,
} from '@/lib/formations'
import { PLACEHOLDER_PLAYERS, type Player } from '@/lib/players'
import PlayerCard from './player-card'
import TeamComplete from './team-complete'

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
        <linearGradient id="pitchGradDraft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a1a" />
          <stop offset="30%" stopColor="#1e5218" />
          <stop offset="70%" stopColor="#1e5218" />
          <stop offset="100%" stopColor="#1a4a1a" />
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

interface SlotButtonProps {
  slot: PositionSlot
  filled: Player | undefined
  isSelected: boolean
  onClick: () => void
}

function SlotButton({ slot, filled, isSelected, onClick }: SlotButtonProps) {
  const color = POSITION_COLOR[slot.position]
  return (
    <button
      style={{ top: `${slot.topPct}%`, left: `${slot.leftPct}%`, color }}
      onClick={onClick}
      aria-label={`${slot.position} position${filled ? ` — ${filled.name}` : ', empty'}`}
      aria-pressed={isSelected}
      className={[
        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center',
        'w-11 h-11 rounded-full border-2 transition-all duration-200 cursor-pointer',
        'font-body text-[9px] font-bold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold',
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
          <span className="text-[8px] font-bold" style={{ color }}>
            {slot.position}
          </span>
        </>
      ) : (
        <span className="font-bold">{slot.position}</span>
      )}
    </button>
  )
}

export default function DraftPitch({ formation }: { formation: Formation }) {
  const slots = buildSlots(formation)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [filledSlots, setFilledSlots] = useState<Record<string, Player>>({})
  const [showComplete, setShowComplete] = useState(false)
  const [autoComplete, setAutoComplete] = useState(true)

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null
  const selectedCard = PLACEHOLDER_PLAYERS.find((p) => p.id === selectedCardId) ?? null
  const filledCount = Object.keys(filledSlots).length

  function handleSlotClick(slot: PositionSlot) {
    setSelectedSlotId(slot.id)
    setSelectedCardId(null)
  }

  function handleConfirmPick() {
    if (!selectedSlotId || !selectedCard) return
    const next = { ...filledSlots, [selectedSlotId]: selectedCard }
    setFilledSlots(next)
    setSelectedSlotId(null)
    setSelectedCardId(null)
    if (Object.keys(next).length === slots.length && autoComplete) {
      setTimeout(() => setShowComplete(true), 350)
    }
  }

  function handleReset() {
    setFilledSlots({})
    setSelectedSlotId(null)
    setSelectedCardId(null)
    setShowComplete(false)
    setAutoComplete(true)
  }

  function handleEditSquad() {
    setShowComplete(false)
    setAutoComplete(false)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-outline-dim bg-surface-container">
        <Link
          href="/"
          className="font-display text-base font-bold text-on-surface uppercase tracking-tight hover:text-gold transition-colors"
        >
          ← WC Legends Draft
        </Link>
        <span className="px-3 py-1 rounded-full border border-gold/40 bg-gold/10 text-gold text-sm font-bold">
          {formation.label}
        </span>
        <div className="flex items-center gap-3">
          {!showComplete && (
            <span className="text-on-surface-muted text-xs font-body hidden sm:block">
              {filledCount}/{slots.length} picked
            </span>
          )}
          <button
            onClick={handleReset}
            className="text-on-surface-muted hover:text-on-surface text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {showComplete ? (
        <TeamComplete
          formation={formation}
          filledSlots={filledSlots}
          slots={slots}
          onEdit={handleEditSquad}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Pitch */}
          <div className="flex-1 flex items-start justify-center">
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-2xl"
              style={{ maxWidth: '380px', aspectRatio: '2/3' }}
            >
              <PitchSVG />
              {slots.map((slot) => (
                <SlotButton
                  key={slot.id}
                  slot={slot}
                  filled={filledSlots[slot.id]}
                  isSelected={selectedSlotId === slot.id}
                  onClick={() => handleSlotClick(slot)}
                />
              ))}
            </div>
          </div>

          {/* Player panel */}
          <aside className="lg:w-[360px] flex flex-col gap-4" aria-label="Player selection panel">
            {selectedSlot ? (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-lg font-bold text-on-surface uppercase">
                    Select a Player
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold border"
                    style={{
                      color: POSITION_COLOR[selectedSlot.position],
                      borderColor: `${POSITION_COLOR[selectedSlot.position]}55`,
                    }}
                  >
                    {selectedSlot.position}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3" role="listbox" aria-label="Available players">
                  {PLACEHOLDER_PLAYERS.map((player) => {
                    const isChosen = selectedCardId === player.id
                    return (
                      <button
                        key={player.id}
                        role="option"
                        aria-selected={isChosen}
                        onClick={() => setSelectedCardId(player.id)}
                        className={[
                          'rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer text-left',
                          isChosen
                            ? 'border-gold scale-[1.03]'
                            : 'border-outline-dim hover:border-gold/40 hover:scale-[1.01]',
                        ].join(' ')}
                        style={
                          isChosen
                            ? { boxShadow: '0 0 0 2px #f2ca50, 0 4px 20px rgba(242,202,80,0.25)' }
                            : undefined
                        }
                      >
                        <PlayerCard player={player} />
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleConfirmPick}
                  disabled={!selectedCard}
                  className={[
                    'w-full py-3 rounded font-body font-bold text-sm uppercase tracking-widest transition-all duration-200',
                    selectedCard
                      ? 'bg-gold text-[#3c2f00] hover:bg-gold-bright cursor-pointer'
                      : 'bg-surface-high text-on-surface-muted cursor-not-allowed opacity-60',
                  ].join(' ')}
                >
                  Confirm Pick
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-outline-dim bg-surface-container/30 p-8 text-center min-h-[200px]">
                <div className="w-14 h-14 rounded-full border-2 border-outline-dim flex items-center justify-center">
                  <span className="text-outline text-xl font-bold leading-none">+</span>
                </div>
                <p className="text-on-surface-muted font-body text-sm leading-relaxed">
                  Tap a position slot on the pitch to select a player
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
