'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FORMATIONS } from '@/lib/formations'
import FormationDiagram from './formation-diagram'

export default function FormationSelect() {
  const router = useRouter()
  const [selected, setSelected] = useState<string>('4-3-3')
  const [showRatings, setShowRatings] = useState(false)

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 gap-12 overflow-hidden">
      {/* Atmospheric background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(212,175,55,0.07) 0%, transparent 70%), radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Hero */}
      <header className="text-center space-y-3 relative z-10">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-gold tracking-tight uppercase">
          World Cup Legends Draft
        </h1>
        <p className="text-on-surface-muted font-body text-base md:text-lg">
          Select your formation to begin
        </p>
      </header>

      {/* Formation cards */}
      <div
        className="grid gap-4 w-full max-w-4xl relative z-10"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
        role="radiogroup"
        aria-label="Formation selection"
      >
        {FORMATIONS.map((f) => {
          const isActive = selected === f.id
          return (
            <button
              key={f.id}
              role="radio"
              aria-checked={isActive}
              aria-label={`${f.label} formation`}
              onClick={() => setSelected(f.id)}
              className={[
                'flex flex-col items-center gap-3 p-4 rounded-xl border cursor-pointer',
                'bg-surface-container backdrop-blur-sm transition-all duration-200',
                isActive ? 'border-gold card-active' : 'border-outline-dim card-glow',
              ].join(' ')}
            >
              <span
                className={`font-display text-2xl font-bold transition-colors ${
                  isActive ? 'text-gold' : 'text-on-surface'
                }`}
              >
                {f.label}
              </span>
              <div className="w-full">
                <FormationDiagram formation={f} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Draft settings */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-4 rounded-lg border border-outline-dim bg-surface-container/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-sm font-bold uppercase tracking-wider text-on-surface">
            Show ratings while selecting
          </p>
          <p className="mt-1 text-xs text-on-surface-muted">
            Reveal player ratings during the draft, or keep picks blind until the squad is complete.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showRatings}
          aria-label="Show ratings while selecting"
          onClick={() => setShowRatings((current) => !current)}
          className={[
            'relative h-7 w-12 shrink-0 overflow-hidden rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold',
            showRatings ? 'border-gold bg-gold/30' : 'border-outline-dim bg-surface-high',
          ].join(' ')}
        >
          <span
            className={[
              'absolute inset-y-0 left-2 flex items-center text-[9px] font-bold uppercase transition-opacity duration-200',
              showRatings ? 'opacity-100 text-gold' : 'opacity-0',
            ].join(' ')}
            aria-hidden
          >
            On
          </span>
          <span
            className={[
              'absolute left-1 top-1 h-5 w-5 rounded-full bg-on-surface shadow transition-transform duration-200',
              showRatings ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      {/* CTAs */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => router.push(`/draft?formation=${selected}&ratings=${showRatings ? 'show' : 'hide'}`)}
          className="px-12 py-4 bg-gold text-[#3c2f00] font-body font-bold text-sm uppercase tracking-widest rounded hover:bg-gold-bright transition-all duration-200 shadow-lg"
          style={{ boxShadow: '0 4px 24px rgba(242,202,80,0.25)' }}
        >
          Build My Squad
        </button>
        <Link
          href="/players"
          className="px-8 py-4 border border-outline-dim text-on-surface-muted font-body font-bold text-sm uppercase tracking-widest rounded hover:border-gold/50 hover:text-on-surface transition-all duration-200"
        >
          Player Database
        </Link>
      </div>
    </div>
  )
}
