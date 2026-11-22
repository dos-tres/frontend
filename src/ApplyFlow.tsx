import {maskApplicationText} from './apply-privacy'
import {useEffect, useRef, useState} from 'react'
import {ageFromBirthDate,safePolicyUrl} from './policy-api'
import {profileRegionLabel} from './ProfileSettings'
import type {PersonalInformation} from './ProfileSettings'
import './apply-flow.css'

type Question = {id:string; label:string; kind:string; required:boolean; options?:string[]; description?:string; hint?:string; fill_key?:string; other?:boolean; can_draft?:boolean}
type Start = {available:boolean; form_revision?:string; test_only?:boolean; reason?:string; questions?:Question[]; filled?:{id:string;label:string;value:string}[]; item:{id:string;title:string}}
type Result = {status:string;confirmed_by:string;submitted_at:string;item:{id:string;title:string}}
type Answers = Record<string,string|string[]>
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/,'')
async function request(path:string, body:unknown) {
  const response = await fetch(`${base}/api/apply/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  const data = await response.json()
  if (!response.ok) throw data.error || {code:'UNKNOWN'}
  return data
}
export default function ApplyFlow({itemId,personal,onClose,onSchedule,officialUrl,onTest,demoFor}:{demoFor?:string;officialUrl?:string;onTest?:()=>void;itemId:string;personal:PersonalInformation;onClose:()=>void;onSchedule:()=>void}) {
  const panel=useRef<HTMLElement>(null)
  const [form,setForm]=useState<Start>(); const [answers,setAnswers]=useState<Answers>({})
  const [stage,setStage]=useState<'loading'|'edit'|'review'|'done'|'unavailable'|'uncertain'>('loading')
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [result,setResult]=useState<Result>()
  const [preview,setPreview]=useState<{id:string;input:string;payload:unknown}|null>(null)
  const [drafting,setDrafting]=useState('')
  const [motivation,setMotivation]=useState('')
  const [queue,setQueue]=useState<string[]>([]);const [step,setStep]=useState(0)
  useEffect(()=>{panel.current?.scrollIntoView({block:'nearest'})},[stage,step])
  const [invalid,setInvalid]=useState<string[]>([]); const lock=useRef(false)
  useEffect(()=>{let active=true
    request('start',{item_id:itemId}).then((data:Start)=>{
      if(!active)return
      setForm(data)
      const local:Record<string,string>={name:personal.name,birth_date:personal.birthDate,birthDate:personal.birthDate,phone:personal.phone,email:personal.email,age:ageFromBirthDate(personal.birthDate),region:personal.regionCode?profileRegionLabel(personal.regionCode):''}
      const initial:Answers={}
      for(const q of data.questions || []) if(q.kind!=='agree' && q.fill_key && local[q.fill_key]) initial[q.id]=local[q.fill_key]
      setAnswers(initial);setQueue((data.questions||[]).filter(q=>!initial[q.id]).map(q=>q.id));setStep(0);setStage(data.available?'edit':'unavailable')
    }).catch(()=>{if(active){setStage('unavailable');setError('신청서를 불러오지 못했어요. 잠시 후 다시 열어 주세요.')}})
    return()=>{active=false}
  },[itemId])
  const masked=(text:string)=>{
    const labels:Record<string,string>={name:'이름',birth_date:'생년월일',phone:'연락처',email:'이메일',region:'거주지'}
    const known:Record<string,string>={}
    for(const q of form?.questions||[]){if(q.fill_key&&labels[q.fill_key]&&typeof answers[q.id]==='string')known[labels[q.fill_key]]=answers[q.id] as string}
    return maskApplicationText(text,personal,known)
  }
  const draftAnswer=async(id:string,generate=false)=>{
    if(drafting||!motivation.trim())return
    setDrafting(id);setError('')
    try {
      const payload={item_id:itemId,question_id:id,messages:[{role:'user',content:masked(motivation)}],preview:!generate}
      const data=await request('draft',payload)
      if(!generate)setPreview({id,input:data.ai_input,payload})
      else {let value=String(data.draft||'');for(const [key,raw] of Object.entries({이름:personal.name,연락처:personal.phone,이메일:personal.email})){value=value.split(`[${key}]`).join(raw)}update(id,value);setPreview(null)}
    } catch {setError('초안을 만들지 못했어요. 입력한 내용은 유지했어요. 다시 시도하거나 직접 작성할 수 있어요.')}
    finally {setDrafting('')}
  }
  const questions=form?.questions || []
  const update=(id:string,value:string|string[])=>{setAnswers(a=>({...a,[id]:value}));setInvalid(ids=>ids.filter(v=>v!==id));setError('');setPreview(null)}
  const review=()=>{
    const malformed=questions.filter(q=>{const value=String(answers[q.id]||'');return !!value&&((q.fill_key==='phone'&&!/^01[016789]-?\d{3,4}-?\d{4}$/.test(value))||(q.fill_key==='age'&&!/^\d{1,3}$/.test(value))) }).map(q=>q.id)
    const missing=questions.filter(q=>q.required && (!answers[q.id] || (Array.isArray(answers[q.id])?!answers[q.id].length:!String(answers[q.id]).trim()))).map(q=>q.id)
    setInvalid([...missing,...malformed])
    if(missing.length||malformed.length){const first=[...missing,...malformed][0];setQueue(questions.map(q=>q.id));setStep(questions.findIndex(q=>q.id===first));setError('표시한 항목을 확인해 주세요.');return}
    setError('');setStage('review')
  }
  const submit=async()=>{
    if(lock.current)return
    lock.current=true;setBusy(true);setError('')
    try {
      const data:Result=await request('submit',{item_id:itemId,answers,form_revision:form?.form_revision})
      if(data.status!=='submitted'||data.confirmed_by!=='server'||data.item?.id!==itemId||!Number.isFinite(Date.parse(data.submitted_at))){setStage('uncertain');return}
      setResult(data);setStage('done')
    } catch(e) {
      const failure=e as {code?:string;missing?:string[];invalid?:string[]}
      if(failure.code==='APPLY_FORM_CHANGED'){setStage('unavailable');setError('작성 중 신청서 문항이 바뀌었어요. 닫고 다시 열어 내용을 확인해 주세요.')}
      else if(failure.code==='APPLY_INVALID'){setInvalid([...(failure.missing||[]),...(failure.invalid||[])]);setStage('edit');setError('신청서의 누락되거나 잘못된 항목을 수정해 주세요.')}
      else if(failure.code==='APPLY_FORM_CLOSED'){setStage('unavailable');setError('작성 중 접수가 마감됐어요. 제출을 완료하지 못했어요.')}
      else if(failure.code==='APPLY_NOT_AVAILABLE'){setStage('unavailable');setError('이 신청서는 현재 조이가 제출할 수 없어요.')}
      else setStage('uncertain')
    } finally {lock.current=false;setBusy(false)}
  }
  return <section ref={panel} className="apply-flow" aria-label="프로그램 신청">
    <header><h3>신청할 내용을 같이 채워볼게요</h3><button className="text-button" disabled={busy} onClick={onClose}>닫기</button></header>

    <p>{form?.item.title}</p>{demoFor&&<p className="apply-demo-context">‘{demoFor}’의 신청 과정을 시연해요. 실제 기관 접수 대신 둘셋 취업 클래스 테스트 구글폼에 연결했어요.</p>}{form?.test_only&&!demoFor&&<p className="apply-test-label">팀 소유 테스트 신청서예요. 실제 기관의 프로그램 신청이 아니에요.</p>}
    {stage==='loading'&&<p role="status">신청서 문항을 확인하고 있어요…</p>}
    {error&&<p role="alert">{error}</p>}
    {stage==='edit'&&<><p>저장된 정보는 이 기기에서 채웠어요. 모르는 항목만 하나씩 여쭤볼게요. 마지막에 전체 내용을 확인하고 제출해요.</p>
      {!questions.some(q=>q.fill_key)&&<p className="settings-help">현재 신청서는 저장 정보 자동 채움을 지원하지 않아 직접 입력이 필요해요.</p>}
      {questions.some(q=>q.id===queue[step]&&q.can_draft)&&<div className="apply-field"><label htmlFor="motivation-facts">참여하고 싶은 이유를 편하게 알려주세요</label><textarea id="motivation-facts" value={motivation} onChange={e=>{setMotivation(e.target.value);setPreview(null)}} placeholder="실제로 하고 싶은 활동과 기대하는 점만 알려주세요. 이름·연락처는 적지 않아도 돼요."/><p className="settings-help">알려준 사실만으로 초안을 만들어요. 입력값은 이 신청서를 닫으면 지워져요.</p></div>}
      <p>알려주실 항목 · {Math.min(step+1,queue.length)} / {queue.length}</p>
      {questions.filter(q=>q.id===queue[step]).map(q=><div className="apply-field" key={q.id}><label htmlFor={`apply-${q.id}`}>{q.label}{q.required?' (필수)':' (선택)'}</label>
        {q.description&&<p>{q.description}</p>}{q.hint&&<p className="settings-help">{q.hint}</p>}
        {q.options?.length?<fieldset id={`apply-${q.id}`} aria-invalid={invalid.includes(q.id)}><legend className="settings-sr-only">{q.label}</legend>{q.options.map(option=><label key={option}><input type={q.kind==='multi'?'checkbox':'radio'} name={`apply-${q.id}`} checked={q.kind==='multi'?Array.isArray(answers[q.id])&&answers[q.id].includes(option):answers[q.id]===option} onChange={()=>{const current=Array.isArray(answers[q.id])?answers[q.id] as string[]:[];update(q.id,q.kind==='multi'?(current.includes(option)?current.filter(v=>v!==option):[...current,option]):option)}}/>{option}</label>)}</fieldset>:q.kind==='long'?<textarea id={`apply-${q.id}`} value={String(answers[q.id]||'')} onChange={e=>update(q.id,e.target.value)} aria-invalid={invalid.includes(q.id)}/>:<input id={`apply-${q.id}`} type={q.kind==='date'?'date':'text'} value={String(answers[q.id]||'')} onChange={e=>update(q.id,e.target.value)} aria-invalid={invalid.includes(q.id)}/>}
        {q.can_draft&&<><button className="text-button" disabled={!!drafting||!motivation.trim()} onClick={()=>void draftAnswer(q.id)}>AI에 전달할 내용 확인</button>{preview?.id===q.id&&<div><pre style={{whiteSpace:'pre-wrap'}}>{preview.input}</pre><button className="btn btn-secondary" disabled={!!drafting} onClick={()=>void draftAnswer(q.id,true)}>{drafting?'초안 작성 중…':'이 내용으로 초안 만들기'}</button></div>}</>}
        {q.other&&<p className="settings-help">기타 직접 답변은 현재 지원하지 않아요. 제공된 선택지로 답할 수 없다면 공식 신청서를 이용해 주세요.</p>}
        {invalid.includes(q.id)&&<p role="alert">이 항목을 확인해 주세요.</p>}
      </div>)}
      <div className="assistant-profile-actions"><button className="text-button" disabled={step===0} onClick={()=>setStep(i=>i-1)}>이전 항목</button><button className="btn btn-primary" onClick={()=>{const q=questions.find(q=>q.id===queue[step]);const v=q?answers[q.id]:undefined;if(q?.required&&(!v||(Array.isArray(v)?!v.length:!String(v).trim()))){setInvalid([q.id]);setError('이 항목에 답해 주세요.');return}setError('');if(step<queue.length-1)setStep(i=>i+1);else review()}}>{step<queue.length-1?'다음':'전체 내용 확인'}</button><button className="text-button" onClick={()=>{setQueue(questions.map(q=>q.id));setStep(0)}}>자동 채운 정보도 수정하기</button></div></>}
    {stage==='review'&&<><h4>이 내용으로 신청할까요?</h4><dl>{questions.map(q=><div key={q.id}><dt>{q.label}</dt><dd>{Array.isArray(answers[q.id])?(answers[q.id] as string[]).join(', '):answers[q.id]||'미입력'}</dd></div>)}</dl><p>제출하면 확인한 신청 정보가 백엔드를 거쳐 신청처에 전달돼요. 이 단계에서는 AI에 답변을 보내지 않아요.</p><button className="btn btn-ghost" disabled={busy} onClick={()=>{setQueue(questions.map(q=>q.id));setStep(0);setStage('edit')}}>내용 수정</button><button className="btn btn-primary" disabled={busy} onClick={submit}>{busy?'제출 중…':'이 내용으로 신청'}</button></>}
    {stage==='done'&&result&&<><h4>신청서가 접수됐어요</h4><p>신청일: {new Date(result.submitted_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</p><p>접수 완료는 선정이나 참여 확정을 의미하지 않아요.</p><button className="btn btn-primary" onClick={onSchedule}>일정 등록하기</button><p className="settings-help">날짜와 시간을 확인한 뒤 일정을 저장해요.</p></>}
    {stage==='unavailable'&&<><h4>{form?.reason==='closed'?'현재 접수가 마감됐어요':'신청 방법을 함께 확인해요'}</h4><p>이 기관 신청서는 현재 둘셋의 자동 제출 연결 대상이 아니에요. 실제 신청은 공식 신청서에서 진행하고, 필요한 내용은 함께 준비할 수 있어요.</p>{safePolicyUrl(officialUrl)&&<a className="text-button" href={safePolicyUrl(officialUrl)} target="_blank" rel="noopener noreferrer">공식 신청서 열기 ↗</a>}{onTest&&<><p>신청 과정을 체험하려면 별도 팀 소유 취업 클래스 테스트 폼으로 이어갈 수 있어요. 이 기관 신청으로 접수되지는 않아요.</p><button className="btn btn-secondary" onClick={onTest}>취업 클래스 테스트 신청 이어가기</button></>}<button className="btn btn-ghost" onClick={onSchedule}>문의할 일정 등록</button></>}
    {stage==='uncertain'&&<div role="alert"><h4>접수 여부를 확인하지 못했어요</h4><p>중복 신청을 막기 위해 다시 제출하지 않을게요. 신청처에서 접수 여부를 확인해 주세요.</p><button className="btn btn-ghost" onClick={onSchedule}>확인할 일정 등록</button></div>}
  </section>
}
