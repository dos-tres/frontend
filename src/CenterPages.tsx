import { useCenterDistance } from './use-center-distance'
import { centerDistanceOrigin, distanceLabel, orderCenters, type CenterSort } from './center-distance'
import KakaoCenterMap from './KakaoCenterMap'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Building2, ExternalLink, MapPin, Search } from 'lucide-react'
import type { Program } from './data'
import { safePolicyUrl, applicationLabel } from './policy-api'
import { requestCenters, requestCenter, centerPrograms, type CenterList, type CenterDetail, type CenterGuide, type PublicCenter } from './center-api'

export function CenterTags({ kind }: { kind?: string }) {
  const tags = [...new Set((kind || '').split(/[·ㆍ/・,]/).map(tag => tag.trim().replace('정책상담', '정책 상담')).filter(Boolean))]
  return tags.length ? <span className="policy-keywords center-tags" aria-label="센터 특징">{tags.map(tag=><span className="center-tag" key={tag}>#{tag}</span>)}</span> : null
}

export function CenterListPage({ onSelect, savedRegion = '' }: { onSelect: (id: string) => void; savedRegion?: string }) {
  const [draft, setDraft] = useState(''), [query, setQuery] = useState(''), [district, setDistrict] = useState('')
  const [data, setData] = useState<CenterList>(), [failed, setFailed] = useState(false), [busy, setBusy] = useState(true), [revision, setRevision] = useState(0)
  useEffect(() => { const controller = new AbortController(); setBusy(true); setFailed(false); setData(undefined)
    requestCenters(query, district, controller.signal).then(v => { if (!controller.signal.aborted) setData(v) }).catch(() => { if (!controller.signal.aborted) setFailed(true) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [query, district, revision])
  const [distanceRevision, setDistanceRevision] = useState(0)
  const origin = centerDistanceOrigin(savedRegion, district)
  const [sort, setSort] = useState<CenterSort>('nearby')
  const [programsOnly, setProgramsOnly] = useState(false)
  const effectiveSort = origin ? sort : 'basic'
  const distance = useCenterDistance(data?.items, effectiveSort === 'nearby' ? origin : '', distanceRevision)
  const centers = orderCenters(data?.items || [], effectiveSort === 'nearby' && distance.status === 'ready' ? 'nearby' : 'basic', distance.distances, programsOnly)
  const submit = (e: FormEvent) => { e.preventDefault(); setQuery(draft.trim()); setRevision(n=>n+1) }
  return <div className="center-directory"><header className="page-title"><h1>주변센터</h1><p>서울의 청년센터를 지역과 이름으로 찾아보세요.</p></header>
    <form className="panel center-search" onSubmit={submit}><label>지역<select aria-label="센터 지역" value={district} onChange={e=>setDistrict(e.target.value)}><option value="">서울 전체</option>{[...new Set([...(data?.districts || []), ...(district ? [district] : [])])].map(d=><option key={d}>{d}</option>)}</select></label><label>센터 이름·주소<input aria-label="센터 검색" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="센터 이름이나 주소를 입력하세요" maxLength={200} /></label><button className="btn btn-primary" type="submit"><Search size={16}/> 검색</button></form>
    <div className="center-list-tools"><label>정렬<select aria-label="센터 정렬" value={effectiveSort} onChange={e=>setSort(e.target.value as CenterSort)}><option value="nearby" disabled={!origin}>가까운순</option><option value="basic">기본순</option></select></label><label className="policy-checkbox"><input type="checkbox" checked={programsOnly} onChange={e=>setProgramsOnly(e.target.checked)} /> 프로그램 안내 있는 센터만</label></div>
    <div className="center-distance-note">
      {!origin ? <p>거주 지역을 등록하거나 조회 지역을 선택하면 가까운순을 사용할 수 있어요. 지금은 기본순이에요.</p> : effectiveSort === 'basic' ? <p>기본순으로 보고 있어요. 가까운순을 선택하면 {origin} 중심에서의 직선거리를 확인할 수 있어요.</p> : <>
        <p><strong>{origin} 중심 기준</strong> · {distance.status === 'loading' ? '거리를 확인하고 있어요…' : distance.status === 'ready' ? '가까운순 · 직선거리' : distance.status === 'failed' ? '거리를 확인하지 못해 기본순으로 보여드려요.' : '직선거리 기준'}</p>
        <small>정확한 집 위치나 현재 위치를 사용하지 않아요. 지역 중심과 센터 주소의 좌표를 카카오맵에서 조회해 대략적인 직선거리를 계산해요.</small>
        {distance.status === 'ready' && distance.missing > 0 && <p>거리 확인이 어려운 {distance.missing}곳은 각 그룹의 뒤에 표시해요.</p>}
        {distance.status === 'failed' && <button className="text-button" onClick={()=>setDistanceRevision(n=>n+1)}>거리 다시 확인</button>}
      </>}
    </div>
    <section className="panel" aria-busy={busy || distance.status === 'loading'}><div className="section-head"><h2>서울 청년센터</h2>{data && <span>{centers.length}곳</span>}</div>
      {busy && <p role="status">센터를 불러오고 있어요.</p>}{failed && <p role="alert">센터를 불러오지 못했어요. <button className="text-button" onClick={()=>setRevision(n=>n+1)}>다시 불러오기</button></p>}
      {data && !centers.length && <p>조건에 맞는 센터가 없어요. 검색어나 지역을 바꾸거나 프로그램 필터를 해제해 보세요.</p>}
      {centers.map(center=><CenterListRow key={center.id} center={center} onSelect={onSelect} showDistance={effectiveSort === 'nearby' && distance.status === 'ready'} distance={distance.distances[center.id]} />)}
    </section>
  </div>
}

export function CenterDetailPage({ id, onBack, onProgram, onAsk }: { onAsk?: (center: PublicCenter) => void; id: string; onBack: () => void; onProgram: (p: Program) => void }) {
  const [data,setData] = useState<CenterDetail>(), [busy,setBusy] = useState(true), [failed,setFailed] = useState(false), [revision,setRevision] = useState(0)
  useEffect(()=>{ const controller=new AbortController(); setBusy(true); setFailed(false); setData(undefined); window.scrollTo(0,0)
    requestCenter(id,controller.signal).then(v=>{if(!controller.signal.aborted)setData(v)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})
    return ()=>controller.abort()
  },[id,revision])
  return <div className="center-directory">
    <button className="btn btn-ghost policy-back" onClick={onBack}><ArrowLeft size={16}/> 센터 목록</button>
    {busy && <p role="status">센터 상세를 불러오고 있어요.</p>}
    {failed && <p role="alert">센터 정보를 불러오지 못했어요. <button className="text-button" onClick={()=>setRevision(n=>n+1)}>다시 불러오기</button></p>}
    {data && <CenterDetailContent data={data} onProgram={onProgram} onAsk={onAsk} />}
  </div>
}

export function CenterDetailContent({ data, onProgram, onAsk }: { onAsk?: (center: PublicCenter) => void; data: CenterDetail; onProgram: (p: Program) => void }) {
  const center = data.item
  const official = center.official
  const hours = official?.hours || center.guide?.hours
  const homepage = safePolicyUrl(official?.homepage || center.guide?.homepage || center.homepage || '') || safePolicyUrl(center.guide?.source.url || '')
  const programs = centerPrograms(data).filter(p=>p.applicationStatus === 'open' || p.applicationStatus === 'always_open')
  return <>
    <header className="page-title center-introduction"><h1>{center.name}</h1><p>{center.province} · {center.district}</p>{center.guide && <><CenterTags kind={center.guide.kind} /><p className="center-introduction-text">{official?.summary || center.guide.summary}</p></>}</header>
    {onAsk && <button className="btn btn-primary" onClick={()=>onAsk(center)}>조이에게 센터 물어보기 · 방문 일정 잡기</button>}
    <div className={`center-detail-grid ${programs.length ? '' : 'center-detail-single'}`}>
      <section className="panel">
        {official ? <section className="center-guide-section"><h2>공간소개</h2>{!center.guide && official.summary && <p>{official.summary}</p>}{official.sections.map((section,index)=><div key={index}><h3>{section.title}</h3><p>{section.body}</p></div>)}{official.usage && <><h3>공간 이용방법</h3><p>{official.usage}</p></>}{official.directions && <><h3>오시는 길</h3><p>{official.directions}</p></>}</section> : center.guide && <CenterGuideSection guide={center.guide} showSummary={false} showSource={false} />}
        <h2>위치·운영 정보</h2>
        <dl className="detail-list">
          {center.address && <div><dt>주소</dt><dd>{center.address}</dd></div>}
          {hours?.trim() && <div><dt>운영 시간</dt><dd>{hours}</dd></div>}
          {homepage && <div><dt>공식 홈페이지</dt><dd><a className="policy-official-link" href={homepage} target="_blank" rel="noopener noreferrer">바로가기 <ExternalLink size={13}/></a></dd></div>}
        </dl>
        <KakaoCenterMap name={center.name} address={center.address} province={center.province} district={center.district} />
      </section>
      {programs.length > 0 && <section className="panel"><div className="section-head"><h2>현재 모집 중인 프로그램</h2><span>{programs.length}개</span></div>{programs.map(p=><div className="center-program" key={p.id}><span className={`policy-period-status status-${p.applicationStatus}`}>{applicationLabel(p)}</span><h3>{p.title}</h3><p>{p.summary}</p><button className="btn btn-secondary" onClick={()=>onProgram(p)}>조이와 알아보기 <ArrowRight size={15}/></button></div>)}</section>}
    </div>
    {!official && safePolicyUrl(center.guide?.notice_url || '') && <section className="panel center-notices"><h2>공지사항</h2><a className="policy-official-link" href={safePolicyUrl(center.guide?.notice_url || '')} target="_blank" rel="noopener noreferrer">공식 공지사항 보기 <ExternalLink size={13}/></a></section>}
    {official && <section className="panel center-notices"><div className="section-head"><h2>공지사항</h2>{safePolicyUrl(official.notice_url) && <a className="policy-official-link" href={safePolicyUrl(official.notice_url)} target="_blank" rel="noopener noreferrer">전체 공지 보기 <ExternalLink size={13}/></a>}</div>{official.notices?.map(notice=>safePolicyUrl(notice.url)&&<a className="center-notice-row" key={notice.id} href={safePolicyUrl(notice.url)} target="_blank" rel="noopener noreferrer"><span>{notice.title}</span>{notice.date&&<time dateTime={notice.date}>{notice.date}</time>}<ExternalLink size={13}/></a>)}</section>}
  </>
}

export function CenterGuideSection({ guide, showSummary = true, showSource = true }: { guide: CenterGuide; showSummary?: boolean; showSource?: boolean }) {
  const source = safePolicyUrl(guide.source.url)
  return <section className="center-guide-section"><h2>{showSummary ? '어떤 곳인가요?' : '공간 이용 안내'}</h2>{showSummary && <p>{guide.summary}</p>}<h3>이용할 수 있는 것</h3><div className="center-facilities">{guide.facilities.map(item=><span key={item}>{item}</span>)}</div><h3>이용 전에</h3><p>{guide.usage_note}</p>{showSource && source && <a className="policy-official-link" href={source} target="_blank" rel="noopener noreferrer">공식 공간 안내 확인 <ExternalLink size={13}/></a>}</section>
}

export function CenterListRow({ center, onSelect, showDistance = false, distance }: { center: PublicCenter; onSelect: (id: string) => void; showDistance?: boolean; distance?: number }) {
  return <button className="center-result center-directory-row" onClick={()=>onSelect(center.id)}>
    <span className="center-pin"><Building2 size={20}/></span>
    <span className="center-row-content"><strong className="center-name">{center.name}</strong>{center.guide && <><small className="center-summary">{center.official?.summary || center.guide.summary}</small></>}<small className="center-address"><MapPin size={13}/> {center.address || '주소 미제공'}</small><CenterTags kind={center.guide?.kind} /></span>
    <span className="center-count">{showDistance && <span className="center-distance" aria-label={`직선거리 ${distanceLabel(distance)}`}>{distanceLabel(distance)}</span>}{(center.open_program_count || 0) > 0 && <strong>현재 모집 중 {center.open_program_count}개</strong>}<small>{center.district}</small></span>
    <ArrowRight size={17}/>
  </button>
}
