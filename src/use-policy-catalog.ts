import { useEffect, useMemo, useState } from 'react'
import { filterPolicies, loadPolicyCatalog, profilePolicyCriteria, requestRecommendations, toProgram, type PolicyCatalog, type PolicyCriteria, type PolicyProfile, type Recommendations } from './policy-api'
import type { Answers } from './checkin-api'
import type { Program } from './data'

export function usePolicyCatalog(active: boolean, answers: Answers, profile: PolicyProfile) {
  const [catalog, setCatalog] = useState<PolicyCatalog>()
  const defaults = useMemo(() => profilePolicyCriteria(catalog, profile), [catalog, profile.birthDate, profile.regionLabel, profile.employment, profile.regionCode, profile.school])
  const [criteria, setCriteria] = useState<PolicyCriteria>(defaults)
  useEffect(() => { setCriteria(defaults) }, [defaults])
  const [recommended, setRecommended] = useState<Program[]>()
  const [notice, setNotice] = useState('')
  const [response, setResponse] = useState<Recommendations>()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!active || catalog) return
    let current = true
    loadPolicyCatalog().then(value => { if (current) { setCatalog(value); setFailed(false) } }).catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [active, catalog, revision])
  useEffect(() => {
    if (!active || !criteria.age || criteria.region.length < 5) { setResponse(undefined); setRecommended(undefined); setBusy(false); setNotice(''); return }
    const controller = new AbortController()
    setResponse(undefined); setBusy(true); setRecommended(undefined); setNotice('')
    requestRecommendations(criteria, answers, controller.signal).then(result => {
      if (controller.signal.aborted) return
      setResponse(result)
      setRecommended([...result.policies, ...result.programs].map(item => toProgram(item, catalog?.items.find(p => p.id === item.id))))
      setNotice([result.source === 'db' ? 'DB에 저장된 수집 데이터 기준 추천이에요.' : '서버 파일에 저장된 수집 데이터 기준 추천이에요. DB 조회 결과가 아니에요.', result.notice, result.programs_notice?.message].filter(Boolean).join(' '))
    }).catch((error: unknown) => {
      // Keep the browsable catalog and entered filters when the API is unavailable.
      if (!controller.signal.aborted) { setRecommended(undefined); setNotice(error instanceof Error && error.message.includes('422') ? '등록한 조건을 추천 서버에서 확인하지 못했어요. 현재는 수집된 정책과 공식 지원 안내를 보여드려요.' : '추천 서버에 연결되지 않아 수집된 정책과 공식 지원 안내를 보여드려요.') }
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [catalog, active, criteria, answers])
  const local = catalog ? filterPolicies(catalog.items, catalog, criteria, '', '전체', false, false, []) : []
  return { catalog, response, criteria, setCriteria, resetCriteria: () => setCriteria(defaults), recommended, items: recommended ?? local, notice, busy, failed, retry: () => setRevision(v => v + 1) }
}
