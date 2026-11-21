import { centerPlaceQuery, selectCenterPlace, kakaoPlaceUrl, type CenterPlaceQuery, type KakaoPlace } from './center-place'
import { centerAddressQueries } from './center-address'
type Point = object
type KakaoMaps = {
  load: (callback: () => void) => void
  LatLng: new (lat: number, lng: number) => Point
  Map: new (element: HTMLElement, options: { center: Point; level: number }) => { relayout: () => void; setCenter: (point: Point) => void }
  Marker: new (options: { map: object; position: Point; title: string }) => { setMap: (map: object | null) => void }
  services: { Places: new () => { keywordSearch: (query: string, callback: (results: KakaoPlace[], status: string, pagination: { hasNextPage: boolean }) => void, options?: { size: number }) => void }; Status: { OK: string; ZERO_RESULT: string }; Geocoder: new () => { addressSearch: (address: string, callback: (result: { x: string; y: string }[], status: string) => void) => void } }
}
declare global { interface Window { kakao?: { maps: KakaoMaps } } }
let sdkPromise: Promise<KakaoMaps> | undefined
export function loadMaps(key: string): Promise<KakaoMaps> {
  if (window.kakao?.maps.services && window.kakao.maps.LatLng) return Promise.resolve(window.kakao.maps)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(fail, 10000)
    function fail() { window.clearTimeout(timer); script.remove(); sdkPromise = undefined; reject(new Error('Map unavailable')) }
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`
    script.onerror = fail
    script.onload = () => { if (!window.kakao?.maps) { fail(); return }; window.kakao.maps.load(() => { window.clearTimeout(timer); if (window.kakao?.maps.services) resolve(window.kakao.maps); else fail() }) }
    document.head.appendChild(script)
  })
  return sdkPromise
}


export type Coordinates = { lat: number; lng: number }
const addressCache = new Map<string, Coordinates>()
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const cached = addressCache.get(address)
  if (cached) return cached
  const key = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
  if (!key) throw new Error('Map unavailable')
  const maps = await loadMaps(key)
  const queries = centerAddressQueries(address)
  if (!queries.length) return null
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = window.setTimeout(() => { settled = true; reject(new Error('Address lookup timed out')) }, 8000)
    const finish = (coords: Coordinates | null) => { settled = true; window.clearTimeout(timer); resolve(coords) }
    const search = (index: number) => {
      new maps.services.Geocoder().addressSearch(queries[index], (results, status) => {
        if (settled) return
        const result = results[0]
        if (status === maps.services.Status.ZERO_RESULT || (status === maps.services.Status.OK && !result)) {
          if (index + 1 < queries.length) search(index + 1)
          else finish(null)
          return
        }
        if (status !== maps.services.Status.OK || !result) { settled = true; window.clearTimeout(timer); reject(new Error('Address lookup failed')); return }
        const coords = { lat: Number(result.y), lng: Number(result.x) }
        if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng) || Math.abs(coords.lat) > 90 || Math.abs(coords.lng) > 180) { finish(null); return }
        addressCache.set(address, coords)
        addressCache.set(queries[index], coords)
        finish(coords)
      })
    }
    search(0)
  })
}

export type CenterLocation = Coordinates & { source: 'address' | 'kakao-place'; address: string; placeName?: string; placeUrl?: string }
const locationCache = new Map<string, CenterLocation>()
const locationRequests = new Map<string, Promise<CenterLocation | null>>()
export async function resolveCenterLocation(center: CenterPlaceQuery): Promise<CenterLocation | null> {
  const id = JSON.stringify([center.name, center.address, center.province, center.district])
  if (locationCache.has(id)) return locationCache.get(id)!
  if (locationRequests.has(id)) return locationRequests.get(id)!
  const request = (async () => {
    // Service errors are retryable; only a missing/unsuccessful address triggers place lookup.
    const hasBuildingAddress = /(?:대로|로|길)\s*\d+|(?:동|읍|면|리)\s+\d+/.test(center.address)
    const coords = hasBuildingAddress ? await geocodeAddress(center.address) : null
    if (coords) return { ...coords, source: 'address' as const, address: center.address }
    const key = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
    if (!key) throw new Error('Map unavailable')
    const maps = await loadMaps(key)
    return new Promise<CenterLocation | null>((resolve, reject) => {
      let settled = false
      const timer = window.setTimeout(() => { settled = true; reject(new Error('Place lookup timed out')) }, 8000)
      try {
        new maps.services.Places().keywordSearch(centerPlaceQuery(center), (results, status, pagination) => {
          if (settled) return
          settled = true; window.clearTimeout(timer)
          if (status === maps.services.Status.ZERO_RESULT) { resolve(null); return }
          if (status !== maps.services.Status.OK) { reject(new Error('Place lookup failed')); return }
          // Do not auto-select from a truncated or ambiguous result set.
          const place = pagination?.hasNextPage ? null : selectCenterPlace(center, results)
          resolve(place ? { lat: Number(place.y), lng: Number(place.x), source: 'kakao-place', address: place.road_address_name || place.address_name, placeName: place.place_name, placeUrl: kakaoPlaceUrl(place) } : null)
        }, { size: 15 })
      } catch (error) { settled = true; window.clearTimeout(timer); reject(error) }
    })
  })()
  locationRequests.set(id, request)
  try { const result = await request; if (result) locationCache.set(id, result); return result }
  finally { locationRequests.delete(id) }
}
