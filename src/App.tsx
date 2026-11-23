import ApplicationScheduleNav from './ApplicationScheduleNav'
import TestDataReset from './TestDataReset'
import HomeLanding from './HomeLanding'
import { SchedulePage, ScheduleEditor } from './SchedulePages'
import { localDate, dueReminders, type CalendarEvent } from './schedule'
import type { PublicCenter } from './center-api'
import { CenterListPage, CenterDetailPage } from './CenterPages'
import PolicyJoyPanel from './PolicyJoyPanel'
import ActivityExperiences from './ActivityExperiences'
import { readSetup, type AnswerDecision } from './setup-state'
import { profileInterests, currentRecommendationAnswers } from './profile-context'
import { readLocal } from './local-storage'
import { HISTORY_KEY, readCheckinHistory, type CheckinRecord } from './checkin-result'
import { AccountLayout, MyPage, type AccountScreen } from './MyPage'
import { PolicyListPage, PolicyDetailPage, initialPolicyView, type PolicyView } from './PolicyPages'
import { usePolicyCatalog } from './use-policy-catalog'
import ProfileSettings, { initialPersonalInformation, profileRegionLabel, type PersonalInformation } from './ProfileSettings'
import ActivityInformation, { initialActivityInformation, type ActivityInformationValue } from './ActivityInformation'
import CurrentStateCheck, { initialCurrentState, type CurrentStateValue } from './CurrentStateCheck'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode, type ButtonHTMLAttributes } from 'react'
import {
  ArrowRight, Bot, Search, MapPin, CalendarDays, UserRound, Bookmark,
  MessageCircle, ChevronRight, ChevronLeft, Sparkles, Send, Plus, Check,
  Clock3, ExternalLink, SlidersHorizontal, Building2, FileText, Map,
  CircleHelp, Plane, Ship, TreePine, Home, Settings, Bell, Heart, Filter,
  Navigation, CalendarCheck, History, Sprout, MapPinned, BadgeCheck,
  BookOpen, Star, Footprints, NotebookPen, Compass, X, Menu
} from 'lucide-react'
import { programs, type Program, type Application } from './data'

import joyImage from './assets/joy.png'
import joyIslandImage from './assets/joy-island.png'
import boatImage from './assets/boat.png'
import planeImage from './assets/plane.png'
import bridgeVillageImage from './assets/bridge-village.png'
import mapImage from './assets/map.png'

type Screen =
  | 'home' | 'chat' | 'apply' | 'setup'
  | 'policy-list' | 'policy-detail'
  | 'center-list' | 'center-detail'
  | 'calendar' | 'applications'
  | 'profile' | 'profile-edit' | 'activity-edit' | 'state-check' | 'records' | 'about'

type Message = { role: 'assistant' | 'user'; text: string }


const navItems = [
  { id: 'assistant', label: 'AI 비서', icon: Bot },
  { id: 'policies', label: '정책·활동 찾기', icon: Search },
  { id: 'centers', label: '주변센터', icon: MapPin },
  { id: 'schedule', label: '신청·일정 관리', icon: CalendarDays },
] as const

function sectionFor(screen: Screen) {
  if (screen === 'home') return null
  if (['chat', 'apply'].includes(screen)) return 'assistant'
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
      assistant: 'chat', policies: 'policy-list', centers: 'center-list',
      schedule: 'calendar', profile: 'profile',
    }
    onNavigate(target[id])
    setMobileOpen(false)
  }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand-button" onClick={() => { onNavigate('home'); setMobileOpen(false) }} aria-label="둘셋 홈으로">
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


