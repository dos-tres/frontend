import { useState, type FormEvent } from 'react'
import { ArrowRight, Building2, CalendarDays, Compass, MessageCircle, Send, Sparkles } from 'lucide-react'
import joyImage from './assets/characters/joy-greeting.svg'
import './home-landing.css'
import './home-premium.css'

type Destination = 'state-check' | 'setup' | 'policy-list' | 'center-list' | 'calendar'

type Props = {
  completed: boolean
  onNavigate: (screen: Destination) => void
  onSend: (text: string) => void
}

const prompts = [
  { label: '취업·진로가 고민이에요', text: '취업 준비에 도움이 되는 정책이나 활동을 알아보고 싶어요.' },
  { label: '생활비·주거 지원이 궁금해요', text: '생활비나 주거에 도움이 되는 지원을 알아보고 싶어요.' },
  { label: '사람들과 만나고 싶어요', text: '부담 없이 사람들과 교류할 수 있는 활동을 찾고 싶어요.' },
  { label: '일정을 정리하고 싶어요', text: '일정 등록' },
]

export default function HomeLanding({ completed, onNavigate, onSend }: Props) {
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const [greetings, setGreetings] = useState(0)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    onSend(value)
    setDraft('')
  }

  return (
    <div className="joy-home joy-home-professional">
      <section className="joy-home-hero" aria-labelledby="joy-home-title">
        <div className="joy-home-intro">
          <div className="joy-home-copy">
            <div className="joy-home-eyebrow"><span className="joy-home-eyebrow-dot" /> AI 비서 · 조이</div>
            <h1 id="joy-home-title">지금 필요한 것부터,<br />조이와 이야기해요.</h1>
            <p className="joy-home-description">
              나에게 맞는 지원을 찾고, 새로운 활동을 시작하는 일.<br className="joy-home-desktop-break" />
              혼자 알아보기 막막할 때 조이에게 말해 주세요.
            </p>
          </div>
          <div className={`joy-home-greeting ${focused ? 'is-focused' : ''}`}>
            <div className="joy-home-mascot-stage">
              <span className="joy-home-mascot-glow" aria-hidden="true" />
              <button
                type="button"
                className="joy-home-mascot"
                aria-label="조이에게 인사하기"
                onClick={() => setGreetings(n => n + 1)}
              >
                <img key={greetings} className="joy-home-mascot-image" src={joyImage} alt="" />
              </button>
              <span className="joy-home-mascot-shadow" aria-hidden="true" />
              <Sparkles className="joy-home-sparkle sparkle-one" size={19} aria-hidden="true" />
              <Sparkles className="joy-home-sparkle sparkle-two" size={13} aria-hidden="true" />
            </div>
            <span className="joy-home-speech">
              <Sparkles size={14} />
              {focused ? '좋아요, 편하게 적어 주세요' : greetings ? '반가워요! 어떤 도움이 필요하세요?' : '안녕하세요, 조이예요'}
            </span>
          </div>
        </div>

        <form className="joy-home-composer" onSubmit={submit}><label className="joy-home-input-label" htmlFor="joy-home-message"><MessageCircle size={16}/> 어떤 도움이 필요하세요?</label><textarea id="joy-home-message" value={draft} onChange={e=>setDraft(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder="예: 취업 준비하면서 참여할 만한 모임이 있을까?" rows={2} maxLength={1000} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing&&e.keyCode!==229){e.preventDefault();e.currentTarget.form?.requestSubmit()}}}/><div className="joy-home-composer-footer"><span>편하게 말해도 괜찮아요.</span><button type="submit" disabled={!draft.trim()} aria-label="조이와 대화 시작"><Send size={18}/><span>대화 시작</span></button></div></form>

        <div className="joy-home-starters">
          <p>이런 이야기로 시작해도 좋아요</p>
          <div>
            {prompts.map(prompt => (
              <button type="button" key={prompt.label} onClick={() => onSend(prompt.text)}>
                {prompt.label}<ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>

        <section className="joy-home-shortcuts" aria-label="직접 둘러보기">
          <div className="joy-home-shortcut-heading">
            <span>직접 둘러보고 싶다면</span>
            <p>필요한 정보를 메뉴에서 바로 찾을 수 있어요.</p>
          </div>
          <div className="joy-home-shortcut-list">
            {!completed && (
              <button type="button" onClick={() => onNavigate('setup')}>
                <span className="joy-home-shortcut-icon"><Sparkles size={19} /></span>
                <span className="joy-home-shortcut-copy"><strong>생활 점검</strong><small>내 상황에 맞는 추천 시작</small></span>
                <ArrowRight className="joy-home-shortcut-arrow" size={15} />
              </button>
            )}
            <button type="button" onClick={() => onNavigate('policy-list')}>
              <span className="joy-home-shortcut-icon"><Compass size={19} /></span>
              <span className="joy-home-shortcut-copy"><strong>정책·활동 찾기</strong><small>나에게 필요한 지원과 기회</small></span>
              <ArrowRight className="joy-home-shortcut-arrow" size={15} />
            </button>
            <button type="button" onClick={() => onNavigate('center-list')}>
              <span className="joy-home-shortcut-icon"><Building2 size={19} /></span>
              <span className="joy-home-shortcut-copy"><strong>주변센터</strong><small>가까운 청년공간과 프로그램</small></span>
              <ArrowRight className="joy-home-shortcut-arrow" size={15} />
            </button>
            <button type="button" onClick={() => onNavigate('calendar')}>
              <span className="joy-home-shortcut-icon"><CalendarDays size={19} /></span>
              <span className="joy-home-shortcut-copy"><strong>내 일정</strong><small>참여 일정을 한눈에</small></span>
              <ArrowRight className="joy-home-shortcut-arrow" size={15} />
            </button>
          </div>
        </section>
      </section>
    </div>
  )
}
