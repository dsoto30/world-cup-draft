import Link from 'next/link'
import { Suspense } from 'react'
import {
  getTournaments,
  getTeamsByTournament,
  getPlayersByTournament,
} from '@/lib/queries'
import PlayerBrowser from '@/components/player-browser'
import PlayerBrowseCard from '@/components/player-browse-card'

interface Props {
  searchParams: Promise<{
    tournament?: string
    team?: string
    position?: string
    search?: string
  }>
}

export default async function PlayersPage({ searchParams }: Props) {
  const sp = await searchParams

  const tournaments = await getTournaments()
  const defaultTournament = tournaments[0]?.tournament_id ?? 'WC-2022'
  const tournamentId = sp.tournament ?? defaultTournament
  const positionCode = sp.position ?? ''
  const search       = sp.search ?? ''

  const teams = await getTeamsByTournament(tournamentId)
  const teamId = sp.team ?? teams[0]?.team_id ?? ''

  const players = await getPlayersByTournament({
    tournamentId,
    teamId:          teamId || undefined,
    dbPositionCode:  positionCode || undefined,
    search:          search || undefined,
  })

  const tournament = tournaments.find((t) => t.tournament_id === tournamentId)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-outline-dim bg-surface-container px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/"
              className="text-on-surface-muted text-xs font-bold uppercase tracking-widest hover:text-gold transition-colors">
              ← Back to Draft
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-gold uppercase mt-1">
              Player Database
            </h1>
            {tournament && (
              <p className="text-on-surface-muted font-body text-sm mt-0.5">
                {tournament.year} World Cup · {tournament.host_country} · Winner: {tournament.winner}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Filters */}
        <Suspense>
          <PlayerBrowser
            tournaments={tournaments}
            teams={teams}
            currentTournament={tournamentId}
            currentTeam={teamId}
            currentPosition={positionCode}
            currentSearch={search}
            totalResults={players.length}
          />
        </Suspense>

        {/* Player grid */}
        {players.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-on-surface-muted font-body">No players match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {players.map((player) => (
              <PlayerBrowseCard key={`${player.playerId}-${player.tournamentId}`} player={player} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
