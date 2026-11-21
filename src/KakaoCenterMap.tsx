import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

import { loadMaps, resolveCenterLocation, type CenterLocation } from './kakao-maps'
import { centerMapSearchAddress } from './center-address'

export default function KakaoCenterMap({ name, address, province, district }: { name: string; address: string; province?: string; district?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured' | 'failed' | 'not-found'>('loading')
  const [location, setLocation] = useState<CenterLocation | null>(null)
  const [revision, setRevision] = useState(0)
  const key = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
  useEffect(() => {
    if (!key) { setState('unconfigured'); return }
    let cancelled = false, observer: ResizeObserver | undefined, marker: { setMap: (map: object | null) => void } | undefined
    setState('loading'); setLocation(null)
    Promise.all([loadMaps(key), resolveCenterLocation({name,address,province,district})]).then(([maps, point]) => {
      if (cancelled || !container.current) return
      if (!point) { setState('not-found'); return }
      setLocation(point)
      const position = new maps.LatLng(point.lat, point.lng)
      const map = new maps.Map(container.current, { center: position, level: 3 })
      marker = new maps.Marker({ map, position, title: name })
      observer = new ResizeObserver(() => { map.relayout(); map.setCenter(position) })
      observer.observe(container.current); setState('ready')
    }).catch(() => { if (!cancelled) setState('failed') })
    return () => { cancelled = true; observer?.disconnect(); marker?.setMap(null); if (container.current) container.current.replaceChildren() }
  }, [key, name, address, province, district, revision])
  return <section className="center-map-section"><h3>센터 위치</h3><p>{location?.address || address || '센터명과 지역으로 위치를 찾고 있어요.'}{location?.source === 'kakao-place' && <small> · 카카오맵 장소 정보로 보완</small>}</p><div className="center-map-frame"><div className="center-kakao-map" ref={container} role="region" aria-label={`${name} 위치 지도`} />{state !== 'ready' && <div className="center-map-message" role={state === 'failed' ? 'alert' : 'status'}>{state === 'loading' ? '센터 위치를 불러오고 있어요.' : state === 'unconfigured' ? '센터 지도는 연결 준비 중이에요. 아래 카카오맵에서 위치를 확인할 수 있어요.' : state === 'not-found' ? '센터 위치를 확실하게 확인하지 못했어요. 아래 카카오맵에서 직접 확인해 주세요.' : <>지도를 불러오지 못했어요. <button className="text-button" onClick={() => setRevision(n=>n+1)}>다시 시도</button></>}</div>}</div>{<a className="policy-official-link" href={location?.placeUrl || `https://map.kakao.com/link/search/${encodeURIComponent(address ? centerMapSearchAddress(address) : [province,district,name].filter(Boolean).join(' '))}`} target="_blank" rel="noopener noreferrer">카카오맵 · 위치·운영시간 확인 <ExternalLink size={13}/></a>}<p className="settings-help">공식 주소를 우선 사용하고, 위치가 없으면 같은 이름·지역의 카카오맵 장소로 보완해요. 프로그램의 실제 행사 장소는 공고에서 확인해 주세요.</p></section>
}
