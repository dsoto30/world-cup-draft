import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local before DB client is initialized (getDb() is lazy)
try {
  const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* assume env vars already set */ }

import { getDb } from '../src/lib/db'

// ─── Rating formula (self-contained copy — source of truth for seeding) ───────

function computeRating({
  goals, penaltyGoals, knockoutGoals, knockoutPenaltyGoals,
  shootoutConverted, shootoutWinConverted,
  starterAppearances, substituteAppearances,
  dbPosition, teamPosition, totalTeamMatches,
  cleanSheets, lowConcessionMatches, knockoutCleanSheets,
  upsetWins, knockoutUpsetWins,
  careerTournaments, confederationScore, teamStrength, awardsCount,
}: {
  goals: number; penaltyGoals: number; knockoutGoals: number; knockoutPenaltyGoals: number
  shootoutConverted: number; shootoutWinConverted: number
  starterAppearances: number; substituteAppearances: number
  dbPosition: string; teamPosition: number; totalTeamMatches: number
  cleanSheets: number; lowConcessionMatches: number; knockoutCleanSheets: number
  upsetWins: number; knockoutUpsetWins: number
  careerTournaments: number; confederationScore: number; teamStrength: number; awardsCount: number
}): number {
  const weightedApps = starterAppearances * 1.5 + substituteAppearances * 0.5
  const tournamentPresence = Math.min(weightedApps, 10.5) * 0.9
  const careerPresence = Math.min(Math.max(careerTournaments - 1, 0), 4) * 1.25
  const confederation = confederationScore * 0.35
  const team = teamStrength * 0.35
  let r = 62 + tournamentPresence + careerPresence + confederation + team

  const goalPts: Record<string, number> = { GK: 7, DF: 5, MF: 4, FW: 3.25 }
  const goalPressure =
    goals * (goalPts[dbPosition] ?? 3.25) +
    penaltyGoals * 0.4 +
    knockoutGoals * 1 +
    knockoutPenaltyGoals * 0.75
  r += Math.min(goalPressure, 21)

  const appearances = starterAppearances + substituteAppearances
  const participationRatio = totalTeamMatches > 0 ? Math.min(1, appearances / totalTeamMatches) : 0
  const participationScale = Math.min(1.0, 0.4 + participationRatio * 0.6)

  if (teamPosition === 1)      r += 9 * participationScale
  else if (teamPosition === 2) r += 6 * participationScale
  else if (teamPosition <= 4)  r += 4 * participationScale
  else if (teamPosition <= 8)  r += 2 * participationScale
  else if (teamPosition <= 16) r += 0.5 * participationScale

  r += Math.min(shootoutConverted * 0.75 + shootoutWinConverted * 1.25, 3)

  if (dbPosition === 'GK') {
    r += Math.min(cleanSheets * 2 + lowConcessionMatches * 0.75 + knockoutCleanSheets * 1.5, 10)
  } else if (dbPosition === 'DF') {
    r += Math.min(cleanSheets * 1.4 + lowConcessionMatches * 0.5 + knockoutCleanSheets, 7)
  } else if (dbPosition === 'MF') {
    r += Math.min(cleanSheets * 0.35 + lowConcessionMatches * 0.2, 2.5)
  }

  r += Math.min(upsetWins * 4 + knockoutUpsetWins * 2, 8)
  r += awardsCount * 8

  return Math.min(99, Math.max(62, Math.round(r)))
}

// ─── Raw query that fetches all stats needed for rating + display ──────────────

