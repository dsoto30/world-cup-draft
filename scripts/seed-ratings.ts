import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local before the DB client is initialized (getDb() is lazy)
try {
  const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {
  // env vars assumed to be set in the shell already
}

import { getDb } from '../src/lib/db'
import { getTournaments, getPlayersByTournament } from '../src/lib/queries'

async function main() {
  const db = getDb()

  console.log('Creating player_ratings table...')
  await db.execute(`
    CREATE TABLE IF NOT EXISTS player_ratings (
      player_id     TEXT    NOT NULL,
      tournament_id TEXT    NOT NULL,
      rating        INTEGER NOT NULL,
      PRIMARY KEY (player_id, tournament_id)
    )
  `)

  const tournaments = await getTournaments()
  console.log(`Seeding ratings for ${tournaments.length} tournaments...\n`)

  let total = 0

  for (const t of tournaments) {
    const players = await getPlayersByTournament({ tournamentId: t.tournament_id })
    if (players.length === 0) continue

    await db.batch(
      players.map((p) => ({
        sql: 'INSERT OR REPLACE INTO player_ratings (player_id, tournament_id, rating) VALUES (?, ?, ?)',
        args: [p.playerId, p.tournamentId!, p.rating],
      }))
    )

    total += players.length
    console.log(`  ${t.tournament_id} (${t.year}): ${players.length} players`)
  }

  console.log(`\nDone — ${total} rows written to player_ratings`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
