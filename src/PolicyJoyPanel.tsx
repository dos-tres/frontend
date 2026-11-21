import { profileChatSteps, profileChatCurrent, profileChatQuestion, parseProfileChat, chatEmploymentOptions, chatSchoolOptions, chatInterestOptions } from './profile-chat'
import joyImage from './assets/joy.png'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Bookmark, ExternalLink, MessageCircle, Plus, Send } from 'lucide-react'
import type { Program } from './data'
import type { PersonalInformation } from './ProfileSettings'
import { profileRegionLabel } from './ProfileSettings'
import type { ActivityInformationValue } from './ActivityInformation'
import { ageFromBirthDate, applicationLabel, periodLabel, requestCatalogItem, safePolicyUrl } from './policy-api'

type Turn = { role: 'assistant' | 'user'; text: string }
type Props = { program?: Program; personal: PersonalInformation; activity: ActivityInformationValue; initialMessages: Turn[]; onBack: () => void; onSavePersonal: (value: PersonalInformation) => void; onSaveActivity: (value: ActivityInformationValue) => void; onNew: () => void; onSave: () => void; saved: boolean }
const choices = ['어떤 지원이야?', '내 조건 확인해 줘', '신청 방법 알려줘']
const short = (value?: string) => value && value.length > 420 ? `${value.slice(0, 420)}…` : value

