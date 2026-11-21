import { RegionSelection } from './RegionSelection'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, ExternalLink, Search, SlidersHorizontal } from 'lucide-react'
import type { Program } from './data'
import { applicationLabel, periodLabel, safePolicyUrl, type CatalogQuery } from './policy-api'
import { usePolicyCatalog } from './use-policy-catalog'
import './policy-pages.css'

export type PolicyView = CatalogQuery
export const initialPolicyView: PolicyView = { query: '', type: '전체', category: '', onlyOpen: true, onlySaved: false, mode: 'all', sort: '기본순', page: 1 }
export function PolicyListPage({ data, view, setView, onSelect, saved, onToggleSave, onCheck, onUseProfile, onEditProfile }: {
  data: ReturnType<typeof usePolicyCatalog>; view: PolicyView; setView: (value: PolicyView) => void;
  onSelect: (p: Program) => void; saved: string[]; onToggleSave: (id: string) => void; onCheck: () => void; onUseProfile: () => void; onEditProfile: () => void
}) {
  const [draftQuery, setDraftQuery] = useState(view.query)
  useEffect(() => { setDraftQuery(view.query) }, [view.query])
  const change = (patch: Partial<PolicyView>) => setView({ ...view, page: 1, ...patch })
  const submit = (event: FormEvent) => { event.preventDefault(); change({ query: draftQuery, mode: 'all' }) }
  const filtered = data.items.filter(p => (view.type === '전체' || p.type === view.type) && (!view.category || p.categories?.includes(view.category)))
  if (view.mode === 'recommended' && view.sort === '마감 임박순') filtered.sort((a,b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))
  if (view.mode === 'recommended' && view.sort === '가나다순') filtered.sort((a,b) => a.title.localeCompare(b.title, 'ko'))
  return <>
    <div className="page-title"><h1>정책·활동 찾기</h1><p>필요한 지원을 찾고, 조이와 함께 내용과 신청 조건을 살펴보세요.</p></div>
    <section className="panel panel-gray search-panel">
      <form onSubmit={submit}>
        <div className="search-input"><Search size={18} /><input aria-label="정책·프로그램 검색" value={draftQuery} onChange={e => setDraftQuery(e.target.value)} placeholder="정책명, 지원 내용, 보조금·상담 등 검색" /><button className="btn btn-primary" type="submit">검색</button></div>
        <div className="policy-criteria"><div className="policy-region-control"><span className="policy-field-label">지역</span><RegionSelection value={data.criteria.region} onChange={region => { data.setCriteria({ ...data.criteria, region }); change({}) }} /></div><button className="btn btn-secondary" type="button" onClick={onUseProfile}>내 지역으로</button><span className="policy-profile-age">{data.criteria.age ? `만 ${data.criteria.age}세 기준` : '나이 미등록'}<button className="policy-profile-link" type="button" onClick={onEditProfile}>내 정보 수정</button></span></div>
      </form>
      <p className="search-helper">거주지를 등록하기 전에는 서울을 중심으로 살펴봐요. 지역을 바꿔 다른 정책도 찾아볼 수 있어요.</p>
      <div className="filter-row" aria-label="조회 방식">{[['all','전체 탐색'],['recommended','맞춤 추천']].map(([mode,label]) => <button key={mode} className={`filter-chip ${view.mode === mode ? 'active' : ''}`} aria-pressed={view.mode === mode} onClick={() => change({ mode, category: '', onlySaved: false, query: '' })}>{label}</button>)}</div>
      <div className="filter-row"><span><SlidersHorizontal size={14} /> 종류</span>{['전체','정책','프로그램'].map(type => <button key={type} className={`filter-chip ${view.type === type ? 'active' : ''}`} aria-pressed={view.type === type} onClick={() => change({ type, category: '' })}>{type}</button>)}<label className="policy-checkbox"><input type="checkbox" checked={view.onlyOpen} onChange={e => change({ onlyOpen: e.target.checked })} /> 마감 제외</label><label className="policy-checkbox"><input type="checkbox" checked={view.onlySaved} onChange={e => change({ onlySaved: e.target.checked })} /> 관심 목록</label></div>
      <div className="filter-row" aria-label="지원 분야"><span>분야</span><button className={`filter-chip ${!view.category ? 'active' : ''}`} aria-pressed={!view.category} onClick={() => change({ category: '' })}>전체 분야</button>{data.categories.map(category => <button key={category} className={`filter-chip ${view.category === category ? 'active' : ''}`} aria-pressed={view.category === category} onClick={() => change({ category })}>{category}</button>)}</div>
    </section>
    <section className="panel results-panel policy-results-layout" aria-busy={data.busy}>
      <div className="section-head"><h2>{view.onlySaved ? '관심 목록' : view.mode === 'recommended' ? '나에게 맞는 추천' : '정책·프로그램 목록'}</h2><div className="policy-result-tools"><label>정렬 <select aria-label="정렬" value={view.sort} onChange={e => change({sort:e.target.value})}>{['기본순','마감 임박순','가나다순'].map(s => <option key={s}>{s}</option>)}</select></label><span role="status">{data.busy ? '불러오는 중…' : `${view.mode === 'recommended' ? filtered.length : data.total}건`}</span></div></div>
      {data.notice && <p className="search-helper" role={data.failed ? 'alert' : undefined}>{data.notice}</p>}
      {data.failed && <button className="btn btn-secondary" onClick={data.retry}>다시 불러오기</button>}
      {filtered.map(p => <article className="result-card policy-list-row" key={p.id}>
        <div className="result-content"><div className="policy-row-meta"><span className={`policy-period-status status-${p.applicationStatus || 'unknown'}`}>{applicationLabel(p)}</span><span className="policy-kind-tag">{p.type}</span>{p.categories?.map(c => <span className="policy-category-tag" key={c}>{c}</span>)}<span className="policy-region-tag">{p.region}</span></div>
          <h3><button className="policy-title-button" onClick={() => onSelect(p)}>{p.title}</button></h3><p>{p.summary}</p>
          <p className="policy-application-period"><strong>신청 기간</strong><span>{periodLabel(p.period)}</span></p>
          {p.source && <small>{p.source}</small>}
          {!!p.keywords?.length && <div className="policy-keywords">{p.keywords.map(k => <span key={k}>#{k}</span>)}</div>}
          {!!p.why?.length && <p className="policy-reason">{p.why[0]}</p>}
        </div>
        <div className="result-actions policy-row-actions"><button className={`icon-button ${saved.includes(p.id) ? 'saved' : ''}`} aria-pressed={saved.includes(p.id)} onClick={() => onToggleSave(p.id)} aria-label={`${p.title} 관심 ${saved.includes(p.id) ? '해제' : '저장'}`}><Bookmark size={17} /></button><button className="btn btn-primary" onClick={() => onSelect(p)}>조이와 알아보기 <ArrowRight size={15} /></button>{safePolicyUrl(p.referenceUrl || p.applyUrl) && <a className="policy-official-link" href={safePolicyUrl(p.referenceUrl || p.applyUrl)} target="_blank" rel="noopener noreferrer">공식 공고 <ExternalLink size={12} /></a>}</div>
      </article>)}
      {!data.busy && !data.failed && !filtered.length && <div className="empty-state"><p>조건에 맞는 정보가 없어요.</p><button className="btn btn-secondary" onClick={() => { onUseProfile(); setView(initialPolicyView) }}>조건 초기화</button>{view.mode === 'recommended' && <button className="btn btn-secondary" onClick={onEditProfile}>내 정보 확인</button>}</div>}
      {view.mode === 'all' && !view.onlySaved && data.total > 12 && <nav className="policy-pagination" aria-label="검색 결과 페이지"><button className="btn btn-secondary" disabled={view.page <= 1 || data.busy} onClick={() => setView({ ...view, page: view.page - 1 })}>이전</button><span>{view.page} / {Math.ceil(data.total / 12)}</span><button className="btn btn-secondary" disabled={view.page * 12 >= data.total || data.busy} onClick={() => setView({ ...view, page: view.page + 1 })}>다음</button></nav>}
    </section>
  </>
}

export function PolicyDetailPage({ program, onApply, onSave, isSaved, onBack }: { program: Program; onApply: () => void; onSave: () => void; isSaved: boolean; onBack: () => void }) {
  return <><button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} /> 목록으로</button><section className="panel policy-detail"><h1>{program.title}</h1><p>{program.summary}</p><p>{program.support}</p><p>신청 기간 · {periodLabel(program.period)}</p>{program.target && <p>지원 대상 · {program.target}</p>}{program.method && <p>신청 방법 · {program.method}</p>}{program.documents && <p>제출 서류 · {program.documents}</p>}{program.exclusions && <p>참여 제한 · {program.exclusions}</p>}{program.income && <p>소득 조건 · {program.income}</p>}<button className="btn btn-primary" onClick={onApply}>조이와 알아보기</button><button className="btn btn-secondary" onClick={onSave}>{isSaved ? '관심 해제' : '관심 저장'}</button>{safePolicyUrl(program.referenceUrl || program.applyUrl) && <a className="policy-official-link" href={safePolicyUrl(program.referenceUrl || program.applyUrl)} target="_blank" rel="noopener noreferrer">공식 공고 <ExternalLink size={12} /></a>}</section></>
}
