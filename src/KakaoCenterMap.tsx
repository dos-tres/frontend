import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

import { loadMaps, geocodeAddress } from './kakao-maps'
import { centerMapSearchAddress } from './center-address'

export default function KakaoCenterMap({ name, address }: { name: string; address: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured' | 'failed' | 'not-found'>('loading')
  const [revision, setRevision] = useState(0)
  const key = import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim()
  useEffect(() => {
    if (!key) { setState('unconfigured'); return }
    if (!address) { setState('not-found'); return }
    let cancelled = false, observer: ResizeObserver | undefined, marker: { setMap: (map: object | null) => void } | undefined
    setState('loading')
    Promise.all([loadMaps(key), geocodeAddress(address)]).then(([maps, point]) => {
      if (cancelled || !container.current) return
      if (!point) { setState('not-found'); return }
      const position = new maps.LatLng(point.lat, point.lng)
      const map = new maps.Map(container.current, { center: position, level: 3 })
      marker = new maps.Marker({ map, position, title: name })
      observer = new ResizeObserver(() => { map.relayout(); map.setCenter(position) })
      observer.observe(container.current); setState('ready')
    }).catch(() => { if (!cancelled) setState('failed') })
    return () => { cancelled = true; observer?.disconnect(); marker?.setMap(null); if (container.current) container.current.replaceChildren() }
  }, [key, name, address, revision])
  return <section className="center-map-section"><h3>센터 위치</h3><p>{address || '주소가 제공되지 않았어요.'}</p><div className="center-map-frame"><div className="center-kakao-map" ref={container} role="region" aria-label={`${name} 위치 지도`} />{state !== 'ready' && <div className="center-map-message" role={state === 'failed' ? 'alert' : 'status'}>{state === 'loading' ? '센터 위치를 불러오고 있어요.' : state === 'unconfigured' ? '센터 지도는 연결 준비 중이에요. 아래 카카오맵에서 위치를 확인할 수 있어요.' : state === 'not-found' ? '이 주소의 위치를 지도에서 찾지 못했어요. 카카오맵에서 주소를 확인해 주세요.' : <>지도를 불러오지 못했어요. <button className="text-button" onClick={() => setRevision(n=>n+1)}>다시 시도</button></>}</div>}</div>{address && <a className="policy-official-link" href={`https://map.kakao.com/link/search/${encodeURIComponent(centerMapSearchAddress(address))}`} target="_blank" rel="noopener noreferrer">카카오맵에서 위치 보기 <ExternalLink size={13}/></a>}<p className="settings-help">센터 주소를 기준으로 표시해요. 프로그램의 실제 행사 장소는 공고에서 확인해 주세요.</p></section>
}
