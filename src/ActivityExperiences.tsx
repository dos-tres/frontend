import { Plus, Trash2 } from 'lucide-react'
import type { ActivityExperience } from './ActivityInformation'
export default function ActivityExperiences({ value, onChange }: { value: ActivityExperience[]; onChange: (next: ActivityExperience[]) => void }) {
 const changeExperience = (id: string, patch: Partial<ActivityExperience>) => onChange(value.map(e => e.id === id ? { ...e, ...patch } : e))
 return (<section className="panel settings-section">
        <div className="section-head"><h2 className="section-label">나의 활동 경험</h2><button type="button" className="btn btn-secondary" onClick={() => onChange([...value, { id: crypto.randomUUID(), title: '', category: '교육·훈련', status: '참여 중' }])}><Plus size={16} /> 활동 추가</button></div>
        <p className="settings-help">교육, 자격증 준비, 일, 대외활동 등 직접 해온 경험을 남겨요. 활동 경험은 이 브라우저에만 보관하며 현재 추천에는 전달하지 않아요.</p>
        {!value.length && <p className="empty-inline">등록한 활동이 없어요. 남기고 싶은 경험부터 추가해 보세요.</p>}
        {value.map((experience, index) => <fieldset className="settings-experience" key={experience.id}>
          <legend>활동 {index + 1}</legend>
          <label className="field-label">활동 이름<input required maxLength={100} value={experience.title} placeholder="예: 컴퓨터 활용 교육, 취업 스터디" onChange={e => changeExperience(experience.id, { title: e.target.value })} /></label>
          <div className="settings-input-grid"><label className="field-label">활동 종류<select value={experience.category} onChange={e => changeExperience(experience.id, { category: e.target.value })}>{['교육·훈련', '자격증·어학', '근무·인턴', '대외활동·봉사', '취미·모임', '기타'].map(o => <option key={o}>{o}</option>)}</select></label>
          <label className="field-label">참여 상태<select value={experience.status} onChange={e => changeExperience(experience.id, { status: e.target.value })}>{['참여 중', '참여 완료', '중단'].map(o => <option key={o}>{o}</option>)}</select></label></div>
          <button type="button" className="btn btn-ghost" aria-label={`활동 ${index + 1} 삭제`} onClick={() => onChange(value.filter(e => e.id !== experience.id))}><Trash2 size={16} /> 삭제</button>
        </fieldset>)}
      </section>)
}
