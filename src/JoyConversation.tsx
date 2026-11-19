import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send, Plus, ClipboardList, ArrowRight } from 'lucide-react'
import { programs, type Program } from './data'
import { conditions, demoExecute, demoNotice, demoReply, type JoyProfile, type JoyTask, type TaskKind } from './joy-demo'
import joy from './assets/joy.png'
import './joy-conversation.css'

type Message = { role: 'assistant' | 'user'; text: string }
export type ConversationEntry = { id: number; program?: Program; text?: string }
type Props = { entry: ConversationEntry; profile: JoyProfile; onProfile: (profile: JoyProfile) => void; onRecord: (program: Program, task: JoyTask) => void; onNavigate: (screen: 'calendar' | 'applications') => void; onNew: () => void }
export default function JoyConversation({ entry, profile, onProfile, onRecord, onNavigate, onNew }: Props) {
  const [program, setProgram] = useState(entry.program)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: entry.program ? `${entry.program.title}, 나도 신청할 수 있는지 함께 알아볼까요? 거주지는 ${profile.region || '미입력'}으로 입력되어 있어요. 연령과 활동 상태를 알려주세요.` : '안녕하세요! 어떤 일을 도와드릴까요?\n필요한 지원을 찾거나, 궁금한 조건을 알아보고 신청도 도와드릴게요.' }, ...(entry.text ? [{ role: 'user' as const, text: entry.text }, { role: 'assistant' as const, text: '아래 예시 항목을 골라 조건을 함께 확인해 볼까요?' }] : [])])
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(!!entry.program)
  const [form, setForm] = useState(profile)
  const [task, setTask] = useState<JoyTask>()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState('')
  const [error, setError] = useState('')
  const [failReply, setFailReply] = useState(false)
  const [failTask, setFailTask] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const active = useRef(true)
  const busy = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [messages, pending, task?.status])
  const send = async (text: string, retry = false) => {
    if (!text.trim() || busy.current) return
    busy.current = true; setPending(true); setError(''); setFailed(''); setDraft('')
    if (!retry) setMessages(v => [...v, { role: 'user', text }])
    try { const reply = await demoReply(text, failReply); if (active.current) setMessages(v => [...v, { role: 'assistant', text: reply }]) }
    catch (e) { if (active.current) { setError((e as Error).message); setFailed(text) } }
    finally { busy.current = false; if (active.current) setPending(false) }
  }
  const saveProfile = (e: FormEvent) => {
    e.preventDefault(); if (task?.status === '진행 중') return; onProfile(form); setEditing(false)
    if (task && !['진행 중', '완료'].includes(task.status)) setTask({ ...task, profile: { ...form }, status: '사용자 확인 필요', result: undefined })
    setMessages(v => [...v, { role: 'assistant', text: '알려주신 정보를 이번 대화에 반영했어요. 조건 확인 카드를 다시 확인해 주세요.' }])
  }
  const choose = (p: Program) => { setProgram(p); setTask(undefined); setEditing(true); setForm(profile); setMessages(v => [...v, { role: 'assistant', text: `${p.title}의 조건을 확인할게요. 연령과 활동 상태가 필요해요.` }]) }
  const prepare = (kind: TaskKind) => setTask({ kind, status: '준비 중', profile: { ...profile }, note: `${program?.title} ${kind}을 도와주세요.` })
  const execute = async () => {
    if (!task || busy.current) return
    busy.current = true; setTask({ ...task, status: '진행 중', result: undefined })
    try { const result = await demoExecute(task, failTask); if (active.current) setTask({ ...task, status: '완료', result }) }
    catch (e) { if (active.current) setTask({ ...task, status: '실패', result: (e as Error).message }) }
    finally { busy.current = false }
  }
  const summary = <><ClipboardList size={24} aria-hidden="true" /><h2>현재 맡긴 작업</h2><strong>{program?.title ?? '대화로 함께 찾아봐요'}</strong><p>{task ? `${task.kind} · ${task.status}` : '조건 확인부터 차근차근 도와드려요.'}</p><p>사용 정보: {profile.region || '지역 미입력'}{profile.age && ` · 만 ${profile.age}세`}{profile.employment && ` · ${profile.employment}`}</p><small>새 대화를 시작하면 항목·메시지·작업은 비워지고, 입력한 내 정보는 이 탭에서 유지돼요. 새로고침하면 초기화돼요.</small></>
  return <section className="joy-conversation" aria-label="조이 대화">
    <div className="joy-dialog">
      <header className="joy-dialog-head"><img src={joy} alt="" /><div><h1>조이 <span>JOY</span></h1><small>나의 개인 AI 비서</small></div><button className="btn btn-secondary" onClick={onNew}><Plus size={18} /> 새 대화</button></header>
      <p className="joy-demo-note">{demoNotice}</p>
      <div className="joy-flow">
        <div role="log" aria-label="대화 메시지" aria-live="polite">{messages.map((m, i) => <div key={i} className={`joy-message joy-message-${m.role}`}><small>{m.role === 'user' ? '나' : '조이'}</small><p>{m.text}</p></div>)}</div>
        <div className="joy-choices">{['내게 맞는 지원 찾아줘', '우리 동네 프로그램 찾아줘', '신청·예약 도와줘'].map(t => <button className="btn btn-secondary" disabled={pending} key={t} onClick={() => void send(t)}>{t}<ArrowRight size={16} /></button>)}</div>
        <div className="joy-profile-prompt"><p>나에 대해 알려주면 더 잘 도와드릴 수 있어요.</p><button className="btn btn-soft" onClick={() => { setForm(profile); setEditing(true) }}>내 정보 {profile.age ? '수정하기' : '알려주기'}</button></div>
        {!program && <section className="joy-card"><h2>함께 살펴볼 지원 · 시연용 예시</h2><div className="joy-choices">{programs.map(p => <button key={p.id} className="btn btn-secondary" onClick={() => choose(p)}>{p.title}</button>)}</div></section>}
        {editing && <form className="joy-card joy-profile-form" onSubmit={saveProfile}><h2>필요한 정보만 알려주세요</h2><p>조건 확인에 사용해요. 실제 계정에는 저장되지 않아요.</p><label>거주 지역<input required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></label><label>만 나이<input type="number" min="0" max="120" required value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></label><label>현재 활동 상태<select required value={form.employment} onChange={e => setForm({ ...form, employment: e.target.value })}><option value="">선택해 주세요</option>{['미취업', '재직', '학생', '기타'].map(v => <option key={v}>{v}</option>)}</select></label><div className="joy-choices"><button className="btn btn-primary">정보 반영하기</button><button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>나중에 알려주기</button></div></form>}
        {program && <section className="joy-card"><span className="joy-tag">시연용 예시</span><h2>{program.title} · 조건 확인</h2><p>가상 조건의 비교 결과예요. 실제 신청 자격은 공식 공고 확인이 필요해요.</p>{conditions(program, profile).map(c => <div className="joy-condition" key={c.name}><strong>{c.name}</strong><span className="joy-tag">{c.status}</span><details><summary>사용 정보와 근거 확인</summary><p>내 정보: {c.value}</p><p>비교 근거: {c.rule}</p><p>공고 출처: {program.source}</p>{/^https?:\/\//.test(program.source) && <a href={program.source} target="_blank" rel="noreferrer">공고 원문 보기 ↗</a>}</details></div>)}<button className="btn btn-secondary" onClick={() => { setForm(profile); setEditing(true) }}>부족한 정보 입력·수정</button><div className="joy-choices">{(['신청', '문의', '예약'] as const).map(kind => <button className="btn btn-primary" key={kind} disabled={task?.status === '진행 중'} onClick={() => prepare(kind)}>{kind} 도와줘</button>)}</div></section>}
        {task && program && <section className="joy-card" aria-label="작업 진행"><span className="joy-tag">시연용 예시 · {task.status}</span><h2>{program.title} · {task.kind}</h2><div role="status"><p>{task.result ?? (task.status === '진행 중' ? '시연 기관의 처리 결과를 기다리고 있어요…' : '대상과 사용할 정보를 확인해 주세요. 실제 기관에는 전송하지 않아요.')}</p></div><p>사용할 정보: {task.profile.region || '미입력'} · {task.profile.age ? `만 ${task.profile.age}세` : '연령 미입력'} · {task.profile.employment || '활동 상태 미입력'}</p><label>요청 내용<textarea aria-label="요청 내용" value={task.note} disabled={['진행 중', '완료'].includes(task.status)} onChange={e => setTask({ ...task, note: e.target.value, status: '사용자 확인 필요' })} /></label><div className="joy-choices">{task.status === '준비 중' && <button className="btn btn-primary" onClick={() => setTask({ ...task, status: '사용자 확인 필요' })}>작업 내용 확인</button>}{task.status === '사용자 확인 필요' && <><button className="btn btn-secondary" onClick={() => { setForm(profile); setEditing(true) }}>사용 정보 수정</button><button className="btn btn-primary" disabled={!task.note.trim()} onClick={() => void execute()}>확인했어요 · 시연 진행</button></>}{task.status === '실패' && <button className="btn btn-primary" onClick={() => void execute()}>작업 재시도</button>}{task.status === '완료' && <><button className="btn btn-primary" onClick={() => onRecord(program, task)}>시연 준비 이력 남기기</button><button className="btn btn-secondary" onClick={() => onNavigate('calendar')}>내 일정 보기</button><button className="btn btn-secondary" onClick={() => onNavigate('applications')}>이력 보기</button></>}</div></section>}
        <details className="joy-mobile-summary"><summary>현재 작업 요약</summary>{summary}</details>
        <details className="joy-simulation"><summary>시연 상태 확인 도구</summary><label><input type="checkbox" checked={failReply} onChange={e => setFailReply(e.target.checked)} /> 메시지 실패 재현</label><label><input type="checkbox" checked={failTask} onChange={e => setFailTask(e.target.checked)} /> 작업 실패 재현</label><p>해제 후 재시도하면 정상 시연 결과를 확인할 수 있어요.</p></details>
        {pending && <p role="status">조이가 답변을 준비하고 있어요…</p>}{error && <div role="alert"><p>{error}</p><button className="btn btn-secondary" disabled={pending} onClick={() => void send(failed, true)}>메시지 재시도</button></div>}<div ref={bottom} />
      </div>
      <form className="joy-composer" onSubmit={e => { e.preventDefault(); void send(draft.trim()) }}><label htmlFor="joy-message">조이에게 메시지</label><div><textarea id="joy-message" rows={2} maxLength={4000} placeholder="어떤 일을 도와드릴까요?" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(draft.trim()) } }} /><button className="btn btn-primary" disabled={pending || task?.status === '진행 중' || !draft.trim()} aria-label="메시지 전송"><Send size={20} /></button></div><small>Enter 전송 · Shift+Enter 줄바꿈</small></form>
    </div><aside className="joy-summary">{summary}</aside>
  </section>
}
