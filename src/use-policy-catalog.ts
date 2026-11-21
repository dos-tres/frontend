import { useEffect, useMemo, useState } from 'react'
import { profilePolicyCriteria, requestRecommendations, requestCatalog, requestCatalogItem, toProgram, type PolicyCriteria, type PolicyProfile, type Recommendations, type CatalogQuery } from './policy-api'
import type { Answers } from './checkin-api'
import type { Program } from './data'

export function usePolicyCatalog(active: boolean, answers: Answers, profile: PolicyProfile, view?: CatalogQuery, saved: string[] = []) {
  const defaults = useMemo(() => { const saved = profilePolicyCriteria(undefined, profile); return { ...saved, region: saved.region || '11' } }, [profile.birthDate, profile.regionLabel, profile.employment, profile.regionCode, profile.school])
  const [criteria, setCriteria] = useState<PolicyCriteria>(defaults)
  useEffect(() => { setCriteria(defaults) }, [defaults])
  const [recommended, setRecommended] = useState<Program[]>()
  const [items, setItems] = useState<Program[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [notice, setNotice] = useState('')
  const [response, setResponse] = useState<Recommendations>()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const savedKey = saved.join('|')
  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const recommendationMode = !view || view.mode === 'recommended' && !view.onlySaved
    if (recommendationMode && (!criteria.age || criteria.region.length < 5)) { setRecommended(undefined); setItems([]); setBusy(false); setNotice('생년월일과 거주 시·군·구를 등록하면 맞춤 추천을 확인할 수 있어요.'); return }
    setBusy(true); setFailed(false); setItems([]); setTotal(0); setRecommended(undefined); setResponse(undefined); setNotice('')
    const load = async () => {
      if (view?.onlySaved) {
        const rows = await Promise.all(saved.filter(id => /^(policy|program):/.test(id)).map(id => requestCatalogItem(id, controller.signal)))
        if (controller.signal.aborted) return
        setItems(rows); setTotal(rows.length); return
      }
      if (!recommendationMode && view) {
        const result = await requestCatalog(criteria, view, controller.signal)
        if (controller.signal.aborted) return
        setItems(result.items.map(item => toProgram(item))); setTotal(result.total); setCategories(result.categories)
        setNotice([result.source === 'file' ? '서버가 보관한 수집 자료를 사용하고 있어요.' : '', result.notice].filter(Boolean).join(' ')); return
      }
      const result = await requestRecommendations(criteria, answers, controller.signal)
      if (controller.signal.aborted) return
      const rows = [...result.policies, ...result.programs].map(item => toProgram(item))
      setResponse(result); setRecommended(rows); setItems(rows); setTotal(rows.length)
      setCategories([...new Set(rows.flatMap(p => p.categories || []))])
      setNotice([result.source === 'file' ? '서버가 보관한 수집 자료를 사용하고 있어요.' : '', result.notice, result.programs_notice?.message].filter(Boolean).join(' '))
    }
    load().catch(() => { if (!controller.signal.aborted) { setFailed(true); setNotice('정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.') } }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [active, criteria, answers, view, savedKey, revision])
  return { response, criteria, setCriteria, resetCriteria: () => setCriteria(defaults), recommended, items, categories, total, notice, busy, failed, retry: () => setRevision(v => v + 1) }
}
