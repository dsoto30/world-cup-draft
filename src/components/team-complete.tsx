'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type Formation, type PositionSlot, type Position, POSITION_COLOR } from '@/lib/formations'
import type { WCPlayer } from '@/lib/queries'

const POSITION_ORDER: Position[] = ['FWD', 'MD', 'DF', 'GK']

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
        <linearGradient id="pitchGradComplete" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a1a" />
          <stop offset="30%" stopColor="#1e5218" />
          <stop offset="70%" stopColor="#1e5218" />
          <stop offset="100%" stopColor="#1a4a1a" />
        </linearGradient>
      </defs>
      <rect width="100" height="150" fill="url(#pitchGradComplete)" />
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
  filledSlots: Record<string, WCPlayer>
  slots: PositionSlot[]
  onEdit: () => void
}

export default function TeamComplete({ formation, filledSlots, slots, onEdit }: Props) {
  const [copied, setCopied] = useState(false)

  const ratings = slots.map((s) => filledSlots[s.id]?.rating ?? 0)
  const overall = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)

  const grouped = POSITION_ORDER.reduce<Record<Position, number[]>>(
    (acc, pos) => ({ ...acc, [pos]: [] }),
    { GK: [], DF: [], MD: [], FWD: [] }
  )
  slots.forEach((s) => {
    const r = filledSlots[s.id]?.rating
    if (r != null) grouped[s.position].push(r)
  })

  async function handleShare() {
    const payload = { f: formation.id, r: ratings }
    const encoded = encodeURIComponent(btoa(JSON.stringify(payload)))
    const url = `${window.location.origin}/view?d=${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: open a prompt with the URL
      window.prompt('Copy your squad link:', url)
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 fade-up">
      {/* Read-only pitch */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-green-secondary text-xl">✓</span>
          <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">
            Squad Complete
          </h2>
        </div>
        <div
          className="relative w-full rounded-xl overflow-hidden shadow-2xl"
          style={{ maxWidth: '360px', aspectRatio: '2/3' }}
        >
          <PitchSVG />
          {slots.map((slot) => {
            const player = filledSlots[slot.id]
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

      {/* Stats + actions */}
      <aside className="lg:w-[360px] flex flex-col gap-5">
        {/* Overall rating */}
        <div className="flex items-center gap-5 p-5 rounded-xl border border-gold/30 bg-surface-container">
          <div className="text-center">
            <div
              className="font-display font-extrabold leading-none"
              style={{ fontSize: '4rem', color: '#f2ca50' }}
            >
              {overall}
            </div>
            <div className="text-on-surface-muted font-body text-xs uppercase tracking-widest mt-1">
              Overall
            </div>
          </div>
          <div className="flex-1 border-l border-outline-dim pl-5">
            <div className="text-on-surface-muted font-body text-xs uppercase tracking-widest mb-1">
              Formation
            </div>
            <div className="font-display text-2xl font-bold text-on-surface">{formation.label}</div>
          </div>
        </div>

        {/* Player roster by position */}
        <div className="rounded-xl border border-outline-dim bg-surface-container p-4 space-y-3">
          {POSITION_ORDER.filter((pos) => grouped[pos].length > 0).map((pos) => (
            <div key={pos} className="flex items-center gap-3">
              <span
                className="w-9 text-center text-xs font-bold uppercase py-0.5 rounded border"
                style={{
                  color: POSITION_COLOR[pos],
                  borderColor: `${POSITION_COLOR[pos]}44`,
                  backgroundColor: `${POSITION_COLOR[pos]}11`,
                }}
              >
                {pos}
              </span>
              <div className="flex flex-wrap gap-1.5">
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded font-body font-bold text-sm uppercase tracking-widest transition-all duration-200 bg-gold text-[#3c2f00] hover:bg-gold-bright cursor-pointer"
            style={{ boxShadow: '0 4px 20px rgba(242,202,80,0.2)' }}
          >
            {copied ? '✓ Link Copied!' : 'Share Squad'}
          </button>
          <button
            onClick={onEdit}
            className="w-full py-3 rounded font-body font-bold text-sm uppercase tracking-widest border border-outline-dim text-on-surface-muted hover:text-on-surface hover:border-outline transition-all duration-200 cursor-pointer"
          >
            Edit Squad
          </button>
          <Link
            href="/"
            className="w-full py-3 rounded font-body font-bold text-xs uppercase tracking-widest text-center border border-outline-dim/50 text-on-surface-muted/60 hover:text-on-surface-muted transition-colors"
          >
            New Formation
          </Link>
        </div>
      </aside>
    </div>
  )
}
