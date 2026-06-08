import { getDb } from './db'
import type { Position } from './formations'

const DB_TO_APP: Record<string, Position> = {
  GK: 'GK', DF: 'DF', MF: 'MD', FW: 'FWD',
}

export const APP_TO_DB: Record<Position, string> = {
  GK: 'GK', DF: 'DF', MD: 'MF', FWD: 'FW',
}

// Only the four top-tier individual WC awards count toward rating
const RATING_AWARD_IDS = `('A-1','A-4','A-7','A-8')`
const NOTABLE_AWARD_IDS = new Set(['A-1', 'A-4', 'A-7', 'A-8'])
const AWARD_LABEL: Record<string, string> = {
  'A-1': 'Golden Ball',
  'A-2': 'Silver Ball',
  'A-3': 'Bronze Ball',
  'A-4': 'Golden Boot',
  'A-5': 'Silver Boot',
  'A-6': 'Bronze Boot',
  'A-7': 'Golden Glove',
  'A-8': 'Best Young Player',
}

export interface WCPlayer {
  playerId: string
  familyName: string
  givenName: string
  fullName: string
  position: Position
  dbPositionCode: string
  teamName: string
  teamCode: string
  tournamentId?: string
  tournamentYear?: number
  shirtNumber?: number
  goals: number
  appearances: number
  careerTournaments: number
  wonTournament: boolean
  awardsCount: number
  awards: string[]
  rating: number
}

export interface TournamentRow {
  tournament_id: string
  year: number
  host_country: string
  winner: string
}

export interface TeamRow {
  team_id: string
  team_name: string
  team_code: string
}

function formatName(family: string, given: string): string {
  if (!given || given === 'not applicable') return family
  return `${given} ${family}`
}

function computeBaseRating({
  starterAppearances,
  substituteAppearances,
  careerTournaments,
  confederationScore,
  teamStrength,
}: {
  starterAppearances: number
  substituteAppearances: number
  careerTournaments: number
  confederationScore: number
  teamStrength: number
}): number {
  // Starters weighted more than subs; cap equivalent to ~7 full starts
  const weightedApps = starterAppearances * 1.5 + substituteAppearances * 0.5
  const tournamentPresence = Math.min(weightedApps, 10.5) * 0.9
  const careerPresence = Math.min(Math.max(careerTournaments - 1, 0), 4) * 1.25

  // Reduced from 0.65/0.75 — historical prestige is a small nudge, not a floor-raiser
  const confederation = confederationScore * 0.35
  const team = teamStrength * 0.35

  return 62 + tournamentPresence + careerPresence + confederation + team
}