export default function PolicyJoyPanel({ program, personal, activity, initialMessages, onBack, onSavePersonal, onSaveActivity, onNew, onSave, saved }: Props) {
  const [detail, setDetail] = useState(program)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [profileStep, setProfileStep] = useState<number | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const profileField = profileStep === null ? undefined : profileChatSteps[profileStep]
  const transcript = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setDetail(program); setFailed(false); setDraft(''); setProfileStep(null)
    setTurns(program ? [{ role: 'user', text: `‘${program.title}’에 대해 알아보고 싶어.` }] : [])
    if (!program) { setBusy(false); return }
    const controller = new AbortController(); setBusy(true)
    requestCatalogItem(program.id, controller.signal).then(item => {
      if (controller.signal.aborted) return
      setDetail({ ...item, why: program.why })
      setTurns(prev => [...prev, { role: 'assistant', text: `좋아요. ‘${item.title}’부터 함께 살펴봐요.\n\n${short(item.summary) || '제공된 공고에서 지원 내용을 확인해 볼게요.'}\n\n신청 기간은 ${periodLabel(item.period)}예요. 내 조건과 맞는지 먼저 볼까요, 신청 방법부터 알아볼까요?` }])
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [program?.id, revision])
  useEffect(() => { const node = transcript.current; if (node) node.scrollTop = node.scrollHeight }, [turns, busy])
  useEffect(() => { window.scrollTo(0, 0) }, [program?.id])
  const age = ageFromBirthDate(personal.birthDate)
  const official = detail && safePolicyUrl(detail.referenceUrl || detail.applyUrl)
  const beginProfile = () => {
    if (profileStep !== null) return
    setProfileStep(0); setDraft(''); setSelectedInterests([...activity.interests])
    setTurns(prev => [...prev, { role: 'user', text: '내 정보 입력할게' }, { role: 'assistant', text: `추천에 필요한 정보만 하나씩 물어볼게요. 답한 내용은 이 브라우저에 저장돼요. 건너뛰어도 괜찮아요.\n\n${profileChatQuestion('birthDate', personal, activity)}` }])
  }
  const respondProfile = (text: string, skip = false, keep = false) => {
    if (!profileField || profileStep === null) return
    let nextPersonal = personal, nextActivity = activity
    const parsed = skip || keep ? undefined : parseProfileChat(profileField, text)
    if (parsed && 'error' in parsed) {
      setTurns(prev => [...prev, { role: 'user', text }, { role: 'assistant', text: parsed.error }]); setDraft(''); return
    }
    if (parsed && 'value' in parsed) {
      if (profileField === 'birthDate' || profileField === 'regionCode') { nextPersonal = { ...personal, [profileField]: parsed.value as string }; onSavePersonal(nextPersonal) }
      else { nextActivity = { ...activity, [profileField]: parsed.value }; onSaveActivity(nextActivity) }
    }
    const nextStep = profileStep + 1
    const reply = skip ? '이번 항목은 건너뛰었어요. 기존 정보가 있으면 유지해요.' : keep ? '기존 정보를 그대로 사용할게요.' : `${parsed && 'label' in parsed ? parsed.label : text}(으)로 반영했어요.`
    setTurns(prev => [...prev, { role: 'user', text: skip ? '건너뛸게' : keep ? '그대로 사용할게' : (parsed && 'label' in parsed ? parsed.label : text) }, { role: 'assistant', text: `${reply}\n\n${nextStep < profileChatSteps.length ? profileChatQuestion(profileChatSteps[nextStep], nextPersonal, nextActivity) : '내 정보 확인을 마쳤어요. 입력한 정보는 마이페이지에서도 확인·수정할 수 있어요. 이제 공고의 내 조건을 다시 확인해 볼까요?'}` }])
    setProfileStep(nextStep < profileChatSteps.length ? nextStep : null); setDraft('')
  }
  const answer = (text: string) => {
    const value = text.trim(); if (!value) return
    if (profileField) { respondProfile(value, /^(건너뛰기|건너뛸게|나중에)$/.test(value)); return }
    if (/내\s*정보.*(입력|수정|등록)/.test(value)) { beginProfile(); return }
    if (busy || failed) return
    let response: string
    if (!detail) response = '정책·활동 찾기에서 관심 있는 공고를 골라 주세요. ‘조이와 알아보기’를 누르면 그 공고를 이 대화로 가져와 지원 내용과 신청 조건을 함께 살펴볼 수 있어요.'
    else if (/조건|자격|대상|나이|지역|소득/.test(value)) {
      const missing = [!age && '나이', !personal.regionCode && '거주 지역', !activity.employment && '현재 상태'].filter(Boolean)
      response = `저장해 둔 정보부터 볼게요.\n${age ? `만 ${age}세` : '나이 미등록'} · ${personal.regionCode ? profileRegionLabel(personal.regionCode) : '거주 지역 미등록'} · ${activity.employment || '현재 상태 미등록'}${activity.school ? ` · ${activity.school}` : ''}\n\n공고의 신청 대상은 다음과 같아요.\n${detail.target || '세부 대상 정보가 제공되지 않았어요.'}${detail.income ? `\n\n소득 조건\n${detail.income}` : ''}${detail.exclusions ? `\n\n참여 제한\n${detail.exclusions}` : ''}\n\n${missing.length ? `${missing.join('·')} 정보가 아직 없어요. 아래 ‘내 정보 입력’에서 저장한 뒤 다시 확인할 수 있어요.` : '추가 자격과 소득·가구 조건도 확인해야 해요.'} 저장 정보만으로 신청 가능 여부를 확정할 수는 없어요.`
    } else if (/신청|방법|서류|준비/.test(value)) response = `신청 방법을 확인했어요.\n\n${detail.method || '공고에 세부 신청 방법이 제공되지 않았어요. 공식 공고에서 확인해 주세요.'}${detail.documents ? `\n\n준비할 서류\n${detail.documents}` : ''}\n\n신청 기간: ${periodLabel(detail.period)}\n제가 대신 신청하는 기능은 아직 준비 중이에요. 공식 공고는 옆의 작은 링크에서 확인할 수 있어요.`
    else if (/지원|내용|요약|설명/.test(value)) response = `${detail.summary || '제공된 요약이 없어요.'}${detail.support && detail.support !== detail.summary ? `\n\n${detail.support}` : ''}\n\n다음으로 내 조건과 신청 방법 중 무엇을 볼까요?`
    else response = '지금은 선택한 공고의 지원 내용·신청 조건·신청 방법을 안내할 수 있어요. 아래 선택지로 이어가 주세요. 자유로운 AI 대화는 아직 연결 준비 중이에요.'
    setTurns(prev => [...prev, { role: 'user', text: value }, { role: 'assistant', text: response }]); setDraft('')
  }
  const submit = (event: FormEvent) => { event.preventDefault(); answer(draft) }
  return <div className="assistant-workspace">
    <aside className="assistant-sidebar">
      <div className="assistant-sidebar-title"><MessageCircle size={20} /><h1>AI 비서</h1></div>
      <button className="btn btn-secondary" onClick={() => { setTurns([]); setProfileStep(null); setDraft(''); onNew() }}><Plus size={16} /> 새 대화</button>
      <p className="assistant-sidebar-label">지금 살펴보는 공고</p>
      {detail ? <div className="assistant-context"><span className={`policy-period-status status-${detail.applicationStatus || 'unknown'}`}>{applicationLabel(detail)}</span><h2>{detail.title}</h2><p>{detail.region} · {detail.categories?.join(' · ')}</p><p>신청 기간<br />{periodLabel(detail.period)}</p><button className="text-button" onClick={onSave} aria-pressed={saved}><Bookmark size={14} /> {saved ? '관심 해제' : '관심 저장'}</button>{official && <a className="policy-official-link" href={official} target="_blank" rel="noopener noreferrer">공식 공고 <ExternalLink size={12} /></a>}</div> : <p className="settings-help">관심 있는 정책이나 프로그램을 가져와 조이와 함께 알아보세요.</p>}
      <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} /> 정책·활동 찾기</button>
      <button className="text-button" onClick={beginProfile}>내 정보 입력·수정</button>
    </aside>
    <section className="assistant-conversation" aria-label="조이와 대화">
      <header className="assistant-heading"><img src={joyImage} alt="" /><div><h2>조이</h2><p>{busy ? '공고를 확인하고 있어요' : '함께 알아보고, 다음 단계까지'}</p></div><span>공고 기반 안내</span></header>
      <div className="assistant-transcript" ref={transcript} role="log" aria-label="대화 내용" aria-live="polite">
        {!program && <div className="assistant-welcome"><img src={joyImage} alt="" /><h2>어떤 도움이 필요하세요?</h2><p>지원 내용을 알아보거나, 내 조건과 신청 준비를 함께 확인해요.</p></div>}
        {!program && initialMessages.filter(m => m.role === 'user').slice(-1).map((m, i) => <div key={`initial-${i}`}><div className="assistant-turn user"><div>{m.text}</div></div><div className="assistant-turn assistant"><img src={joyImage} alt="조이" /><div>관심 있는 공고를 함께 살펴봐요. 아래 ‘정책·프로그램 찾아보기’에서 선택하면 이 대화로 가져올게요.</div></div></div>)}
        {turns.map((turn, index) => <div className={`assistant-turn ${turn.role}`} key={index}>{turn.role === 'assistant' && <img src={joyImage} alt="조이" />}<div>{turn.text}</div></div>)}
        {busy && <p role="status">선택한 공고를 읽고 있어요…</p>}
        {failed && <div role="alert">공고를 불러오지 못했어요. <button className="text-button" onClick={() => setRevision(n => n + 1)}>다시 시도</button></div>}

      </div>
      <div className="assistant-composer"><div className="assistant-choices">{profileField ? <>
        {profileField === 'employment' && chatEmploymentOptions.map(option => <button key={option} onClick={() => respondProfile(option)}>{option}</button>)}
        {profileField === 'school' && chatSchoolOptions.map(option => <button key={option} onClick={() => respondProfile(option)}>{option}</button>)}
        {profileField === 'interests' && <>{chatInterestOptions.map(option => <button aria-pressed={selectedInterests.includes(option)} disabled={!selectedInterests.includes(option) && selectedInterests.length >= 3} key={option} onClick={() => setSelectedInterests(prev => prev.includes(option) ? prev.filter(v => v !== option) : [...prev, option])}>{option}</button>)}<button disabled={!selectedInterests.length} onClick={() => respondProfile(selectedInterests.join(', '))}>선택 완료</button></>}
        {profileChatCurrent(profileField, personal, activity) && <button onClick={() => respondProfile('', false, true)}>기존 정보 그대로</button>}
        <button onClick={() => respondProfile('', true)}>건너뛰기</button><button onClick={() => { setProfileStep(null); setDraft(''); setTurns(prev => [...prev, { role: 'assistant', text: '여기까지 입력한 정보는 유지할게요. 언제든 다시 입력할 수 있어요.' }]) }}>여기까지 입력</button>
      </> : <>{detail ? choices.map(c => <button disabled={busy || failed} key={c} onClick={() => answer(c)}>{c}</button>) : <button onClick={onBack}>정책·프로그램 찾아보기</button>}<button onClick={beginProfile}>내 정보 입력</button></>}</div><form onSubmit={submit}><input aria-label="조이에게 메시지" placeholder={profileField === 'birthDate' ? '예: 2000-01-15' : profileField === 'regionCode' ? '예: 서울 관악구' : '조이에게 물어보세요'} value={draft} onChange={e => setDraft(e.target.value)} disabled={!profileField && (busy || failed)} /><button type="submit" aria-label="메시지 보내기" disabled={!draft.trim() || (!profileField && (busy || failed))}><Send size={18} /></button></form><p>공고 정보를 바탕으로 안내해요. 자유 대화 AI와 자동 신청은 연결 준비 중이에요.</p></div>
    </section>
  </div>
}
