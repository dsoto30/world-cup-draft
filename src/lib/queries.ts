import { getDb } from './db'
import type { Position } from './formations'

const DB_TO_APP: Record<string, Position> = {
  GK: 'GK', DF: 'DF', MF: 'MD', FW: 'FWD',
}

export const APP_TO_DB: Record<Position, string> = {
  GK: 'GK', DF: 'DF', MD: 'MF', FWD: 'FW',
}

const RATING_AWARD_IDS = `('A-1','A-4','A-7','A-8')`
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

// libSQL Row objects aren't plain JS objects and can't cross the RSC boundary.
// This converts each row to a plain object using positional column access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlain<T>(result: { columns: string[]; rows: any[] }): T[] {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  ) as T[]
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface RawRow {
  player_id: string
  tournament_id: string
  rating: number
  total_count?: number
  family_name: string
  given_name: string
  count_tournaments: number
  shirt_number: number | null
  position_code: string
  team_name: string
  team_code: string
  tournament_year: number
  won_tournament: number
  awards_count: number
  award_names: string | null
}

// player_ratings provides the precomputed rating.
// Awards are read from the source table via this CTE.
const DISPLAY_CTES = `
  agg_awards AS (
    SELECT player_id, tournament_id,
      SUM(CASE WHEN award_id IN ${RATING_AWARD_IDS} THEN 1 ELSE 0 END) AS awards_count,
      GROUP_CONCAT(award_id, ',') AS award_ids
    FROM award_winners
    GROUP BY player_id, tournament_id
  )
`

// alias = the table/CTE alias that exposes player_id, tournament_id, rating
function displayCols(alias: string): string {
  return `
    ${alias}.player_id,
    ${alias}.tournament_id,
    ${alias}.rating,
    p.family_name,
    p.given_name,
    p.count_tournaments,
    s.shirt_number,
    s.position_code,
    t.team_name,
    t.team_code,
    tourn.year                        AS tournament_year,
    CASE WHEN ts_pos.position = 1 THEN 1 ELSE 0 END AS won_tournament,
    COALESCE(aw.awards_count, 0)      AS awards_count,
    COALESCE(aw.award_ids, '')        AS award_names
  `
}

function displayJoins(alias: string): string {
  return `
    JOIN players p         ON p.player_id          = ${alias}.player_id
    JOIN squads s          ON s.player_id           = ${alias}.player_id
                          AND s.tournament_id       = ${alias}.tournament_id
    JOIN teams t           ON t.team_id             = s.team_id
    JOIN tournaments tourn ON tourn.tournament_id   = ${alias}.tournament_id
    LEFT JOIN tournament_standings ts_pos
      ON ts_pos.tournament_id = ${alias}.tournament_id AND ts_pos.team_id = s.team_id
    LEFT JOIN agg_awards aw ON aw.player_id  = ${alias}.player_id AND aw.tournament_id  = ${alias}.tournament_id
  `
}

function toWCPlayer(r: RawRow): WCPlayer {
  const awardIds = r.award_names ? r.award_names.split(',').filter(Boolean) : []
  const awards = awardIds.map((id) => AWARD_LABEL[id] ?? id)

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
    careerTournaments: r.count_tournaments,
    wonTournament: r.won_tournament === 1,
    awardsCount: r.awards_count,
    awards,
    rating: r.rating,
  }
}

// ─── Tournaments ──────────────────────────────────────────────────────────────

export async function getTournaments(): Promise<TournamentRow[]> {
  const result = await getDb().execute(
    `SELECT tournament_id, year, host_country, winner
     FROM tournaments
     WHERE year % 4 = 2
     ORDER BY year DESC`
  )
  return toPlain<TournamentRow>(result)
}

// ─── Teams for a tournament ───────────────────────────────────────────────────

export async function getTeamsByTournament(tournamentId: string): Promise<TeamRow[]> {
  const result = await getDb().execute({
    sql: `SELECT DISTINCT t.team_id, t.team_name, t.team_code
          FROM squads s
          JOIN teams t ON t.team_id = s.team_id
          WHERE s.tournament_id = ?
          ORDER BY t.team_name`,
    args: [tournamentId],
  })
  return toPlain<TeamRow>(result)
}

// ─── Players for a tournament (browser page) ─────────────────────────────────

interface TournamentPlayerOpts {
  tournamentId: string
  teamId?: string
  dbPositionCode?: string
  search?: string
}

export async function getPlayersByTournament(opts: TournamentPlayerOpts): Promise<WCPlayer[]> {
  const { tournamentId, teamId, dbPositionCode, search } = opts

  let sql = `
    WITH ${DISPLAY_CTES}
    SELECT ${displayCols('pr')}
    FROM player_ratings pr
    ${displayJoins('pr')}
    WHERE pr.tournament_id = @tid AND p.female = 0
  `
  const args: Record<string, string | number | null> = { tid: tournamentId }

  if (teamId) {
    sql += ' AND s.team_id = @teamId'
    args.teamId = teamId
  }
  if (dbPositionCode) {
    sql += ' AND s.position_code = @posCode'
    args.posCode = dbPositionCode
  }
  if (search) {
    sql += ' AND (p.family_name LIKE @search OR p.given_name LIKE @search)'
    args.search = `%${search}%`
  }

  sql += ' ORDER BY t.team_name, pr.rating DESC'

  const result = await getDb().execute({ sql, args })
  return toPlain<RawRow>(result).map(toWCPlayer)
}