function computeRating({
  goals,
  penaltyGoals,
  knockoutGoals,
  knockoutPenaltyGoals,
  shootoutConverted,
  shootoutWinConverted,
  starterAppearances,
  substituteAppearances,
  dbPosition,
  teamPosition,
  totalTeamMatches,
  cleanSheets,
  lowConcessionMatches,
  knockoutCleanSheets,
  upsetWins,
  knockoutUpsetWins,
  careerTournaments,
  confederationScore,
  teamStrength,
  awardsCount,
}: {
  goals: number
  penaltyGoals: number
  knockoutGoals: number
  knockoutPenaltyGoals: number
  shootoutConverted: number
  shootoutWinConverted: number
  starterAppearances: number
  substituteAppearances: number
  dbPosition: string
  teamPosition: number   // 1=champion, 8=QF, 16=R16, 99=group stage/unknown
  totalTeamMatches: number
  cleanSheets: number
  lowConcessionMatches: number
  knockoutCleanSheets: number
  upsetWins: number
  knockoutUpsetWins: number
  careerTournaments: number
  confederationScore: number
  teamStrength: number
  awardsCount: number
}): number {
  let r = computeBaseRating({
    starterAppearances,
    substituteAppearances,
    careerTournaments,
    confederationScore,
    teamStrength,
  })

  const goalPts: Record<string, number> = { GK: 7, DF: 5, MF: 4, FW: 3.25 }
  const goalPressure =
    goals * (goalPts[dbPosition] ?? 3.25) +
    penaltyGoals * 0.4 +
    knockoutGoals * 1 +
    knockoutPenaltyGoals * 0.75
  r += Math.min(goalPressure, 21)

  // Scale team finish bonus by how much this player actually participated.
  // A bench warmer on a champion team gets a fraction of the bonus vs. a starter who played every game.
  const appearances = starterAppearances + substituteAppearances
  const participationRatio = totalTeamMatches > 0 ? Math.min(1, appearances / totalTeamMatches) : 0
  const participationScale = Math.min(1.0, 0.4 + participationRatio * 0.6)

  if (teamPosition === 1)       r += 9 * participationScale
  else if (teamPosition === 2)  r += 6 * participationScale
  else if (teamPosition <= 4)   r += 4 * participationScale
  else if (teamPosition <= 8)   r += 2 * participationScale
  else if (teamPosition <= 16)  r += 0.5 * participationScale

  const shootoutPressure = shootoutConverted * 0.75 + shootoutWinConverted * 1.25
  r += Math.min(shootoutPressure, 3)

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

// ─── Shared CTEs ─────────────────────────────────────────────────────────────

// Prestige tier per team based on all-time men's WC wins
const PRESTIGE_CTE = `
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
  )
`

// team_position: uses tournament_standings for exact 1-4 finish,
// qualified_teams.performance as authoritative fallback for everyone else.
// All five performance values are handled explicitly.
const TEAM_POSITION_EXPR = `
  COALESCE(
    ts_pos.position,
    CASE qt.performance
      WHEN 'final'             THEN 2   -- finalist at minimum if not in standings
      WHEN 'third-place match' THEN 4   -- 4th at minimum if not in standings
      WHEN 'quarter-finals'    THEN 8
      WHEN 'round of 16'       THEN 16
      ELSE                          99  -- group stage
    END,
    99
  )
`

const MODERN_MENS_CTE = `
  mens_wc AS (
    SELECT tournament_id
    FROM tournaments
    WHERE year % 4 = 2 AND year >= 1998
  )
`

const RATING_CTES = `
  ${MODERN_MENS_CTE},
  ${PRESTIGE_CTE},
  confederation_strength AS (
    SELECT t.confederation_id,
      AVG(
        CASE
          WHEN ts.position = 1 THEN 6.0
          WHEN ts.position = 2 THEN 4.5
          WHEN ts.position <= 4 THEN 3.5
          WHEN ts.position <= 8 THEN 2.25
          WHEN ts.position <= 16 THEN 1.0
          ELSE 0.25
        END
      ) AS confederation_score
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
      ON ta.tournament_id = pa.tournament_id
     AND ta.match_id = pa.match_id
     AND ta.team_id = pa.team_id
    JOIN matches m ON m.match_id = pa.match_id
    JOIN mens_wc mwc ON mwc.tournament_id = pa.tournament_id
    GROUP BY pa.player_id, pa.tournament_id, pa.team_id
  ),
  shootout_stats AS (
    SELECT pk.player_id, pk.tournament_id, pk.team_id,
      SUM(CASE WHEN pk.converted = 1 THEN 1 ELSE 0 END) AS shootout_converted,
      SUM(
        CASE
          WHEN pk.converted = 1
           AND ta.penalty_shootout = 1
           AND COALESCE(ta.penalties_for, 0) > COALESCE(ta.penalties_against, 0)
          THEN 1 ELSE 0
        END
      ) AS shootout_win_converted
    FROM penalty_kicks pk
    JOIN team_appearances ta
      ON ta.tournament_id = pk.tournament_id
     AND ta.match_id = pk.match_id
     AND ta.team_id = pk.team_id
    JOIN mens_wc mwc ON mwc.tournament_id = pk.tournament_id
    GROUP BY pk.player_id, pk.tournament_id, pk.team_id
  ),
  agg_awards AS (
    SELECT aw.player_id, aw.tournament_id,
      COUNT(*) AS award_count,
      GROUP_CONCAT(aw.award_id, ',') AS award_ids
    FROM award_winners aw
    JOIN mens_wc mwc ON mwc.tournament_id = aw.tournament_id
    WHERE aw.award_id IN ${RATING_AWARD_IDS}
    GROUP BY aw.player_id, aw.tournament_id
  ),
  player_upsets AS (
    SELECT pa.player_id, pa.tournament_id, pa.team_id,
      SUM(
        CASE
          WHEN ta.win = 1 AND (opp_strength.strength - own_strength.strength) >= 3
          THEN 1 ELSE 0
        END
      ) AS upset_wins,
      SUM(
        CASE
          WHEN ta.win = 1
           AND m.knockout_stage = 1
           AND (opp_strength.strength - own_strength.strength) >= 3
          THEN 1 ELSE 0
        END
      ) AS knockout_upset_wins
    FROM player_appearances pa
    JOIN team_appearances ta
      ON ta.tournament_id = pa.tournament_id
     AND ta.match_id = pa.match_id
     AND ta.team_id = pa.team_id
    JOIN matches m ON m.match_id = pa.match_id
    JOIN team_strength own_strength ON own_strength.team_id = ta.team_id
    JOIN team_strength opp_strength ON opp_strength.team_id = ta.opponent_id
    JOIN mens_wc mwc ON mwc.tournament_id = pa.tournament_id
    GROUP BY pa.player_id, pa.tournament_id, pa.team_id
  )
`

// ─── Tournaments ──────────────────────────────────────────────────────────────

export function getTournaments(): TournamentRow[] {
  return getDb()
    .prepare(
      `SELECT tournament_id, year, host_country, winner
       FROM tournaments
       WHERE year % 4 = 2 AND year >= 1998
       ORDER BY year DESC`
    )
    .all() as TournamentRow[]
}

// ─── Teams for a tournament ───────────────────────────────────────────────────

export function getTeamsByTournament(tournamentId: string): TeamRow[] {
  return getDb()
    .prepare(
      `SELECT DISTINCT t.team_id, t.team_name, t.team_code
       FROM squads s
       JOIN teams t ON t.team_id = s.team_id
       WHERE s.tournament_id = ?
       ORDER BY t.team_name`
    )
    .all(tournamentId) as TeamRow[]
}

// ─── Players for a tournament (browser page) ─────────────────────────────────

interface TournamentPlayerOpts {
  tournamentId: string
  teamId?: string
  dbPositionCode?: string
  search?: string
}

interface RawRatingRow {
  player_id: string
  tournament_id: string
  family_name: string
  given_name: string
  count_tournaments: number
  shirt_number: number | null
  position_code: string
  team_id: string
  team_name: string
  team_code: string
  tournament_year: number
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
  awards_won: number
  award_names: string | null
  confederation_score: number
  team_strength: number
}

export interface RandomTeamContext {
  tournamentId: string
  tournamentYear: number
  teamId: string
  teamName: string
  teamCode: string
}

function ratingSelect(): string {
  return `
    WITH ${RATING_CTES}
    SELECT
      s.player_id,
      s.tournament_id,
      p.family_name,
      p.given_name,
      p.count_tournaments,
      s.shirt_number,
      s.position_code,
      s.team_id,
      t.team_name,
      t.team_code,
      tourn.year AS tournament_year,
      COALESCE(ag.goals, 0) AS goals,
      COALESCE(ag.penalty_goals, 0) AS penalty_goals,
      COALESCE(ag.knockout_goals, 0) AS knockout_goals,
      COALESCE(ag.knockout_penalty_goals, 0) AS knockout_penalty_goals,
      COALESCE(ss.shootout_converted, 0) AS shootout_converted,
      COALESCE(ss.shootout_win_converted, 0) AS shootout_win_converted,
      COALESCE(aa.appearances, 0) AS appearances,
      COALESCE(aa.starter_appearances, 0) AS starter_appearances,
      COALESCE(aa.substitute_appearances, 0) AS substitute_appearances,
      ${TEAM_POSITION_EXPR} AS team_position,
      COALESCE(tm.total_matches, 0) AS total_team_matches,
      COALESCE(ds.clean_sheets, 0) AS clean_sheets,
      COALESCE(ds.low_concession_matches, 0) AS low_concession_matches,
      COALESCE(ds.knockout_clean_sheets, 0) AS knockout_clean_sheets,
      COALESCE(pu.upset_wins, 0) AS upset_wins,
      COALESCE(pu.knockout_upset_wins, 0) AS knockout_upset_wins,
      COALESCE(aw.award_count, 0) AS awards_won,
      COALESCE(aw.award_ids, '') AS award_names,
      COALESCE(cs.confederation_score, 0.75) AS confederation_score,
      COALESCE(ts.strength, 0.75) AS team_strength
    FROM squads s
    JOIN mens_wc mwc ON mwc.tournament_id = s.tournament_id
    JOIN players p ON p.player_id = s.player_id
    JOIN teams t ON t.team_id = s.team_id
    JOIN tournaments tourn ON tourn.tournament_id = s.tournament_id
    LEFT JOIN agg_goals ag ON ag.player_id = s.player_id AND ag.tournament_id = s.tournament_id
    LEFT JOIN agg_apps aa ON aa.player_id = s.player_id AND aa.tournament_id = s.tournament_id
    LEFT JOIN defense_stats ds
      ON ds.player_id = s.player_id
     AND ds.tournament_id = s.tournament_id
     AND ds.team_id = s.team_id
    LEFT JOIN shootout_stats ss
      ON ss.player_id = s.player_id
     AND ss.tournament_id = s.tournament_id
     AND ss.team_id = s.team_id
    LEFT JOIN agg_awards aw ON aw.player_id = s.player_id AND aw.tournament_id = s.tournament_id
    LEFT JOIN tournament_standings ts_pos
      ON ts_pos.tournament_id = s.tournament_id AND ts_pos.team_id = s.team_id
    LEFT JOIN qualified_teams qt
      ON qt.tournament_id = s.tournament_id AND qt.team_id = s.team_id
    LEFT JOIN team_matches tm ON tm.team_id = s.team_id AND tm.tournament_id = s.tournament_id
    LEFT JOIN player_upsets pu
      ON pu.player_id = s.player_id
     AND pu.tournament_id = s.tournament_id
     AND pu.team_id = s.team_id
    LEFT JOIN team_strength ts ON ts.team_id = s.team_id
    LEFT JOIN confederation_strength cs ON cs.confederation_id = t.confederation_id
    WHERE p.female = 0
  `
}

function toWCPlayer(r: RawRatingRow): WCPlayer {
  const awardIds = r.award_names ? r.award_names.split(',') : []
  const awards = awardIds
    .filter((id) => NOTABLE_AWARD_IDS.has(id))
    .map((id) => AWARD_LABEL[id] ?? id)

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
    awardsCount: r.awards_won,
  })

  return {
    playerId: r.player_id,
    familyName: r.family_name,
    givenName: r.given_name,
    fullName: formatName(r.family_name, r.given_name),
    position: DB_TO_APP[r.position_code] ?? 'FWD',
    dbPositionCode: r.position_code,
    teamName: r.team_name,
    teamCode: r.team_code,
    tournamentId: r.tournament_id,
    tournamentYear: r.tournament_year,
    shirtNumber: r.shirt_number ?? undefined,
    goals: r.goals,
    appearances: r.appearances,
    careerTournaments: r.count_tournaments,
    wonTournament: r.team_position === 1,
    awardsCount: r.awards_won,
    awards,
    rating,
  }
}

