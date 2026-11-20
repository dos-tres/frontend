import { HISTORY_KEY, readCheckinHistory, type CheckinRecord } from './checkin-result'
import { AccountLayout, MyPage, type AccountScreen } from './MyPage'
import { PolicyListPage, PolicyDetailPage, initialPolicyView, type PolicyView } from './PolicyPages'
import { usePolicyCatalog } from './use-policy-catalog'
import ProfileSettings, { initialPersonalInformation, profileRegionLabel, type PersonalInformation } from './ProfileSettings'
import ActivityInformation, { initialActivityInformation, type ActivityInformationValue } from './ActivityInformation'
import CurrentStateCheck, { initialCurrentState, type CurrentStateValue } from './CurrentStateCheck'
import { useMemo, useState, type FormEvent, type ReactNode, type ButtonHTMLAttributes } from 'react'
import {
  ArrowRight, Bot, Search, MapPin, CalendarDays, UserRound, Bookmark,
  MessageCircle, ChevronRight, ChevronLeft, Sparkles, Send, Plus, Check,
  Clock3, ExternalLink, SlidersHorizontal, Building2, FileText, Map,
  CircleHelp, Plane, Ship, TreePine, Home, Settings, Bell, Heart, Filter,
  Navigation, CalendarCheck, History, Sprout, MapPinned, BadgeCheck,
  BookOpen, Star, Footprints, NotebookPen, Compass, X, Menu
} from 'lucide-react'
import { programs, centers, initialApplications, type Program, type Center, type Application } from './data'

import joyImage from './assets/joy.png'
import joyIslandImage from './assets/joy-island.png'
import boatImage from './assets/boat.png'
import planeImage from './assets/plane.png'
import bridgeVillageImage from './assets/bridge-village.png'
import mapImage from './assets/map.png'

type Screen =
  | 'home' | 'chat' | 'apply'
  | 'policy-list' | 'policy-detail'
  | 'center-list' | 'center-detail'
  | 'calendar' | 'applications'
  | 'profile' | 'profile-edit' | 'activity-edit' | 'state-check' | 'records' | 'about'

type Message = { role: 'assistant' | 'user'; text: string }
type CalendarEvent = { id: number; title: string; date: string; type: string }

const navItems = [
  { id: 'assistant', label: 'AI 비서', icon: Bot },
  { id: 'policies', label: '정책·활동 찾기', icon: Search },
  { id: 'centers', label: '주변센터', icon: MapPin },
  { id: 'schedule', label: '내 일정', icon: CalendarDays },
] as const

