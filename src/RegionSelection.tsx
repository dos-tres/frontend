import { useId, useState } from 'react'
import { Check, ChevronDown, MapPin, X } from 'lucide-react'
import administrative from './data/administrative-regions.json'
import regions from './data/regions.json'
import './region-selection.css'

export function selectedRegionLabel(code: string) {
  if (!code) return '전국'
  return regions.find(r => r.code === code)?.label || administrative.provinces.find(r => r.code === code)?.fullName || '지역 선택'
}
export function RegionSelection({ value, onChange, allowNationwide = true }: { value: string; onChange: (value: string) => void; allowNationwide?: boolean }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const id = useId()
  const province = draft.slice(0, 2)
  const district = administrative.districts.find(r => r.code === draft.slice(0, 5))
  const districts = administrative.districts.filter(r => r.code.startsWith(province))
  const towns = district ? regions.filter(r => r.code.length === 8 && r.label.startsWith(`${district.label} `)) : []
  const choose = (code: string) => setDraft(code)
  const apply = () => { onChange(draft); setOpen(false) }
  return <div className="region-selection">
    <button type="button" className={`region-selection-trigger ${open ? 'is-open' : ''}`} aria-expanded={open} aria-controls={id} onClick={() => { if (!open) setDraft(value); setOpen(v => !v) }}><MapPin size={17} /><span>{value ? selectedRegionLabel(value) : allowNationwide ? '전국 · 지역 선택' : '거주 지역 선택'}</span><ChevronDown size={17} /></button>
    {open && <section id={id} className="region-selection-panel" aria-label="지역 선택">
      <div className="region-panel-heading"><strong>지역 선택</strong><span>시·도부터 차례로 선택해 주세요.</span><button type="button" className="icon-button" aria-label="지역 선택 닫기" onClick={() => setOpen(false)}><X size={17} /></button></div>
      <div className="region-columns">
        <section className="region-column"><h3>시·도</h3><div className="region-column-scroll">{allowNationwide && <button type="button" className={!draft ? 'is-selected' : ''} aria-pressed={!draft} onClick={() => choose('')}>전국{!draft && <Check size={16} />}</button>}{administrative.provinces.map(p => <button type="button" key={p.code} aria-pressed={province === p.code} className={province === p.code ? 'is-selected' : ''} onClick={() => choose(p.code)}>{p.fullName}{province === p.code && <Check size={16} />}</button>)}</div></section>
        <section className="region-column"><h3>시·구·군</h3><div className="region-column-scroll">{province ? <>{allowNationwide && <button type="button" aria-pressed={draft === province} className={draft === province ? 'is-selected' : ''} onClick={() => choose(province)}>전체{draft === province && <Check size={16} />}</button>}{districts.map(r => <button type="button" key={r.code} aria-pressed={district?.code === r.code} className={district?.code === r.code ? 'is-selected' : ''} onClick={() => choose(r.code)}>{r.label.split(' ').slice(1).join(' ') || r.label}{district?.code === r.code && <Check size={16} />}</button>)}</> : <p className="region-column-empty">시·도를 선택해 주세요.</p>}</div></section>
        <section className="region-column region-town-column"><h3>동·읍·면</h3><div className="region-column-scroll region-town-grid">{district ? <><button type="button" aria-pressed={draft === district.code} className={draft === district.code ? 'is-selected' : ''} onClick={() => choose(district.code)}><span className="region-check"><Check size={12} /></span>전체</button>{towns.map(r => <button type="button" key={r.code} aria-pressed={draft === r.code} className={draft === r.code ? 'is-selected' : ''} onClick={() => choose(r.code)}><span className="region-check"><Check size={12} /></span>{r.label.slice(district.label.length).trim()}</button>)}</> : <p className="region-column-empty">시·구·군을 선택해 주세요.</p>}</div></section>
      </div>
      <div className="region-selection-footer"><div><small>선택한 지역</small><strong>{draft ? selectedRegionLabel(draft) : '전국'}</strong></div><div><button type="button" className="btn btn-secondary" onClick={() => choose(value)}>되돌리기</button><button type="button" className="btn btn-primary" disabled={!allowNationwide && draft.length < 5} onClick={apply}>선택 완료</button></div></div>
    </section>}
  </div>
}
