import { RegionSelection } from './RegionSelection'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Check, ExternalLink, FileText, Search, SlidersHorizontal } from 'lucide-react'
import type { Program } from './data'
import { isClosed, periodLabel, safePolicyUrl, policyProvinces, policyDistricts } from './policy-api'
import { usePolicyCatalog } from './use-policy-catalog'
import './policy-pages.css'

export type PolicyView = { query: string; type: string; onlyOpen: boolean; onlySaved: boolean; sort: string; page: number }
export const initialPolicyView: PolicyView = { query: '', type: '전체', onlyOpen: true, onlySaved: false, sort: '기본순', page: 1 }
const PAGE_SIZE = 12
export function PolicyListPage({ data, view, setView, onSelect, saved, onToggleSave, onCheck, onUseProfile, onEditProfile }: {
  data: ReturnType<typeof usePolicyCatalog>; view: PolicyView; setView: (value: PolicyView) => void;
  onSelect: (p: Program) => void; saved: string[]; onToggleSave: (id: string) => void; onCheck: () => void; onUseProfile: () => void; onEditProfile: () => void
}) {
  const [draftQuery, setDraftQuery] = useState(view.query)
  useEffect(() => { setDraftQuery(view.query) }, [view.query])
  const changeRegion = (region: string) => { data.setCriteria({ ...data.criteria, region }); change({}) }
  const change = (patch: Partial<PolicyView>) => setView({ ...view, page: 1, ...patch })
  const terms = view.query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const filtered = data.items.filter(p => (!view.onlyOpen || !isClosed(p)) && (!view.onlySaved || saved.includes(p.id)) &&
    (view.type === '전체' || view.type === p.type) && terms.every(term => `${p.title} ${p.summary} ${p.source} ${p.category || ''}`.toLowerCase().includes(term)))
  if (view.sort === '마감 임박순') filtered.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))
  if (view.sort === '가나다순') filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(view.page, pages)
  const submit = (event: FormEvent) => { event.preventDefault(); change({ query: draftQuery }) }
  const reset = () => { setDraftQuery(''); data.resetCriteria(); setView(initialPolicyView) }
  return <>
    <div className="page-title"><h1>정책·활동 찾기</h1><p>청년정책과 지역 프로그램을 살펴보고, 나에게 필요한 지원을 찾아보세요.</p></div>
    <section className="panel panel-gray search-panel">
      <form onSubmit={submit}>
        <div className="search-input"><Search size={18} /><input aria-label="정책·프로그램 검색" value={draftQuery} onChange={e => setDraftQuery(e.target.value)} placeholder="정책명, 지원 내용, 운영기관 검색" /><button className="btn btn-primary" type="submit">검색</button></div>
        <div className="policy-criteria">
          <div className="policy-region-control"><span className="policy-field-label">지역</span><RegionSelection value={data.criteria.region} onChange={changeRegion} /></div>
          <button className="btn btn-secondary" type="button" onClick={reset}>내 지역으로</button>
          <span className="policy-profile-age">{data.criteria.age ? `만 ${data.criteria.age}세 기준` : '생년월일 미등록'}<button className="policy-profile-link" type="button" onClick={onEditProfile}>내 정보 수정</button></span>
        </div>
        <p className="search-helper">내 정보의 나이와 거주 지역을 기본으로 보여드려요. 다른 지역도 선택해 살펴볼 수 있어요.</p>
      </form>
      <div className="filter-row"><span><SlidersHorizontal size={14} /> 분류</span>{['전체', '정책', '프로그램'].map(type => <button className={`filter-chip ${view.type === type ? 'active' : ''}`} aria-pressed={view.type === type} onClick={() => change({ type })} key={type}>{type}</button>)}
        <label className="policy-checkbox"><input type="checkbox" checked={view.onlyOpen} onChange={e => change({ onlyOpen: e.target.checked })} /> 마감 제외</label>
        <label className="policy-checkbox"><input type="checkbox" checked={view.onlySaved} onChange={e => change({ onlySaved: e.target.checked })} /> 관심 목록</label>
      </div>
    </section>
    <div className="results-layout policy-results-layout">
      <section className="panel panel-gray results-panel" aria-busy={data.busy || !data.catalog}>
        <div className="section-head"><h3>{data.recommended ? '조건별 추천' : '정책·프로그램 목록'}</h3><div className="policy-result-tools"><span role="status">{filtered.length.toLocaleString()}건{data.busy ? ' · 추천 확인 중' : ''}</span><select aria-label="정렬" value={view.sort} onChange={e => change({ sort: e.target.value })}>{['기본순', '마감 임박순', '가나다순'].map(sort => <option key={sort}>{sort}</option>)}</select></div></div>
        {!data.catalog && data.recommended === undefined && <p className="empty-state" role="status">{data.failed ? '목록을 불러오지 못했어요.' : '정책 정보를 불러오고 있어요.'}{data.failed && <button className="btn btn-secondary" onClick={data.retry}>목록 불러오기</button>}</p>}
        {data.notice && <p className="search-helper">{data.notice}</p>}
        {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => <article className="result-card" key={p.id}>
          <div className="result-icon"><FileText size={20} /></div>
          <div className="result-content"><span className="result-type">{p.type} · {p.category || p.region}{isClosed(p) ? ' · 마감' : p.deadline ? ` · ~${p.deadline}` : ' · 일정 확인'}</span><h3><button className="policy-title-button" onClick={() => onSelect(p)}>{p.title}</button></h3><p>{p.summary || '상세 공고에서 지원 내용을 확인해 주세요.'}</p><small>{p.source} · {periodLabel(p.period)}</small>{p.why?.length ? <p className="policy-reason">{p.why[0]}</p> : null}</div>
          <div className="result-actions"><button className={`icon-button ${saved.includes(p.id) ? 'saved' : ''}`} aria-pressed={saved.includes(p.id)} onClick={() => onToggleSave(p.id)} aria-label={`${p.title} 관심 ${saved.includes(p.id) ? '해제' : '저장'}`}><Bookmark size={17} /></button><button className="btn btn-secondary" onClick={() => onSelect(p)}>상세 보기</button></div>
        </article>)}
        {data.catalog && !filtered.length && <div className="empty-state"><p>선택한 조건에 맞는 정보가 없어요. 검색어나 조건을 바꿔 보세요.</p><button className="btn btn-secondary" onClick={reset}>조건 초기화</button></div>}
        {filtered.length > PAGE_SIZE && <nav className="policy-pagination" aria-label="검색 결과 페이지"><button className="btn btn-secondary" disabled={page === 1} onClick={() => setView({ ...view, page: page - 1 })}>이전</button><span aria-live="polite">{page} / {pages}</span><button className="btn btn-secondary" disabled={page === pages} onClick={() => setView({ ...view, page: page + 1 })}>다음</button></nav>}
      </section>
      <aside className="panel joy-side-card policy-guide"><span className="mini-label">지원 정보 살펴보기</span><h3>내 조건에 맞게 찾아보세요</h3><p>내 정보와 상태 점검 답변을 바탕으로 필요한 도움을 좁혀볼 수 있어요.</p><div className="mini-checks"><span><Check size={14} /> 나이·거주 지역 확인</span><span><Check size={14} /> 지원 내용·신청 조건 비교</span><span><Check size={14} /> 공식 공고에서 최종 확인</span></div><button className="btn btn-secondary" onClick={() => { onUseProfile() }}>내 거주 지역으로 보기</button><button className="btn btn-primary" onClick={onCheck}>내 상태 점검하기 <ArrowRight size={14} /></button><p className="search-helper">수집 기준: {data.catalog?.generatedAt || '확인 중'}. 공고의 변경·마감 여부는 운영기관에서 확인해 주세요.</p></aside>
    </div>
  </>
}

