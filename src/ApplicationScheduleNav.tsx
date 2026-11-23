import './application-schedule-nav.css'
export default function ApplicationScheduleNav({active,onApplications,onCalendar}:{active:'applications'|'calendar';onApplications:()=>void;onCalendar:()=>void}) {
  return <nav className="application-schedule-nav" aria-label="신청·일정 관리"><button type="button" aria-current={active==='applications'?'page':undefined} onClick={onApplications}>신청 이력</button><button type="button" aria-current={active==='calendar'?'page':undefined} onClick={onCalendar}>일정</button></nav>
}