const FULL_QUERY = `
  WITH
  mens_wc AS (
    SELECT tournament_id FROM tournaments WHERE year % 4 = 2
  ),
  team_prestige AS (
    SELECT t.team_id,
      CASE
        WHEN COALESCE(w.wins, 0) >= 3 THEN 2
        WHEN COALESCE(w.wins, 0) >= 1 THEN 1
        ELSE 0
      END AS prestige
    FROM teams t
    LEFT JOIN (
      SELECT ts.team_id, COUNT(*) AS wins
      FROM tournament_standings ts
      JOIN tournaments tourn ON tourn.tournament_id = ts.tournament_id
      WHERE ts.position = 1 AND tourn.year % 4 = 2
      GROUP BY ts.team_id
    ) w ON w.team_id = t.team_id
  ),
  confederation_strength AS (
    SELECT t.confederation_id,
      AVG(CASE
        WHEN ts.position = 1  THEN 6.0
        WHEN ts.position = 2  THEN 4.5
        WHEN ts.position <= 4 THEN 3.5
        WHEN ts.position <= 8 THEN 2.25
        WHEN ts.position <= 16 THEN 1.0
        ELSE 0.25
      END) AS confederation_score
    FROM tournament_standings ts
    JOIN tournaments tourn ON tourn.tournament_id = ts.tournament_id
    JOIN teams t ON t.team_id = ts.team_id
    WHERE tourn.year % 4 = 2
    GROUP BY t.confederation_id
  ),
  team_strength AS (
    SELECT t.team_id,
      COALESCE(cs.confederation_score, 0.75) + COALESCE(tp.prestige, 0) * 2 AS strength
    FROM teams t
    LEFT JOIN confederation_strength cs ON cs.confederation_id = t.confederation_id
    LEFT JOIN team_prestige tp ON tp.team_id = t.team_id
  ),
  agg_goals AS (
    SELECT g.player_id, g.tournament_id,
      COUNT(*) AS goals,
      SUM(CASE WHEN g.penalty = 1 THEN 1 ELSE 0 END) AS penalty_goals,
      SUM(CASE WHEN m.knockout_stage = 1 THEN 1 ELSE 0 END) AS knockout_goals,
      SUM(CASE WHEN m.knockout_stage = 1 AND g.penalty = 1 THEN 1 ELSE 0 END) AS knockout_penalty_goals
    FROM goals g
    JOIN matches m ON m.match_id = g.match_id
    JOIN mens_wc mwc ON mwc.tournament_id = g.tournament_id
    WHERE g.own_goal = 0
    GROUP BY g.player_id, g.tournament_id
  ),
  agg_apps AS (
    SELECT pa.player_id, pa.tournament_id,
      COUNT(*) AS appearances,
      SUM(CASE WHEN pa.starter = 1 THEN 1 ELSE 0 END) AS starter_appearances,
      SUM(CASE WHEN pa.substitute = 1 THEN 1 ELSE 0 END) AS substitute_appearances
    FROM player_appearances pa
    JOIN mens_wc mwc ON mwc.tournament_id = pa.tournament_id
    GROUP BY pa.player_id, pa.tournament_id
  ),
  team_matches AS (
    SELECT ta.team_id, ta.tournament_id, COUNT(*) AS total_matches
    FROM team_appearances ta
    JOIN mens_wc mwc ON mwc.tournament_id = ta.tournament_id
    GROUP BY ta.team_id, ta.tournament_id
  ),
  defense_stats AS (
    SELECT pa.player_id, pa.tournament_id, pa.team_id,
      SUM(CASE WHEN ta.goals_against = 0 THEN 1 ELSE 0 END) AS clean_sheets,
      SUM(CASE WHEN ta.goals_against <= 1 THEN 1 ELSE 0 END) AS low_concession_matches,
      SUM(CASE WHEN ta.goals_against = 0 AND m.knockout_stage = 1 THEN 1 ELSE 0 END) AS knockout_clean_sheets
    FROM player_appearances pa
    JOIN team_appearances ta
      ON ta.tournament_id = pa.tournament_id AND ta.match_id = pa.match_id AND ta.team_id = pa.team_id
    JOIN matches m ON m.match_id = pa.match_id
    JOIN mens_wc mwc ON mwc.tournament_id = pa.tournament_id
    GROUP BY pa.player_id, pa.tournament_id, pa.team_id
  ),
  shootout_stats AS (
    SELECT pk.player_id, pk.tournament_id, pk.team_id,
      SUM(CASE WHEN pk.converted = 1 THEN 1 ELSE 0 END) AS shootout_converted,
      SUM(CASE WHEN pk.converted = 1 AND ta.penalty_shootout = 1
               AND COALESCE(ta.penalties_for, 0) > COALESCE(ta.penalties_against, 0)
               THEN 1 ELSE 0 END) AS shootout_win_converted
    FROM penalty_kicks pk
    JOIN team_appearances ta
      ON ta.tournament_id = pk.tournament_id AND ta.match_id = pk.match_id AND ta.team_id = pk.team_id
    JOIN mens_wc mwc ON mwc.tournament_id = pk.tournament_id
    GROUP BY pk.player_id, pk.tournament_id, pk.team_id
  ),
  agg_awards AS (
    SELECT aw.player_id, aw.tournament_id,
      SUM(CASE WHEN aw.award_id IN ('A-1','A-4','A-7','A-8') THEN 1 ELSE 0 END) AS rating_award_count,
      GROUP_CONCAT(aw.award_id, ',') AS award_ids
    FROM award_winners aw
    JOIN mens_wc mwc ON mwc.tournament_id = aw.tournament_id
    GROUP BY aw.player_id, aw.tournament_id
  ),
  player_upsets AS (
    SELECT pa.player_id, pa.tournament_id, pa.team_id,
      SUM(CASE WHEN ta.win = 1 AND (opp_strength.strength - own_strength.strength) >= 3
               THEN 1 ELSE 0 END) AS upset_wins,
      SUM(CASE WHEN ta.win = 1 AND m.knockout_stage = 1
               AND (opp_strength.strength - own_strength.strength) >= 3
               THEN 1 ELSE 0 END) AS knockout_upset_wins
    FROM player_appearances pa
    JOIN team_appearances ta
      ON ta.tournament_id = pa.tournament_id AND ta.match_id = pa.match_id AND ta.team_id = pa.team_id
    JOIN matches m ON m.match_id = pa.match_id
    JOIN team_strength own_strength ON own_strength.team_id = ta.team_id
    JOIN team_strength opp_strength ON opp_strength.team_id = ta.opponent_id
    JOIN mens_wc mwc ON mwc.tournament_id = pa.tournament_id
    GROUP BY pa.player_id, pa.tournament_id, pa.team_id
  )
  SELECT
    s.player_id,
    s.tournament_id,
    s.position_code,
    s.team_id,
    p.count_tournaments,
    COALESCE(ag.goals, 0)                    AS goals,
    COALESCE(ag.penalty_goals, 0)            AS penalty_goals,
    COALESCE(ag.knockout_goals, 0)           AS knockout_goals,
    COALESCE(ag.knockout_penalty_goals, 0)   AS knockout_penalty_goals,
    COALESCE(ss.shootout_converted, 0)       AS shootout_converted,
    COALESCE(ss.shootout_win_converted, 0)   AS shootout_win_converted,
    COALESCE(aa.appearances, 0)              AS appearances,
    COALESCE(aa.starter_appearances, 0)      AS starter_appearances,
    COALESCE(aa.substitute_appearances, 0)   AS substitute_appearances,
    COALESCE(ts_pos.position,
      CASE qt.performance
        WHEN 'final'             THEN 2
        WHEN 'third-place match' THEN 4
        WHEN 'quarter-finals'    THEN 8
        WHEN 'round of 16'       THEN 16
        ELSE                          99
      END, 99)                               AS team_position,
    COALESCE(tm.total_matches, 0)            AS total_team_matches,
    COALESCE(ds.clean_sheets, 0)             AS clean_sheets,
    COALESCE(ds.low_concession_matches, 0)   AS low_concession_matches,
    COALESCE(ds.knockout_clean_sheets, 0)    AS knockout_clean_sheets,
    COALESCE(pu.upset_wins, 0)               AS upset_wins,
    COALESCE(pu.knockout_upset_wins, 0)      AS knockout_upset_wins,
    COALESCE(aw.rating_award_count, 0)       AS rating_awards_won,
    COALESCE(aw.award_ids, '')               AS award_names,
    COALESCE(cs.confederation_score, 0.75)   AS confederation_score,
    COALESCE(ts.strength, 0.75)              AS team_strength
  FROM squads s
  JOIN mens_wc mwc ON mwc.tournament_id = s.tournament_id
  JOIN players p ON p.player_id = s.player_id
  LEFT JOIN agg_goals ag      ON ag.player_id = s.player_id AND ag.tournament_id = s.tournament_id
  LEFT JOIN agg_apps aa       ON aa.player_id = s.player_id AND aa.tournament_id = s.tournament_id
  LEFT JOIN defense_stats ds
    ON ds.player_id = s.player_id AND ds.tournament_id = s.tournament_id AND ds.team_id = s.team_id
  LEFT JOIN shootout_stats ss
    ON ss.player_id = s.player_id AND ss.tournament_id = s.tournament_id AND ss.team_id = s.team_id
  LEFT JOIN agg_awards aw     ON aw.player_id = s.player_id AND aw.tournament_id = s.tournament_id
  LEFT JOIN tournament_standings ts_pos
    ON ts_pos.tournament_id = s.tournament_id AND ts_pos.team_id = s.team_id
  LEFT JOIN qualified_teams qt
    ON qt.tournament_id = s.tournament_id AND qt.team_id = s.team_id
  LEFT JOIN team_matches tm   ON tm.team_id = s.team_id AND tm.tournament_id = s.tournament_id
  LEFT JOIN player_upsets pu
    ON pu.player_id = s.player_id AND pu.tournament_id = s.tournament_id AND pu.team_id = s.team_id
  LEFT JOIN team_strength ts  ON ts.team_id = s.team_id
  LEFT JOIN confederation_strength cs ON cs.confederation_id = (
    SELECT confederation_id FROM teams WHERE team_id = s.team_id
  )
  WHERE p.female = 0
`

