import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getFormation, buildSlots } from '@/lib/formations'
import { getPlayersByIds } from '@/lib/queries'
import type { WCPlayer } from '@/lib/queries'
import TeamView from '@/components/team-view'

// ─── Payload types ────────────────────────────────────────────────────────────

interface PlayerSnapshot {
  r: number   // rating
  n: string   // fullName
  tc: string  // teamCode
  tn: string  // teamName
  ty: number  // tournamentYear
}

interface PayloadV2 {
  v: 2
  f: string
  p: PlayerSnapshot[]
}

interface PayloadV1 {
  f: string
  p: [string, string][]
}

function decodePayload(raw: string): PayloadV1 | PayloadV2 | null {
  try {
    const json = Buffer.from(raw, 'base64').toString('utf-8')
    const data = JSON.parse(json)
    if (typeof data.f !== 'string' || !Array.isArray(data.p)) return null
    return data as PayloadV1 | PayloadV2
  } catch {
    return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ViewPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>
}) {
  const { d } = await searchParams
  if (!d) redirect('/')

  const payload = decodePayload(d)
  if (!payload) redirect('/')

  const formation = getFormation(payload.f)
  if (!formation) redirect('/')

  const slots = buildSlots(formation)
  if (payload.p.length !== slots.length) redirect('/')

  let filledSlots: Record<string, WCPlayer>

  if ('v' in payload && payload.v === 2) {
    // v2: all display data is in the URL — no DB call needed
    filledSlots = {}
    slots.forEach((slot, i) => {
      const snap = (payload as PayloadV2).p[i]
      if (!snap) return
      filledSlots[slot.id] = {
        playerId: '',
        familyName: '',
        givenName: '',
        fullName: snap.n,
        position: slot.position,
        dbPositionCode: '',
        teamName: snap.tn,
        teamCode: snap.tc,
        tournamentId: undefined,
        tournamentYear: snap.ty || undefined,
        shirtNumber: undefined,
        careerTournaments: 0,
        wonTournament: false,
        awardsCount: 0,
        awards: [],
        rating: snap.r,
      }
    })
  } else {
    // v1 legacy: look up players by ID from DB (cached 24h per unique squad)
    const pairs = (payload as PayloadV1).p.map(([playerId, tournamentId]) => ({ playerId, tournamentId }))
    const cacheKey = (payload as PayloadV1).p.map(([pid, tid]) => `${pid}|${tid}`).join(',')
    const fetchSquad = unstable_cache(
      () => getPlayersByIds(pairs),
      [`squad-${cacheKey}`],
      { revalidate: 86400 }
    )
    const fetched = await fetchSquad()
    const byKey = new Map(fetched.map((p) => [`${p.playerId}|${p.tournamentId}`, p]))
    filledSlots = {}
    slots.forEach((slot, i) => {
      const [pid, tid] = (payload as PayloadV1).p[i]
      const player = byKey.get(`${pid}|${tid}`)
      if (player) filledSlots[slot.id] = player
    })
  }

  const ratings = slots.map((s) => filledSlots[s.id]?.rating ?? 0)
  const overall = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)

  return (
    <main className="bg-surface min-h-screen">
      <TeamView
        formation={formation}
        slots={slots}
        filledSlots={filledSlots}
        overall={overall}
      />
    </main>
  )
}
