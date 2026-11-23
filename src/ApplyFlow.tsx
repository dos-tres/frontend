import {maskApplicationText} from './apply-privacy'
import {useEffect, useRef, useState} from 'react'
import {ageFromBirthDate,safePolicyUrl} from './policy-api'
import {profileRegionLabel} from './ProfileSettings'
import type {PersonalInformation} from './ProfileSettings'
import './apply-flow.css'

type Question = {id:string; label:string; kind:string; required:boolean; options?:string[]; description?:string; hint?:string; fill_key?:string; other?:boolean; can_draft?:boolean; rows?:{id:string;label:string;required:boolean}[]}
type Start = {read_only?:boolean;submission_ready?:boolean;replica?:boolean;source_form_url?:string;available:boolean; form_revision?:string; test_only?:boolean; reason?:string; questions?:Question[]; filled?:{id:string;label:string;value:string}[]; item:{id:string;title:string}}
export type ApplyResult = {status:string;confirmed_by:string;submitted_at:string;item:{id:string;title:string}; answers?:{label:string;value:string}[]; sourceUrl?:string}
type Answers = Record<string,string|string[]>
const reviewLabel=(q:Question)=>({name:'이름',age:'나이',region:'거주 지역',phone:'연락처',email:'이메일',birth_date:'생년월일'}[q.fill_key||'']||(/동의/.test(q.label)?'참여 동의':q.kind==='long'?q.label.replace(/^\d+\.\s*/, ''):/피드백/.test(q.label)?'받고 싶은 도움':/취업 준비/.test(q.label)?'준비 상태':q.label.replace(/\s*\([^)]*\)/g,'')))
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/,'')
async function request(path:string, body:unknown) {
  const response = await fetch(`${base}/api/apply/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  const data = await response.json()
  if (!response.ok) throw data.error || {code:'UNKNOWN'}
  return data
}
export default function ApplyFlow({itemId,personal,onClose,onSchedule,onComplete,onReviewed,officialUrl,onTest,demoFor,motivationContext=''}:{onReviewed?:(answers:{label:string;value:string}[],sourceUrl?:string)=>void;motivationContext?:string;demoFor?:string;officialUrl?:string;onTest?:()=>void;itemId:string;personal:PersonalInformation;onClose:()=>void;onSchedule:(result?:ApplyResult)=>void;onComplete?:(result:ApplyResult)=>void}) {
  const panel=useRef<HTMLElement>(null)
  const [form,setForm]=useState<Start>(); const [answers,setAnswers]=useState<Answers>({})
  const [stage,setStage]=useState<'loading'|'edit'|'review'|'done'|'unavailable'|'uncertain'>('loading')
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [result,setResult]=useState<ApplyResult>()
  const [drafting,setDrafting]=useState('')
  const [autofilledLabels,setAutofilledLabels]=useState<string[]>([])
  const [queue,setQueue]=useState<string[]>([]);const [step,setStep]=useState(0)
  const [editingReview,setEditingReview]=useState(false)
  const [reviewPage,setReviewPage]=useState(0)
  useEffect(()=>{panel.current?.scrollIntoView({block:'nearest'})},[stage,step,reviewPage])
  const [invalid,setInvalid]=useState<string[]>([]); const lock=useRef(false)
  useEffect(()=>{let active=true
    request('start',{item_id:itemId}).then((data:Start)=>{
      if(!active)return
      setForm(data)
      const local:Record<string,string>=data.replica?{name:'가상수아',birth_date:'2003-01-20',phone:'010-0000-0000',age:'23',region:'서울 강동구 천호동'}:{name:personal.name,birth_date:personal.birthDate,birthDate:personal.birthDate,phone:personal.phone,email:personal.email,age:ageFromBirthDate(personal.birthDate),region:personal.regionCode?profileRegionLabel(personal.regionCode):''}
      const initial:Answers={}
      for(const q of data.questions || []) if(q.kind!=='agree' && q.fill_key && local[q.fill_key] && !(q.fill_key==='region'&&/타\s*지역|거주할\s*경우|거주\s*시|거주하는\s*경우|생활권/.test(q.label))) initial[q.id]=local[q.fill_key]
      setAutofilledLabels((data.questions||[]).filter(q=>initial[q.id]).map(q=>reviewLabel(q).replace(/^\s*\d+\s*[.)、．]\s*/,'')));setAnswers(initial);setQueue((data.questions||[]).map(q=>q.id));setStep(0);setStage(data.available?'edit':'unavailable')
    }).catch(()=>{if(active){setStage('unavailable');setError('신청서를 불러오지 못했어요. 잠시 후 다시 열어 주세요.')}})
    return()=>{active=false}
  },[itemId])
  const masked=(text:string)=>{
    const labels:Record<string,string>={name:'이름',birth_date:'생년월일',phone:'연락처',email:'이메일',region:'거주지'}
    const known:Record<string,string>={}
    for(const q of form?.questions||[]){if(q.fill_key&&labels[q.fill_key]&&typeof answers[q.id]==='string')known[labels[q.fill_key]]=answers[q.id] as string}
    return maskApplicationText(text,personal,known)
  }
  const draftAnswer=async(id:string)=>{
    if(drafting)return
    setDrafting(id);setError('')
    try {
      const facts=motivationContext.trim()||'이 활동에 참여하고 싶어요. 구체적인 경력이나 경험은 아직 알려주지 않았어요.'
      const data=await request('draft',{item_id:itemId,question_id:id,messages:[{role:'user',content:masked(facts)}],preview:false})
      let value=String(data.draft||'')
      for(const [key,raw] of Object.entries({이름:personal.name,연락처:personal.phone,이메일:personal.email}))value=value.split(`[${key}]`).join(raw)
      update(id,value)
    } catch {setError('답변을 만들지 못했어요. 다시 추천받거나 직접 입력해 주세요.')}
    finally {setDrafting('')}
  }
  const questions=form?.questions || []
  const snapshot=()=>questions.map(q=>({label:q.label,value:q.kind==='multi_grid'?(q.rows||[]).map(r=>`${r.label}: ${(Array.isArray(answers[r.id])?answers[r.id] as string[]:[]).join(', ')}`).join(' / '):Array.isArray(answers[q.id])?(answers[q.id] as string[]).join(', '):String(answers[q.id]||'')}))
  const update=(id:string,value:string|string[])=>{setAnswers(a=>({...a,[id]:value}));setInvalid(ids=>ids.filter(v=>v!==id));setError('')}
  const review=(resetPage=true)=>{
    const malformed=questions.filter(q=>{const value=String(answers[q.id]||'');return !!value&&((q.fill_key==='phone'&&!/^01[016789]-?\d{3,4}-?\d{4}$/.test(value))||(q.fill_key==='age'&&!/^\d{1,3}$/.test(value))) }).map(q=>q.id)
    const missing=questions.filter(q=>q.kind!=='multi_grid'&&q.required && (!answers[q.id] || (Array.isArray(answers[q.id])?!answers[q.id].length:!String(answers[q.id]).trim()))).map(q=>q.id)
    setInvalid([...missing,...malformed])
    if(missing.length||malformed.length){const first=[...missing,...malformed][0];setQueue(questions.map(q=>q.id));setStep(questions.findIndex(q=>q.id===first));setError('표시한 항목을 확인해 주세요.');return}
    setError('');if(resetPage)setReviewPage(0);setStage('review')
  }
  const submit=async()=>{
    if(lock.current||!form?.replica||form?.submission_ready!==true)return
    lock.current=true;setBusy(true);setError('')
    try {
      const data:ApplyResult=await request('submit',{item_id:itemId,form_revision:form.form_revision,answers})
      data.answers=snapshot();data.sourceUrl=form?.source_form_url;setResult(data);setStage('done');onComplete?.(data);return
    } catch(e) {
      const failure=e as {code?:string;missing?:string[];invalid?:string[]}
      if(failure.code==='APPLY_FORM_CHANGED'){setStage('unavailable');setError('작성 중 신청서 문항이 바뀌었어요. 닫고 다시 열어 내용을 확인해 주세요.')}
      else if(failure.code==='APPLY_INVALID'){const invalidIds=[...(failure.missing||[]),...(failure.invalid||[])];setInvalid(invalidIds);setQueue(questions.map(q=>q.id));setStep(Math.max(0,questions.findIndex(q=>q.id===invalidIds[0]||q.rows?.some(r=>r.id===invalidIds[0]))));setEditingReview(true);setStage('edit');setError(form?.replica?'가상 이름과 테스트 연락처(010-0000-0000)를 사용하고 필수 항목을 확인해 주세요.':'신청서의 누락되거나 잘못된 항목을 수정해 주세요.')}
      else if(failure.code==='APPLY_FORM_CLOSED'){setStage('unavailable');setError('작성 중 접수가 마감됐어요. 제출을 완료하지 못했어요.')}
      else if(failure.code==='APPLY_NOT_AVAILABLE'){setStage('unavailable');setError('이 신청서는 현재 조이가 제출할 수 없어요.')}
      else setStage('uncertain')
    } finally {lock.current=false;setBusy(false)}
  }
  return <section ref={panel} className="apply-flow" aria-label="프로그램 신청">
    <header><h3>신청할 내용을 같이 채워볼게요</h3><button className="text-button" disabled={busy} onClick={onClose}>닫기</button></header>

    <p>{demoFor||form?.item.title}</p><p className="apply-test-label">{form?.replica?'원본 질문 그대로 작성해요. 응답은 팀 소유 복제 폼에만 저장돼요. 가상 정보만 입력해 주세요.':'신청서 확인과 답변 작성만 가능해요. 지금은 제출되지 않아요.'}</p>{form?.source_form_url&&<a className="text-button" href={safePolicyUrl(form.source_form_url)} target="_blank" rel="noopener noreferrer">원본 구글폼 확인 ↗</a>}
    {stage==='loading'&&<p role="status">신청서 문항을 확인하고 있어요…</p>}
    {error&&<p role="alert">{error}</p>}
    {stage==='edit'&&<>
      {!questions.some(q=>q.fill_key)&&<p className="settings-help">현재 신청서는 저장 정보 자동 채움을 지원하지 않아 직접 입력이 필요해요.</p>}
      {!!autofilledLabels.length&&<p className="settings-help">{autofilledLabels.join('·')}은 저장된 정보로 채웠어요. 각 항목에서 내용을 확인하고 수정한 뒤 다음으로 넘어가 주세요.</p>}
      <p>알려주실 항목 · {Math.min(step+1,queue.length)} / {queue.length}</p>
      {questions.filter(q=>q.id===queue[step]).map(q=><div className="apply-field" key={q.id}><label htmlFor={`apply-${q.id}`}>{q.label.replace(/^\s*\d+\s*[.)、．]\s*/,'')}{q.required?' (필수)':' (선택)'}</label>
        {q.description&&<details className="apply-question-description"><summary>질문 안내 보기</summary><p>{q.description}</p></details>}{q.hint&&q.hint!==q.description&&<p className="settings-help">{q.hint}</p>}
        {q.kind==='multi_grid'?<div className="apply-grid">{q.rows?.map(row=><fieldset key={row.id}><legend>{row.label}</legend>{q.options?.map(option=><label key={option}><input type="checkbox" checked={Array.isArray(answers[row.id])&&answers[row.id].includes(option)} onChange={()=>{const current=Array.isArray(answers[row.id])?answers[row.id] as string[]:[];update(row.id,current.includes(option)?current.filter(v=>v!==option):[...current,option])}}/>{option}</label>)}</fieldset>)}</div>:q.options?.length?<fieldset id={`apply-${q.id}`} aria-invalid={invalid.includes(q.id)}><legend className="settings-sr-only">{q.label}</legend>{q.options.map(option=><label key={option}><input type={q.kind==='multi'?'checkbox':'radio'} name={`apply-${q.id}`} checked={q.kind==='multi'?Array.isArray(answers[q.id])&&answers[q.id].includes(option):answers[q.id]===option} onChange={()=>{const current=Array.isArray(answers[q.id])?answers[q.id] as string[]:[];update(q.id,q.kind==='multi'?(current.includes(option)?current.filter(v=>v!==option):[...current,option]):option)}}/>{option}</label>)}</fieldset>:q.kind==='long'?<textarea id={`apply-${q.id}`} placeholder="직접 입력하거나 추천받기를 눌러주세요" rows={4} value={String(answers[q.id]||'')} onChange={e=>update(q.id,e.target.value)} aria-invalid={invalid.includes(q.id)}/>:<input id={`apply-${q.id}`} type={q.kind==='date'?'date':'text'} value={String(answers[q.id]||'')} onChange={e=>update(q.id,e.target.value)} aria-invalid={invalid.includes(q.id)}/>}
        {q.can_draft&&<button className="btn btn-secondary" disabled={!!drafting} onClick={()=>void draftAnswer(q.id)}>{drafting?'답변 만드는 중…':'추천받기'}</button>}
        {q.other&&<label className="apply-other">기타 직접 입력<input aria-label={`${q.label} 기타 직접 입력`} value={q.kind==='multi'?(Array.isArray(answers[q.id])?(answers[q.id] as string[]).find(v=>!q.options?.includes(v))||'':''):typeof answers[q.id]==='string'&&!q.options?.includes(answers[q.id] as string)?answers[q.id] as string:''} onChange={e=>{const custom=e.target.value;update(q.id,q.kind==='multi'?[...(Array.isArray(answers[q.id])?(answers[q.id] as string[]).filter(v=>q.options?.includes(v)):[]),...(custom?[custom]:[])]:custom)}}/></label>}
        {invalid.includes(q.id)&&<p role="alert">이 항목을 확인해 주세요.</p>}
      </div>)}
      <div className="assistant-profile-actions"><button className="text-button" disabled={step===0||editingReview} onClick={()=>setStep(i=>i-1)}>이전 항목</button><button className="btn btn-primary" onClick={()=>{const q=questions.find(q=>q.id===queue[step]);const v=q?answers[q.id]:undefined;if(q?.required&&(!v||(Array.isArray(v)?!v.length:!String(v).trim()))){setInvalid([q.id]);setError('이 항목에 답해 주세요.');return}setError('');if(editingReview){setEditingReview(false);review(false)}else if(step<queue.length-1)setStep(i=>i+1);else review()}}>{editingReview?'수정 완료':step<queue.length-1?'다음':'전체 내용 확인'}</button></div></>}
    {stage==='review'&&<section className="apply-review-section" aria-label="신청 내용 최종 확인">
      <div className="apply-review-heading"><h4>작성한 내용을 확인해 주세요</h4><span>{reviewPage+1} / {Math.ceil(questions.length/3)}</span></div>
      <dl className="apply-review">{questions.slice(reviewPage*3,reviewPage*3+3).map((q,offset)=><div key={q.id}>
        <dt>{reviewLabel(q)}</dt>
        <dd>{q.kind==='multi_grid'?(q.rows?.filter(r=>Array.isArray(answers[r.id])&&answers[r.id].length).map(r=>`${r.label} · ${(answers[r.id] as string[]).join(', ')}`).join('\n')||'선택하지 않았어요'):Array.isArray(answers[q.id])?(answers[q.id] as string[]).join(', '):answers[q.id]||'입력하지 않았어요'}</dd>
        <button className="text-button" aria-label={`${q.label} 수정`} onClick={()=>{setQueue(questions.map(q=>q.id));setStep(reviewPage*3+offset);setEditingReview(true);setStage('edit')}}>수정</button>
      </div>)}</dl>
      <div className="apply-review-footer"><button className="btn btn-secondary" disabled={reviewPage===0||busy} onClick={()=>setReviewPage(p=>p-1)}>이전</button>
      {reviewPage<Math.ceil(questions.length/3)-1?<button className="btn btn-primary" onClick={()=>setReviewPage(p=>p+1)}>다음 내용 확인</button>:form?.submission_ready===true?<button className="btn btn-primary" disabled={busy} onClick={submit}>{busy?'제출 중…':'이 내용으로 제출하기'}</button>:<button className="btn btn-primary" onClick={()=>{onReviewed?.(snapshot(),form?.source_form_url);onClose()}}>작성 완료</button>}</div>
    </section>}
    {stage==='done'&&result&&<><h4>신청 시연이 완료됐어요</h4><p>작성일: {new Date(result.submitted_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</p><button className="btn btn-primary" onClick={()=>onSchedule(result)}>일정 등록하기</button><p className="settings-help">신청한 날짜로 기록하고 이 대화를 연결해요.</p></>}
    {stage==='unavailable'&&<><h4>{form?.reason==='closed'?'현재 접수가 마감됐어요':'신청 방법을 함께 확인해요'}</h4><p>원본 신청서를 읽지 못했어요. 지원하지 않는 형식이거나 접근이 제한됐을 수 있어요. 질문을 임의로 만들지 않고, 공식 신청서에서 확인할 수 있도록 안내할게요.</p>{safePolicyUrl(officialUrl)&&<a className="text-button" href={safePolicyUrl(officialUrl)} target="_blank" rel="noopener noreferrer">공식 신청서 열기 ↗</a>}<button className="btn btn-ghost" onClick={()=>onSchedule()}>문의할 일정 등록</button></>}
    {stage==='uncertain'&&<div role="alert"><h4>접수 여부를 확인하지 못했어요</h4><p>중복 신청을 막기 위해 다시 제출하지 않을게요. 신청처에서 접수 여부를 확인해 주세요.</p><button className="btn btn-ghost" onClick={()=>onSchedule()}>확인할 일정 등록</button></div>}
  </section>
}
