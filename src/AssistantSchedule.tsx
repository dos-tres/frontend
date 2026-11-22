import { useState } from 'react'
import { localDate, eventLabel, parseSchedule, validateEvent, type CalendarEvent } from './schedule'
import { ScheduleEditor } from './SchedulePages'
import type { PublicCenter } from './center-api'
import type { Program } from './data'
export type ScheduleBridge = { events: CalendarEvent[]; save:(e:CalendarEvent)=>void; remove:(id:number)=>void; open:(date?:string)=>void; recordApplication?:(program:Program)=>void }
export function useAssistantSchedule(bridge:ScheduleBridge|undefined, center:PublicCenter|undefined, program:Program|undefined, say:(user:string,assistant:string)=>void,chatId?:string) {
 const [pending,setPending]=useState<Partial<CalendarEvent>>(),[editing,setEditing]=useState<CalendarEvent>(),[deleting,setDeleting]=useState<CalendarEvent>()
 const handle=(text:string):boolean=>{
  if(!bridge)return false
  if((pending||deleting)&&/신청|자격|추천|프로그램|정책|서류|지원|왜|뭐|어떤|알려|설명/.test(text)&&!/일정.*(?:등록|변경|삭제)/.test(text)){setPending(undefined);setDeleting(undefined);return false}
  if(text==='취소'){setPending(undefined);setEditing(undefined);setDeleting(undefined);say(text,'일정 변경을 취소했어요.');return true}
  if(deleting){if(text==='삭제 확인'){bridge.remove(deleting.id);say(text,'일정을 삭제했어요.');setDeleting(undefined)}else say(text,'삭제할 일정이 맞으면 ‘삭제 확인’, 아니면 ‘취소’를 눌러 주세요.');return true}
  if(/^(일정\s*(등록|추가)(해줘|해\s*줘|할래|하기)?|일정)$/.test(text.trim())){setPending(program?{title:program.title,type:'참여 일정',kind:'activity',itemId:program.id,location:program.place}:{});say(text,program?`‘${program.title}’ 참여 일정을 등록할게요. 참여 날짜가 언제인가요?`:'어떤 일정을 등록하고 싶으세요? 예: 자소서 상담, 준비물 문의');return true}
  if(pending){
   if(text==='저장 확인'){
    const next={id:Date.now(),type:'개인 일정',source:'assistant' as const,...pending} as CalendarEvent
    const error=validateEvent(next)
    if(error){say(text,error);return true}
    bridge.save({...next,chatId:next.chatId||chatId});setPending(undefined);say(text,`저장했어요. ${eventLabel(next)}\n내 일정에서도 수정하거나 삭제할 수 있어요.`);return true
   }
   const parsed=parseSchedule(text)
   const next={...pending,...parsed,title:pending.title||parsed.title}
   if(!pending.title&&!parsed.title)next.title=text

   setPending(next);say(text,!next.title?'어떤 일정인가요?':!next.date?'언제인가요? 예: 내일 또는 2026-12-01':!next.startTime&&!/시간\s*미정/.test(text)?'몇 시인가요? 오전·오후도 알려주세요. 아직 정해지지 않았다면 ‘시간 미정’이라고 해주세요.':`${eventLabel(next as CalendarEvent)}\n이대로 등록할까요? ‘저장 확인’을 누르거나 시간·알림 설정을 열어 주세요.`);return true
  }
  if(program && /신청.*(완료|했어|했어요)/.test(text)){bridge.recordApplication?.(program);setPending({title:program.title,type:'참여 일정',source:'application',itemId:program.id});say(text,'직접 신청했다고 알려주신 내용으로 신청 이력을 남겼어요. 참석 일정은 언제인가요? 신청 마감일을 참석 날짜로 사용하지 않아요.');return true}
  if(/일정.*(보여|알려|확인)|오늘.*(뭐|할 일)/.test(text)){say(text,bridge.events.length?bridge.events.map(eventLabel).join('\n'):'아직 등록한 일정이 없어요. 날짜와 할 일을 말해 주세요.');return true}
  if(/삭제|수정|변경/.test(text)&&/일정/.test(text)){
   const matches=bridge.events.filter(e=>text.includes(e.title));if(matches.length!==1){say(text,'어떤 일정인지 이름을 정확히 알려주세요. 내 일정에서 직접 선택해도 돼요.');bridge.open();return true}
   if(/삭제/.test(text)){setDeleting(matches[0]);say(text,`${eventLabel(matches[0])}\n이 일정을 삭제할까요?`)}else {const patch=parseSchedule(text); if(patch.date||patch.startTime||patch.reminderMinutes!==undefined){setPending({...matches[0],...patch,title:matches[0].title,notifiedAt:undefined});say(text,`${eventLabel({...matches[0],...patch,title:matches[0].title})}\n변경 내용을 확인한 뒤 ‘저장 확인’을 눌러 주세요.`)}else {setEditing(matches[0]);say(text,'수정할 내용을 확인하고 저장해 주세요.');}}return true
  }
  if(/일정|예약|방문|상담.*(내일|요일|시)|(?:내일|모레|요일).*(?:시|등록|추가)/.test(text)){
   const parsed=parseSchedule(text), next:Partial<CalendarEvent>={...parsed,title:parsed.title|| (center?`${center.name} 방문`:program?program.title:undefined),location:/문의/.test(text)?'전화 문의':center?.address||program?.place||'',centerId:center?.id,itemId:program?.id,kind:/문의/.test(text)?'inquiry':program?'activity':'personal',type:/문의/.test(text)?'문의 일정':program?'참여 일정':'개인 일정'}
   if(next.title==='문의')next.title=program?`${program.title} 준비물 문의`:'프로그램 준비물 문의'
   if(next.title?.match(/^(일정|센터|방문할래|등록|추가)$/))next.title=center?`${center.name} 방문`:program?.title
   setPending(next);say(text,!next.title?'어떤 일정을 등록할까요?':!next.date?'언제인가요? 날짜를 알려주세요.':!next.startTime?'몇 시인가요? 오전·오후와 시간을 알려주세요. 시간 미정으로도 등록할 수 있어요.':`${eventLabel(next as CalendarEvent)}\n이대로 등록할까요?`);return true
  }
  return false
 }
 const editor=editing&&bridge?<ScheduleEditor event={editing} date={editing.date} onClose={()=>setEditing(undefined)} onSave={e=>{bridge.save({...e,chatId:e.chatId||chatId});setEditing(undefined);setPending(undefined);say('일정 저장',`${eventLabel(e)}\n저장했어요.`)}}/>:null
 const controls=null
 const preview=pending?.title && pending.date && !validateEvent(pending as CalendarEvent) && bridge ? <ScheduleConfirmation event={pending as CalendarEvent} onConfirm={()=>handle('저장 확인')} onEdit={()=>setEditing({id:Date.now(),type:'개인 일정',source:'assistant',...pending} as CalendarEvent)} onCancel={()=>handle('취소')} /> : null
 return {handle,controls,editor,preview,active:!!pending||!!editing||!!deleting,begin:(date:string)=>setPending({date}),reset:()=>{setPending(undefined);setEditing(undefined);setDeleting(undefined)}}
}