export function PolicyDetailPage({ program, onApply, onSave, isSaved, onBack }: { program: Program; onApply: () => void; onSave: () => void; isSaved: boolean; onBack: () => void }) {
  const reference = safePolicyUrl(program.referenceUrl) || safePolicyUrl(program.applyUrl)
  const apply = safePolicyUrl(program.applyUrl) || reference
  const closed = isClosed(program)
  return <>
    <button className="btn btn-ghost policy-back" onClick={onBack}><ArrowLeft size={16} /> 목록으로 돌아가기</button>
    <div className="page-title"><h1>정책·활동 상세</h1><p>지원 내용과 신청 조건을 확인하고, 공식 공고에서 신청을 준비하세요.</p></div>
    <div className="two-column policy-detail-layout">
      <section className="panel panel-gray detail-panel policy-detail"><span className="result-type">{program.type} · {program.category || program.region}{closed ? ' · 마감' : ''}</span><h2>{program.title}</h2><p>{program.summary}</p>
        <div className="divider" />
        <dl className="detail-list"><div><dt>지원 대상</dt><dd>{program.target}</dd></div><div><dt>신청 기간</dt><dd>{periodLabel(program.period)}</dd></div><div><dt>운영 기관</dt><dd>{program.source}</dd></div>{program.type !== '정책' && <div><dt>참여 장소</dt><dd>{program.place}</dd></div>}</dl>
        {program.why?.length ? <section className="policy-detail-section"><h3>추천 이유</h3><ul>{program.why.map(why => <li key={why}>{why}</li>)}</ul></section> : null}
        <section className="policy-detail-section"><h3>지원 내용</h3><p>{program.support || program.summary || '공식 공고에서 확인해 주세요.'}</p></section>
        {program.income && <section className="policy-detail-section"><h3>소득 조건</h3><p>{program.income}</p></section>}
        <section className="policy-detail-section"><h3>신청 방법</h3><p>{program.method}</p></section>
        {program.documents && <section className="policy-detail-section"><h3>제출 서류</h3><p>{program.documents}</p></section>}
        {program.exclusions && <section className="policy-detail-section"><h3>참여 제한</h3><p>{program.exclusions}</p></section>}
        {program.evergreen && <p className="notice">이용 전에 센터에 운영 여부를 확인해 주세요.</p>}
        <div className="button-row"><button className="btn btn-secondary" onClick={onSave} aria-pressed={isSaved}><Bookmark size={15} />{isSaved ? '관심 목록에서 해제' : '관심 목록에 저장'}</button>{reference && <a className="btn btn-secondary" href={reference} target="_blank" rel="noopener noreferrer">공식 공고 확인 <ExternalLink size={15} /></a>}</div>
      </section>
      <aside className="panel steps-panel policy-guide"><h3>{closed ? '신청 기간이 지난 공고예요' : '신청 전에 확인해 주세요'}</h3><p>지원 조건을 충족하는지, 필요한 서류가 무엇인지 공식 공고에서 확인하세요.</p>{apply && !closed && <a className="btn btn-primary" href={apply} target="_blank" rel="noopener noreferrer">신청 페이지 확인 <ExternalLink size={15} /></a>}{!reference && <p className="notice">등록된 공고 링크가 없어요. 운영기관에서 공고명을 검색해 확인해 주세요.</p>}<button className="btn btn-secondary" onClick={onApply}>신청 준비하기 <ArrowRight size={15} /></button><div className="divider" /><h4>신청 이력도 남겨보세요</h4><p>신청 준비 화면에서 관심 공고와 진행 상황을 기록할 수 있어요.</p></aside>
    </div>
  </>
}
