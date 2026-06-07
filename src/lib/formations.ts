export type Position = 'GK' | 'DF' | 'MD' | 'FWD'
export type FormationId = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-4-3' | '3-5-2'

export const POSITION_COLOR: Record<Position, string> = {
  GK: '#f2ca50',
  DF: '#86d89d',
  MD: '#d0c5af',
  FWD: '#ffbfb8',
}

export interface PositionSlot {
  id: string
  position: Position
  topPct: number
  leftPct: number
}

export interface FormationRow {
  position: Position
  count: number
  topPct: number
  /** Override default even distribution across the pitch width */
  leftPcts?: number[]
}

export interface Formation {
  id: FormationId
  label: string
  rows: FormationRow[]
}

function getLeftPositions(count: number): number[] {
  if (count === 1) return [50]
  return Array.from({ length: count }, (_, i) => 12 + (i * 76) / (count - 1))
}

export function buildSlots(formation: Formation): PositionSlot[] {
  const slots: PositionSlot[] = []
  formation.rows.forEach((row, rowIdx) => {
    const lefts = row.leftPcts ?? getLeftPositions(row.count)
    for (let i = 0; i < row.count; i++) {
      slots.push({
        id: `${row.position}-${rowIdx}-${i}`,
        position: row.position,
        topPct: row.topPct,
        leftPct: lefts[i],
      })
    }
  })
  return slots
}

export const FORMATIONS: Formation[] = [
  {
    id: '4-3-3',
    label: '4-3-3',
    rows: [
      { position: 'FWD', count: 3, topPct: 10 },
      { position: 'MD', count: 3, topPct: 36 },
      { position: 'DF', count: 4, topPct: 62 },
      { position: 'GK', count: 1, topPct: 82 },
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2',
    rows: [
      // FWDs close together — classic twin strikers
      { position: 'FWD', count: 2, topPct: 10, leftPcts: [35, 65] },
      { position: 'MD', count: 4, topPct: 36 },
      { position: 'DF', count: 4, topPct: 62 },
      { position: 'GK', count: 1, topPct: 82 },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    rows: [
      { position: 'FWD', count: 1, topPct: 10 },
      { position: 'MD', count: 3, topPct: 30 },
      // Two DMs close together in front of the back four
      { position: 'MD', count: 2, topPct: 50, leftPcts: [38, 62] },
      { position: 'DF', count: 4, topPct: 67 },
      { position: 'GK', count: 1, topPct: 82 },
    ],
  },
  {
    id: '3-4-3',
    label: '3-4-3',
    rows: [
      { position: 'FWD', count: 3, topPct: 10 },
      { position: 'MD', count: 4, topPct: 38 },
      { position: 'DF', count: 3, topPct: 64 },
      { position: 'GK', count: 1, topPct: 82 },
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2',
    rows: [
      // Two wide FWDs form the top of an inverted triangle (▽)
      { position: 'FWD', count: 2, topPct: 10, leftPcts: [28, 72] },
      // CAM acts as the apex of the ▽, sitting between the FWDs
      { position: 'MD', count: 1, topPct: 24 },
      // Four remaining MDs in a flat line
      { position: 'MD', count: 4, topPct: 44 },
      { position: 'DF', count: 3, topPct: 64 },
      { position: 'GK', count: 1, topPct: 82 },
    ],
  },
]

export function getFormation(id: string): Formation | undefined {
  return FORMATIONS.find((f) => f.id === id)
}