export function getPlayersByTournament(opts: TournamentPlayerOpts): WCPlayer[] {
  const { tournamentId, teamId, dbPositionCode, search } = opts
  const db = getDb()

  let sql = `${ratingSelect()} AND s.tournament_id = @tid`
  const params: Record<string, string | number> = { tid: tournamentId }

  if (teamId) {
    sql += ' AND s.team_id = @teamId'
    params.teamId = teamId
  }
  if (dbPositionCode) {
    sql += ' AND s.position_code = @posCode'
    params.posCode = dbPositionCode
  }
  if (search) {
    sql += ' AND (p.family_name LIKE @search OR p.given_name LIKE @search)'
    params.search = `%${search}%`
  }

  sql += ' ORDER BY t.team_name, goals DESC, appearances DESC'

  const rows = db.prepare(sql).all(params) as RawRatingRow[]

  return rows.map(toWCPlayer)
}

// ─── Draft slot search: best tournament card per player (1998–2022 men's WC) ──

interface SearchOpts {
  dbPosition: string
  search?: string
  page?: number
  pageSize?: number
}

export function searchPlayersForDraft(opts: SearchOpts): {
  players: WCPlayer[]
  total: number
} {
  const { dbPosition, search = '', page = 1, pageSize = 6 } = opts
  const db = getDb()
  const searchPct = search ? `%${search}%` : null

  // All per-tournament rows for this position within 1998-2022 men's WC scope.
  // ~1,344 rows max per position (7 WCs × 32 teams × ~6 players) — fast in-memory.
  const sql = `
    ${ratingSelect()}
      AND s.position_code = @dbPosition
      AND (@searchPct IS NULL OR p.family_name LIKE @searchPct OR p.given_name LIKE @searchPct)
  `

  const rows = db
    .prepare(sql)
    .all({ dbPosition, searchPct }) as RawRatingRow[]

  // Compute rating per row, keep each player's best tournament
  const bestByPlayer = new Map<string, { player: WCPlayer; rating: number }>()

  for (const row of rows) {
    const player = toWCPlayer(row)
    const rating = player.rating
    const existing = bestByPlayer.get(row.player_id)
    if (!existing || rating > existing.rating) {
      bestByPlayer.set(row.player_id, { player, rating })
    }
  }

  const sorted = Array.from(bestByPlayer.values()).sort(
    (a, b) => b.rating - a.rating
  )

  const total = sorted.length
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const players = paginated.map(({ player }) => player)

  return { players, total }
}