// ─── Draft slot search: best tournament card per player, paginated ────────────

interface SearchOpts {
  dbPosition: string
  search?: string
  page?: number
  pageSize?: number
}

export async function searchPlayersForDraft(opts: SearchOpts): Promise<{
  players: WCPlayer[]
  total: number
}> {
  const { dbPosition, search = '', page = 1, pageSize = 6 } = opts
  const searchPct = search ? `%${search}%` : null
  const offset = (page - 1) * pageSize

  // ROW_NUMBER picks best-rated tournament per player in SQL.
  // COUNT(*) OVER () on `best` gives total unique players before the outer LIMIT.
  const sql = `
    WITH
    ranked AS (
      SELECT
        pr.player_id, pr.tournament_id, pr.rating,
        ROW_NUMBER() OVER (PARTITION BY pr.player_id ORDER BY pr.rating DESC) AS rn
      FROM player_ratings pr
      JOIN squads s ON s.player_id = pr.player_id AND s.tournament_id = pr.tournament_id
      JOIN players p ON p.player_id = pr.player_id
      WHERE s.position_code = @dbPosition
        AND p.female = 0
        AND (@searchPct IS NULL OR p.family_name LIKE @searchPct OR p.given_name LIKE @searchPct)
    ),
    best AS (
      SELECT player_id, tournament_id, rating,
        COUNT(*) OVER () AS total_count
      FROM ranked WHERE rn = 1
    ),
    ${DISPLAY_CTES}
    SELECT ${displayCols('best')}, best.total_count
    FROM best
    ${displayJoins('best')}
    ORDER BY best.rating DESC
    LIMIT @pageSize OFFSET @offset
  `

  const result = await getDb().execute({
    sql,
    args: { dbPosition, searchPct, pageSize, offset },
  })

  const rows = toPlain<RawRow & { total_count: number }>(result)
  const total = rows[0]?.total_count ?? 0

  return { players: rows.map(toWCPlayer), total }
}

// ─── Random legends for draft (rating ≥ 82, best card per player) ─────────────

export async function getRandomLegendPlayersForDraft(
  dbPosition: string,
  excludePlayerIds: string[] = []
): Promise<{
  players: WCPlayer[]
  total: number
  context: null
}> {
  const excludeClause =
    excludePlayerIds.length > 0
      ? `AND pr.player_id NOT IN (${excludePlayerIds.map(() => '?').join(',')})`
      : ''

  const sql = `
    WITH
    ranked AS (
      SELECT
        pr.player_id, pr.tournament_id, pr.rating,
        ROW_NUMBER() OVER (PARTITION BY pr.player_id ORDER BY pr.rating DESC) AS rn
      FROM player_ratings pr
      JOIN squads s ON s.player_id = pr.player_id AND s.tournament_id = pr.tournament_id
      JOIN players p ON p.player_id = pr.player_id
      WHERE s.position_code = ? AND p.female = 0 ${excludeClause}
    ),
    eligible AS (
      SELECT player_id, tournament_id, rating,
        COUNT(*) OVER () AS total_count
      FROM ranked WHERE rn = 1 AND rating >= 82
    ),
    ${DISPLAY_CTES}
    SELECT ${displayCols('eligible')}, eligible.total_count
    FROM eligible
    ${displayJoins('eligible')}
    ORDER BY RANDOM()
    LIMIT 4
  `

  const result = await getDb().execute({ sql, args: [dbPosition, ...excludePlayerIds] })
  const rows = toPlain<RawRow & { total_count: number }>(result)
  const total = rows[0]?.total_count ?? 0

  return { players: rows.map(toWCPlayer), total, context: null }
}

export const getRandomTeamPlayersForDraft = getRandomLegendPlayersForDraft

// ─── Fetch specific player cards by (playerId, tournamentId) pairs ─────────────

export async function getPlayersByIds(
  pairs: { playerId: string; tournamentId: string }[]
): Promise<WCPlayer[]> {
  if (pairs.length === 0) return []

  const conditions = pairs
    .map(() => `(pr.player_id = ? AND pr.tournament_id = ?)`)
    .join(' OR ')

  const args = pairs.flatMap((p) => [p.playerId, p.tournamentId])

  const sql = `
    WITH ${DISPLAY_CTES}
    SELECT ${displayCols('pr')}
    FROM player_ratings pr
    ${displayJoins('pr')}
    WHERE p.female = 0 AND (${conditions})
  `

  const result = await getDb().execute({ sql, args })
  return toPlain<RawRow>(result).map(toWCPlayer)
}
