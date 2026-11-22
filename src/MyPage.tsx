import { useEffect, type ReactNode } from 'react'
import { ArrowRight, Bookmark, ClipboardCheck, FileText, Home, MapPin, Settings2, UserRound } from 'lucide-react'
import type { PersonalInformation } from './ProfileSettings'
import { profileRegionLabel } from './ProfileSettings'
import type { ActivityInformationValue } from './ActivityInformation'
import { ageFromBirthDate } from './policy-api'
import './my-page.css'

export type AccountScreen = 'profile' | 'profile-edit' | 'activity-edit' | 'state-check' | 'records'
const menus = [
  { screen: 'profile', label: '마이 홈', icon: Home },
  { screen: 'profile-edit', label: '내 정보', icon: UserRound },
  { screen: 'activity-edit', label: '맞춤 설정', icon: Settings2 },
  { screen: 'state-check', label: '생활 점검', icon: ClipboardCheck },
  { screen: 'records', label: '내 기록', icon: FileText },
] as const
export function AccountLayout({ screen, onNavigate, children }: { screen: AccountScreen; onNavigate: (screen: AccountScreen) => void; children: ReactNode }) {
  useEffect(() => { window.scrollTo(0, 0) }, [screen])
  return <div className="account-layout"><aside className="account-navigation"><h2>마이페이지</h2><nav aria-label="마이페이지 메뉴">{menus.map(({ screen: id, label, icon: Icon }) => <button key={id} type="button" aria-current={screen === id ? 'page' : undefined} onClick={() => onNavigate(id)}><Icon size={18} /><span>{label}</span><ArrowRight size={14} /></button>)}</nav></aside><div className="account-content">{children}</div></div>
}
export function MyPage({ personal, activity, completed, savedCount, onEdit, onActivity, onCheck, onSaved, onBrowse, onRecords }: {
  personal: PersonalInformation; activity: ActivityInformationValue; completed: boolean; savedCount: number;
  onRecords: () => void; onEdit: () => void; onActivity: () => void; onCheck: () => void; onSaved: () => void; onBrowse: () => void
}) {
  const age = ageFromBirthDate(personal.birthDate)
  return <>
    <div className="page-title"><h1>마이 홈</h1><p>내 정보와 맞춤 설정을 관리하고, 필요한 지원을 이어서 살펴보세요.</p></div>
    <section className="panel account-overview"><div><span className="mini-label">MY DOS TRES</span><h2>{personal.name ? `${personal.name}님, 반가워요` : '나의 둘셋'}</h2><p><MapPin size={15} />{personal.regionCode ? profileRegionLabel(personal.regionCode) : '거주 지역을 등록해 맞춤 지원을 찾아보세요.'}{age && <span>만 {age}세</span>}</p></div><button className="btn btn-secondary" onClick={onEdit}>내 정보 수정 <ArrowRight size={15} /></button></section>
    <div className="account-stats"><button onClick={onSaved}><Bookmark size={20} /><span>관심 정책·프로그램</span><strong>{savedCount}<small>건</small></strong><ArrowRight size={16} /></button><button onClick={onRecords}><FileText size={20} /><span>등록한 활동 경험</span><strong>{activity.experiences.length}<small>건</small></strong><ArrowRight size={16} /></button><button onClick={onCheck} aria-label={completed ? '생활 점검 결과 확인' : '생활 점검 시작'}><ClipboardCheck size={20} /><span>생활 점검</span><strong className={`account-status ${completed ? '' : 'account-status-start'}`}>{completed ? '결과 보기' : '시작하기'}</strong><ArrowRight size={16} /></button></div>
    <div className="account-card-grid">
      <section className="panel account-card"><div className="section-head"><h3>내 기본 정보</h3><button className="account-text-link" onClick={onEdit}>수정 <ArrowRight size={14} /></button></div><dl className="account-info-rows"><div><dt>생년월일</dt><dd>{personal.birthDate || '미등록'}{age && ` · 만 ${age}세`}</dd></div><div><dt>휴대전화</dt><dd>{personal.phone || '미등록'}</dd></div><div><dt>이메일</dt><dd>{personal.email || '미등록'}</dd></div><div><dt>거주 지역</dt><dd>{personal.regionCode ? profileRegionLabel(personal.regionCode) : '미등록'}</dd></div></dl><p className="account-card-help">나이와 거주 지역은 정책 검색에 자동 적용돼요.</p></section>
      <section className="panel account-card"><div className="section-head"><h3>맞춤 지원 조건</h3><button className="account-text-link" onClick={onActivity}>관리 <ArrowRight size={14} /></button></div><dl className="account-info-rows"><div><dt>현재 상태</dt><dd>{activity.employment || '선택 안 함'}</dd></div><div><dt>재학 상태</dt><dd>{activity.school || '선택 안 함'}</dd></div><div><dt>참여 방식</dt><dd>{activity.participation || '선택 안 함'}</dd></div><div><dt>모임 규모</dt><dd>{activity.groupSize || '선택 안 함'}</dd></div><div><dt>관심 분야</dt><dd>{activity.interests.length ? <div className="account-interest-tags">{activity.interests.map(item => <span key={item}>{item}</span>)}</div> : '선택 안 함'}</dd></div></dl><p className="account-card-help">기본 정보와 별도로 관심 분야·활동 선호를 관리해요.</p></section>
    </div>
    <section className="panel account-next"><div><h3>지금 나에게 필요한 지원은?</h3><p>요즘의 일상을 돌아보고, 내 조건에 맞는 정책과 프로그램을 찾아보세요.</p></div><div className="button-row"><button className="btn btn-secondary" onClick={onCheck}>{completed ? '생활 점검 다시 하기' : '생활 점검하기'}</button><button className="btn btn-primary" onClick={onBrowse}>맞춤 지원 찾아보기 <ArrowRight size={15} /></button></div></section>
  </>
}