export function ScheduleConfirmation({event,onConfirm,onEdit,onCancel}:{event:CalendarEvent;onConfirm:()=>void;onEdit:()=>void;onCancel:()=>void}) {
 const validDate=new Date(`${event.date}T12:00:00`),year=validDate.getFullYear(),month=validDate.getMonth(),offset=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate()
 return <section className="schedule-confirmation" aria-label="일정 등록 확인"><h3>이 일정으로 등록할까요?</h3><div className="schedule-confirmation-layout"><div><strong>{year}년 {month+1}월</strong><div className="schedule-preview-calendar" aria-label={`${event.date} 선택된 달력`}>{['일','월','화','수','목','금','토'].map(d=><small key={d}>{d}</small>)}{Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{const day=i-offset+1;return <span key={i} className={day===validDate.getDate()?'selected':''} aria-current={day===validDate.getDate()?'date':undefined}>{day>0&&day<=days?day:''}</span>})}</div></div><div className="schedule-confirmation-details"><h4>{event.title}</h4><p>{localDate(validDate)}</p><strong>{event.startTime||'시간 미정'}{event.endTime&&`–${event.endTime}`}</strong>{event.location&&<p>{event.location}</p>}{event.reminderMinutes!==undefined&&<p>{event.reminderMinutes}분 전 알림</p>}<small>아직 저장되지 않았어요.</small></div></div><div className="schedule-actions"><button className="btn btn-primary" onClick={onConfirm}>확인하고 등록</button><button className="btn btn-secondary" onClick={onEdit}>내용 수정</button><button className="text-button" onClick={onCancel}>취소</button></div></section>
}
