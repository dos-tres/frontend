import { useEffect, useRef, useState } from 'react'
import { exampleQuestions, exampleSummary } from './checkin-example'
import { SettingsShell } from './ProfileSettings'
import { buildStateResult, supportsForResult, typeInfo, type CheckinRecord, type StateResult } from './checkin-result'
import { checkinScales, checkinBinaryOptions } from './checkin-scale'
import { loadQuestions, summarizeAnswers, type Answers, type Question, type Questions, type Summary } from './checkin-api'

export type CurrentStateValue = { answers: Answers; ratings?: Record<string, number>; completed: boolean; summary?: Summary; result?: StateResult; id?: string; savedAt?: string }
export const initialCurrentState: CurrentStateValue = { answers: {}, completed: false }

export default function CurrentStateCheck({ value, history, storageError, onSave, onBack, onChat }: {
  value: CurrentStateValue; history: CheckinRecord[]; storageError: boolean; onSave: (value: CheckinRecord) => void; onBack: () => void; onChat: () => void
}) {
  const [catalog, setCatalog] = useState<Questions>()
  const [answers, setAnswers] = useState<Answers>(() => Object.fromEntries(Object.entries(value.answers).filter(([id, answer]) =>
    Array.isArray(answer) || (!['unknown', 'skip', 'later'].includes(answer) && (!checkinBinaryOptions[id] || checkinBinaryOptions[id].some(option => option.code === answer)))
  )))
  const [ratings, setRatings] = useState<Record<string, number>>({ ...value.ratings })
  const [editing, setEditing] = useState(false)
  const [example, setExample] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<StateResult | undefined>(value.result || (value.completed ? buildStateResult(value.answers) : undefined))
  const [selectedId, setSelectedId] = useState(value.id)
  const heading = useRef<HTMLHeadingElement>(null)
  const submission = useRef<AbortController>()
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    loadQuestions(controller.signal).then(setCatalog).catch(() => {
      if (!controller.signal.aborted) { setCatalog(exampleQuestions); setExample(true) }
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
    setAnswers(current => ({ ...current, [question.id]: next }))
  }
  const saveResult = (summary: Summary) => {
    const nextResult = buildStateResult(answers)
    const record: CheckinRecord = { id: crypto.randomUUID(), savedAt: new Date().toISOString(), answers: { ...answers }, ratings: { ...ratings }, completed: true, summary, result: nextResult }
    setResult(nextResult); setSelectedId(record.id); setEditing(false); onSave(record)
  }
  const restart = () => { setAnswers({}); setRatings({}); setResult(undefined); setSelectedId(undefined); setEditing(true) }
  const selectRecord = (record: CheckinRecord) => { setAnswers({ ...record.answers }); setRatings({ ...record.ratings }); setResult(record.result); setSelectedId(record.id); setEditing(false) }
  const submit = async () => {
    if (sending) return
    submission.current?.abort()
    const controller = new AbortController(); submission.current = controller
    setSending(true)
    try {
      const result = example ? exampleSummary(answers) : await summarizeAnswers(answers, controller.signal)
      if (!controller.signal.aborted) saveResult(result)
    } catch {
      if (!controller.signal.aborted) { saveResult(exampleSummary(answers)) }
    } finally { if (!controller.signal.aborted) setSending(false) }
  }
  return <SettingsShell title="자가진단" description="요즘의 일상과 관계를 돌아보고, 지금 필요한 도움을 확인해요." onBack={onBack}>
    {loading && <p role="status">상태 점검 문항을 불러오고 있어요.</p>}
    {storageError && <p role="alert" className="checkin-storage-error">이 브라우저에 결과를 저장하지 못했어요. 현재 화면에서는 볼 수 있지만, 새로고침하면 이 결과가 남지 않을 수 있어요.</p>}
    {history.length > 0 && <section className="panel checkin-history"><div className="section-head"><h2>상태 점검 이력</h2><button className="btn btn-secondary" disabled={sending} onClick={restart}>다시 설문하기</button></div><div className="checkin-history-list">{history.map(record => <button type="button" key={record.id} aria-pressed={selectedId === record.id && !editing} disabled={sending} onClick={() => selectRecord(record)}><time dateTime={record.savedAt}>{new Date(record.savedAt).toLocaleString('ko-KR')}</time><strong>{record.result.title}</strong><span>결과 보기</span></button>)}</div></section>}
    {!loading && catalog && (result && !editing ? <div className="checkin-result">
      <section className="panel settings-section"><span className="mini-label">나의 상태 요약</span><h2 ref={heading} tabIndex={-1}>{result.title}</h2><p>{result.description}</p>
        <div className="checkin-result-tags">{result.types.map(type => <span key={type}>{typeInfo[type].title}</span>)}</div>
        <dl className="checkin-result-areas">{result.areas.map(area => <div key={area.name}><dt>{area.name}</dt><dd>{area.status}</dd></div>)}</dl>
        <p className="settings-help">응답을 바탕으로 정리한 현재 상태예요. 의학적 진단이나 위험 등급이 아니에요.</p>
        <div className="settings-survey-actions"><button className="btn btn-secondary" onClick={() => setEditing(true)}>답변 수정하고 다시 저장</button><button className="btn btn-secondary" onClick={restart}>새로 설문하기</button><button className="btn btn-secondary" onClick={onChat}>조이와 이야기하기</button></div>
        {!storageError && <p role="status" className="settings-help">결과가 이 브라우저에 저장됐어요. 다음 방문에도 이력에서 확인할 수 있어요.</p>}
      </section>
      <section className="panel settings-section"><h2>이런 지원부터 살펴보세요</h2><p>상태 유형별로 연결한 전국 공통 제도와 공공 서비스를 모았어요. 신청 자격·모집 기간·이용 가능한 활동은 각 공식 안내에서 확인해 주세요.</p>
        <div className="checkin-support-list">{supportsForResult(result).map(item => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><small>{item.source} · 공식 안내 ↗</small></a>)}</div>
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
        {answers[question.id]?.length > 0 && <button type="button" className="checkin-clear-answer" onClick={() => { setAnswers(current => { const next = { ...current }; delete next[question.id]; return next }); setRatings(current => { const next = { ...current }; delete next[question.id]; return next }) }}>선택 해제</button>}
      </fieldset>)}
      </section>)}
      <section className="panel settings-section checkin-survey-submit"><div><strong>{questions.length}개 중 {answered}개 응답했어요</strong><p className="settings-help">선택한 답변을 바탕으로 지금 필요한 도움을 정리해요.</p></div><button type="submit" className="btn btn-primary" disabled={sending || answered === 0}>{sending ? '결과를 불러오는 중…' : '결과 보기'}</button></section>
    </form>)}
  </SettingsShell>
}
