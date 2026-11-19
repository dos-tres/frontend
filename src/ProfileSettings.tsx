import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Check, Search, MapPin, ArrowRight, ArrowLeft } from 'lucide-react'
import regions from './data/regions.json'
import './profile-settings.css'

export type PersonalInformation = {
  name: string
  birthDate: string
  phone: string
  email: string
  regionCode: string
}
export const initialPersonalInformation: PersonalInformation = {
  name: '', birthDate: '', phone: '', email: '',
  regionCode: '',
}
export const profileRegionLabel = (code: string) => regions.find(region => region.code === code)?.label ?? '거주 지역을 선택해 주세요'

export function SettingsShell({ title, description, onBack, children }: { title: string; description: string; onBack: () => void; children: ReactNode }) {
  return <div className="profile-settings">
    <button type="button" className="btn btn-ghost settings-back" onClick={onBack}><ArrowLeft size={16} /> 마이페이지로 돌아가기</button>
    <header className="page-title"><h1>{title}</h1><p>{description}</p></header>
    <div className="settings-editor">{children}</div>
  </div>
}

export function Choices({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <fieldset className="settings-fieldset"><legend>{label}</legend><div className="settings-options">
    {[...options, '선택 안 함'].map(option => {
      const next = option === '선택 안 함' ? '' : option
      return <label key={option} className={`filter-chip settings-choice ${value === next ? 'active' : ''}`}>
        <input type="radio" name={label} checked={value === next} onChange={() => onChange(next)} /><span>{option}</span>
      </label>
    })}
  </div></fieldset>
}

export function RegionPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(20)
  const results = useMemo(() => {
    const terms = query.trim().split(/\s+/).filter(Boolean)
    return regions.filter(r => terms.length ? terms.every(term => r.label.includes(term)) : r.code.length === 5)
  }, [query])
  return <div className="settings-region">
    <h3>거주 지역</h3>
    <div className="settings-region-value"><MapPin size={20} /><strong>{profileRegionLabel(value)}</strong>
      <button type="button" className="btn btn-secondary" aria-expanded={open} aria-controls="region-picker" onClick={() => { setOpen(v => !v); setQuery(''); setLimit(20) }}>{value ? '지역 변경' : '지역 선택'}</button>
    </div>
    {open && <div className="settings-region-picker" id="region-picker">
      <label htmlFor="region-search">시·군·구 또는 읍·면·동 검색</label>
      <div className="settings-search"><Search size={20} /><input id="region-search" autoFocus type="search" value={query} placeholder="예: 강서구 염창동, 부산 해운대구" onChange={e => { setQuery(e.target.value); setLimit(20) }} /></div>
      <p className="settings-help">검색 결과에서 거주 지역을 선택해 주세요. 상세 주소는 입력하지 않아요.</p>
      <p role="status">{results.length}개 지역</p>
      <ul className="settings-region-results">{results.slice(0, limit).map(r => <li key={r.code}><button type="button" aria-pressed={value === r.code} onClick={() => { onChange(r.code); setOpen(false) }}><span>{r.label}</span>{value === r.code ? <Check size={18} /> : <ArrowRight size={16} />}</button></li>)}</ul>
      {!results.length && <p>일치하는 지역이 없어요. 시·군·구나 동 이름으로 다시 검색해 주세요.</p>}
      {results.length > limit && <button type="button" className="btn btn-secondary" onClick={() => setLimit(v => v + 20)}>지역 더 보기</button>}
      <button type="button" className="settings-text-button" onClick={() => setOpen(false)}>검색 닫기</button><small>지역 목록: 2025년 8월 기준</small>
    </div>}
  </div>
}

export function SaveSettings({ onCancel, label = '수정 완료' }: { onCancel: () => void; label?: string }) {
  return <div className="panel settings-save"><div><p>입력한 내용은 이 탭에서 유지돼요.</p><small>새로고침하면 초기화돼요.</small></div><div>
    <button type="button" className="btn btn-secondary" onClick={onCancel}>취소</button><button className="btn btn-primary" type="submit"><Check size={18} />{label}</button>
  </div></div>
}

export default function ProfileSettings({ value, onSave, onBack }: { value: PersonalInformation; onSave: (next: PersonalInformation) => void; onBack: () => void }) {
  const [draft, setDraft] = useState(value)
  const change = (key: keyof PersonalInformation, next: string) => setDraft(current => ({ ...current, [key]: next }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ ...draft, name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim() }) }
  return <SettingsShell title="내 정보 수정" description="이름, 연락처, 거주지 등 기본 정보를 관리해요." onBack={onBack}>
    <form onSubmit={submit}>
      <section className="panel settings-section">
        <div className="settings-section-heading"><h2>기본 신상정보</h2><p>입력할 수 있는 항목만 작성해 주세요.</p></div>
        <div className="settings-input-grid">
          <label className="field-label">이름<input autoComplete="name" maxLength={50} value={draft.name} onChange={e => change('name', e.target.value)} /></label>
          <label className="field-label">생년월일<input type="date" autoComplete="bday" max={new Date().toLocaleDateString('sv-SE')} value={draft.birthDate} onChange={e => change('birthDate', e.target.value)} /></label>
          <label className="field-label">휴대전화 번호<input type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="010-0000-0000" value={draft.phone} onChange={e => change('phone', e.target.value)} /></label>
          <label className="field-label">이메일<input type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" value={draft.email} onChange={e => change('email', e.target.value)} /></label>
        </div>
      </section>
      <section className="panel settings-section"><RegionPicker value={draft.regionCode} onChange={code => change('regionCode', code)} /></section>
      <SaveSettings onCancel={onBack} />
    </form>
  </SettingsShell>
}
