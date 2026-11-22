import AssistantCatalog from './AssistantCatalog'
import ChatRecommendations from './ChatRecommendations'
import {requestAssistantChat, type ChatReply} from './chat-api'
import {toProgram,type RecommendationItem} from './policy-api'
import PolicyApplicationExample from './PolicyApplicationExample'
import ApplyFlow from './ApplyFlow'
import {buildAssistantContext,assistantContextLines,buildAssistantChatPayload} from './assistant-context'
import type {Answers} from './checkin-api'
import { useAssistantSchedule, type ScheduleBridge } from './AssistantSchedule'
import type { PublicCenter } from './center-api'
import { profileChatSteps, profileChatCurrent, profileChatQuestion, parseProfileChat, chatEmploymentOptions, chatSchoolOptions, chatInterestOptions } from './profile-chat'
import joyImage from './assets/joy.png'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bookmark, ExternalLink, MessageCircle, Plus, Send } from 'lucide-react'
import type { Program } from './data'
import type { PersonalInformation } from './ProfileSettings'
import { profileRegionLabel } from './ProfileSettings'
import type { ActivityInformationValue } from './ActivityInformation'
import { ageFromBirthDate, applicationLabel, periodLabel, requestCatalogItem, safePolicyUrl } from './policy-api'

type Turn = { role: 'assistant' | 'user'; text: string; recommendations?:NonNullable<ChatReply['results']> }
type Props = { startFresh?: boolean; checkinAnswers?: Answers; answerDecisions?: Record<string,string>; preferProfile?: boolean; scheduleContext?: {date:string}; center?: PublicCenter; schedule?: ScheduleBridge; program?: Program; personal: PersonalInformation; activity: ActivityInformationValue; initialMessages: Turn[]; onBack: () => void; onSavePersonal: (value: PersonalInformation) => void; onSaveActivity: (value: ActivityInformationValue) => void; onNew: () => void; onSave: () => void; saved: boolean }
type SavedChat = {id:string;title:string;updatedAt:string;turns:Turn[];draft:string;reply:ChatReply|null;answers:Answers;detail?:Program;profileStep?:number|null;profileQueue?:number[]}
const CHAT_KEY='dos-tres.chat-history.v1'
function readChats():{activeId:string;entries:SavedChat[]} {
  try {const data=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');if(data&&Array.isArray(data.entries))return {activeId:String(data.activeId||''),entries:data.entries.filter((c:SavedChat)=>typeof c.id==='string'&&Array.isArray(c.turns)&&c.turns.every(t=>['user','assistant'].includes(t.role)&&typeof t.text==='string')).slice(0,20)}}catch{}
  return {activeId:'',entries:[]}
}
const choices = ['내가 신청할 수 있어?', '신청 준비 도와줘']
const short = (value?: string) => value && value.length > 420 ? `${value.slice(0, 420)}…` : value

export default function PolicyJoyPanel({ startFresh=false, checkinAnswers={}, answerDecisions={}, preferProfile=false, scheduleContext, center, schedule, program, personal, activity, initialMessages, onSavePersonal, onSaveActivity, onNew, onSave, saved }: Props) {
  const [savedChats,setSavedChats] = useState(readChats)
  const [activeChatId,setActiveChatId] = useState(()=>startFresh?crypto.randomUUID():readChats().activeId||crypto.randomUUID())
  const restoreChat = useRef<SavedChat|null>(startFresh?null:readChats().entries.find(c=>c.id===readChats().activeId)||null)
  const [saveFailed,setSaveFailed] = useState(false)
  const flushChat=useRef(()=>{})
  useEffect(()=>()=>flushChat.current(),[])
  const [activeRecommendation,setActiveRecommendation] = useState<RecommendationItem|null>(null)
  const [pendingAction,setPendingAction] = useState('')
  const [chatBusy,setChatBusy] = useState(false)
  const [chatError,setChatError] = useState('')
  const [chatReply,setChatReply] = useState<ChatReply | null>(null)
  const [chatAnswers,setChatAnswers] = useState<Answers>({})
  const chatRequest = useRef<AbortController | null>(null)
  useEffect(()=>()=>chatRequest.current?.abort(),[])
  const [catalogQuery,setCatalogQuery] = useState('')
  const [catalogMode,setCatalogMode] = useState<'정책'|'프로그램'|'추천'|null>(null)
  const [policyExample,setPolicyExample] = useState(false)
  const [applying,setApplying] = useState(false)
  const [detail, setDetail] = useState(program)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [profileQueue,setProfileQueue] = useState<number[]>([])
  const [nickname,setNickname] = useState(()=>{try{return localStorage.getItem('dos-tres.nickname.v1')||''}catch{return ''}})
  const [profileStep, setProfileStep] = useState<number | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const profileField = profileStep === null ? undefined : profileChatSteps[profileStep]
  const contextSignature=useRef('')
  const handledInitial=useRef('')
  const transcript = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const signature=`${program?.id||''}:${center?.id||''}:${scheduleContext?.date||''}:${revision}`
    if(contextSignature.current===signature)return
    if(!program)contextSignature.current=signature
    if(!program&&!center&&!scheduleContext&&restoreChat.current){const c=restoreChat.current;setTurns(c.turns);setDraft(c.draft||'');setChatReply(c.reply||null);setChatAnswers(c.answers||{});setDetail(c.detail);setProfileStep(c.profileStep??null);setProfileQueue(c.profileQueue||[]);return}
    chatRequest.current?.abort(); chatRequest.current=null; setChatBusy(false); setChatError(''); setChatReply(null); setChatAnswers({})
    setActiveRecommendation(null);setCatalogMode(null); setPolicyExample(false); setApplying(false); setDetail(program); setFailed(false); setDraft(''); setProfileStep(null)
    setTurns(scheduleContext ? [{role:'assistant',text:`내 일정에서 ${scheduleContext.date} 일정을 함께 정리하러 왔어요. 어떤 약속이나 할 일을 등록할까요?`}] : center ? [{role:'assistant',text:`‘${center.name}’에 대해 함께 알아봐요. ${center.guide?.summary || ''}\n이용 안내를 물어보거나 방문 일정을 말해 주세요.`}] : program ? [{ role: 'user', text: `‘${program.title}’에 대해 알아보고 싶어.` }] : [])
    if (!program) { setBusy(false); return }
    const controller = new AbortController(); setBusy(true)
    requestCatalogItem(program.id, controller.signal).then(item => {
      if (controller.signal.aborted) return
      contextSignature.current=signature
      setDetail({ ...item, why: program.why })
      setTurns(prev => [...prev, { role: 'assistant', text: `좋아요. ‘${item.title}’부터 함께 살펴봐요.\n\n${short(item.summary) || '제공된 공고에서 지원 내용을 확인해 볼게요.'}\n\n신청 기간은 ${periodLabel(item.period)}예요. 내 조건과 맞는지 먼저 볼까요, 신청 방법부터 알아볼까요?` }])
    }).catch(() => { if (!controller.signal.aborted){contextSignature.current=signature;setFailed(true)} }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [program?.id, center?.id, scheduleContext?.date, revision])
  useEffect(() => { const node = transcript.current; if (node) node.scrollTop = node.scrollHeight }, [turns, busy, profileStep, chatReply])
  useEffect(() => { window.scrollTo(0, 0) }, [program?.id])
  const scheduler = useAssistantSchedule(schedule, center, activeRecommendation?toProgram(activeRecommendation):detail, (user,assistant)=>setTurns(prev=>[...prev,{role:'user',text:user},{role:'assistant',text:assistant}]))
  const context = buildAssistantContext(personal,activity,checkinAnswers,answerDecisions,preferProfile)
  const contextLines = assistantContextLines(context)
  const age = context.local.age
  const official = detail && safePolicyUrl(detail.referenceUrl || detail.applyUrl)
  useEffect(()=>{
    if(!turns.length&&!draft){flushChat.current=()=>{};return}
    const entry:SavedChat={id:activeChatId,title:(turns.find(t=>t.role==='user')?.text||'작성 중인 대화').slice(0,36),updatedAt:new Date().toISOString(),turns,draft,reply:chatReply,answers:chatAnswers,detail,profileStep,profileQueue}
    const persist=()=>{try{const existing=readChats();const entries=[entry,...existing.entries.filter(c=>c.id!==activeChatId)].slice(0,20);localStorage.setItem(CHAT_KEY,JSON.stringify({activeId:activeChatId,entries}));setSavedChats({activeId:activeChatId,entries});setSaveFailed(false)}catch{setSaveFailed(true)}}
    flushChat.current=persist
    const timer=window.setTimeout(persist,250);window.addEventListener('beforeunload',persist)
    return()=>{window.clearTimeout(timer);window.removeEventListener('beforeunload',persist)}
  },[turns,draft,chatReply,chatAnswers,detail,activeChatId,profileStep,profileQueue])
  const openSavedChat = (c:SavedChat) => {
    chatRequest.current?.abort();chatRequest.current=null;setChatBusy(false);setChatError('');restoreChat.current=c;setActiveChatId(c.id);setTurns(c.turns);setDraft(c.draft||'');setChatReply(c.reply||null);setChatAnswers(c.answers||{});setDetail(c.detail);setProfileStep(null);setApplying(false);setPolicyExample(false);setCatalogMode(null);onNew()
  }
  const selectCatalogItem = (item:Program) => {
    setCatalogMode(null); setDetail(item); setApplying(false); setPolicyExample(false); setFailed(false)
    setTurns(prev=>[...prev,{role:'user',text:`‘${item.title}’ 알아볼래`},{role:'assistant',text:`${short(item.summary)||'공고의 안내를 함께 확인해요.'}\n\n신청 기간: ${periodLabel(item.period)}\n궁금한 내용을 물어보세요. 신청 조건부터 함께 확인해 볼까요?`}])
  }
  const beginProfile = () => {
    setCatalogMode(null); setPolicyExample(false); setApplying(false); scheduler.reset();setChatReply(null)
    if (profileStep !== null) return
    if(!nickname){const names=['산뜻한 새싹','느긋한 구름','반가운 다람쥐','작은 파도'];const next=names[Math.floor(Math.random()*names.length)];setNickname(next);try{localStorage.setItem('dos-tres.nickname.v1',next)}catch{}}
    const missing=profileChatSteps.map((_,i)=>i).filter(i=>profileChatSteps[i]!=='name'&&!profileChatCurrent(profileChatSteps[i],personal,activity)&&!(profileChatSteps[i]==='interests'&&Array.isArray(context.checkin.interests)&&context.checkin.interests.length>0))
    setProfileQueue(missing);setProfileStep(missing[0]??null);setDraft('');setSelectedInterests([...activity.interests])
    if(!missing.length&&context.profile){
      const completed:Turn[]=[...turns,{role:'assistant',text:'저장된 정보로 맞는 지원을 찾아볼게요.'}]
      setTurns(completed);void sendChat('지금까지 이야기와 저장한 조건으로 맞는 지원을 추천해 줘',{},context,completed,true)
    }else setTurns(prev=>[...prev,{role:'assistant',text:'저장된 정보는 그대로 참고할게요. 비어 있는 정보만 알려주세요.'}])
  }
  const previousProfile = () => {
    if(profileStep===null)return
    const index=profileQueue.indexOf(profileStep)
    if(index>0){setProfileStep(profileQueue[index-1]);setDraft('');setSelectedInterests([...activity.interests])}
  }
  const respondProfile = (text: string, skip = false) => {
    if (!profileField || profileStep === null) return
    let nextPersonal=personal,nextActivity=activity
    const parsed=skip?undefined:parseProfileChat(profileField,text)
    if(parsed && 'error' in parsed){setTurns(prev=>[...prev,{role:'assistant',text:parsed.error}]);return}
    if(parsed && 'value' in parsed){
      if(profileField==='name'||profileField==='birthDate'||profileField==='regionCode'){nextPersonal={...personal,[profileField]:parsed.value as string};onSavePersonal(nextPersonal)}
      else {nextActivity={...activity,[profileField]:profileField==='school'&&!parsed.value?'학생이 아니에요':parsed.value};onSaveActivity(nextActivity)}
    }
    const index=profileQueue.indexOf(profileStep)
    const next=profileQueue[index+1]
    if(next===undefined){
      const updated=buildAssistantContext(nextPersonal,nextActivity,checkinAnswers,answerDecisions,preferProfile)
      const completed:Turn[]=[...turns,{role:'assistant',text:updated.profile?'입력한 정보를 반영했어요. 이제 맞는 지원을 찾아볼게요.':'입력한 정보를 저장했어요. 나이와 거주 지역을 알려주면 맞는 지원을 찾을 수 있어요.'}]
      setTurns(completed)
      if(updated.profile)void sendChat('지금까지 이야기와 저장한 조건으로 맞는 지원을 추천해 줘',{},updated,completed,true)
    }
    setProfileStep(next??null);setDraft('');setSelectedInterests([...nextActivity.interests])
  }
  const sendChat = async (value:string, answers:Answers=chatAnswers, requestContext=context, baseTurns:Turn[]=turns, silent=false) => {
    if (chatRequest.current) return
    const controller=new AbortController(); chatRequest.current=controller
    const next:Turn[]=silent?baseTurns:[...baseTurns,{role:'user',text:value}]
    const requestTurns:Turn[]=silent?[...next,{role:'user',text:value}]:next
    setTurns(next); setDraft(''); setChatError(''); setChatBusy(true); setChatReply(null); setCatalogMode(null)
    try {
      const payload=buildAssistantChatPayload(requestTurns.filter(t=>t.text.trim()).slice(-40).map(t=>({role:t.role,content:t.text.slice(0,1000)})),requestContext)
      payload.checkin={...payload.checkin,...answers}
      const reply=await requestAssistantChat({...payload,selected_item_id:silent||/다른.*(?:추천|찾)|새로.*(?:추천|찾)|다시.*추천/.test(value)?undefined:(activeRecommendation?.id||detail?.id)},controller.signal)
      if(controller.signal.aborted)return
      setTurns([...next,...(reply.results?[{role:'assistant' as const,text:'',recommendations:reply.results}]:reply.replies.map(text=>({role:'assistant' as const,text})))])
      setChatReply(reply); setChatAnswers(reply.checkin)
    } catch { if(!controller.signal.aborted){setTurns(silent?next:next.slice(0,-1));if(!silent)setDraft(value);setChatError('답변을 받지 못했어요. 잠시 후 다시 보내주세요.')} }
    finally {if(chatRequest.current===controller){chatRequest.current=null;setChatBusy(false)}}
  }
  const actOnRecommendation = async (action:string,selected=activeRecommendation) => {
    if(!selected||busy||chatBusy)return
    setBusy(true);setFailed(false)
    try {
      const item=await requestCatalogItem(selected.id,new AbortController().signal)
      setActiveRecommendation(selected);setDetail(item);setChatReply(null);setCatalogMode(null);setApplying(false)
      if(action==='apply'){setApplying(true);setDraft('')}
      else setPendingAction(action)
    } catch {setChatError('공고를 불러오지 못했어요. 잠시 후 다시 눌러주세요.')}
    finally {setBusy(false)}
  }
  const answer = (text: string) => {
    const value = text.trim(); if (!value || chatRequest.current) return
    if (profileField) { respondProfile(value, /^(건너뛰기|건너뛸게|나중에)$/.test(value)); return }
    if (scheduler.handle(value)) { setDraft(''); return }
    if (/내\s*정보.*(입력|수정|등록)/.test(value)) { beginProfile(); return }
    if (busy) return
    if (detail && /^(신청해\s*줘|신청할래|신청하기|신청 진행)/.test(value)) {setCatalogMode(null);setPolicyExample(false);setApplying(true);setDraft('');return}
    void sendChat(value)
  }
  useEffect(()=>{if(pendingAction&&detail&&!busy){setPendingAction('');answer(pendingAction)}},[pendingAction,detail,busy])
  useEffect(()=>{ scheduler.reset(); if(scheduleContext)scheduler.begin(scheduleContext.date) },[program?.id,center?.id,scheduleContext?.date])
  useEffect(()=>{
    const last=initialMessages[initialMessages.length-1]
    const key=last?`${initialMessages.length}:${last.text}`:''
    if(handledInitial.current===key)return
    // StrictMode replays mount effects: defer the first request so cleanup can cancel it.
    const timer=window.setTimeout(()=>{handledInitial.current=key;if(!program&&!center&&!scheduleContext&&last?.role==='user')answer(last.text)},0)
    return()=>window.clearTimeout(timer)
  },[initialMessages])
  const submit = (event: FormEvent) => { event.preventDefault(); answer(draft) }
  return <div className="assistant-workspace">
    <aside className="assistant-sidebar">
      <div className="assistant-sidebar-title"><MessageCircle size={20} /><h1>AI 비서</h1></div>
      <button className="btn btn-secondary" onClick={() => { restoreChat.current=null;const id=crypto.randomUUID();setActiveChatId(id);try{const existing=readChats();localStorage.setItem(CHAT_KEY,JSON.stringify({...existing,activeId:id}))}catch{} chatRequest.current?.abort(); chatRequest.current=null; setChatBusy(false);setChatError('');setChatReply(null);setChatAnswers({}); setCatalogMode(null); setDetail(undefined); setPolicyExample(false); setApplying(false); scheduler.reset(); setTurns([]); setProfileStep(null); setDraft(''); onNew() }}><Plus size={16} /> 새 대화</button>
      <details className="assistant-profile-context" open><summary>대화 이력</summary><p>이 브라우저에 최근 20개를 저장해요.</p>{savedChats.entries.map(c=><button className="chat-history-entry" aria-current={c.id===activeChatId?'true':undefined} key={c.id} onClick={()=>openSavedChat(c)}><strong>{c.title}</strong><small>{new Date(c.updatedAt).toLocaleDateString('ko-KR')}</small></button>)}</details>
      <p className="assistant-sidebar-label">함께 살펴보는 정보</p>{scheduleContext && <div className="assistant-context"><h2>내 일정에서 이어진 대화</h2><p>{scheduleContext.date} 선택</p><p>정리한 일정을 달력에서 확인한 뒤 등록해요.</p></div>}{center && <div className="assistant-context"><h2>{center.name}</h2><p>{center.address}</p><p>{center.guide?.summary}</p></div>}
      {detail ? <div className="assistant-context"><span className={`policy-period-status status-${detail.applicationStatus || 'unknown'}`}>{applicationLabel(detail)}</span><h2>{detail.title}</h2><p>{detail.region} · {detail.categories?.join(' · ')}</p><p>신청 기간<br />{periodLabel(detail.period)}</p>{detail.id===program?.id && <button className="text-button" onClick={onSave} aria-pressed={saved}><Bookmark size={14} /> {saved ? '관심 해제' : '관심 저장'}</button>}{official && <a className="policy-official-link" href={official} target="_blank" rel="noopener noreferrer">공식 공고 <ExternalLink size={12} /></a>}</div> : <p className="settings-help">{scheduleContext?'선택한 날짜의 약속이나 할 일을 말해 주세요.':center?'센터 이용 안내와 방문 일정을 함께 살펴봐요.':'관심 있는 정책이나 프로그램을 가져와 조이와 함께 알아보세요.'}</p>}
      <details className="assistant-profile-context"><summary>시연 예시</summary><button className="text-button" onClick={()=>{setDetail({id:'demo:career',type:'프로그램',title:'[둘셋 테스트] 자소서·면접 피드백 클래스',summary:'취업 준비를 처음 시작한 청년의 자소서·면접 피드백 신청을 연습해요. 실제 모집이 아닌 시연용 클래스예요.',region:'온라인 · 가상',target:'취업 준비를 시작한 청년(시연 설정)',period:'테스트 폼 기준',method:'팀 소유 테스트 신청서',place:'온라인(가상)',source:'둘셋 테스트'});setChatReply(null);setApplying(true)}}>취업 클래스 테스트 신청서</button><button className="text-button" onClick={()=>{setDetail({id:'demo:open',type:'프로그램',title:'[테스트] 베이킹 클래스 신청서',summary:'팀 소유 테스트 폼의 작성 흐름을 확인해요.',region:'테스트',target:'테스트',period:'테스트 폼 기준',method:'테스트 신청서',place:'실제 행사 아님',source:'테스트'});setChatReply(null);setApplying(true)}}>베이킹 테스트 신청서</button><button className="text-button" onClick={()=>{setDetail({id:'demo:closed',type:'프로그램',title:'[테스트] 마감 신청서',summary:'마감 동작 확인',region:'테스트',target:'테스트',period:'마감',method:'테스트',place:'실제 행사 아님',source:'테스트'});setChatReply(null);setApplying(true)}}>마감 테스트 신청서</button><button className="text-button" onClick={()=>{setApplying(false);setCatalogMode(null);setPolicyExample(true)}}>월세 지원 신청 도움 보기</button></details>
      <details className="assistant-profile-context"><summary>참고하는 내 정보</summary>{contextLines.length?<ul>{contextLines.map((line,index)=><li key={index}>{line}</li>)}</ul>:<p>아직 입력한 정보가 없어요.</p>}</details>
      <button className="text-button" onClick={beginProfile}>부족한 정보 입력</button><details className="assistant-profile-context"><summary>저장한 정보 수정</summary>{profileChatSteps.filter(field=>field!=='name').map(field=><button className="text-button" key={field} onClick={()=>{const i=profileChatSteps.indexOf(field);setProfileQueue([i]);setProfileStep(i);setSelectedInterests([...activity.interests]);setDraft('');setChatReply(null)}}>{{birthDate:'생년월일',regionCode:'거주 지역',employment:'현재 상태',school:'재학 상태',interests:'관심 분야'}[field]}</button>)}</details><details className="assistant-profile-context"><summary>{nickname||'별명 설정'}</summary><input aria-label="대화 별명" value={nickname} maxLength={30} onChange={e=>{setNickname(e.target.value);try{localStorage.setItem('dos-tres.nickname.v1',e.target.value)}catch{}}}/><p>대화에서 쓰는 별명이에요. 신청서 이름과는 별개예요.</p></details>
    </aside>
    <section className="assistant-conversation" aria-label="조이와 대화">
      <header className="assistant-heading"><img src={joyImage} alt="" /><div><h2>조이</h2><p>{chatBusy ? '답변하고 있어요' : busy ? '공고를 확인하고 있어요' : '함께 알아보고, 다음 단계까지'}</p></div><span>{scheduleContext?'일정 등록 안내':'공고 기반 안내'}</span></header>
      {saveFailed&&<p role="alert">대화를 이 브라우저에 저장하지 못했어요. 현재 화면에서는 계속할 수 있어요.</p>}
      <div className="assistant-transcript" ref={transcript} role="log" aria-label="대화 내용" aria-live="polite">
        {!detail && !center && !scheduleContext && !catalogMode && !turns.length && <div className="assistant-welcome"><img src={joyImage} alt="" /><h2>어떤 도움이 필요하세요?</h2><p>지금 필요한 도움을 편하게 말해 주세요.</p><div className="assistant-choices"><button onClick={()=>answer('월세 지원 알아보고 싶어')}>월세 지원 알아보고 싶어</button><button onClick={()=>answer('참여할 프로그램 추천해 줘')}>참여할 활동을 찾고 있어</button></div></div>}

        {turns.map((turn, index) => turn.recommendations ? <ChatRecommendations key={index} items={[...turn.recommendations.programs,...turn.recommendations.policies]} onActive={setActiveRecommendation} onAction={(action,item)=>void actOnRecommendation(action,item)} busy={busy||chatBusy}/> : chatReply?.results && !turns.some(t=>t.recommendations) && turn.role==='assistant' && !turns.slice(index+1).some(t=>t.role==='user') ? null : <div className={`assistant-turn ${turn.role}`} key={index}>{turn.role === 'assistant' && <img src={joyImage} alt="조이" />}<div>{turn.text}{index===turns.length-1 && turn.role==='assistant' && !chatBusy && !profileField && !!chatReply?.choices.length && <div className="assistant-inline-actions">{chatReply?.choices.map((choice,i)=><button className="btn btn-secondary" key={i} onClick={()=>{const answers=choice.type==='answer'&&choice.question_id&&choice.code?{...chatAnswers,[choice.question_id]:choice.code}:chatAnswers;if(choice.type==='answer')void sendChat(choice.text||choice.label,answers);else answer(choice.text||choice.label)}}>{choice.label}</button>)}</div>}</div></div>)}
        {profileField && <section className="assistant-question" aria-label="필요한 정보 입력">
          <span className="assistant-question-step">추가로 필요한 정보 · {profileQueue.indexOf(profileStep!)+1} / {profileQueue.length}</span>
          <h3>{profileField==='birthDate'?'생년월일을 알려주세요':profileField==='regionCode'?'어느 지역에 살고 있나요?':profileField==='employment'?'지금 어떤 상태인가요?':profileField==='school'?'현재 재학 상태를 알려주세요':profileField==='name'?'이름을 수정해 주세요':'관심 있는 분야를 골라주세요'}</h3>
          <p>{profileField==='birthDate'?'참여할 수 있는 나이인지 확인할 때 사용해요.':profileField==='regionCode'?'동까지 알려주셔도 좋아요. 예: 서울 강동구 천호동. 상세 주소는 필요 없어요.':profileField==='interests'?'최대 3개까지 선택할 수 있어요.':'하나를 고르면 다음으로 넘어가요.'}</p>
          <div className="assistant-profile-options">{(profileField==='employment'?chatEmploymentOptions:profileField==='school'?chatSchoolOptions:profileField==='interests'?chatInterestOptions:[]).map(option=><button key={option} aria-pressed={profileField==='interests'?selectedInterests.includes(option):profileChatCurrent(profileField,personal,activity)===option} disabled={profileField==='interests'&&!selectedInterests.includes(option)&&selectedInterests.length>=3} onClick={()=>profileField==='interests'?setSelectedInterests(prev=>prev.includes(option)?prev.filter(v=>v!==option):[...prev,option]):respondProfile(option)}>{option}</button>)}</div>
          {['name','birthDate','regionCode'].includes(profileField)&&<form onSubmit={submit}><input autoFocus aria-label="내 정보 답변" placeholder={profileField==='birthDate'?'예: 2003-06-20':profileField==='regionCode'?'예: 서울 강동구 천호동':'이름'} value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit" disabled={!draft.trim()}>다음</button></form>}
          <div className="assistant-profile-actions">{profileField==='interests'&&<button className="btn btn-primary" disabled={!selectedInterests.length} onClick={()=>respondProfile(selectedInterests.join(', '))}>이 관심으로 계속하기 →</button>}{profileQueue.indexOf(profileStep!)>0&&<button className="text-button" onClick={previousProfile}>이전 질문</button>}<button className="text-button" onClick={()=>respondProfile('',true)}>나중에 알려줄게요</button></div>
        </section>}

        {chatBusy && <p role="status">조이가 답변하고 있어요…</p>}
        {chatError && <p role="alert">{chatError}</p>}
        {chatReply?.results && !turns.some(t=>t.recommendations) && <ChatRecommendations key={turns.length} items={[...chatReply.results.programs,...chatReply.results.policies]} onActive={setActiveRecommendation} onAction={(action,item)=>void actOnRecommendation(action,item)} busy={busy||chatBusy} />}
        {!profileField && !context.profile && !!chatReply?.needs.includes('profile') && <button className="btn btn-secondary" onClick={beginProfile}>추천에 필요한 내 정보 입력</button>}
        {catalogMode && <AssistantCatalog mode={catalogMode} query={catalogQuery} criteria={{age:context.local.age,region:context.profile?.sigungu_cd||'',job:context.local.employment,school:context.local.school}} answers={context.checkin} onSelect={selectCatalogItem} />}
        {policyExample && <PolicyApplicationExample personal={personal} onClose={()=>setPolicyExample(false)} onSchedule={()=>{setPolicyExample(false);answer('월세 지원 조건·서류 확인 일정 등록')}} />}
        {applying && detail && <ApplyFlow key={detail.id} itemId={detail.id} personal={personal} onClose={()=>setApplying(false)} onSchedule={()=>{setApplying(false);answer('일정 등록')}} />}
        {!profileField && scheduler.preview}
        {busy && <p role="status">선택한 공고를 읽고 있어요…</p>}
        {failed && <div role="alert">공고를 불러오지 못했어요. <button className="text-button" onClick={() => setRevision(n => n + 1)}>다시 시도</button></div>}

      </div>
      <div className="assistant-composer">{!profileField && (!!scheduleContext || !!center || scheduler.active) && scheduler.controls}{center && <div className="assistant-choices"><button onClick={()=>answer('센터 이용 안내 알려줘')}>공간·이용 안내</button></div>}{!profileField && <form onSubmit={submit}><input aria-label="조이에게 메시지" placeholder={profileField === 'name' ? '이름 또는 별명' : profileField === 'birthDate' ? '예: 2000-01-15' : profileField === 'regionCode' ? '예: 서울 관악구' : '조이에게 물어보세요'} value={draft} onChange={e => setDraft(e.target.value)} maxLength={1000} disabled={chatBusy || (!profileField && (busy))} /><button type="submit" aria-label="메시지 보내기" disabled={chatBusy || !draft.trim() || (!profileField && (busy))}><Send size={18} /></button></form>}<p>공고 정보를 바탕으로 안내해요. 일정 대화는 날짜·시간을 확인한 뒤 저장해요. 신청은 최종 확인 후 진행해요. 대화는 AI가 답변하며 중요한 내용은 공식 안내를 확인해 주세요.</p></div>
    </section>
  </div>
}
