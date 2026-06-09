export const TEAM_FLAG: Record<string, string> = {
  ALG: '🇩🇿', AGO: '🇦🇴', ARE: '🇦🇪', ARG: '🇦🇷', AUS: '🇦🇺', AUT: '🇦🇹',
  BEL: '🇧🇪', BIH: '🇧🇦', BOL: '🇧🇴', BRA: '🇧🇷', BGR: '🇧🇬', BUL: '🇧🇬',
  CAN: '🇨🇦', CHE: '🇨🇭', CHI: '🇨🇱', CHL: '🇨🇱', CHN: '🇨🇳', CIV: '🇨🇮',
  CMR: '🇨🇲', COD: '🇨🇩', COL: '🇨🇴', CRC: '🇨🇷', CRI: '🇨🇷', CRO: '🇭🇷',
  CSK: '🇨🇿', CUB: '🇨🇺', CZE: '🇨🇿', DDR: '🇩🇪', DEN: '🇩🇰', DEU: '🇩🇪',
  DNK: '🇩🇰', DZA: '🇩🇿', ECU: '🇪🇨', EGY: '🇪🇬', ENG: '🏴', ESP: '🇪🇸',
  FRA: '🇫🇷', FRG: '🇩🇪', GER: '🇩🇪', GHA: '🇬🇭', GRC: '🇬🇷', GRE: '🇬🇷',
  HND: '🇭🇳', HON: '🇭🇳', HRV: '🇭🇷', HTI: '🇭🇹', HUN: '🇭🇺', IDN: '🇮🇩',
  IRL: '🇮🇪', IRN: '🇮🇷', IRQ: '🇮🇶', ISL: '🇮🇸', ISR: '🇮🇱', ITA: '🇮🇹',
  JAM: '🇯🇲', JPN: '🇯🇵', KOR: '🇰🇷', KSA: '🇸🇦', KUW: '🇰🇼', KWT: '🇰🇼',
  MAR: '🇲🇦', MEX: '🇲🇽', NED: '🇳🇱', NGA: '🇳🇬', NLD: '🇳🇱', NIR: '🇬🇧',
  NOR: '🇳🇴', NZL: '🇳🇿', PAN: '🇵🇦', PAR: '🇵🇾', PER: '🇵🇪', POL: '🇵🇱',
  POR: '🇵🇹', PRK: '🇰🇵', PRT: '🇵🇹', PRY: '🇵🇾', QAT: '🇶🇦', ROU: '🇷🇴',
  RSA: '🇿🇦', RUS: '🇷🇺', SAU: '🇸🇦', SCG: '🇷🇸', SCO: '🏴', SEN: '🇸🇳',
  SLV: '🇸🇻', SRB: '🇷🇸', SUI: '🇨🇭', SUN: '🇷🇺', SVK: '🇸🇰', SVN: '🇸🇮',
  SWE: '🇸🇪', TCH: '🇨🇿', TGO: '🇹🇬', TOG: '🇹🇬', TRI: '🇹🇹', TTO: '🇹🇹',
  TUN: '🇹🇳', TUR: '🇹🇷', UAE: '🇦🇪', UKR: '🇺🇦', URS: '🇷🇺', URU: '🇺🇾',
  URY: '🇺🇾', USA: '🇺🇸', WAL: '🏴', YUG: '🇷🇸', ZAF: '🇿🇦',
}

export function getTeamFlag(teamCode: string, teamName: string): string {
  const name = teamName.toLowerCase()
  if (name.includes('west germany') || name.includes('germany')) return '🇩🇪'
  if (name.includes('netherlands')) return '🇳🇱'
  if (name.includes('uruguay')) return '🇺🇾'
  return TEAM_FLAG[teamCode.toUpperCase()] ?? '🏳'
}
