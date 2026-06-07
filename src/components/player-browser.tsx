'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { TournamentRow, TeamRow } from '@/lib/queries'

const POSITIONS = [
  { value: '', label: 'All Positions' },
  { value: 'GK', label: 'GK – Goalkeeper' },
  { value: 'DF', label: 'DF – Defender' },
  { value: 'MF', label: 'MF – Midfielder' },
  { value: 'FW', label: 'FW – Forward' },
]

interface Props {
  tournaments: TournamentRow[]
  teams: TeamRow[]
  currentTournament: string
  currentTeam: string
  currentPosition: string
  currentSearch: string
  totalResults: number
}

export default function PlayerBrowser({
  tournaments, teams,
  currentTournament, currentTeam, currentPosition, currentSearch,
  totalResults,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, sp]
  )

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Tournament */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-on-surface-muted text-[10px] uppercase tracking-widest font-bold">
            Tournament
          </label>
          <select
            value={currentTournament}
            onChange={(e) => push({ tournament: e.target.value, team: '' })}
            className="bg-surface-container border border-outline-dim text-on-surface text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/60 cursor-pointer"
          >
            {tournaments.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.year} · {t.host_country}
              </option>
            ))}
          </select>
        </div>

        {/* Team */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-on-surface-muted text-[10px] uppercase tracking-widest font-bold">
            Team
          </label>
          <select
            value={currentTeam}
            onChange={(e) => push({ team: e.target.value })}
            className="bg-surface-container border border-outline-dim text-on-surface text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/60 cursor-pointer"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.team_id} value={t.team_id}>
                {t.team_name} ({t.team_code})
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-on-surface-muted text-[10px] uppercase tracking-widest font-bold">
            Position
          </label>
          <select
            value={currentPosition}
            onChange={(e) => push({ position: e.target.value })}
            className="bg-surface-container border border-outline-dim text-on-surface text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gold/60 cursor-pointer"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-on-surface-muted text-[10px] uppercase tracking-widest font-bold">
            Search
          </label>
          <form onSubmit={(e) => { e.preventDefault(); push({ search: (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value }) }}>
            <input
              name="q"
              type="search"
              defaultValue={currentSearch}
              placeholder="Player name…"
              className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-dim text-on-surface text-sm placeholder:text-outline focus:outline-none focus:border-gold/60 transition-colors"
            />
          </form>
        </div>
      </div>

      {/* Result count */}
      <p className="text-on-surface-muted text-xs font-body">
        {totalResults.toLocaleString()} player{totalResults !== 1 ? 's' : ''} found
      </p>
    </div>
  )
}
