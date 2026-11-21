import { useState, type FormEvent } from 'react'
import { ArrowRight, ArrowUpRight, Send, Sparkles, Sprout, MapPin, Footprints, Compass, CalendarDays } from 'lucide-react'
import joy from './assets/paper-village/joy-original.png'
import briefcase from './assets/paper-village/briefcase.png'
import house from './assets/paper-village/home.png'
import chat from './assets/paper-village/chat.png'
import checklist from './assets/paper-village/checklist.png'
import center from './assets/paper-village/center-isolated.png'
import plane from './assets/paper-village/paperplane-smooth.png'
import bridge from './assets/illustrations/opportunity-bridge.png'
import './home-page.css'

type HomeDestination = 'setup' | 'profile' | 'state-check' | 'policy-list' | 'center-list' | 'calendar' | 'records'
type HomeProps = { completed: boolean; onNavigate: (screen: HomeDestination) => void; onSend: (text: string) => void }

const prompts = [
  { title: '취업·진로', message: '취업·진로 때문에 고민이에요', description: '내 다음 걸음을 찾고 싶어요', image: briefcase },
  { title: '경제·주거', message: '경제·주거가 걱정이에요', description: '생활에 힘이 되는 지원이 필요해요', image: house },
  { title: '사람·활동', message: '사람들과 교류할 기회가 필요해요', description: '가까운 곳에서 함께하고 싶어요', image: chat },
]

