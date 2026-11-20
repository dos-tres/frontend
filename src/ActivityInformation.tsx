import { useState, type FormEvent } from 'react'
import { Choices, SaveSettings, SettingsShell } from './ProfileSettings'

export type ActivityExperience = { id: string; title: string; category: string; status: string }
export type ActivityInformationValue = {
  employment: string
  school: string
  interests: string[]
  participation: string
  groupSize: string
  experiences: ActivityExperience[]
}
export const initialActivityInformation: ActivityInformationValue = { employment: '', school: '', interests: [], participation: '', groupSize: '', experiences: [] }
const interestOptions = ['취업·진로', '주거', '생활·금융', '교육·자격증', '창업', '건강·마음', '문화·여가', '지역 활동']

export default function ActivityInformation({ value, onSave, onBack, onboarding = false }: { value: ActivityInformationValue; onSave: (value: ActivityInformationValue) => void; onBack: () => void; onboarding?: boolean }) {
  const [draft, setDraft] = useState(() => ({ ...value, interests: [...value.interests], experiences: value.experiences.map(e => ({ ...e })) }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ ...draft, experiences: draft.experiences.map(e => ({ ...e, title: e.title.trim() })) }) }
  return <SettingsShell title="맞춤 설정" hideBack={onboarding} description="기본 조건과 관심 분야를 한 번 등록하면, 지원 정보를 찾을 때 다시 입력하지 않아도 돼요." onBack={onBack}>
    <form onSubmit={submit}>
      <section className="panel settings-section">
        <div className="settings-section-heading"><h2>기본 조건</h2><p>현재 상황에 해당하는 항목을 선택해 주세요. 원하지 않는 항목은 비워둘 수 있어요.</p></div>
        <Choices label="현재 상태" options={['구직 중', '재직 중', '재학 중', '아르바이트·단기', '프리랜서', '창업·자영업', '쉬고 있어요']} value={draft.employment} onChange={employment => setDraft(v => ({ ...v, employment }))} />
        <Choices label="재학 상태 · 학생인 경우" options={['고등학생', '대학생', '대학원생']} value={draft.school || ''} onChange={school => setDraft(v => ({ ...v, school }))} />
      </section>
      <section className="panel settings-section"><div className="settings-section-heading"><h2>관심 분야</h2><p>알아보고 싶은 분야를 최대 3개 선택해 주세요. 여기서 저장하거나 생활 점검에서 답한 관심 중 가장 최근에 저장한 값을 다음 추천에 사용해요.</p></div>
        <fieldset className="settings-fieldset"><legend className="settings-sr-only">관심 분야 · 최대 3개 선택 가능</legend><div className="settings-options">{interestOptions.map(interest => <label key={interest} className={`filter-chip settings-choice ${draft.interests.includes(interest) ? 'active' : ''}`}><input type="checkbox" disabled={!draft.interests.includes(interest) && draft.interests.length >= 3} checked={draft.interests.includes(interest)} onChange={() => setDraft(v => ({ ...v, interests: v.interests.includes(interest) ? v.interests.filter(i => i !== interest) : [...v.interests, interest] }))} /><span>{interest}</span></label>)}</div></fieldset>
      </section>
      <section className="panel settings-section"><div className="settings-section-heading"><h2>참여 선호</h2><p>어떤 방식이 편한지 직접 선택해요. 참여 방식과 모임 규모는 이 브라우저에만 보관하며 현재 추천에는 반영되지 않아요.</p></div>
        <Choices label="편한 참여 방식" options={['온라인', '직접 방문', '둘 다 좋아요']} value={draft.participation} onChange={participation => setDraft(v => ({ ...v, participation }))} />
        <Choices label="편한 모임 규모" options={['혼자 참여', '소규모 모임', '규모 상관없어요']} value={draft.groupSize} onChange={groupSize => setDraft(v => ({ ...v, groupSize }))} />
      </section>
      <SaveSettings subtleCancel={onboarding} onCancel={onBack} cancelLabel={onboarding ? "나중에 하기" : undefined} label={onboarding ? "다음" : "맞춤 설정 저장"} />
    </form>
  </SettingsShell>
}