export function getRandomTeamPlayersForDraft(dbPosition: string): {
  players: WCPlayer[]
  total: number
  context: RandomTeamContext | null
} {
  const db = getDb()
  const context = db
    .prepare(
      `WITH ${MODERN_MENS_CTE}
       SELECT
         s.tournament_id AS tournamentId,
         tourn.year AS tournamentYear,
         s.team_id AS teamId,
         t.team_name AS teamName,
         t.team_code AS teamCode
       FROM squads s
       JOIN mens_wc mwc ON mwc.tournament_id = s.tournament_id
       JOIN players p ON p.player_id = s.player_id
       JOIN tournaments tourn ON tourn.tournament_id = s.tournament_id
       JOIN teams t ON t.team_id = s.team_id
       WHERE p.female = 0
         AND s.position_code = @dbPosition
       GROUP BY s.tournament_id, s.team_id
       HAVING COUNT(*) > 0
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .get({ dbPosition }) as RandomTeamContext | undefined

  if (!context) {
    return { players: [], total: 0, context: null }
  }

  const rows = db
    .prepare(
      `${ratingSelect()}
       AND s.tournament_id = @tournamentId
       AND s.team_id = @teamId
       AND s.position_code = @dbPosition
       ORDER BY goals DESC, appearances DESC`
    )
    .all({
      tournamentId: context.tournamentId,
      teamId: context.teamId,
      dbPosition,
    }) as RawRatingRow[]

  const players = rows
    .map(toWCPlayer)
    .sort((a, b) => b.rating - a.rating || b.goals - a.goals || b.appearances - a.appearances)

  return { players, total: players.length, context }
}