export default function HomePage({ completed, onNavigate, onSend }: HomeProps) {
  const [draft, setDraft] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }
  return (
    <div className="dt-home">
      <section className="dt-welcome" aria-labelledby="dt-home-title">
        <div>
          <p className="dt-kicker"><span /> 청년의 다음 걸음을 함께, 둘셋</p>
          <h1 id="dt-home-title">나의 속도로,<br className="dt-mobile-break" /> <em>세상과 연결되는 곳.</em></h1>
          <p className="dt-lead">혼자 고민하던 일부터, 함께하고 싶은 일까지.<br className="dt-mobile-break" /> 조이와 작은 한 걸음을 시작해요.</p>
        </div>
        <div className="dt-welcome-note" aria-hidden="true"><img src={plane} alt="" /><span>작은 시작이<br />새로운 연결로</span></div>
      </section>

      <div className="dt-home-grid">
        <section className="dt-conversation" aria-labelledby="dt-joy-title">
          <div className="dt-joy-intro">
            <div className="dt-joy-copy">
              <span className="dt-label dt-ai-label"><Sparkles size={14} aria-hidden="true" /> 너의 AI 비서, JOY</span>
              <h2 id="dt-joy-title">어떤 고민이든,<br />조이에게 말해봐요.</h2>
              <p>복잡한 정책도, 낯선 활동도 괜찮아요.<br />지금 나에게 필요한 것부터 같이 찾아볼게요.</p>
            </div>
            <div className="dt-joy-art"><span className="dt-joy-halo" /><img src={joy} alt="파란 스카프를 두른 종이접기 AI 비서 조이" width="1024" height="1024" /><span className="dt-joy-greeting" aria-hidden="true">반가워요!</span></div>
          </div>
          <div className="dt-prompt-heading"><h3>지금 마음에 가까운 이야기를 골라보세요</h3><span>여기서 시작해도 좋아요</span></div>
          <div className="dt-prompt-grid">
            {prompts.map(prompt => <button key={prompt.title} className="dt-prompt" onClick={() => onSend(prompt.message)}>
              <img src={prompt.image} alt="" width="64" height="64" />
              <strong>{prompt.title}<ArrowUpRight size={16} aria-hidden="true" /></strong>
              <span>{prompt.description}</span>
            </button>)}
          </div>
          <form className="dt-message-form" onSubmit={submit}>
            <label className="dt-sr-only" htmlFor="dt-message">조이에게 이야기하기</label>
            <span className="dt-input-mark" aria-hidden="true"><Sparkles size={20} /></span>
            <input id="dt-message" value={draft} onChange={event => setDraft(event.target.value)} placeholder="지금 떠오르는 고민을 편하게 적어주세요" autoComplete="off" />
            <button type="submit" disabled={!draft.trim()} aria-label="조이에게 메시지 보내기"><Send size={19} aria-hidden="true" /></button>
          </form>
          <p className="dt-input-caption">정책 이름을 몰라도, 생각이 잘 정리되지 않아도 괜찮아요.</p>
        </section>

        <aside className="dt-home-aside" aria-label="나에게 맞는 시작과 주변 활동">
          <section className="dt-self-card" aria-labelledby="dt-self-title">
            <div className="dt-self-heading"><span className="dt-label"><Sprout size={14} aria-hidden="true" /> 나를 알아가는 시간</span><img src={checklist} alt="" width="66" height="66" /></div>
            <h2 id="dt-self-title">{completed ? '요즘의 나는 어떤가요?' : '나에게 맞는 시작을 찾아요.'}</h2>
            <p>{completed ? '최근의 일상과 마음을 가볍게 돌아보고, 나에게 편한 활동 방식을 살펴봐요.' : '내 정보와 관심을 알려주면, 나에게 맞는 정책과 활동을 더 쉽게 찾을 수 있어요.'}</p>
            <button className="dt-text-link" onClick={() => onNavigate(completed ? 'state-check' : 'setup')}>{completed ? '생활 점검 다시 해보기' : '처음 시작하기'}<ArrowRight size={17} aria-hidden="true" /></button>
            <span className="dt-card-note">{completed ? '진단이나 점수가 아닌, 나를 이해하는 과정이에요.' : '조이와 대화는 바로 시작할 수 있어요.'}</span>
          </section>
          <section className="dt-nearby-card" aria-labelledby="dt-nearby-title">
            <div className="dt-nearby-copy"><span className="dt-label"><MapPin size={14} aria-hidden="true" /> 우리 동네의 연결</span><h2 id="dt-nearby-title">가까운 곳에서,<br />새로운 기회를.</h2><p>청년센터와 함께할 활동을 만나보세요.</p><button className="dt-text-link" onClick={() => onNavigate('center-list')}>주변센터 둘러보기<ArrowRight size={17} aria-hidden="true" /></button></div>
            <img className="dt-center-art" src={center} alt="" width="220" height="220" />
          </section>
        </aside>
      </div>

      <section className="dt-journey" aria-labelledby="dt-journey-title">
        <div className="dt-journey-heading"><div><p className="dt-kicker">둘셋에서 이어지는 나의 여정</p><h2 id="dt-journey-title">작은 관심이, <em>나만의 경험이 되도록.</em></h2></div><button className="dt-text-link" onClick={() => onNavigate('records')}>내 기록 보기<ArrowUpRight size={16} aria-hidden="true" /></button></div>
        <div className="dt-journey-content"><div className="dt-village-art"><img src={bridge} alt="종이 섬과 청년 공간을 연결하는 다리와 작은 종이배" width="1792" height="1024" loading="lazy" /><span>혼자 머물던 섬에서, 함께하는 일상으로.</span></div><ol className="dt-journey-steps">
          <li><span className="dt-step-number">01</span><button onClick={() => onNavigate('profile')}><span className="dt-step-title"><Sprout size={19} aria-hidden="true" /> 나의 섬</span><strong>지금의 나를 이해해요</strong><span>내 관심과 필요한 도움을 알아가요.</span><ArrowUpRight className="dt-step-arrow" size={18} aria-hidden="true" /></button></li>
          <li><span className="dt-step-number">02</span><button onClick={() => onNavigate('policy-list')}><span className="dt-step-title"><Compass size={19} aria-hidden="true" /> 기회의 다리</span><strong>나에게 맞는 기회를 찾아요</strong><span>정책과 활동, 참여 방법을 살펴봐요.</span><ArrowUpRight className="dt-step-arrow" size={18} aria-hidden="true" /></button></li>
          <li><span className="dt-step-number">03</span><button onClick={() => onNavigate('calendar')}><span className="dt-step-title"><Footprints size={19} aria-hidden="true" /> 경험의 마을</span><strong>작은 참여를 일상으로 이어요</strong><span>일정을 챙기고 다음 걸음을 준비해요.</span><ArrowUpRight className="dt-step-arrow" size={18} aria-hidden="true" /></button></li>
        </ol></div>
      </section>
      <button className="dt-calendar-link" onClick={() => onNavigate('calendar')}><CalendarDays size={18} aria-hidden="true" /><span>기억하고 싶은 다음 약속</span><strong>내 일정 확인하기</strong><ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  )
}
