import { useEffect, useState } from 'react'
import type { PublicCenter } from './center-api'
import { geocodeAddress } from './kakao-maps'
import { distanceKm } from './center-distance'

type DistanceState = { origin: string; distances: Record<string, number>; status: 'idle' | 'loading' | 'ready' | 'failed'; missing: number }
export function useCenterDistance(centers: PublicCenter[] | undefined, origin: string, revision: number) {
  const [state, setState] = useState<DistanceState>({origin:'',distances:{},status:'idle',missing:0})
  useEffect(()=>{
    if (!origin || !centers?.length) { setState({origin,distances:{},status:'idle',missing:0}); return }
    let cancelled=false
    setState({origin,distances:{},status:'loading',missing:0})
    const calculate = async () => {
      try {
        const start=await geocodeAddress(origin)
        if (cancelled) return
        if (!start) { setState({origin,distances:{},status:'failed',missing:centers.length}); return }
        const distances: Record<string,number>={}
        let index=0
        // Bound requests and stop scheduling work after changing region or leaving.
        await Promise.all(Array.from({length:Math.min(4,centers.length)},async()=>{
          while (!cancelled && index<centers.length) {
            const center=centers[index++]
            try {
              const point=center.address ? await geocodeAddress(center.address) : null
              if (cancelled) return
              if (point) distances[center.id]=distanceKm(start,point)
            } catch { /* An unavailable center address must not hide the center. */ }
          }
        }))
        if (!cancelled) setState({origin,distances,status:Object.keys(distances).length ? 'ready' : 'failed',missing:centers.length-Object.keys(distances).length})
      } catch { if (!cancelled) setState({origin,distances:{},status:'failed',missing:centers.length}) }
    }
    void calculate()
    return ()=>{cancelled=true}
  },[centers,origin,revision])
  return state.origin===origin ? state : {origin,distances:{},status:'loading' as const,missing:0}
}
