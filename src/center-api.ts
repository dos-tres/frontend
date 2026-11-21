import { toProgram, type RecommendationItem } from './policy-api'
export type CenterGuide = { kind: string; summary: string; facilities: string[]; usage_note: string; hours?: string; homepage?: string; notice_url?: string; source: { name: string; url: string; checked_at: string } }
export type OfficialCenterContent = { center_id: string; name: string; summary: string; address: string; hours: string; directions: string; usage: string; sections: {title:string;body:string}[]; homepage: string; notice_url: string; notices?: {id:string;title:string;date:string;url:string}[]; fetched_at: string; notices_fetched_at?: string }
export type PublicCenter = { id: string; name: string; address: string; region_code: string; district: string; province: string; homepage: string; updated_at: string; program_count?: number; open_program_count?: number; guide?: CenterGuide; official?: OfficialCenterContent }
export type CenterList = { items: PublicCenter[]; districts: string[]; source: 'file'; dataset: 'runtime' | 'seed'; programs_source: 'db' | 'file'; notice: string }
export type CenterDetail = { item: PublicCenter; source: 'file'; dataset: 'runtime' | 'seed'; programs: RecommendationItem[]; programs_source: 'db' | 'file'; notice: string }
async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${base}/api/centers${path}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) })
  if (!response.ok) throw new Error(`센터 조회 실패 (${response.status})`)
  return response.json()
}
export const requestCenters = (q: string, district: string, signal: AbortSignal) => get<CenterList>(`?${new URLSearchParams({ q, district })}`, signal)
export const requestCenter = (id: string, signal: AbortSignal) => get<CenterDetail>(`/${encodeURIComponent(id)}`, signal)
export const centerPrograms = (result: CenterDetail) => result.programs.map(item => toProgram(item))