function sectionFor(screen: Screen) {
  if (['home', 'chat', 'apply'].includes(screen)) return 'assistant'
  if (['policy-list', 'policy-detail'].includes(screen)) return 'policies'
  if (['center-list', 'center-detail'].includes(screen)) return 'centers'
  if (['calendar', 'applications'].includes(screen)) return 'schedule'
  return 'profile'
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}brand/dulset-island-symbol.svg`} width="56" height="56" alt="" />
      <span className="brand-name">둘셋</span>
    </span>
  )
}

function Button({
  children, variant = 'primary', className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'soft' }) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>
}

function Panel({ children, className = '', tone = 'white' }: { children: ReactNode; className?: string; tone?: 'white' | 'blue' | 'green' | 'lavender' | 'gray' }) {
  return <section className={`panel panel-${tone} ${className}`}>{children}</section>
}

function PageTitle({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <div className="page-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

function JoyAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <img className={`joy-avatar joy-${size}`} src={joyImage} alt="파란 스카프를 두른 종이접기 캐릭터 조이" />
}

function Header({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const active = sectionFor(screen)
  const navigate = (id: string) => {
    const target: Record<string, Screen> = {
      assistant: 'home', policies: 'policy-list', centers: 'center-list',
      schedule: 'calendar', profile: 'profile',
    }
    onNavigate(target[id])
    setMobileOpen(false)
  }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand-button" onClick={() => navigate('assistant')} aria-label="둘셋 홈으로">
          <BrandMark />
        </button>
        <button className="mobile-menu" onClick={() => setMobileOpen(v => !v)} aria-label="메뉴 열기">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`nav-links ${mobileOpen ? 'nav-open' : ''}`} aria-label="주요 메뉴">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-link ${active === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
                <Icon size={16} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <Button className="header-ask" variant="secondary" aria-current={['profile', 'profile-edit', 'activity-edit', 'state-check'].includes(screen) ? 'page' : undefined} onClick={() => navigate('profile')}>
          <UserRound size={18} /> 마이페이지
        </Button>
      </div>
    </header>
  )
}

function Footer({ onAbout }: { onAbout: () => void }) {
  return (
    <footer className="footer">
      <span>둘셋 · 청년의 고민과 정책, 지역 활동을 연결하는 AI 비서</span>
      <button onClick={onAbout}>둘셋 소개 <ArrowRight size={13} /></button>
    </footer>
  )
}

function HomePage({ onNavigate, onSend }: { onNavigate: (s: Screen) => void; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState('')
  const prompts = [
    ['취업·진로 때문에 고민이에요', '지원받을 정책과 함께할 활동 찾기', 'briefcase'],
    ['경제·주거가 걱정이에요', '현실적인 지원사업부터 확인하기', 'home'],
    ['사람들과 교류할 기회가 필요해요', '부담 없는 가까운 활동부터 시작하기', 'people'],
  ]
  const submit = (e: FormEvent) => { e.preventDefault(); onSend(draft); setDraft('') }
  return (
    <>
      <PageTitle title="둘셋과 함께, 시작해볼까요?" description="혼자 시작하기 막막한 청년을 위한 사회참여 AI 비서 · 필요한 도움과 지역 활동을 함께 찾아드려요." />
      <div className="home-grid">
        <Panel tone="blue" className="home-agent">
          <div className="agent-intro">
            <div>
              <span className="small-tag"><Sparkles size={13} /> AI 비서 조이</span>
              <h2>안녕하세요!<br />저는 AI 비서 조이예요.</h2>
              <p>어떤 고민이 있든 편하게 이야기해 주세요.<br />필요한 도움과 지역 활동을 함께 찾아드릴게요.</p>
            </div>
            <JoyAvatar size="lg" />
          </div>
          <div className="divider" />
          <h3 className="section-label">어디서 시작할지 모르겠다면</h3>
          <div className="prompt-list">
            {prompts.map(([title, desc]) => (
              <button key={title} className="prompt-card" onClick={() => onSend(title)}>
                <span><strong>{title}</strong><small>{desc}</small></span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          <form className="chat-entry" onSubmit={submit}>
            <MessageCircle size={18} />
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="조이에게 자유롭게 이야기하기..." aria-label="조이에게 메시지 입력" />
            <button type="submit" aria-label="메시지 보내기"><Send size={17} /></button>
          </form>
        </Panel>
        <aside className="home-aside">
          <Panel tone="lavender" className="status-card">
            <div className="panel-heading">
              <div>
                <span className="mini-label">MY CONNECTION</span>
                <h3>나의 연결 상태 살펴보기</h3>
              </div>
              <Sprout size={24} />
            </div>
            <p>최근 외부 활동, 사람들과의 교류, 새 활동에 대한 부담을 가볍게 돌아봐요.</p>
            <p className="notice">※ 고립 여부를 진단하거나 점수화하지 않아요.</p>
            <Button variant="secondary" onClick={() => onNavigate('profile')}>나에게 편한 활동 방식 알아보기 <ArrowRight size={15} /></Button>
          </Panel>
          <Panel tone="green" className="weekly-card">
            <div className="weekly-copy">
              <span className="mini-label">THIS WEEK</span>
              <h3>이번 주의 연결</h3>
              <p>관심 지역의 청년센터 프로그램과 저장한 일정을 확인해요.</p>
              <Button variant="secondary" onClick={() => onNavigate('center-list')}>근처 참여 기회 살펴보기 <ArrowRight size={15} /></Button>
            </div>
            <img src={boatImage} alt="파란 깃발을 단 종이배" />
          </Panel>
        </aside>
      </div>
      <section className="journey-section">
        <div className="journey-heading">
          <div><span className="mini-label">MY JOURNEY</span><h2>나의 섬에서, 기회의 다리를 건너</h2><p>작은 관심이 실제 참여로 이어지고, 나만의 경험이 쌓여요.</p></div>
          <span className="journey-caption">섬 → 다리 → 마을</span>
        </div>
        <div className="journey-grid">
          <article className="journey-card island-step">
            <img src={joyIslandImage} alt="초록 섬에 서 있는 조이" />
            <div><span>01 · 나의 섬</span><h3>지금의 나를 이해해요</h3><p>관심사와 필요한 도움을 편하게 알려주세요.</p></div>
          </article>
          <article className="journey-card bridge-step">
            <img src={bridgeVillageImage} alt="섬과 마을을 연결하는 다리" />
            <div><span>02 · 기회의 다리</span><h3>나에게 맞는 기회를 찾아요</h3><p>정책과 프로그램을 비교하고 참여 방법을 살펴봐요.</p></div>
          </article>
          <article className="journey-card village-step">
            <img src={bridgeVillageImage} alt="다리 너머의 작은 마을" />
            <div><span>03 · 경험의 마을</span><h3>참여 경험을 쌓아가요</h3><p>신청과 참여를 기록하고 다음 기회로 이어가요.</p></div>
          </article>
        </div>
      </section>
    </>
  )
}

function ChatPage({ messages, onSend }: { messages: Message[]; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState('')
  const submit = (e: FormEvent) => { e.preventDefault(); onSend(draft); setDraft('') }
  return (
    <>
      <PageTitle title="조이 AI 비서 · 대화" description="시작 화면에서 채팅으로 전환하고, 이전 대화를 이어서 사용할 수 있어요." />
      <div className="chat-layout">
        <Panel tone="gray" className="chat-history">
          <Button onClick={() => onSend('새로운 고민이 있어요.')}><Plus size={16} /> 새 대화</Button>
          <div className="divider" />
          <h3>최근 대화</h3>
          {['취업 준비와 활동', '주거 지원 찾아보기', '센터 프로그램 문의'].map((title, i) => (
            <button key={title} className={`history-item ${i === 0 ? 'selected' : ''}`} onClick={() => onSend(`${title}에 대해 이어서 이야기하고 싶어요.`)}>
              <strong>{title}</strong><small>{['11/17 · 이어서 대화', '11/15 · 다시 열기', '11/13 · 신청 이력 연결'][i]}</small>
            </button>
          ))}
          <button className="text-button">대화 삭제 · 관리</button>
        </Panel>
        <Panel className="chat-main">
          <div className="chat-main-head"><JoyAvatar size="sm" /><div><strong>조이</strong><small>청년 지원 AI 비서</small></div><span className="online-dot">대화 예시</span></div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`message-row ${message.role}`}>
                {message.role === 'assistant' && <JoyAvatar size="sm" />}
                <div className={`message-bubble ${message.role}`}>{message.text}</div>
              </div>
            ))}
          </div>
          <div className="quick-replies">
            <span>답변 선택</span>
            <button onClick={() => onSend('온라인으로 시작하고 싶어요')}>온라인으로 시작하고 싶어요</button>
            <button onClick={() => onSend('작은 모임 정도는 괜찮아요')}>작은 모임 정도는 괜찮아요</button>
          </div>
          <form className="chat-entry" onSubmit={submit}>
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="메시지를 입력해 주세요..." aria-label="메시지 입력" />
            <button type="submit" aria-label="보내기"><Send size={17} /></button>
          </form>
          <p className="muted-note">현재는 화면 확인을 위한 예시 응답입니다. 실제 AI 응답은 백엔드 API 연결 후 동작해요.</p>
        </Panel>
      </div>
    </>
  )
}

function ApplyPage({ program, onRecord, onOpenPolicy }: { program: Program; onRecord: () => void; onOpenPolicy: () => void }) {
  return (
    <>
      <PageTitle title="조이 AI 비서 · 실제 신청 도우미" description="신청서 작성 자체가 아니라, 공식 신청을 돕고 그 결과를 기록하는 과정이에요." />
      <div className="two-column">
        <Panel tone="gray" className="detail-panel">
          <span className="mini-label">선택한 정책·프로그램</span>
          <h2>{program.title}</h2>
          <p>{program.summary}</p>
          <div className="divider" />
          <dl className="detail-list">
            <div><dt>신청 기간</dt><dd>{program.period}</dd></div>
            <div><dt>신청 자격</dt><dd>{program.target}</dd></div>
            <div><dt>신청 방식</dt><dd>{program.method}</dd></div>
            <div><dt>참여 장소</dt><dd>{program.place}</dd></div>
            <div><dt>출처</dt><dd>{program.source}</dd></div>
          </dl>
          <p className="notice">신청 기간과 자격은 운영기관 공식 공고에서 최종 확인해 주세요.</p>
          <Button variant="secondary" onClick={onOpenPolicy}><ExternalLink size={15} /> 정책·활동 목록으로 돌아가기</Button>
        </Panel>
        <Panel className="steps-panel">
          <h3>조이의 다음 단계</h3>
          {[
            ['01', '신청 방법·기한 알려드릴게요', '공고 출처를 기준으로 필요한 조건만 확인해요.'],
            ['02', '신청은 공식 페이지에서 진행해요', '실제 신청은 운영기관 페이지에서 직접 확인하고 제출해요.'],
            ['03', '신청하셨나요? 이력을 남길까요?', '신청 날짜, 결과 예정일, 참여 일정을 기록해요.'],
          ].map(([num, title, desc]) => <div className="step-row" key={num}><span>{num}</span><div><strong>{title}</strong><small>{desc}</small></div></div>)}
          <div className="divider" />
          <h4>글을 작성해야 하는 항목이 있을 때만</h4>
          <p>조이: “지원 동기를 적어야 하네요. 초안을 써드릴까요?”</p>
          <Button variant="secondary" onClick={onRecord}><NotebookPen size={15} /> 신청 이력에 기록하기</Button>
        </Panel>
      </div>
    </>
  )
}

function CenterListPage({ onSelect }: { onSelect: (c: Center) => void }) {
  const [region, setRegion] = useState('서울 마포구 (예시)')
  const [programOnly, setProgramOnly] = useState(false)
  return (
    <>
      <PageTitle title="내 주변 청년센터" description="관심 지역의 청년센터와 참여 기회를 탐색해요. 위치 기능은 실제 연결 후 사용할 수 있어요." />
      <Panel tone="gray" className="search-panel">
        <div className="filter-row">
          <label className="region-select">활동 지역
            <select value={region} onChange={e => setRegion(e.target.value)}><option>서울 마포구 (예시)</option><option>대전 유성구 (예시)</option><option>직접 선택 예정</option></select>
          </label>
          <Button variant={programOnly ? 'primary' : 'secondary'} onClick={() => setProgramOnly(v => !v)}><Filter size={14} /> 프로그램 있는 곳</Button>
          <Button variant="secondary" onClick={() => alert('실제 위치 권한 연결 전입니다.')}><Navigation size={14} /> 현재 위치 사용</Button>
        </div>
        <p className="search-helper">센터 이용법 · 행사 · 소모임 · 청년 공간 안내를 함께 확인할 수 있어요.</p>
      </Panel>
      <div className="results-layout">
        <Panel tone="gray" className="results-panel">
          <div className="section-head"><h3>주변 기관 / 참여 프로그램</h3><span>가상 위치·예시</span></div>
          <div className="map-preview">
            <img src={mapImage} alt="종이 지도와 위치 핀 캐릭터" />
            <div className="map-bubble"><MapPin size={15} /> {region}</div>
            <div className="map-label">가까운 청년센터</div>
          </div>
          {centers.filter(c => !programOnly || c.programs.length > 0).map(c => (
            <button className="center-result" key={c.id} onClick={() => onSelect(c)}>
              <span className="center-pin"><Building2 size={18} /></span>
              <span><strong>{c.name}</strong><small>{c.description}</small></span>
              <em>{c.distance}</em><ChevronRight size={17} />
            </button>
          ))}
        </Panel>
        <Panel className="joy-side-card">
          <img className="side-illustration" src={boatImage} alt="종이배 캐릭터" />
          <span className="mini-label">JOY'S CENTER GUIDE</span>
          <h3>조이는 센터 이용도 도와줘요!</h3>
          <div className="mini-checks"><span><Check size={14} /> 가까운 센터 찾기</span><span><Check size={14} /> 프로그램과 신청 일정 확인</span><span><Check size={14} /> 방문 전 문의 내용 정리</span></div>
          <p className="notice">전화 직접 대행은 향후 확장 기능으로 구분해요.</p>
        </Panel>
      </div>
    </>
  )
}

function CenterDetailPage({ center, onBack, onHelp }: { center: Center; onBack: () => void; onHelp: () => void }) {
  return (
    <>
      <PageTitle title="청년센터 상세 · 프로그램" description="기관의 실제 이용 방법과 참여 기회를 확인하고, 조이와 문의를 준비해요." />
      <div className="two-column">
        <Panel tone="gray" className="detail-panel">
          <span className="mini-label">CENTER · 가상 정보</span>
          <h2>{center.name}</h2><p>{center.description}</p>
          <div className="divider" />
          <dl className="detail-list">
            <div><dt>지역</dt><dd>{center.region}</dd></div>
            <div><dt>주소</dt><dd>{center.address}</dd></div>
            <div><dt>운영 시간</dt><dd>{center.hours}</dd></div>
          </dl>
          <h3 className="section-label">이곳에서 할 수 있는 일</h3>
          {center.programs.map(p => <div className="simple-list-item" key={p}><Check size={16} /> {p}</div>)}
          <Button variant="secondary" onClick={onBack}>센터 목록으로 돌아가기</Button>
        </Panel>
        <Panel className="steps-panel">
          <JoyAvatar size="md" />
          <h3>방문하기 전에</h3>
          <p>조이가 센터 이용 방법과 공식 연락처를 정리해 드릴게요.</p>
          <Button onClick={onHelp}>조이에게 문의 내용 준비 요청 <ArrowRight size={15} /></Button>
          <div className="divider" />
          <h4>주변 프로그램</h4>
          {center.programs.map(p => <p className="subtle-row" key={p}>{p}</p>)}
          <p className="notice">센터 정보와 운영 일정은 공식 기관 페이지에서 최종 확인해야 해요.</p>
        </Panel>
      </div>
    </>
  )
}

function CalendarPage({ events, onAddEvent, onGoApplications }: { events: CalendarEvent[]; onAddEvent: (date: string) => void; onGoApplications: () => void }) {
  const [month, setMonth] = useState(new Date(2026, 10, 1))
  const [selectedDate, setSelectedDate] = useState('2026-11-19')
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1
    return day > 0 && day <= daysInMonth ? day : null
  })
  const dateKey = (day: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const monthLabel = `${year}년 ${monthIndex + 1}월`
  const selectedEvents = events.filter(e => e.date === selectedDate)
  return (
    <>
      <PageTitle title="내 일정 · 캘린더" description="참여 예정일, 신청 마감, 결과 발표, 개인 일정과 메모를 함께 확인해요." />
      <div className="calendar-layout">
        <Panel tone="gray" className="calendar-panel">
          <div className="calendar-toolbar">
            <button className="icon-button" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeft size={18} /></button>
            <h3>{monthLabel}</h3>
            <button className="icon-button" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRight size={18} /></button>
            <Button onClick={() => onAddEvent(selectedDate)}><Plus size={15} /> 일정 등록</Button>
          </div>
          <div className="calendar-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <div className="calendar-weekday" key={d}>{d}</div>)}
            {cells.map((day, i) => {
              const key = day ? dateKey(day) : ''
              const hasEvents = events.some(e => e.date === key)
              return <button key={i} disabled={!day} className={`calendar-cell ${key === selectedDate ? 'selected' : ''} ${hasEvents ? 'has-event' : ''}`} onClick={() => day && setSelectedDate(key)}>
                {day && <><span>{day}</span>{hasEvents && <i />}</>}
              </button>
            })}
          </div>
          <p className="notice">※ 일정과 마감일은 사용자가 확인 후 저장한 기록을 기준으로 관리해요.</p>
        </Panel>
        <Panel className="upcoming-panel">
          <h3>선택한 날짜</h3><strong className="selected-date">{selectedDate.replaceAll('-', '.')}</strong>
          {selectedEvents.length ? selectedEvents.map(e => <div className="upcoming-item" key={e.id}><CalendarCheck size={17} /><div><strong>{e.title}</strong><small>{e.type}</small></div></div>) : <p className="empty-inline">등록된 일정이 없어요.</p>}
          <Button variant="secondary" onClick={() => onAddEvent(selectedDate)}>이 날짜에 일정 추가</Button>
          <div className="divider" />
          <h3>신청 이력도 함께 관리해요</h3>
          <p>신청 상태와 참여 예정일을 한 곳에서 확인할 수 있어요.</p>
          <Button onClick={onGoApplications}>신청 이력 보기 <ArrowRight size={15} /></Button>
        </Panel>
      </div>
    </>
  )
}

function ApplicationsPage({ applications, onChangeStatus, onCalendar }: { applications: Application[]; onChangeStatus: (id: string, status: Application['status']) => void; onCalendar: () => void }) {
  const [filter, setFilter] = useState('전체')
  const [selected, setSelected] = useState(applications[0]?.id ?? '')
  const filtered = applications.filter(a => filter === '전체' || a.status === filter)
  const active = applications.find(a => a.id === selected) ?? filtered[0]
  return (
    <>
      <PageTitle title="내 일정 · 신청 이력 관리" description="정책 신청부터 참여까지 기록하고, 추후 필요한 행동을 확인하는 곳이에요." />
      <div className="application-layout">
        <Panel tone="gray" className="application-list-panel">
          <div className="filter-row">
            {['전체', '신청 전', '신청 완료', '결과 대기', '참여 완료'].map(f => <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
          {filtered.map(a => <button className={`application-row ${active?.id === a.id ? 'selected' : ''}`} key={a.id} onClick={() => setSelected(a.id)}>
            <span><strong>{a.title}</strong><small>{a.date} · {a.note}</small></span><em className={`status status-${a.status.replaceAll(' ', '')}`}>{a.status}</em>
          </button>)}
          <p className="notice">신청 이력은 자동 확인이 아니라, 사용자가 확인 후 저장한 기록을 포함해요.</p>
        </Panel>
        <Panel className="application-detail">
          <h3>신청 상세</h3>
          {active ? <>
            <dl className="detail-list compact">
              <div><dt>신청한 곳</dt><dd>{active.title}</dd></div>
              <div><dt>신청 날짜</dt><dd>{active.date}</dd></div>
              <div><dt>현재 상태</dt><dd>{active.status}</dd></div>
              <div><dt>메모</dt><dd>{active.note}</dd></div>
            </dl>
            <label className="field-label">상태 변경
              <select value={active.status} onChange={e => onChangeStatus(active.id, e.target.value as Application['status'])}>
                {['신청 전', '신청 완료', '결과 대기', '참여 완료'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </> : <p className="empty-inline">기록이 없어요.</p>}
          <Button variant="secondary" onClick={onCalendar}>관련 일정 보기 <CalendarDays size={15} /></Button>
        </Panel>
      </div>
    </>
  )
}

function RecordsPage() {
  const [tab, setTab] = useState('대화 이력')
  const items: Record<string, string[]> = {
    '대화 이력': ['취업 준비와 함께할 활동', '나에게 맞는 주거 지원 찾기'],
    '관심 목록': ['청년 지원정책 A', '지역 취업 스터디'],
    '참여 이력': ['청년 커뮤니티 프로그램'],
    '설정·데이터 관리': ['개인정보 및 대화 기록 관리 안내'],
  }
  return (
    <>
      <PageTitle title="마이페이지 · 내 기록" description="과거 상담·관심 정책·참여 기록을 다시 확인하고 조이와 이어서 대화해요." />
      <div className="records-layout">
        <Panel tone="gray" className="records-tabs">
          <h3>내가 저장한 기록</h3>
          {Object.keys(items).map(k => <button className={`record-tab ${tab === k ? 'active' : ''}`} key={k} onClick={() => setTab(k)}><strong>{k}</strong><small>{items[k].length}건 · 기록 예시</small></button>)}
        </Panel>
        <Panel className="records-content">
          <div className="section-head"><h3>{tab}</h3><span>저장된 예시</span></div>
          {items[tab].map((item, i) => <div className="record-entry" key={item}><div><strong>{item}</strong><small>{i === 0 ? '11/17 · 조이와 상담 · 이어서 대화' : '11/15 · 관심 저장 · 다시 보기'}</small></div><ChevronRight size={18} /></div>)}
          <div className="divider" />
          <p>관심 활동과 참여 기록도 같은 계정에서 조회할 수 있도록 연결할 예정이에요.</p>
          <p className="notice">개인정보·상담 기록의 저장, 삭제 범위는 실제 운영 정책 확정이 필요해요.</p>
        </Panel>
      </div>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <PageTitle title="둘셋 소개" description="둘셋은 청년의 고민과 지원제도, 지역사회 활동을 연결하고 실제 참여를 돕는 AI 비서 서비스예요." />
      <div className="about-layout">
        <Panel tone="blue" className="about-main">
          <div className="about-hero">
            <div><span className="small-tag"><Sparkles size={13} /> HOW IT WORKS</span><h2>기회를 찾아,<br />한 걸음씩 이어가요.</h2><p>조이는 청년의 이야기를 듣고, 필요한 정책과 지역 활동을 함께 찾으며 신청과 참여 준비를 도와요.</p></div>
            <JoyAvatar size="lg" />
          </div>
          {[
            ['01', '조이와 이야기하기', '취업·경제·주거·관계 등 고민과 필요한 도움 파악'],
            ['02', '정책과 청년센터 프로그램 찾기', '참여 선호에 맞는 지원과 활동 검색'],
            ['03', '신청을 돕고 기록 남기기', '공식 신청 경로 안내, 신청 여부 확인, 일정·메모 저장'],
            ['04', '작은 연결 이어가기', '참여 기록이 쌓이면 섬·다리·마을로 시각화'],
          ].map(([n, title, desc]) => <div className="about-step" key={n}><span>{n}</span><div><strong>{title}</strong><small>{desc}</small></div></div>)}
        </Panel>
        <Panel className="about-notes">
          <h3>알아두면 좋아요</h3>
          <p><Check size={15} /> 추천은 실제 공고와 출처를 확인해 제공해야 해요.</p>
          <p><Check size={15} /> 고립 여부를 진단하거나 점수화하지 않아요.</p>
          <p><Check size={15} /> 실제 신청과 예약은 사용자가 확인하고 진행해요.</p>
          <p><Check size={15} /> 신청 데이터와 대화 이력은 본인이 관리할 수 있어야 해요.</p>
          <div className="about-art"><img src={planeImage} alt="종이비행기 캐릭터" /><img src={boatImage} alt="종이배 캐릭터" /></div>
        </Panel>
      </div>
    </>
  )
}

function AddEventModal({ date, onClose, onSave }: { date: string; onClose: () => void; onSave: (title: string, date: string) => void }) {
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(date)
  const submit = (e: FormEvent) => { e.preventDefault(); if (title.trim()) onSave(title.trim(), eventDate) }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="mini-label">MY SCHEDULE</span><h2>일정 등록</h2><p>잊지 않고 챙길 일을 기록해요.</p>
        <label className="field-label">일정 이름<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 센터에 문의하기" required /></label>
        <label className="field-label">날짜<input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required /></label>
        <div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>취소</Button><Button type="submit">저장하기</Button></div>
      </form>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [personal, setPersonal] = useState<PersonalInformation>(initialPersonalInformation)
  const [activity, setActivity] = useState<ActivityInformationValue>(initialActivityInformation)
  const [checkinHistory, setCheckinHistory] = useState<CheckinRecord[]>(readCheckinHistory)
  const [stateCheck, setStateCheck] = useState<CurrentStateValue>(() => checkinHistory[0] || initialCurrentState)
  const [checkinStorageError, setCheckinStorageError] = useState(false)
  const saveCheckin = (record: CheckinRecord) => {
    const next = [record, ...checkinHistory]
    setCheckinHistory(next); setStateCheck(record)
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setCheckinStorageError(false) }
    catch { setCheckinStorageError(true) }
  }
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '안녕하세요! 저는 조이예요. 어떤 고민이든 편하게 이야기해 주세요.' },
    { role: 'user', text: '취업 준비가 길어져서 사람도 잘 안 만나게 돼요.' },
    { role: 'assistant', text: '현재 고민과 원하는 활동 방식을 먼저 확인할게요. 온라인과 작은 모임 중 어떤 게 더 편한가요?' },
  ])
  const [selectedProgram, setSelectedProgram] = useState<Program>(programs[0])
  const [policyView, setPolicyView] = useState<PolicyView>(initialPolicyView)
  const policyAnswers = useMemo(() => {
    const names: Record<string, string> = { '취업·진로': '일자리·취업', '주거': '집·주거', '생활·금융': '생활비·금융', '교육·자격증': '교육·자격증', '창업': '창업', '건강·마음': '마음건강·상담', '문화·여가': '문화·여가', '지역 활동': '사람 만나기·모임' }
    const interests = activity.interests.map(i => names[i]).filter(Boolean).slice(0, 3)
    return { ...stateCheck.answers, ...(stateCheck.answers.interests === undefined && interests.length ? { interests } : {}) }
  }, [stateCheck.answers, activity.interests])
  const policyData = usePolicyCatalog(['policy-list', 'policy-detail', 'apply'].includes(screen), policyAnswers, { birthDate: personal.birthDate, regionLabel: profileRegionLabel(personal.regionCode), regionCode: personal.regionCode, employment: activity.employment, school: activity.school })
  const [selectedCenterId, setSelectedCenterId] = useState(centers[0].id)
  const [savedIds, setSavedIds] = useState<string[]>(['p2'])
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 1, title: '센터 문의', date: '2026-11-19', type: '문의 계획 · 개인 메모' },
    { id: 2, title: '프로그램 참여', date: '2026-11-21', type: '참여 예정 · 장소 확인' },
    { id: 3, title: '신청 마감', date: '2026-11-25', type: '실제 공고 확인 후 등록' },
  ])
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventDate, setEventDate] = useState('2026-11-19')
  const [toast, setToast] = useState('')

  const selectedCenter = centers.find(c => c.id === selectedCenterId) ?? centers[0]

  const notify = (message: string) => setToast(message)
  const sendMessage = (text: string) => {
    const value = text.trim()
    if (!value) return
    setMessages(prev => [...prev, { role: 'user', text: value }, { role: 'assistant', text: '이야기해 줘서 고마워요. 관심 지역과 원하는 참여 방식을 함께 확인한 뒤, 관련 정책과 프로그램을 찾아볼게요. 실제 공고와 신청 조건은 공식 출처로 확인할 수 있도록 안내할게요.' }])
    setScreen('chat')
  }
  const toggleSave = (id: string) => setSavedIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  const openProgram = (p: Program) => { setSelectedProgram(p); setScreen('policy-detail') }
  const openCenter = (c: Center) => { setSelectedCenterId(c.id); setScreen('center-detail') }
  const recordApplication = () => {
    setApplications(prev => [{ id: `a${Date.now()}`, title: selectedProgram.title, status: '신청 전', date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'), note: '관심 등록 · 실제 신청 여부는 직접 확인' }, ...prev])
    setScreen('applications')
    notify('신청 준비 기록을 추가했어요.')
  }
  const addEvent = (title: string, date: string) => {
    setEvents(prev => [...prev, { id: Date.now(), title, date, type: '개인 일정' }])
    setShowEventModal(false)
    notify('일정을 저장했어요.')
  }
  const changeApplication = (id: string, status: Application['status']) => setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))

  const useProfileForPolicies = () => { policyData.resetCriteria(); setPolicyView(initialPolicyView) }

  const page = useMemo(() => {
    switch (screen) {
      case 'home': return <HomePage onNavigate={setScreen} onSend={sendMessage} />
      case 'chat': return <ChatPage messages={messages} onSend={sendMessage} />
      case 'apply': return <ApplyPage program={selectedProgram} onRecord={recordApplication} onOpenPolicy={() => setScreen('policy-list')} />
      case 'policy-list': return <PolicyListPage data={policyData} view={policyView} setView={setPolicyView} onSelect={openProgram} saved={savedIds} onToggleSave={toggleSave} onCheck={() => setScreen('state-check')} onUseProfile={useProfileForPolicies} onEditProfile={() => setScreen('profile-edit')} />
      case 'policy-detail': return <PolicyDetailPage onBack={() => setScreen('policy-list')} program={selectedProgram} onApply={() => setScreen('apply')} onSave={() => toggleSave(selectedProgram.id)} isSaved={savedIds.includes(selectedProgram.id)} />
      case 'center-list': return <CenterListPage onSelect={openCenter} />
      case 'center-detail': return <CenterDetailPage center={selectedCenter} onBack={() => setScreen('center-list')} onHelp={() => sendMessage(`${selectedCenter.name} 이용 방법과 문의할 내용을 정리해 줘.`)} />
      case 'calendar': return <CalendarPage events={events} onAddEvent={date => { setEventDate(date); setShowEventModal(true) }} onGoApplications={() => setScreen('applications')} />
      case 'applications': return <ApplicationsPage applications={applications} onChangeStatus={changeApplication} onCalendar={() => setScreen('calendar')} />
      case 'profile': return <MyPage personal={personal} activity={activity} completed={stateCheck.completed} savedCount={savedIds.filter(id => id.startsWith('policy:') || id.startsWith('program:')).length} onEdit={() => setScreen('profile-edit')} onActivity={() => setScreen('activity-edit')} onCheck={() => setScreen('state-check')} onSaved={() => { setPolicyView({ ...initialPolicyView, onlySaved: true }); setScreen('policy-list') }} onBrowse={() => setScreen('policy-list')} />
      case 'profile-edit': return <ProfileSettings value={personal} onBack={() => setScreen('profile')} onSave={next => { setPersonal(next); setScreen('profile'); notify('기본 정보를 수정했어요.') }} />
      case 'activity-edit': return <ActivityInformation value={activity} onBack={() => setScreen('profile')} onSave={next => { setActivity(next); setScreen('profile'); notify('활동·관심 정보를 저장했어요.') }} />
      case 'state-check': return <CurrentStateCheck value={stateCheck} history={checkinHistory} storageError={checkinStorageError} onSave={saveCheckin} onBack={() => setScreen('profile')} onChat={() => setScreen('chat')} />
      case 'records': return <RecordsPage />
      case 'about': return <AboutPage />
      default: return <HomePage onNavigate={setScreen} onSend={sendMessage} />
    }
  }, [screen, personal, activity, stateCheck, checkinHistory, checkinStorageError, messages, selectedProgram, selectedCenter, savedIds, applications, events, policyData, policyView])

  return (
    <div className="app-shell">
      <Header screen={screen} onNavigate={setScreen} />
      <main className="main-container">{['profile', 'profile-edit', 'activity-edit', 'state-check', 'records'].includes(screen) ? <AccountLayout screen={screen as AccountScreen} onNavigate={setScreen}>{page}</AccountLayout> : page}</main>
      <Footer onAbout={() => setScreen('about')} />
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      {showEventModal && <AddEventModal date={eventDate} onClose={() => setShowEventModal(false)} onSave={addEvent} />}
    </div>
  )
}

