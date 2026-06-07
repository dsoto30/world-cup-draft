'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FORMATIONS } from '@/lib/formations'
import FormationDiagram from './formation-diagram'

export default function FormationSelect() {
  const router = useRouter()
  const [selected, setSelected] = useState<string>('4-3-3')

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 gap-12 overflow-hidden">
      {/* Atmospheric background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
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

      {/* CTA */}
      <button
        onClick={() => router.push(`/draft?formation=${selected}`)}
        className="relative z-10 px-12 py-4 bg-gold text-[#3c2f00] font-body font-bold text-sm uppercase tracking-widest rounded hover:bg-gold-bright transition-all duration-200 shadow-lg"
        style={{ boxShadow: '0 4px 24px rgba(242,202,80,0.25)' }}
      >
        Build My Squad
      </button>
    </div>
  )
}
