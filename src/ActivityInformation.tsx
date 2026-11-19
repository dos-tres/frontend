import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Choices, SaveSettings, SettingsShell } from './ProfileSettings'

export type ActivityExperience = { id: string; title: string; category: string; status: string }
export type ActivityInformationValue = {
  employment: string
  interests: string[]
  participation: string
  groupSize: string
  experiences: ActivityExperience[]
}
export const initialActivityInformation: ActivityInformationValue = { employment: '', interests: [], participation: '', groupSize: '', experiences: [] }
const interestOptions = ['취업·진로', '주거', '생활·금융', '교육·자격증', '창업', '건강·마음', '문화·여가', '지역 활동']

export default function ActivityInformation({ value, onSave, onBack }: { value: ActivityInformationValue; onSave: (value: ActivityInformationValue) => void; onBack: () => void }) {
  const [draft, setDraft] = useState(() => ({ ...value, interests: [...value.interests], experiences: value.experiences.map(e => ({ ...e })) }))
  const changeExperience = (id: string, patch: Partial<ActivityExperience>) => setDraft(v => ({ ...v, experiences: v.experiences.map(e => e.id === id ? { ...e, ...patch } : e) }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ ...draft, experiences: draft.experiences.map(e => ({ ...e, title: e.title.trim() })) }) }
  return <SettingsShell title="내 상태 입력" description="해온 활동과 관심사, 편한 참여 방식을 직접 등록해요." onBack={onBack}>
    <form onSubmit={submit}>
      <section className="panel settings-section">
        <div className="settings-section-heading"><h2>지금 하는 일</h2><p>현재의 활동 상황을 선택해 주세요.</p></div>
        <Choices label="활동 상태" options={['구직 중', '재직 중', '재학 중', '창업·자영업', '쉬고 있어요']} value={draft.employment} onChange={employment => setDraft(v => ({ ...v, employment }))} />
      </section>
      <section className="panel settings-section">
        <div className="section-head"><h2 className="section-label">나의 활동 경험</h2><button type="button" className="btn btn-secondary" onClick={() => setDraft(v => ({ ...v, experiences: [...v.experiences, { id: crypto.randomUUID(), title: '', category: '교육·훈련', status: '참여 중' }] }))}><Plus size={16} /> 활동 추가</button></div>
        <p className="settings-help">교육, 자격증 준비, 일, 대외활동 등 직접 해온 경험을 남겨요.</p>
        {!draft.experiences.length && <p className="empty-inline">등록한 활동이 없어요. 남기고 싶은 경험부터 추가해 보세요.</p>}
        {draft.experiences.map((experience, index) => <fieldset className="settings-experience" key={experience.id}>
          <legend>활동 {index + 1}</legend>
          <label className="field-label">활동 이름<input required maxLength={100} value={experience.title} placeholder="예: 컴퓨터 활용 교육, 취업 스터디" onChange={e => changeExperience(experience.id, { title: e.target.value })} /></label>
          <div className="settings-input-grid"><label className="field-label">활동 종류<select value={experience.category} onChange={e => changeExperience(experience.id, { category: e.target.value })}>{['교육·훈련', '자격증·어학', '근무·인턴', '대외활동·봉사', '취미·모임', '기타'].map(o => <option key={o}>{o}</option>)}</select></label>
          <label className="field-label">참여 상태<select value={experience.status} onChange={e => changeExperience(experience.id, { status: e.target.value })}>{['참여 중', '참여 완료', '중단'].map(o => <option key={o}>{o}</option>)}</select></label></div>
          <button type="button" className="btn btn-ghost" aria-label={`활동 ${index + 1} 삭제`} onClick={() => setDraft(v => ({ ...v, experiences: v.experiences.filter(e => e.id !== experience.id) }))}><Trash2 size={16} /> 삭제</button>
        </fieldset>)}
      </section>
      <section className="panel settings-section"><div className="settings-section-heading"><h2>관심 분야</h2><p>알아보고 싶은 분야를 모두 선택해 주세요.</p></div>
        <fieldset className="settings-fieldset"><legend className="settings-sr-only">관심 분야 · 여러 개 선택 가능</legend><div className="settings-options">{interestOptions.map(interest => <label key={interest} className={`filter-chip settings-choice ${draft.interests.includes(interest) ? 'active' : ''}`}><input type="checkbox" checked={draft.interests.includes(interest)} onChange={() => setDraft(v => ({ ...v, interests: v.interests.includes(interest) ? v.interests.filter(i => i !== interest) : [...v.interests, interest] }))} /><span>{interest}</span></label>)}</div></fieldset>
      </section>
      <section className="panel settings-section"><div className="settings-section-heading"><h2>참여 선호</h2><p>어떤 방식이 편한지 직접 선택해요.</p></div>
        <Choices label="편한 참여 방식" options={['온라인', '직접 방문', '둘 다 좋아요']} value={draft.participation} onChange={participation => setDraft(v => ({ ...v, participation }))} />
        <Choices label="편한 모임 규모" options={['혼자 참여', '소규모 모임', '규모 상관없어요']} value={draft.groupSize} onChange={groupSize => setDraft(v => ({ ...v, groupSize }))} />
      </section>
      <SaveSettings onCancel={onBack} label="활동 정보 저장" />
    </form>
  </SettingsShell>
}
