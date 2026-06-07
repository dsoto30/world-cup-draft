import { redirect } from 'next/navigation'
import { getFormation, buildSlots } from '@/lib/formations'
import type { Position } from '@/lib/formations'
import TeamView from '@/components/team-view'

interface TeamPayload {
  f: string
  r: number[]
}

function decodePayload(raw: string): TeamPayload | null {
  try {
    const json = Buffer.from(raw, 'base64').toString('utf-8')
    const data = JSON.parse(json)
    if (typeof data.f !== 'string' || !Array.isArray(data.r)) return null
    return data as TeamPayload
  } catch {
    return null
  }
}

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
  if (payload.r.length !== slots.length) redirect('/')

  const players = Object.fromEntries(
    slots.map((slot, i) => [
      slot.id,
      { rating: payload.r[i], position: slot.position as Position },
    ])
  )

  const overall = Math.round(
    payload.r.reduce((a, b) => a + b, 0) / payload.r.length
  )

  return (
    <main className="bg-surface min-h-screen">
      <TeamView
        formation={formation}
        slots={slots}
        players={players}
        overall={overall}
      />
    </main>
  )
}
