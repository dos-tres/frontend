import { useEffect, useMemo, useState } from 'react'
import { filterPolicies, loadPolicyCatalog, profilePolicyCriteria, requestRecommendations, toProgram, type PolicyCatalog, type PolicyCriteria, type PolicyProfile } from './policy-api'
import type { Answers } from './checkin-api'
import type { Program } from './data'

export function usePolicyCatalog(active: boolean, answers: Answers, profile: PolicyProfile) {
  const [catalog, setCatalog] = useState<PolicyCatalog>()
  const defaults = useMemo(() => profilePolicyCriteria(catalog, profile), [catalog, profile.birthDate, profile.regionLabel, profile.employment, profile.regionCode, profile.school])
  const [criteria, setCriteria] = useState<PolicyCriteria>(defaults)
  useEffect(() => { setCriteria(defaults) }, [defaults])
  const [recommended, setRecommended] = useState<Program[]>()
  const [notice, setNotice] = useState('')
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
    if (!catalog || !active || !criteria.age || criteria.region.length < 5 || !catalog.regionGroups.some(codes => codes.includes(criteria.region.slice(0, 5)))) { setRecommended(undefined); setBusy(false); setNotice(''); return }
    const controller = new AbortController()
    setBusy(true); setRecommended(undefined); setNotice('')
    requestRecommendations(criteria, answers, controller.signal).then(result => {
      if (controller.signal.aborted) return
      setRecommended([...result.policies, ...result.programs].map(item => toProgram(item, catalog.items.find(p => p.id === item.id))))
      setNotice(result.programs_notice?.message || '')
    }).catch(() => {
      // Keep the browsable catalog and entered filters when the API is unavailable.
      if (!controller.signal.aborted) { setRecommended(undefined); setNotice('') }
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [catalog, active, criteria, answers])
  const local = catalog ? filterPolicies(catalog.items, catalog, criteria, '', '전체', false, false, []) : []
  return { catalog, criteria, setCriteria, resetCriteria: () => setCriteria(defaults), recommended, items: recommended ?? local, notice, busy, failed, retry: () => setRevision(v => v + 1) }
}
