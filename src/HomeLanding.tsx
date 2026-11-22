import { useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Building2, CalendarDays, Compass, Heart, MessageCircle, Send, Sparkles } from 'lucide-react'
import joyImage from './assets/joy.png'
import planeImage from './assets/plane.png'
import './home-landing.css'

type Destination = 'state-check' | 'setup' | 'policy-list' | 'center-list' | 'calendar'
type HomeLandingProps = {
  completed: boolean
  onNavigate: (screen: Destination) => void
  onSend: (text: string) => void
}
const questions = [
  { label: '취업·진로', message: '취업 준비에 도움이 되는 청년 정책이나 프로그램을 찾아줘.' },
  { label: '생활비·주거', message: '생활비와 주거에 도움이 되는 지원 정책을 알고 싶어.' },
  { label: '새로운 활동', message: '부담 없이 참여할 수 있는 청년센터 활동을 추천해 줘.' },
  { label: '일정 정리', message: '내 일정을 정리하고 싶어.' },
]
const destinations = [
  { screen: 'policy-list' as const, number: '01', label: 'POLICY & OPPORTUNITY', title: '내게 맞는 정책 찾기', description: '복잡한 지원 조건을 살펴보고, 지금 필요한 기회를 찾아보세요.', Icon: Compass, tone: 'mint', link: '정책 살펴보기' },
  { screen: 'center-list' as const, number: '02', label: 'LOCAL PROGRAM', title: '청년센터 프로그램', description: '가까운 청년공간과 새로운 경험을 만날 수 있는 프로그램을 확인해요.', Icon: Building2, tone: 'sky', link: '센터 둘러보기' },
  { screen: 'calendar' as const, number: '03', label: 'MY NEXT STEP', title: '내 일정 챙기기', description: '기억해 두고 싶은 일정과 참여 계획을 한곳에서 정리해요.', Icon: CalendarDays, tone: 'peach', link: '일정 확인하기' },
]

