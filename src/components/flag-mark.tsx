import { getTeamFlag } from '@/lib/flags'

const TEAM_FLAG_IMAGE: Record<string, string> = {
  ENG: '/flags/gb-eng.svg',
  WAL: '/flags/gb-wls.svg',
}

function getFlagImage(teamCode: string, teamName: string): string | undefined {
  const name = teamName.toLowerCase()
  if (name.includes('england')) return TEAM_FLAG_IMAGE.ENG
  if (name.includes('wales')) return TEAM_FLAG_IMAGE.WAL
  return TEAM_FLAG_IMAGE[teamCode.toUpperCase()]
}

export default function FlagMark({ teamCode, teamName }: { teamCode: string; teamName: string }) {
  const imageSrc = getFlagImage(teamCode, teamName)
  if (imageSrc) {
    return (
      <span
        aria-label={`${teamName} flag`}
        role="img"
        className="h-4 w-6 rounded-[2px] bg-cover bg-center inline-block"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
    )
  }
  return <span className="text-lg leading-none">{getTeamFlag(teamCode, teamName)}</span>
}
