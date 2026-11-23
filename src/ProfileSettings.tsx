import { RegionSelection } from './RegionSelection'
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

export function SettingsShell({ title, description, onBack, children, backLabel = '마이페이지로 돌아가기', hideBack = false, actions }: { actions?:ReactNode; hideBack?: boolean; backLabel?: string; title: string; description: string; onBack: () => void; children: ReactNode }) {
  return <div className="profile-settings">
    {!hideBack && <button type="button" className="btn btn-ghost settings-back" onClick={onBack}><ArrowLeft size={16} /> {backLabel}</button>}
    <header className="page-title"><div className="settings-title-actions"><h1>{title}</h1>{actions}</div><p>{description}</p></header>
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
  return <div className="settings-region"><h3>거주 지역</h3><RegionSelection value={value} onChange={onChange} allowNationwide={false} /><p className="settings-help">동·읍·면까지 선택할 수 있어요. 상세 주소는 입력하지 않아요.</p></div>
}

export function SaveSettings({ onCancel, label = '수정 완료', cancelLabel = '취소', subtleCancel = false }: { subtleCancel?: boolean; cancelLabel?: string; onCancel: () => void; label?: string }) {
  return <div className="panel settings-save"><div><p>입력한 내용은 이 브라우저에 저장돼요.</p><small>같은 주소에서 재방문해도 유지돼요. 계정과 동기화되지 않아요.</small></div><div>
    <button type="button" className={subtleCancel ? "text-button" : "btn btn-secondary"} onClick={onCancel}>{cancelLabel}</button><button className="btn btn-primary" type="submit"><Check size={18} />{label}</button>
  </div></div>
}

export default function ProfileSettings({ value, onSave, onBack, onboarding = false }: { value: PersonalInformation; onSave: (next: PersonalInformation) => void; onBack: () => void; onboarding?: boolean }) {
  const [draft, setDraft] = useState(value)
  const change = (key: keyof PersonalInformation, next: string) => setDraft(current => ({ ...current, [key]: next }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ ...draft, name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim() }) }
  return <SettingsShell title="내 정보" hideBack={onboarding} description={onboarding ? "나이와 거주 지역으로 지원 정보를 찾아요. 비워 두고 나중에 입력해도 돼요." : "기본 정보를 관리해요. 이름과 연락처는 선택 항목이에요."} onBack={onBack}>
    <form onSubmit={submit}>
      <section className="panel settings-section">
        <div className="settings-section-heading"><h2>기본 신상정보</h2><p>입력할 수 있는 항목만 작성해 주세요.</p></div>
        <div className="settings-input-grid">
          {!onboarding && <label className="field-label">이름<input autoComplete="name" maxLength={50} value={draft.name} onChange={e => change('name', e.target.value)} /></label>}
          <label className="field-label">생년월일<input type="date" autoComplete="bday" max={new Date().toLocaleDateString('sv-SE')} value={draft.birthDate} onChange={e => change('birthDate', e.target.value)} /></label>
          {!onboarding && <label className="field-label">휴대전화 번호<input type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="010-0000-0000" value={draft.phone} onChange={e => change('phone', e.target.value)} /></label>}
          {!onboarding && <label className="field-label">이메일<input type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" value={draft.email} onChange={e => change('email', e.target.value)} /></label>}
        </div>
      </section>
      <section className="panel settings-section"><RegionPicker value={draft.regionCode} onChange={code => change('regionCode', code)} /></section>
      <SaveSettings subtleCancel={onboarding} onCancel={onBack} cancelLabel={onboarding ? "나중에 하기" : undefined} label={onboarding ? "다음" : "저장하기"} />
    </form>
  </SettingsShell>
}
