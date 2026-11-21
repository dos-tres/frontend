export type CalendarEvent = { id: number; title: string; date: string; type: string; startTime?: string; endTime?: string; location?: string; reminderMinutes?: number; notifiedAt?: string; source?: 'manual' | 'assistant' | 'application'; itemId?: string; centerId?: string }
export const localDate = (value = new Date()) => `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`
export function validateEvent(event: Pick<CalendarEvent,'title'|'date'|'startTime'|'endTime'|'reminderMinutes'>): string {
  if (!event.title.trim()) return '일정 이름을 알려주세요.'
  const d = new Date(`${event.date}T12:00:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !Number.isFinite(d.getTime()) || localDate(d)!==event.date) return '날짜를 다시 확인해 주세요.'
  if ([event.startTime,event.endTime].some(t=>t && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return '시간을 다시 확인해 주세요.'
  if (event.endTime && (!event.startTime || event.endTime<=event.startTime)) return '종료 시간은 시작 시간보다 늦게 설정해 주세요.'
  if(event.reminderMinutes!==undefined && (!event.startTime || !Number.isFinite(event.reminderMinutes) || event.reminderMinutes<0)) return '알림을 받으려면 시작 시간을 입력해 주세요.'
  return ''
}
export function parseSchedule(text: string, now = new Date()): Partial<CalendarEvent> {
  let date: string | undefined
  const iso=text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (iso) date=iso[1]
  else if (/오늘|내일|모레/.test(text)) { const d=new Date(now); d.setDate(d.getDate()+(/모레/.test(text)?2:/내일/.test(text)?1:0)); date=localDate(d) }
  else { const weekday=text.match(/(이번\s*주|다음\s*주)?\s*([일월화수목금토])요일/); if(weekday){const d=new Date(now); let offset='일월화수목금토'.indexOf(weekday[2])-d.getDay(); if(weekday[1]?.replace(/\s/g,'')==='다음주')offset+=7; else if(offset<0)offset+=7; d.setDate(d.getDate()+offset); date=localDate(d)} }
  const times=[...text.matchAll(/(오전|오후|저녁|밤)?\s*(\d{1,2})(?::(\d{2})|시(?!간)(?:\s*(반|\d{1,2}분))?)/g)]
  let meridiem=''
  const parsed=times.map(m=>{meridiem=m[1]||meridiem; let hour=Number(m[2]); if(!meridiem && hour<=12)return undefined; if(meridiem && hour>12)return undefined; if(['오후','저녁','밤'].includes(meridiem)&&hour<12)hour+=12; if(meridiem==='오전'&&hour===12)hour=0; return `${String(hour).padStart(2,'0')}:${m[3]|| (m[4]==='반'?'30':String(parseInt(m[4]||'0')).padStart(2,'0'))}`})
  const reminder=text.match(/(\d{1,4})\s*분\s*전/), hourReminder=text.match(/(\d{1,2})\s*시간\s*전/)
  const reminderMinutes=reminder?Number(reminder[1]):hourReminder?Number(hourReminder[1])*60:undefined
  const title=text.replace(/\d+\s*(분|시간)\s*전(?:에)?\s*(알려\s*줘|알림)?/g,'').replace(/\d{4}-\d{2}-\d{2}|오늘|내일|모레|(이번\s*주|다음\s*주)?\s*[일월화수목금토]요일/g,'').replace(/(오전|오후|저녁|밤)?\s*\d{1,2}(?::\d{2}|시(?!간)(?:\s*(반|\d{1,2}분))?)\s*(부터|까지)?/g,'').replace(/(일정\s*)?(등록해\s*줘|추가해\s*줘|넣어\s*줘|잡아\s*줘)|일정\s*(등록|추가)|있어[요]?/g,'').trim()
  return { ...(reminderMinutes!==undefined?{reminderMinutes}:{}),...(date?{date}:{}),...(parsed[0]?{startTime:parsed[0]}:{}),...(parsed[1]?{endTime:parsed[1]}:{}),...(title?{title}:{}) }
}
export const eventLabel = (e: CalendarEvent) => `${e.date} ${e.startTime ? `${e.startTime}${e.endTime?`~${e.endTime}`:''}` : '시간 미정'} · ${e.title}${e.location?` · ${e.location}`:''}`
export function dueReminders(events: CalendarEvent[], now = Date.now()) {
  return events.filter(e=>{if(e.reminderMinutes===undefined||!e.startTime||e.notifiedAt)return false; const at=new Date(`${e.date}T${e.startTime}:00`).getTime(); return now>=at-e.reminderMinutes*60000 && now<at+60000})
}
export function timeBlocks(events: CalendarEvent[]) {
 const minutes=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3))
 const ends:number[]=[]
 return events.filter(e=>e.startTime && !validateEvent(e)).sort((a,b)=>a.startTime!.localeCompare(b.startTime!)).map(event=>{
  const start=minutes(event.startTime!),end=event.endTime?minutes(event.endTime):Math.min(1440,start+30)
  let lane=ends.findIndex(e=>e<=start); if(lane<0)lane=ends.length;ends[lane]=end
  return {event,start,end,lane}
 })
}