export default function HomeLanding({ completed, onNavigate, onSend }: HomeLandingProps) {
  const [draft, setDraft] = useState('')
  const [hello, setHello] = useState(false)
  const messageInput = useRef<HTMLTextAreaElement>(null)
  const focusJoy = () => {
    document.getElementById('ask-joy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    messageInput.current?.focus({ preventScroll: true })
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message) return
    onSend(message)
    setDraft('')
  }
  return (
    <div className="dt-home">
      <section className="dt-hero" aria-labelledby="dt-home-title">
        <div className="dt-hero-copy">
          <span className="dt-eyebrow"><span className="dt-eyebrow-dot" /> 청년의 시작을 함께하는 AI 비서, 둘셋</span>
          <h1 id="dt-home-title">막막했던 첫걸음도,<br /><strong>둘셋이면 조금 더 가볍게.</strong></h1>
          <p className="dt-hero-lead">어떤 지원이 필요한지 몰라도 괜찮아요.<br />지금 상황을 이야기하면 AI 비서 조이가 청년 정책과 지역 프로그램을 함께 찾아드려요.</p>
          <div className="dt-hero-actions">
            <button type="button" className="dt-button dt-button-primary" onClick={focusJoy}>조이에게 이야기하기 <ArrowRight size={19} /></button>
            <button type="button" className="dt-button dt-button-outline" onClick={() => onNavigate('policy-list')}>정책 직접 둘러보기</button>
          </div>
          <div className="dt-hero-note"><Heart size={16} aria-hidden="true" /> 로그인 없이, 지금 필요한 것부터 시작해 보세요.</div>
        </div>
        <div className="dt-hero-art">
          <span className="dt-hero-art-orbit dt-hero-art-orbit-one" aria-hidden="true" />
          <span className="dt-hero-art-orbit dt-hero-art-orbit-two" aria-hidden="true" />
          <img className="dt-hero-plane" src={planeImage} alt="" aria-hidden="true" />
          <span className="dt-hero-bubble dt-hero-bubble-top">나에게 맞는 지원이 있을까?</span>
          <div className="dt-joy-card">
            <span className="dt-joy-card-chip"><Sparkles size={14} /> AI 비서 JOY</span>
            <button type="button" className="dt-joy-figure" aria-label="조이에게 인사하기" onClick={() => setHello(value => !value)}>
              <img src={joyImage} alt="파란 스카프를 두른 종이 캐릭터 조이" />
            </button>
            <p>{hello ? '반가워요! 아래에서 편하게 이야기해요.' : '안녕하세요! 저는 조이예요.'}</p>
          </div>
          <span className="dt-hero-bubble dt-hero-bubble-bottom"><span className="dt-bubble-sparkle"><Sparkles size={15} /></span> 함께 하나씩 찾아봐요!</span>
        </div>
      </section>

      <section className="dt-discover" aria-labelledby="dt-discover-title">
        <div className="dt-section-heading">
          <span className="dt-section-kicker">DISCOVER YOUR NEXT STEP</span>
          <h2 id="dt-discover-title">어디서부터 시작할까요?</h2>
          <p>궁금한 것부터 골라 보세요. 둘셋이 다음 화면으로 안내할게요.</p>
        </div>
        <div className="dt-discover-grid">
          {destinations.map(({ screen, number, label, title, description, Icon, tone, link }) => (
            <button key={screen} type="button" className={'dt-discover-card dt-discover-' + tone} onClick={() => onNavigate(screen)}>
              <span className="dt-card-top"><span>{number} / {label}</span><ArrowRight size={19} aria-hidden="true" /></span>
              <span className="dt-card-icon"><Icon size={29} strokeWidth={1.8} /></span>
              <strong>{title}</strong>
              <span className="dt-card-description">{description}</span>
              <span className="dt-card-link">{link} <ArrowRight size={16} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="dt-ask" id="ask-joy" aria-labelledby="dt-ask-title">
        <div className="dt-ask-intro">
          <span className="dt-section-kicker">TALK TO JOY</span>
          <h2 id="dt-ask-title">말로 설명하기 어려워도<br />괜찮아요.</h2>
          <p>취업, 생활, 주거, 새로운 활동까지. 생각나는 대로 적으면 조이와 대화를 시작할 수 있어요.</p>
          <div className="dt-ask-steps">
            <span><span>1</span> 지금 고민 이야기하기</span>
            <span><span>2</span> 조건과 관심사 살펴보기</span>
            <span><span>3</span> 정책과 프로그램 알아보기</span>
          </div>
        </div>
        <div className="dt-ask-panel">
          <div className="dt-ask-panel-heading"><span className="dt-ask-panel-avatar"><img src={joyImage} alt="" /></span><span><strong>조이에게 물어보세요</strong><small>어떤 질문이든 편하게 시작해요</small></span><Sparkles size={20} aria-hidden="true" /></div>
          <form onSubmit={submit} className="dt-ask-form">
            <label htmlFor="dt-joy-message" className="dt-ask-form-label"><MessageCircle size={17} /> 지금 어떤 도움이 필요하세요?</label>
            <textarea id="dt-joy-message" ref={messageInput} value={draft} onChange={event => setDraft(event.target.value)}
              placeholder="예: 취업 준비 중인데 참여할 만한 프로그램이 있을까?" rows={4} maxLength={1000}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <div className="dt-ask-form-bottom"><small>Enter 전송 · Shift + Enter 줄바꿈</small><button type="submit" disabled={!draft.trim()}>대화 시작 <Send size={16} /></button></div>
          </form>
          <div className="dt-suggestions"><span>이렇게 물어봐도 좋아요</span><div>{questions.map(question => <button key={question.label} type="button" onClick={() => onSend(question.message)}>{question.label}<ArrowRight size={14} /></button>)}</div></div>
        </div>
      </section>

      {!completed && <section className="dt-checkin" aria-label="생활 점검 시작하기">
        <span className="dt-checkin-icon"><Sparkles size={23} /></span>
        <div><strong>어떤 지원이 필요한지 아직 모르겠다면?</strong><p>간단한 생활 점검으로 요즘 상황과 관심 분야를 정리해 보세요.</p></div>
        <button type="button" onClick={() => onNavigate('setup')}>생활 점검 시작하기 <ArrowRight size={17} /></button>
      </section>}

      <section className="dt-ending" aria-labelledby="dt-ending-title">
        <span>SMALL STEP, REAL CHANGE</span>
        <h2 id="dt-ending-title">시작이 어렵다면,<br />둘셋이 함께할게요.</h2>
        <p>오늘의 작은 질문이 새로운 기회로 이어지도록.</p>
        <button className="dt-button dt-button-ending" type="button" onClick={focusJoy}>조이와 시작하기 <ArrowRight size={19} /></button>
      </section>
    </div>
  )
}