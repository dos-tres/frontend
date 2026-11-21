/** Only accept a unique place with the same centre name and administrative area. */
export type CenterPlaceQuery = { name: string; address: string; province?: string; district?: string }
export type KakaoPlace = { id: string; place_name: string; address_name: string; road_address_name: string; x: string; y: string; place_url: string }
const compact = (s: string) => s.normalize('NFKC').replace(/[\s·ㆍ()\[\]_-]/g, '').replace(/^서울특별시/, '서울').replace(/^서울(?=청년)/, '')
export function centerPlaceQuery(center: CenterPlaceQuery) {
  return [...new Set([center.province, center.district, center.name].filter(Boolean))].join(' ')
}
export function selectCenterPlace(center: CenterPlaceQuery, results: KakaoPlace[]): KakaoPlace | null {
  const district = center.district || center.address.match(/[가-힣]+구(?=\s|$)/)?.[0]
  const province = center.province || (/^서울/.test(center.address) ? '서울' : '')
  // A name without an administrative area is not enough to resolve an identity.
  if (!district || !province || compact(center.name).length < 4) return null
  const found = results.filter(p => {
    const address = p.road_address_name || p.address_name
    const lat = Number(p.y), lng = Number(p.x)
    return compact(p.place_name) === compact(center.name) &&
      address.split(/\s+/).includes(district) && compact(address).startsWith(compact(province)) &&
      p.x.trim() !== '' && p.y.trim() !== '' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180
  })
  const unique = [...new Map(found.map(p => [p.id, p])).values()]
  return unique.length === 1 ? unique[0] : null
}
export const kakaoPlaceUrl = (place: KakaoPlace) => /^\d+$/.test(place.id) ? `https://place.map.kakao.com/${place.id}` : undefined
