import { useState } from 'react'
import { ArrowRight, Check, ChevronRight } from 'lucide-react'

const steps = [
  {
    question: '요즘 가장 먼저 해결하고 싶은 건 무엇인가요?',
    options: ['취업·진로가 고민이에요', '주거·생활 지원이 궁금해요', '사람이나 활동을 찾고 싶어요', '아직 잘 모르겠어요'],
  },
  {
    question: '어떤 안내 방식이 가장 편할까요?',
    options: ['선택지를 하나씩 보여주세요', '직접 이야기하며 정리할래요', '핵심만 간단히 보고 싶어요'],
  },
  {
    question: '오늘 어디부터 시작해 볼까요?',
    options: ['관련 정책을 찾아보고 싶어요', '청년센터 프로그램을 살펴보고 싶어요', '제 고민부터 정리하고 싶어요'],
  },
] as const

export function GuidedStart({ onSend }: { onSend: (text: string) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const finished = step === steps.length
  const current = steps[step]

  const select = (answer: string) => setAnswers(previous => [...previous.slice(0, step), answer])

  const start = () => {
    if (answers.length !== steps.length) return
    onSend([
      '조이, 제 상황을 함께 정리해 주세요.',
      '가장 필요한 도움: ' + answers[0],
      '편한 안내 방식: ' + answers[1],
      '오늘 해보고 싶은 일: ' + answers[2],
      '한 번에 질문 하나씩, 쉬운 말과 선택지로 안내해 주세요.',
    ].join('\n'))
  }

  return (
    <div className="home-check" aria-label="선택형 시작 체험">
      <div className="home-check-top">
        <strong>{finished ? '선택 완료' : (step + 1) + ' / ' + steps.length + ' 단계'}</strong>
        <span>자가진단 점수가 아닌 대화 시작용 선택입니다</span>
      </div>
      <div className="home-check-progress" aria-hidden="true">
        {steps.map((item, index) => <span key={item.question} className={index <= step ? 'is-active' : ''} />)}
      </div>
      {finished ? (
        <div className="home-check-result" aria-live="polite">
          <h3>이렇게 조이와 시작할게요</h3>
          <ul>{answers.map((answer, index) => <li key={index}>{answer}</li>)}</ul>
          <p>선택한 내용은 이 브라우저에서 예시 대화를 시작하는 데만 사용됩니다. 아직 저장하거나 실제 AI로 전송하지 않아요.</p>
          <div className="home-check-actions">
            <button type="button" className="home-check-back" onClick={() => setStep(steps.length - 1)}>이전 단계</button>
            <button type="button" className="home-check-next" onClick={start}>조이와 대화 시작 <ArrowRight size={17} /></button>
          </div>
        </div>
      ) : (
        <div className="home-check-step" aria-live="polite">
          <h3>{current.question}</h3>
          <div className="home-check-options">
            {current.options.map(option => (
              <button key={option} type="button"
                className={'home-check-option ' + (answers[step] === option ? 'is-selected' : '')}
                aria-pressed={answers[step] === option}
                onClick={() => select(option)}>
                <span>{option}</span>
                {answers[step] === option ? <Check size={19} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="home-check-actions">
            <button type="button" className="home-check-back" disabled={step === 0} onClick={() => setStep(previous => previous - 1)}>이전</button>
            <button type="button" className="home-check-next" disabled={!answers[step]} onClick={() => setStep(previous => previous + 1)}>
              {step === steps.length - 1 ? '선택 확인' : '다음'} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
