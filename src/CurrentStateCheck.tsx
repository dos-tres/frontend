import { useEffect, useRef, useState } from 'react'
import { exampleQuestions, exampleSummary } from './checkin-example'
import { SettingsShell } from './ProfileSettings'
import { loadQuestions, summarizeAnswers, type Answers, type Questions, type Summary } from './checkin-api'

export type CurrentStateValue = { answers: Answers; completed: boolean; summary?: Summary }
export const initialCurrentState: CurrentStateValue = { answers: {}, completed: false }

export default function CurrentStateCheck({ value, onSave, onBack, onExplore, onChat }: {
  value: CurrentStateValue; onSave: (value: CurrentStateValue) => void; onBack: () => void; onExplore: () => void; onChat: () => void
}) {
  const [catalog, setCatalog] = useState<Questions>()
  const [answers, setAnswers] = useState<Answers>({ ...value.answers })
  const [step, setStep] = useState(-1)
  const [summary, setSummary] = useState(value.summary)
  const [example, setExample] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(value.completed)
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
  useEffect(() => { heading.current?.focus() }, [step, summary])
  const questions = catalog ? [...catalog.domain_questions, ...catalog.extra_questions] : []
  const question = questions[step]
  const update = (code: string) => {
    if (!question) return
    const previous = answers[question.id]
    let next: string | string[] = code
    if (question.multiple) {
      const selected = Array.isArray(previous) ? previous : []
      next = selected.includes(code) ? selected.filter(c => c !== code) : code === 'none' ? ['none'] : [...selected.filter(c => c !== 'none'), code]
      if (question.max && next.length > question.max) return
    }
    setAnswers(current => ({ ...current, [question.id]: next })); setSummary(undefined); setSaved(false)
  }
  const submit = async () => {
    submission.current?.abort()
    const controller = new AbortController(); submission.current = controller
    setSending(true)
    try {
      const result = example ? exampleSummary(answers) : await summarizeAnswers(answers, controller.signal)
      setSummary(result); setStep(-1)
    } catch {
      if (!controller.signal.aborted) { setSummary(exampleSummary(answers)); setStep(-1) }
    } finally { if (!controller.signal.aborted) setSending(false) }
  }
  return <SettingsShell title="자가진단" description="요즘의 일상과 관계를 돌아보고, 지금 필요한 도움을 확인해요." onBack={onBack}>
    {loading && <p role="status">상태 점검 문항을 불러오고 있어요.</p>}
    {!loading && catalog && (summary && step < 0 ? <section className="panel settings-section">
      <h2 ref={heading} tabIndex={-1}>지금 나에게 필요한 도움</h2><p>{summary.disclaimer}</p>
      {summary.notes.length ? summary.notes.map(note => <p key={note}>{note}</p>) : <p>우선 살펴볼 영역이 없어요. 원할 때 다시 답하거나 지원 목록을 둘러보세요.</p>}
      <h3>내가 선택한 답변</h3>
      {questions.map(q => {
        const answer = answers[q.id]
        const codes = Array.isArray(answer) ? answer : [answer]
        return <div className="record-entry" key={q.id}><div><strong>{q.text}</strong><small>{codes.filter(Boolean).map(code => [...q.options, ...catalog.common_options].find(o => o.code === code)?.label).join(', ') || '건너뛴 질문'}</small></div></div>
      })}
      <div className="settings-survey-actions">
        <button className="btn btn-primary" disabled={saved} onClick={() => { onSave({ answers: { ...answers }, completed: true, summary }); setSaved(true) }}>{saved ? '답변 보관됨' : '답변 보관'}</button>
        <button className="btn btn-secondary" onClick={() => { setStep(0); setSaved(false) }}>답변 수정</button>
        <button className="btn btn-secondary" onClick={onExplore}>지원 목록 살펴보기</button><button className="btn btn-secondary" onClick={onChat}>조이와 이야기하기</button>
      </div><p role="status" className="settings-help">{saved ? '이 탭에서 답변을 보관하고 있어요.' : '답변 보관을 누르면 마이페이지에서 다시 볼 수 있어요.'} 새로고침하면 초기화돼요. 답변은 서버에 저장하지 않아요.</p>
    </section> : question ? <section className="panel settings-section" aria-busy={sending}>
      <p>{step + 1} / {questions.length} 문항</p><progress className="settings-progress" aria-label="상태 점검 진행률" value={step + 1} max={questions.length} />
      <h2 className="settings-question-title" ref={heading} tabIndex={-1}>{question.text}</h2>
      <fieldset className="settings-fieldset" disabled={sending}><legend>{question.multiple ? `여러 개 선택 가능${question.max ? ` · 최대 ${question.max}개` : ''}` : '하나를 선택해 주세요'}</legend><div className="settings-survey-options">
        {[...question.options, ...(question.multiple ? [] : catalog.common_options)].map(option => {
          const answer = answers[question.id]
          const checked = Array.isArray(answer) ? answer.includes(option.code) : answer === option.code
          return <label className={`filter-chip settings-choice ${checked ? 'active' : ''}`} key={option.code}><input type={question.multiple ? 'checkbox' : 'radio'} name={question.id} checked={checked} disabled={question.multiple && !checked && !!question.max && Array.isArray(answer) && answer.length >= question.max} onChange={() => update(option.code)} /><span>{option.label}</span></label>
        })}
      </div></fieldset>
      <div className="settings-survey-actions"><button className="btn btn-secondary" disabled={sending} onClick={() => { setStep(v => v - 1) }}>이전</button>
        <button className="btn btn-secondary" disabled={sending} onClick={() => { setAnswers(current => { const next = { ...current }; delete next[question.id]; return next }); setSummary(undefined); setSaved(false); setStep(v => v + 1) }}>건너뛰기</button>
        <button className="btn btn-primary" disabled={sending || !answers[question.id] || answers[question.id].length === 0} onClick={() => { setStep(v => v + 1) }}>다음</button></div>
    </section> : step >= questions.length ? <section className="panel settings-section"><h2 ref={heading} tabIndex={-1}>답변을 정리할 준비가 됐어요</h2><p>선택한 답변을 바탕으로 도움 영역을 정리해요.</p><div className="settings-survey-actions"><button className="btn btn-secondary" disabled={sending} onClick={() => setStep(questions.length - 1)}>이전</button><button className="btn btn-primary" disabled={sending} onClick={submit}>{sending ? '결과를 불러오는 중…' : '결과 보기'}</button></div></section> : <section className="panel settings-section"><h2>지금의 나를 돌아볼까요?</h2><p>{catalog.notice}</p><p>{questions.length}개의 질문을 한 번에 하나씩 확인해요. 원하지 않는 질문은 건너뛸 수 있어요.</p><button className="btn btn-primary" onClick={() => setStep(0)}>상태 점검 시작</button></section>)}
  </SettingsShell>
}
