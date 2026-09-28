export function matchesRegion(region: { level: string; code: string; provinceCode: string }, level: string, province: string, kind: string) {
  return (level === 'PROV' ? region.level === 'PROV' : region.level !== 'PROV' && (kind === 'all' || region.level === kind)) && (province === 'all' || region.provinceCode === province);
}
