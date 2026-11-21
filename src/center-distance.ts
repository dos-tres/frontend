import type { Coordinates } from './kakao-maps'

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const deltaLat = radians(b.lat-a.lat), deltaLng = radians(b.lng-a.lng)
  const h = Math.sin(deltaLat/2)**2 + Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(deltaLng/2)**2
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0,h))))
}
export function distanceLabel(km: number | undefined): string {
  if (km === undefined || !Number.isFinite(km)) return '거리 확인 불가'
  if (km < 0.1) return '약 100m 이내'
  return km < 1 ? `약 ${Math.round(km*10)*100}m` : `약 ${km.toFixed(1)}km`
}
export function sortCentersByDistance<T extends { id: string }>(centers: T[], distances: Record<string, number>): T[] {
  return centers.map((center, index) => ({ center, index })).sort((a,b) => (distances[a.center.id] ?? Infinity) - (distances[b.center.id] ?? Infinity) || a.index-b.index).map(item=>item.center)
}
export function centerDistanceOrigin(savedRegion: string, selectedDistrict: string): string {
  return selectedDistrict ? `서울특별시 ${selectedDistrict}` : savedRegion
}

export type CenterSort = 'nearby' | 'basic'
export function orderCenters<T extends { id: string; program_count?: number }>(centers: T[], sort: CenterSort, distances: Record<string, number>, programsOnly = false): T[] {
  const eligible = centers.filter(center => !programsOnly || (center.program_count || 0) > 0)
  const sorted = sort === 'nearby' ? sortCentersByDistance(eligible, distances) : eligible
  // Keep both groups stable so their distance/default order is preserved.
  return [...sorted.filter(c => (c.program_count || 0) > 0), ...sorted.filter(c => !(c.program_count || 0))]
}
