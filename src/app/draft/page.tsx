import { redirect } from 'next/navigation'
import { getFormation } from '@/lib/formations'
import DraftPitch from '@/components/draft-pitch'

export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ formation?: string }>
}) {
  const { formation: formationId } = await searchParams
  const formation = formationId ? getFormation(formationId) : undefined

  if (!formation) {
    redirect('/formations')
  }

  return (
    <main className="min-h-screen p-4 md:p-6 flex flex-col">
      <DraftPitch formation={formation} />
    </main>
  )
}
