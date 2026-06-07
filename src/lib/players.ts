import type { Position } from './formations'

export interface Player {
  id: string
  name: string
  rating: number
  position: Position
  club: string
  nation: string
}

export const PLACEHOLDER_PLAYERS: Player[] = [
  { id: '1', name: 'Player Name', rating: 91, position: 'FWD', club: 'Club FC', nation: 'Country' },
  { id: '2', name: 'Player Name', rating: 88, position: 'MD', club: 'Club FC', nation: 'Country' },
  { id: '3', name: 'Player Name', rating: 85, position: 'DF', club: 'Club FC', nation: 'Country' },
  { id: '4', name: 'Player Name', rating: 79, position: 'GK', club: 'Club FC', nation: 'Country' },
]
