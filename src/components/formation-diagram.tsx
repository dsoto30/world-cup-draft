import type { Formation, Position } from '@/lib/formations'
import { POSITION_COLOR } from '@/lib/formations'

function getLeftPositions(count: number): number[] {
  if (count === 1) return [50]
  return Array.from({ length: count }, (_, i) => 15 + (i * 70) / (count - 1))
}

export default function FormationDiagram({ formation }: { formation: Formation }) {
  return (
    <div
      className="relative w-full rounded overflow-hidden border border-outline-dim"
      style={{ aspectRatio: '3/4', backgroundColor: 'rgba(0, 98, 51, 0.15)' }}
    >
      <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
      {formation.rows.map((row, rowIdx) => {
        const lefts = row.leftPcts ?? getLeftPositions(row.count)
        return lefts.map((leftPct, i) => (
          <span
            key={`${rowIdx}-${i}`}
            className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              top: `${row.topPct}%`,
              left: `${leftPct}%`,
              backgroundColor: POSITION_COLOR[row.position as Position],
              boxShadow: `0 0 4px ${POSITION_COLOR[row.position as Position]}88`,
            }}
          />
        ))
      })}
    </div>
  )
}
