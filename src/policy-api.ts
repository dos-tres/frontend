import legalRegions from './data/regions.json'
import administrativeRegions from './data/administrative-regions.json'
import type { Program } from './data'
import type { Answers, Summary } from './checkin-api'

export type PolicyCatalog = { generatedAt: string; items: Program[]; regionGroups: string[][]; regions: { code: string; label: string }[] }
export type PolicyCriteria = { age: string; region: string; job: string; school?: string }
export type PolicyProfile = { birthDate: string; regionLabel: string; employment: string; regionCode?: string; school?: string }
export const policyProvinces = administrativeRegions.provinces
export const policyDistricts = administrativeRegions.districts

// Municipalities with non-autonomous wards include all descendant wards.
export function policyRegionCodes(region: string): string[] {
  const districtCode = region.slice(0, 5)
  const selected = policyDistricts.find(r => r.code === districtCode)
  return selected ? policyDistricts.filter(r => r.code === districtCode || r.label.startsWith(`${selected.label} `)).map(r => r.code) : [region]
}
export function ageFromBirthDate(birthDate: string, today = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return ''
  const [year, month, day] = birthDate.split('-').map(Number)
  const birth = new Date(year, month - 1, day)
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > today) return ''
  let age = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--
  return age >= 0 && age <= 120 ? String(age) : ''
}
export function profilePolicyCriteria(catalog: PolicyCatalog | undefined, profile: PolicyProfile, today = new Date()): PolicyCriteria {
  const label = profile.regionLabel.replace(/^(광주광역시|전라남도)(?= |$)/, '전남광주통합특별시')
  const district = policyDistricts.filter(r => label === r.label || label.startsWith(`${r.label} `)).sort((a, b) => b.label.length - a.label.length)[0]
  const province = policyProvinces.find(p => label === p.fullName || label.startsWith(`${p.fullName} `))
  const saved = profile.regionCode && legalRegions.find(r => r.code === profile.regionCode && r.label === label)
  const jobs: Record<string, string> = { '재직 중': '회사원', '재학 중': '학생', '쉬고 있어요': '쉬는 중' }
  return { age: ageFromBirthDate(profile.birthDate, today), region: saved ? saved.code : district?.code || province?.code || '', job: jobs[profile.employment] || profile.employment, ...(profile.school ? { school: profile.school } : {}) }
}
export type RecommendationItem = {
  fit_notice?: string; activity_brief?: string; fit_reason?: string; activity_place?: string; activity_schedule?: string;
  categories?: string[]; subcategories?: string[]; keywords?: string[]; region_label?: string;
  application_status?: Program['applicationStatus']; application_status_label?: string; application_period?: string;
  target?: string; method?: string; documents?: string; exclusions?: string; updated_at?: string;
  age_min?: number | null; age_max?: number | null;
  id: string; kind: 'policy' | 'program'; title: string; summary: string; scope: string;
  deadline: string | null; why: string[]; domains: string[]; access_type: string;
  support?: string; institution?: string; apply_period: string; apply_url?: string;
  reference_url?: string; income_condition?: { kind: string; max_manwon?: number | null; text: string } | null; score?: number; situations?: string[];
  center?: string; place?: string; url?: string; apply_urls?: string; evergreen?: boolean
}
export type Recommendations = { policies: RecommendationItem[]; programs: RecommendationItem[]; notice: string; programs_notice: { code?: string; message: string } | null; summary: Summary; candidates: { policy: number; program: number }; source: string }
export const loadPolicyCatalog = () => import('./data/policy-catalog.json').then(m => m.default as PolicyCatalog)
export function safePolicyUrl(value?: string): string | undefined {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined } catch { return undefined }
}
export function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function isClosed(item: Program, today = localDate()) { return !!item.deadline && item.deadline < today }
export function periodLabel(value: string) { return value.replace(/(\d{4})(\d{2})(\d{2})/g, '$1.$2.$3') }
export function filterPolicies(items: Program[], catalog: PolicyCatalog, criteria: PolicyCriteria, query: string, type: string, onlyOpen: boolean, onlySaved: boolean, saved: string[], today = localDate()) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const selectedCodes = new Set(policyRegionCodes(criteria.region))
  return items.filter(p => {
    const codes = p.regionGroup === undefined ? [] : catalog.regionGroups[p.regionGroup] || []
    return (!onlyOpen || !isClosed(p, today)) && (!onlySaved || saved.includes(p.id)) &&
      (type === '전체' || p.type === type) &&
      (!criteria.age || (Number(criteria.age) >= (p.ageMin || 0) && Number(criteria.age) <= (p.ageMax || 120))) &&
      (!criteria.region || (criteria.region.length === 2 || p.type !== '정책' ? codes.some(c => c.startsWith(criteria.region.slice(0, 2))) : codes.some(code => selectedCodes.has(code)))) &&
      terms.every(term => `${p.title} ${p.summary} ${p.category || ''} ${p.source}`.toLowerCase().includes(term))
  })
}
export function toProgram(item: RecommendationItem, _original?: Program): Program {
  return {
    id: item.id, type: item.kind === 'policy' ? '정책' : '프로그램', title: item.title,
    summary: item.summary, region: item.region_label || item.scope, period: item.application_period || item.apply_period || '기간 미제공',
    target: item.target || '', method: item.method || '', place: item.place || '', source: item.institution || item.center || '',
    support: item.support || item.summary, income: item.income_condition?.text || '', incomeCondition: item.income_condition,
    referenceUrl: safePolicyUrl(item.reference_url || item.url), applyUrl: safePolicyUrl(item.apply_url || item.apply_urls?.split(/\s+/)[0]),
    why: item.why, domains: item.domains, deadline: item.deadline, evergreen: item.evergreen,
    categories: item.categories || [], subcategories: item.subcategories || [], keywords: item.keywords || [],
    category: item.categories?.join(' · '), applicationStatus: item.application_status, applicationStatusLabel: item.application_status_label,
    documents: item.documents, exclusions: item.exclusions, updatedAt: item.updated_at, ageMin: item.age_min, ageMax: item.age_max,
  }
}
export type CatalogQuery = { query: string; type: string; category: string; onlyOpen: boolean; onlySaved: boolean; mode: string; page: number; sort: string }
export type CatalogResponse = { items: RecommendationItem[]; total: number; categories: string[]; source: string; notice: string }
export async function requestCatalog(criteria: PolicyCriteria, view: CatalogQuery, signal: AbortSignal): Promise<CatalogResponse> {
  const params = new URLSearchParams({ q: view.query, only_open: String(view.onlyOpen), page: String(view.page), page_size: '12', sort: view.sort === '마감 임박순' ? 'deadline' : 'title' })
  if (view.type !== '전체') params.set('kind', view.type === '정책' ? 'policy' : 'program')
  if (view.category) params.set('category', view.category)
  if (criteria.region) params.set('sigungu_cd', criteria.region.slice(0, 5))
  if (criteria.age) params.set('age', criteria.age)
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${base}/api/catalog/items?${params}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) })
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json()
}
export async function requestCatalogItem(id: string, signal: AbortSignal): Promise<Program> {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${base}/api/catalog/items/${encodeURIComponent(id)}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) })
  if (!response.ok) throw new Error(`API ${response.status}`)
  const result = await response.json()
  return toProgram(result.item)
}
export function applicationLabel(program: Program): string {
  if (program.applicationStatusLabel) return program.applicationStatusLabel
  if (isClosed(program)) return '마감'
  if (/상시|연중/.test(program.period)) return '상시'
  return program.deadline ? '모집 중' : '기간 미제공'
}
export async function requestRecommendations(criteria: PolicyCriteria, answers: Answers, signal: AbortSignal): Promise<Recommendations> {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${base}/api/recommendations`, {
    method: 'POST', signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: { age: Number(criteria.age), sigungu_cd: criteria.region.slice(0, 5), job: criteria.job || null, school: criteria.school || null }, checkin: answers }),
  })
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json()
}
