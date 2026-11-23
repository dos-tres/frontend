import type { AnswerDecision } from './setup-state'
import { recommendationAnswers as mergeRecommendationAnswers, currentRecommendationAnswers } from './profile-context'
import { usePolicyCatalog } from './use-policy-catalog'
import type { PolicyProfile } from './policy-api'
import type { Program } from './data'
import { useEffect, useMemo, useRef, useState } from 'react'
import { exampleQuestions, exampleSummary } from './checkin-example'
import { SettingsShell } from './ProfileSettings'
import { buildStateResult, supportsForResult, typeInfo, type CheckinRecord, type StateResult } from './checkin-result'
import { checkinScales, checkinBinaryOptions } from './checkin-scale'
import { loadQuestions, summarizeAnswers, type Answers, type Question, type Questions, type Summary } from './checkin-api'

export type CurrentStateValue = { answers: Answers; ratings?: Record<string, number>; completed: boolean; summary?: Summary; result?: StateResult; id?: string; savedAt?: string }
export const initialCurrentState: CurrentStateValue = { answers: {}, completed: false }

export default function CurrentStateCheck({ value, profile, defaultInterests, preferProfile = false, onboarding = false, startInSurvey = false, decisions = {}, onDecision, onOpenPolicy, onEditProfile, history, storageError, onSave, onBack, onChat }: {
  startInSurvey?: boolean; onboarding?: boolean; preferProfile?: boolean; decisions?: Record<string, AnswerDecision>; onDecision?: (id: string, decision: AnswerDecision) => void; value: CurrentStateValue; profile: PolicyProfile; defaultInterests: string[]; onOpenPolicy: (program: Program) => void; onEditProfile: () => void; history: CheckinRecord[]; storageError: boolean; onSave: (value: CheckinRecord) => void; onBack: () => void; onChat: () => void
}) {
  const [catalog, setCatalog] = useState<Questions>()
  const [answers, setAnswers] = useState<Answers>(() => Object.fromEntries(Object.entries(mergeRecommendationAnswers(startInSurvey ? {} : value.answers, defaultInterests, preferProfile)).filter(([id, answer]) =>
    Array.isArray(answer) || (!['unknown', 'skip', 'later'].includes(answer) && (!checkinBinaryOptions[id] || checkinBinaryOptions[id].some(option => option.code === answer)))
  )))
  const [serverSummary, setServerSummary] = useState(startInSurvey ? undefined : value.summary)
  const [ratings, setRatings] = useState<Record<string, number>>(startInSurvey ? {} : { ...value.ratings })
  const [editing, setEditing] = useState(startInSurvey)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<StateResult | undefined>(startInSurvey ? undefined : value.result || (value.completed ? buildStateResult(value.answers, value.summary) : undefined))
  const [selectedId, setSelectedId] = useState(startInSurvey ? undefined : value.id)
  const recommendationAnswers = useMemo(() => selectedId && selectedId !== value.id && !editing ? answers : currentRecommendationAnswers(answers, defaultInterests, preferProfile, decisions), [answers, defaultInterests, preferProfile, selectedId, value.id, editing, decisions])
  const recommendations = usePolicyCatalog(!!result && !editing, recommendationAnswers, profile)
  const heading = useRef<HTMLHeadingElement>(null)
  const submission = useRef<AbortController>()
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    loadQuestions(controller.signal).then(setCatalog).catch(() => {
      if (!controller.signal.aborted) { setCatalog(exampleQuestions) }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
  useEffect(() => () => submission.current?.abort(), [])
  useEffect(() => { heading.current?.focus() }, [editing, result, loading])
  const questions = catalog ? [...catalog.domain_questions, ...catalog.extra_questions] : []
  const groups = [
    { title: '일상과 마음', description: '각 문항에서 나에게 가까운 점을 하나 골라 주세요.', questions: questions.filter(q => checkinScales[q.id]) },
    { title: '활동과 관계', description: '해당하는 답을 하나 골라 주세요.', questions: questions.filter(q => checkinBinaryOptions[q.id]) },
    { title: '필요한 변화와 지원', description: '해당하는 항목을 모두 골라 주세요.', questions: questions.filter(q => !checkinScales[q.id] && !checkinBinaryOptions[q.id]) },
  ]
  const orderedQuestions = groups.flatMap(group => group.questions)
  const answered = questions.filter(q => answers[q.id]?.length).length
  const update = (question: Question, code: string) => {
    const previous = answers[question.id]
    let next: string | string[] = code
    if (question.multiple) {
      const selected = Array.isArray(previous) ? previous : []
      next = selected.includes(code) ? selected.filter(c => c !== code) : code === 'none' ? ['none'] : [...selected.filter(c => c !== 'none'), code]
      if (question.max && next.length > question.max) return
    }
    onDecision?.(question.id, 'answered')
    setAnswers(current => ({ ...current, [question.id]: next }))
  }
  const saveResult = (summary: Summary) => {
    const nextResult = buildStateResult(answers, summary)
    setServerSummary(summary)
    const record: CheckinRecord = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), answers: { ...answers }, ratings: { ...ratings }, completed: true, summary, result: nextResult }
    setResult(nextResult); setSelectedId(record.id); setEditing(false); onSave(record)
  }
  const restart = () => { setAnswers({}); setRatings({}); setResult(undefined); setServerSummary(undefined); setSelectedId(undefined); setEditing(true); setHistoryOpen(false) }
  const selectRecord = (record: CheckinRecord) => { setAnswers({ ...record.answers }); setRatings({ ...record.ratings }); setResult(record.result); setServerSummary(record.summary); setSelectedId(record.id); setEditing(false); setHistoryOpen(false) }
  const submit = async () => {
    if (sending) return
    submission.current?.abort()
    const controller = new AbortController(); submission.current = controller
    setSending(true)
    try {
      const result = await summarizeAnswers(answers, controller.signal)
      if (!controller.signal.aborted) saveResult(result)
    } catch {
      if (!controller.signal.aborted) { saveResult(exampleSummary(answers)) }
    } finally { if (!controller.signal.aborted) setSending(false) }
  }
  return <SettingsShell title="생활 점검" hideBack={onboarding} description="요즘의 일상과 관계를 돌아보고, 지금 필요한 도움을 확인해요." onBack={onBack}>
    {!editing && !historyOpen && serverSummary?.example && <p role="status">서버 연결 실패 또는 시간 초과로 답변 기반 로컬 결과를 표시해요. 서버 계산 결과가 아니에요.</p>}
    {loading && <p role="status">생활 점검 문항을 불러오고 있어요.</p>}
    {storageError && <p role="alert" className="checkin-storage-error">이 브라우저에 결과를 저장하지 못했어요. 현재 화면에서는 볼 수 있지만, 새로고침하면 이 결과가 남지 않을 수 있어요.</p>}
    {history.length > 0 && !onboarding && <div className="button-row"><button type="button" className="btn btn-secondary" disabled={sending} onClick={() => setHistoryOpen(open => !open)}>{historyOpen ? '점검으로 돌아가기' : '이력 보기'}</button>{!editing && <button type="button" className="btn btn-secondary" onClick={restart}>다시 점검하기</button>}</div>}
    {historyOpen && history.length > 0 && <section className="panel checkin-history"><div className="section-head"><h2>생활 점검 이력</h2></div><div className="checkin-history-list">{history.map(record => <button type="button" key={record.id} aria-pressed={selectedId === record.id && !editing} disabled={sending} onClick={() => selectRecord(record)}><time dateTime={record.savedAt}>{new Date(record.savedAt).toLocaleString('ko-KR')}</time><strong>{record.result.title}</strong><span>결과 보기</span></button>)}</div></section>}
    {!loading && !historyOpen && catalog && (result && !editing ? <div className="checkin-result">
      <section className="panel settings-section"><span className="mini-label">점검 결과</span><h2 ref={heading} tabIndex={-1}>{result.title}</h2><p>{result.description}</p>
        <div className="checkin-result-tags">{result.types.map(type => <span key={type}>{typeInfo[type].title}</span>)}</div>
        <dl className="checkin-result-areas">{result.areas.map(area => <div key={area.name}><dt>{area.name}</dt><dd>{area.status}</dd></div>)}</dl>
        {serverSummary?.notes.map(note => <p key={note}>{note}</p>)}
        {serverSummary?.interests?.length ? <p>관심 분야: {serverSummary.interests.join(', ')}</p> : null}
        {serverSummary?.satisfaction && <p>생활 만족도: {{ good: '만족하는 편', normal: '보통', bad: '아쉬운 편' }[serverSummary.satisfaction] || serverSummary.satisfaction}</p>}
        <p className="settings-help">{serverSummary?.disclaimer || '응답을 바탕으로 정리한 현재 상태예요. 의학적 진단이나 위험 등급이 아니에요.'}</p>
        <div className="settings-survey-actions"><button className="btn btn-secondary" onClick={() => setEditing(true)}>답변 수정하고 다시 저장</button><button className="btn btn-secondary" onClick={restart}>다시 점검하기</button><button className="btn btn-secondary" onClick={onChat}>{onboarding ? '조이와 대화 시작하기' : '조이와 이야기하기'}</button></div>
        {!storageError && <p role="status" className="settings-help">결과가 이 브라우저에 저장됐어요. 다음 방문에도 이력에서 확인할 수 있어요.</p>}
      </section>
      <section className="panel settings-section" aria-busy={recommendations.busy}><h2>지금 살펴볼 정책과 프로그램</h2>
        {recommendations.busy && <p role="status">내 조건과 점검 결과에 맞는 지원을 확인하고 있어요.</p>}
        {recommendations.notice && <p>{recommendations.notice}</p>}
        {recommendations.recommended?.length === 0 && <p>조건에 맞는 추천 결과가 없어요. 정책 검색에서 조건을 바꿔 보세요.</p>}
        {recommendations.recommended !== undefined ? <div className="checkin-support-list">{recommendations.recommended.map(item => <article key={item.id}><span>{item.type} · {item.region}</span><h3>{item.title}</h3><p>{item.summary}</p>{item.why?.length ? <ul>{item.why.map(why => <li key={why}>{why}</li>)}</ul> : null}{item.income && <p>소득 조건: {item.income}</p>}<p>{item.source} · {item.period}</p><button className="btn btn-secondary" onClick={() => onOpenPolicy(item)}>지원 내용 확인</button></article>)}</div> : !recommendations.busy && <>
          {(!recommendations.criteria.age || recommendations.criteria.region.length < 5) && <p>나이와 거주 시·군·구를 등록하면 점검 결과에 맞는 정책과 프로그램을 확인할 수 있어요. <button className="btn btn-secondary" onClick={onEditProfile}>내 정보 등록</button></p>}
          <p>지금 바로 살펴볼 수 있는 전국 공통 지원 안내예요.</p>
          <div className="checkin-support-list">{supportsForResult(result).map(item => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><small>{item.source} · 공식 안내 ↗</small></a>)}</div>
        </>}
      </section>
    </div> : <form className="checkin-survey" aria-busy={sending} onSubmit={event => { event.preventDefault(); void submit() }}>
      <section className="panel settings-section checkin-survey-intro">
        <h2 ref={heading} tabIndex={-1}>요즘의 나는 어떤가요?</h2><p>{catalog.notice}</p>
        <p>전체 {questions.length}개 문항을 살펴보고, 나에게 가까운 답을 골라 주세요. 답하고 싶지 않은 문항은 비워 두어도 괜찮아요.</p>
        <p className="settings-help" role="status">{questions.length}개 중 {answered}개 응답</p>
        <progress className="settings-progress" aria-label="응답한 문항 수" value={answered} max={questions.length} />
      </section>
      {groups.filter(group => group.questions.length).map(group => <section key={group.title} className="panel checkin-survey-group" aria-label={group.title}>
        <div className="checkin-group-heading"><h2>{group.title}</h2><p>{group.description}</p></div>
        {group.questions.map(question => <fieldset key={question.id} className="checkin-survey-question" disabled={sending}>
        <legend><span className="checkin-question-number">{String(orderedQuestions.indexOf(question) + 1).padStart(2, '0')}</span>{question.text}</legend>
        {question.multiple && <p className="settings-help">{question.max ? `최대 ${question.max}개 선택` : '여러 개 선택 가능'}</p>}
        {checkinScales[question.id] ? <>
          <div className="checkin-scale" role="radiogroup" aria-label={question.text}>
            {checkinScales[question.id].labels.map((label, position) => <label key={label} className="checkin-scale-option">
              <input type="radio" name={question.id} value={position + 1} checked={ratings[question.id] === position + 1} onChange={() => { setRatings(current => ({ ...current, [question.id]: position + 1 })); update(question, checkinScales[question.id].codes[position]) }} />
              <span className="checkin-scale-dot" aria-hidden="true" /><span className="checkin-scale-label">{label}</span>
            </label>)}
          </div>
        </> : <div className="settings-survey-options">
          {(checkinBinaryOptions[question.id] || question.options).map(option => {
            const answer = answers[question.id]
            const checked = Array.isArray(answer) ? answer.includes(option.code) : answer === option.code
            const atLimit = question.multiple && !checked && option.code !== 'none' && !!question.max && Array.isArray(answer) && answer.filter(code => code !== 'none').length >= question.max
            return <label className={`settings-choice ${checked ? 'active' : ''}`} key={option.code}><input type={question.multiple ? 'checkbox' : 'radio'} name={question.id} checked={checked} disabled={!!atLimit} onChange={() => update(question, option.code)} /><span>{option.label}</span></label>
          })}
        </div>}
        <button type="button" className="checkin-clear-answer" onClick={() => { setAnswers(current => { const next = { ...current }; delete next[question.id]; return next }); setRatings(current => { const next = { ...current }; delete next[question.id]; return next }); onDecision?.(question.id, 'declined') }}>답하지 않을래요</button>
        {!answers[question.id]?.length && decisions[question.id] === 'skipped' && <p className="settings-help">이번에는 건너뛴 문항이에요. 나중에 답할 수 있어요.</p>}
        {!answers[question.id]?.length && decisions[question.id] === 'declined' && <p className="settings-help">답변하지 않겠다는 선택을 이 브라우저에 보관해요.</p>}
        {answers[question.id]?.length > 0 && <button type="button" className="checkin-clear-answer" onClick={() => { setAnswers(current => { const next = { ...current }; delete next[question.id]; return next }); setRatings(current => { const next = { ...current }; delete next[question.id]; return next }) }}>선택 해제</button>}
      </fieldset>)}
      </section>)}
      <section className="panel settings-section checkin-survey-submit"><div><strong>{questions.length}개 중 {answered}개 응답했어요</strong><p className="settings-help">선택한 답변을 바탕으로 지금 필요한 도움을 정리해요.</p></div><div>{onboarding && <button type="button" className="text-button" disabled={sending} onClick={onBack}>나중에 하기</button>}<button type="submit" className="btn btn-primary" disabled={sending || answered === 0}>{sending ? '결과를 불러오는 중…' : '결과 보기'}</button></div></section>
    </form>)}
  </SettingsShell>
}