function ApplicationsPage({ applications, onChangeStatus, onCalendar }: { applications: Application[]; onChangeStatus: (id: string, status: Application['status']) => void; onCalendar: () => void }) {
  const [filter, setFilter] = useState('전체')
  const [selected, setSelected] = useState(applications[0]?.id ?? '')
  const filtered = applications.filter(a => filter === '전체' || a.status === filter)
  const active = filtered.find(a => a.id === selected) ?? filtered[0]
  return (
    <>
      <PageTitle title="신청·일정 관리" description="정책 신청부터 참여까지 기록하고, 추후 필요한 행동을 확인하는 곳이에요." />
      <ApplicationScheduleNav active="applications" onApplications={()=>{}} onCalendar={onCalendar} />
      <div className="application-layout">
        <Panel tone="gray" className="application-list-panel">
          <div className="filter-row">
            {['전체', '작성 완료', '신청 전', '신청 완료', '결과 대기', '참여 완료'].map(f => <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
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
            {!!active.answers?.length&&<details><summary>작성한 신청 내용 보기 · 이 기기에 저장됨</summary><dl className="detail-list compact">{active.answers.map((a,i)=><div key={i}><dt>{a.label}</dt><dd>{a.value||'입력하지 않았어요'}</dd></div>)}</dl></details>}
            <label className="field-label">상태 변경
              <select value={active.status} onChange={e => onChangeStatus(active.id, e.target.value as Application['status'])}>
                {['작성 완료', '신청 전', '신청 완료', '결과 대기', '참여 완료'].map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </> : <p className="empty-inline">기록이 없어요.</p>}
          <Button variant="secondary" onClick={onCalendar}>관련 일정 보기 <CalendarDays size={15} /></Button>
        </Panel>
      </div>
    </>
  )
}

function RecordsPage({ saved, applications, events, history, onSelect, onCheck, experiences, onExperiences, loading, failed }: { loading: boolean; failed: boolean; experiences: ActivityInformationValue['experiences']; onExperiences: (next: ActivityInformationValue['experiences']) => void; saved: Program[]; applications: Application[]; events: CalendarEvent[]; history: CheckinRecord[]; onSelect: (program: Program) => void; onCheck: () => void }) {
  return <>
    <PageTitle title="마이페이지 · 내 기록" description="이 브라우저에 저장한 관심 정보, 신청 준비와 일정, 생활 점검을 확인해요. 서버 계정과 동기화되지 않아요." />
    {loading && <p role="status">저장한 공고를 확인하고 있어요.</p>}{failed && <p role="alert">저장한 공고를 불러오지 못했어요. 관심 ID와 다른 로컬 기록은 보존돼 있어요.</p>}
    <ActivityExperiences value={experiences} onChange={onExperiences} />
    <Panel><h2>관심 정책·프로그램 · {saved.length}건</h2>{saved.map(p => <button className="record-entry" key={p.id} onClick={() => onSelect(p)}>{p.title}<ChevronRight size={18} /></button>)}{!saved.length && <p>관심 저장한 정보가 없어요.</p>}</Panel>
    <Panel><h2>신청·참여 기록 · {applications.length}건</h2>{applications.map(a => <p key={a.id}>{a.title} · {a.status} · {a.date}</p>)}{!applications.length && <p>등록한 신청 기록이 없어요.</p>}</Panel>
    <Panel><h2>내 일정 · {events.length}건</h2>{events.map(e => <p key={e.id}>{e.date} · {e.title}</p>)}{!events.length && <p>등록한 일정이 없어요.</p>}</Panel>
    <Panel><h2>생활 점검 · {history.length}건</h2>{history.map(r => <p key={r.id}>{new Date(r.savedAt).toLocaleString('ko-KR')} · {r.result.title}</p>)}<Button variant="secondary" onClick={onCheck}>점검 이력 보기</Button></Panel>
  </>
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

export default function App() {
  const [setup, setSetup] = useState(readSetup)
  const [screen, setScreen] = useState<Screen>('home')
  const [personal, setPersonal] = useState<PersonalInformation>(() => readLocal('personal', initialPersonalInformation))
  const [activity, setActivity] = useState<ActivityInformationValue>(() => readLocal('activity', initialActivityInformation))
  const [checkinHistory, setCheckinHistory] = useState<CheckinRecord[]>(readCheckinHistory)
  const [stateCheck, setStateCheck] = useState<CurrentStateValue>(() => checkinHistory[0] || initialCurrentState)
  const [checkinStorageError, setCheckinStorageError] = useState(false)
  const saveCheckin = (record: CheckinRecord) => {
    const next = [record, ...checkinHistory]
    setCheckinHistory(next); setStateCheck(record)
    setSetup(prev => ({ ...prev, checkin: 'answered', ...(record.answers.interests !== undefined ? { interestSource: 'checkin' } : {}) }))
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setCheckinStorageError(false) }
    catch { setCheckinStorageError(true) }
  }
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSession, setChatSession] = useState(0)
  const [chatRestore,setChatRestore]=useState<{id:string;nonce:number}>()
  const [calendarDate,setCalendarDate]=useState(localDate())
  const [selectedProgram, setSelectedProgram] = useState<Program>(programs[0])
  const [chatProgram, setChatProgram] = useState<Program>()
  const [chatCenter, setChatCenter] = useState<PublicCenter>()
  const [chatSchedule, setChatSchedule] = useState<{date:string}>()
  const [savedIds, setSavedIds] = useState<string[]>(() => readLocal('saved', [] as string[]))
  const [policyView, setPolicyView] = useState<PolicyView>(initialPolicyView)
  const effectivePolicyView = useMemo(() => screen === 'records' ? { ...initialPolicyView, onlySaved: true } : policyView, [screen, policyView])
  const defaultInterests = useMemo(() => profileInterests(activity.interests), [activity.interests])
  const policyAnswers = useMemo(() => currentRecommendationAnswers(stateCheck.answers, defaultInterests, setup.interestSource === 'profile', setup.decisions), [stateCheck.answers, defaultInterests, setup.interestSource, setup.decisions])
  const policyData = usePolicyCatalog(['policy-list', 'policy-detail', 'apply', 'records'].includes(screen), policyAnswers, { birthDate: personal.birthDate, regionLabel: profileRegionLabel(personal.regionCode), regionCode: personal.regionCode, employment: activity.employment, school: activity.school }, effectivePolicyView, savedIds)
  const [selectedCenterId, setSelectedCenterId] = useState('')
  const [applications, setApplications] = useState<Application[]>(() => readLocal('applications', [] as Application[]))
  const [events, setEvents] = useState<CalendarEvent[]>(() => readLocal('events', [] as CalendarEvent[]))
  const [editingEvent, setEditingEvent] = useState<CalendarEvent>()
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventDate, setEventDate] = useState(localDate())
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    try {
      for (const [key, value] of Object.entries({ personal, activity, saved: savedIds, applications, events, setup })) localStorage.setItem(`dos-tres.${key}.v1`, JSON.stringify(value))
      setStorageError(false)
    } catch { setStorageError(true) }
  }, [personal, activity, savedIds, applications, events, setup])


  const notify = (message: string) => setToast(message)
  const sendMessage = (text: string) => {
    const value = text.trim()
    if (!value) return
    setChatProgram(undefined); setChatCenter(undefined); setChatSchedule(undefined)
    setChatRestore(undefined)
    setMessages([{ role: 'user', text: value }])
    setChatSession(value => value + 1)
    setScreen('chat')
  }
  const toggleSave = (id: string) => setSavedIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  const openProgram = (p: Program) => { setChatCenter(undefined); setChatSchedule(undefined); setSelectedProgram(p); setChatProgram(p); setScreen('chat') }
  const openCenter = (id: string) => { setSelectedCenterId(id); setScreen('center-detail') }
  const recordApplication = () => {
    setApplications(prev => [{ id: `a${Date.now()}`, title: selectedProgram.title, status: '신청 전', date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'), note: '관심 등록 · 실제 신청 여부는 직접 확인' }, ...prev])
    setScreen('applications')
    notify('신청 준비 기록을 추가했어요.')
  }
  const saveEvent = (event: CalendarEvent) => {
    setEvents(prev => prev.some(e=>e.id===event.id) ? prev.map(e=>e.id===event.id?event:e) : [...prev,event])
    setShowEventModal(false); notify('일정을 저장했어요.')
  }
  useEffect(()=>{
    const check=()=>{const due=dueReminders(events);if(!due.length)return
      notify(`조이 알림: ${due.map(e=>e.title).join(' · ')}`)
      if('Notification' in window && Notification.permission==='granted')due.forEach(e=>{try{new Notification('조이 · 일정 알림',{body:e.title})}catch{/* In-app reminder remains available. */}})
      setEvents(prev=>prev.map(e=>due.some(d=>d.id===e.id)?{...e,notifiedAt:new Date().toISOString()}:e))
    }; check(); const timer=window.setInterval(check,15000);return()=>window.clearInterval(timer)
  },[events])
  const enableNotifications=async()=>{if(!('Notification' in window)){notify('이 브라우저에서는 화면 안 알림을 이용해 주세요.');return}try{const permission=await Notification.requestPermission();notify(permission==='granted'?'이 화면을 열어 둔 동안 기기 알림을 받을 수 있어요.':'화면 안에서 일정 알림을 확인할 수 있어요.')}catch{notify('기기 알림을 켜지 못했어요. 화면 안 알림은 유지해요.')}}
  const changeApplication = (id: string, status: Application['status']) => setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))

  const savePersonal = (next: PersonalInformation) => { setPersonal(next); setSetup(prev => ({ ...prev, personal: next.birthDate || next.regionCode ? 'answered' : 'skipped' })) }
  const saveActivity = (next: ActivityInformationValue) => { setActivity(next); setSetup(prev => ({ ...prev, preferences: next.employment || next.school || next.interests.length || next.participation || next.groupSize ? 'answered' : 'skipped', ...(JSON.stringify(next.interests) !== JSON.stringify(activity.interests) ? { interestSource: 'profile', decisions: { ...prev.decisions, interests: 'answered' as const } } : {}) })) }
  const decideQuestion = (id: string, decision: AnswerDecision) => setSetup(prev => ({ ...prev, decisions: { ...prev.decisions, [id]: decision } }))
  const finishSetup = () => { setSetup(prev => ({ ...prev, finished: true, personal: prev.personal === 'unanswered' ? 'skipped' : prev.personal, preferences: prev.preferences === 'unanswered' ? 'skipped' : prev.preferences, checkin: prev.checkin === 'unanswered' ? 'skipped' : prev.checkin })); setScreen('chat') }
  const skipSetup = () => { setSetup(prev => ({ ...prev, [(['', 'personal', 'preferences', 'checkin'] as const)[prev.step] || 'checkin']: 'skipped', step: Math.min(3, prev.step + 1), ...(prev.step === 3 ? { finished: true } : {}) })); if (setup.step === 3) setScreen('policy-list') }
  const startSetup = () => {
    if (personal.birthDate&&personal.regionCode&&checkinHistory.some(record => record.completed)) {setChatProgram(undefined);setChatCenter(undefined);setChatSchedule(undefined);setChatRestore(undefined);setMessages([]);setChatSession(v=>v+1);setScreen('chat');return}
    setSetup(prev => ({ ...prev, step: 1, finished: false })); setScreen('setup')
  }
  const navigate = (next: Screen) => { if (next === 'setup') startSetup(); else setScreen(next) }
  const useProfileForPolicies = () => { policyData.resetCriteria(); setPolicyView(initialPolicyView) }

  const chatPage = <PolicyJoyPanel onCheck={()=>setScreen(personal.birthDate&&personal.regionCode?'state-check':'setup')} restoreRequest={chatRestore} key={chatSession} startFresh={chatSession > 0} checkinAnswers={policyAnswers} answerDecisions={setup.decisions} preferProfile={setup.interestSource==='profile'} scheduleContext={chatSchedule} center={chatCenter} schedule={{ openApplications:()=>setScreen('applications'), recordDraft:(p,answers,submitted,sourceUrl)=>setApplications(prev=>[{id:`draft:${p.id}`,title:p.title,status:submitted?'신청 완료':'작성 완료',date:localDate().replaceAll('-','.'),note:submitted?'팀 소유 복제 폼 제출 확인 · 실제 기관 접수 아님':'작성·확인 완료 · 실제 기관 미제출',answers,sourceUrl},...prev.filter(a=>a.id!==`draft:${p.id}`)]), events, save:saveEvent, remove:id=>setEvents(prev=>prev.filter(e=>e.id!==id)), open:date=>{if(date)setCalendarDate(date);setScreen('calendar')}, recordApplication:p=>setApplications(prev=>prev.some(a=>a.id===`reported:${p.id}`)?prev:[{id:`reported:${p.id}`,title:p.title,status:'신청 완료',date:localDate().replaceAll('-','.'),note:'사용자가 직접 신청했다고 확인한 기록 · 기관 접수 확인 아님'},...prev]) }} program={chatProgram} personal={personal} activity={activity} initialMessages={messages} onBack={() => setScreen(chatSchedule?'calendar':chatCenter?'center-list':'policy-list')} onSavePersonal={savePersonal} onSaveActivity={saveActivity} onNew={() => { setChatRestore(undefined);setChatProgram(undefined); setChatCenter(undefined); setChatSchedule(undefined); setMessages([]) }} onSave={() => { if (chatProgram) toggleSave(chatProgram.id) }} saved={!!chatProgram && savedIds.includes(chatProgram.id)} />

  const page = useMemo(() => {
    switch (screen) {
      case 'setup': return <div className="setup-flow">
        {setup.step <= 1 && <ProfileSettings onboarding value={personal} onSave={next => { savePersonal(next); setSetup(prev => ({ ...prev, step: 2 })) }} onBack={skipSetup} />}
        {setup.step === 2 && <ActivityInformation onboarding value={activity} onSave={next => { saveActivity(next); setSetup(prev => ({ ...prev, step: 3 })) }} onBack={skipSetup} />}
        {setup.step === 3 && <><CurrentStateCheck onboarding startInSurvey decisions={setup.decisions} onDecision={decideQuestion} preferProfile={setup.interestSource === 'profile'} defaultInterests={defaultInterests} profile={{ birthDate: personal.birthDate, regionLabel: profileRegionLabel(personal.regionCode), regionCode: personal.regionCode, employment: activity.employment, school: activity.school }} onOpenPolicy={openProgram} onEditProfile={() => setSetup(prev => ({ ...prev, step: 1 }))} value={stateCheck} history={checkinHistory} storageError={checkinStorageError} onSave={saveCheckin} onBack={skipSetup} onChat={finishSetup} /></>}
      </div>
      case 'home': return <HomeLanding completed={checkinHistory.some(record => record.completed)} onNavigate={navigate} onSend={sendMessage} />
      case 'chat': return null
      case 'apply': return <ApplyPage program={selectedProgram} onRecord={recordApplication} onOpenPolicy={() => setScreen('policy-list')} />
      case 'policy-list': return <PolicyListPage data={policyData} view={policyView} setView={setPolicyView} onSelect={openProgram} saved={savedIds} onToggleSave={toggleSave} onCheck={() => setScreen('state-check')} onUseProfile={useProfileForPolicies} onEditProfile={() => setScreen('profile-edit')} />
      case 'policy-detail': return <PolicyDetailPage onBack={() => setScreen('policy-list')} program={selectedProgram} onApply={() => { setChatProgram(selectedProgram); setScreen('chat') }} onSave={() => toggleSave(selectedProgram.id)} isSaved={savedIds.includes(selectedProgram.id)} />
      case 'center-list': return <CenterListPage onSelect={openCenter} savedRegion={personal.regionCode ? profileRegionLabel(personal.regionCode) : ''} />
      case 'center-detail': return <CenterDetailPage onAsk={center=>{setChatCenter(center);setChatSchedule(undefined);setChatProgram(undefined);setMessages([]);setScreen('chat')}} id={selectedCenterId} onBack={() => setScreen('center-list')} onProgram={openProgram} />
      case 'calendar': return <SchedulePage onOpenChat={event=>{setChatProgram(undefined);setChatCenter(undefined);setChatSchedule(undefined);setChatRestore({id:event.chatId!,nonce:Date.now()});setScreen('chat')}} initialDate={chatSchedule?.date||calendarDate} onAsk={date=>{setChatProgram(undefined);setChatCenter(undefined);setMessages([]);setChatSchedule({date});setScreen('chat')}} onNotifications={enableNotifications} events={events} onAdd={date => { setEditingEvent(undefined); setEventDate(date); setShowEventModal(true) }} onEdit={event => { setEditingEvent(event); setEventDate(event.date); setShowEventModal(true) }} onDelete={id => setEvents(prev => prev.filter(e => e.id !== id))} onApplications={() => setScreen('applications')} />
      case 'applications': return <ApplicationsPage applications={applications} onChangeStatus={changeApplication} onCalendar={() => setScreen('calendar')} />
      case 'profile': return <MyPage onRecords={() => setScreen('records')} personal={personal} activity={activity} completed={checkinHistory.some(record => record.completed)} savedCount={savedIds.filter(id => id.startsWith('policy:') || id.startsWith('program:')).length} onEdit={() => setScreen('profile-edit')} onActivity={() => setScreen('activity-edit')} onCheck={() => setScreen('state-check')} onSaved={() => { setPolicyView({ ...initialPolicyView, onlySaved: true }); setScreen('policy-list') }} onBrowse={() => setScreen('policy-list')} />
      case 'profile-edit': return <ProfileSettings value={personal} onBack={() => setScreen('profile')} onSave={next => { savePersonal(next); setScreen('profile'); notify('기본 정보를 수정했어요.') }} />
      case 'activity-edit': return <ActivityInformation value={activity} onBack={() => setScreen('profile')} onSave={next => { saveActivity(next); setScreen('profile'); notify('활동·관심 정보를 저장했어요.') }} />
      case 'state-check': return <CurrentStateCheck startInSurvey decisions={setup.decisions} onDecision={decideQuestion} preferProfile={setup.interestSource === 'profile'} defaultInterests={defaultInterests} profile={{ birthDate: personal.birthDate, regionLabel: profileRegionLabel(personal.regionCode), regionCode: personal.regionCode, employment: activity.employment, school: activity.school }} onOpenPolicy={openProgram} onEditProfile={() => setScreen('profile-edit')} value={stateCheck} history={checkinHistory} storageError={checkinStorageError} onSave={saveCheckin} onBack={() => setScreen('profile')} onChat={() => setScreen('chat')} />
      case 'records': return <RecordsPage loading={policyData.busy} failed={policyData.failed} experiences={activity.experiences} onExperiences={experiences => setActivity(prev => ({ ...prev, experiences }))} saved={policyData.items.filter(p => savedIds.includes(p.id))} applications={applications} events={events} history={checkinHistory} onSelect={openProgram} onCheck={() => setScreen('state-check')} />
      case 'about': return <AboutPage />
      default: return <HomeLanding completed={checkinHistory.some(record => record.completed)} onNavigate={navigate} onSend={sendMessage} />
    }
  }, [screen, personal, activity, stateCheck, checkinHistory, checkinStorageError, messages, selectedProgram, selectedCenterId, savedIds, applications, events, policyData, policyView, setup, chatProgram, chatCenter, chatSchedule, policyAnswers, calendarDate, chatRestore])

  return (
    <div className="app-shell">
      <Header screen={screen} onNavigate={setScreen} />
      <main className="main-container"><div style={{display:screen==='chat'?'block':'none'}} aria-hidden={screen!=='chat'}>{chatPage}</div>{['profile', 'profile-edit', 'activity-edit', 'state-check', 'records'].includes(screen) ? <AccountLayout screen={screen as AccountScreen} onNavigate={setScreen}>{page}</AccountLayout> : page}</main>
      <TestDataReset />
      <Footer onAbout={() => setScreen('about')} />
      {storageError && <p role="alert">이 브라우저에 저장하지 못했어요. 새로고침하면 수정 내용이 사라질 수 있어요.</p>}
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
      {showEventModal && <ScheduleEditor event={editingEvent} date={eventDate} onClose={() => setShowEventModal(false)} onSave={saveEvent} />}
    </div>
  )
}

