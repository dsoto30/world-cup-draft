import { NextRequest, NextResponse } from 'next/server'
import { searchPlayersForDraft, getRandomLegendPlayersForDraft, APP_TO_DB } from '@/lib/queries'
import type { Position } from '@/lib/formations'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const position = (searchParams.get('position') ?? 'FWD') as Position
  const mode = searchParams.get('mode') ?? 'search'
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(12, Math.max(1, parseInt(searchParams.get('pageSize') ?? '6', 10)))

  const dbPosition = APP_TO_DB[position] ?? 'FW'

  try {
    if (mode === 'randomLegends' || mode === 'randomTeam') {
      const result = getRandomLegendPlayersForDraft(dbPosition)
      return NextResponse.json(result)
    }

    const result = searchPlayersForDraft({ dbPosition, search, page, pageSize })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to load players', error)
    return NextResponse.json(
      { players: [], total: 0, context: null, error: 'Player database unavailable' },
      { status: 500 },
    )
  }
}