interface RawRow {
  player_id: string
  tournament_id: string
  position_code: string
  team_id: string
  count_tournaments: number
  goals: number
  penalty_goals: number
  knockout_goals: number
  knockout_penalty_goals: number
  shootout_converted: number
  shootout_win_converted: number
  appearances: number
  starter_appearances: number
  substitute_appearances: number
  team_position: number
  total_team_matches: number
  clean_sheets: number
  low_concession_matches: number
  knockout_clean_sheets: number
  upset_wins: number
  knockout_upset_wins: number
  rating_awards_won: number
  award_names: string
  confederation_score: number
  team_strength: number
}

async function main() {
  const db = getDb()

  console.log('Recreating player_ratings table...')
  await db.execute('DROP TABLE IF EXISTS player_ratings')
  await db.execute(`
    CREATE TABLE player_ratings (
      player_id      TEXT    NOT NULL,
      tournament_id  TEXT    NOT NULL,
      rating         INTEGER NOT NULL,
      goals          INTEGER NOT NULL DEFAULT 0,
      appearances    INTEGER NOT NULL DEFAULT 0,
      won_tournament INTEGER NOT NULL DEFAULT 0,
      awards_count   INTEGER NOT NULL DEFAULT 0,
      award_names    TEXT    NOT NULL DEFAULT '',
      PRIMARY KEY (player_id, tournament_id)
    )
  `)

  console.log('Fetching all player stats...')
  const result = await db.execute(FULL_QUERY)
  const rows = result.rows as unknown as RawRow[]
  console.log(`  ${rows.length} player-tournament rows fetched`)

  const statements = rows.map((r) => {
    const rating = computeRating({
      goals: r.goals,
      penaltyGoals: r.penalty_goals,
      knockoutGoals: r.knockout_goals,
      knockoutPenaltyGoals: r.knockout_penalty_goals,
      shootoutConverted: r.shootout_converted,
      shootoutWinConverted: r.shootout_win_converted,
      starterAppearances: r.starter_appearances,
      substituteAppearances: r.substitute_appearances,
      dbPosition: r.position_code,
      teamPosition: r.team_position,
      totalTeamMatches: r.total_team_matches,
      cleanSheets: r.clean_sheets,
      lowConcessionMatches: r.low_concession_matches,
      knockoutCleanSheets: r.knockout_clean_sheets,
      upsetWins: r.upset_wins,
      knockoutUpsetWins: r.knockout_upset_wins,
      careerTournaments: r.count_tournaments,
      confederationScore: r.confederation_score,
      teamStrength: r.team_strength,
      awardsCount: r.rating_awards_won,
    })

    return {
      sql: `INSERT INTO player_ratings
              (player_id, tournament_id, rating, goals, appearances, won_tournament, awards_count, award_names)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.player_id,
        r.tournament_id,
        rating,
        r.goals,
        r.appearances,
        r.team_position === 1 ? 1 : 0,
        r.rating_awards_won,
        r.award_names,
      ],
    }
  })

  // Turso batch has a statement limit — insert in chunks
  const CHUNK = 500
  for (let i = 0; i < statements.length; i += CHUNK) {
    await db.batch(statements.slice(i, i + CHUNK))
    process.stdout.write(`\r  Inserted ${Math.min(i + CHUNK, statements.length)} / ${statements.length}`)
  }

  console.log(`\nDone — ${statements.length} rows written to player_ratings`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
