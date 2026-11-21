import { useState } from 'react'
import { eventLabel, parseSchedule, validateEvent, type CalendarEvent } from './schedule'
import { ScheduleEditor } from './SchedulePages'
import type { PublicCenter } from './center-api'
import type { Program } from './data'
export type ScheduleBridge = { events: CalendarEvent[]; save:(e:CalendarEvent)=>void; remove:(id:number)=>void; open:()=>void; recordApplication?:(program:Program)=>void }
export function useAssistantSchedule(bridge:ScheduleBridge|undefined, center:PublicCenter|undefined, program:Program|undefined, say:(user:string,assistant:string)=>void) {
 const [pending,setPending]=useState<Partial<CalendarEvent>>(),[editing,setEditing]=useState<CalendarEvent>(),[deleting,setDeleting]=useState<CalendarEvent>()
 const handle=(text:string):boolean=>{
  if(!bridge)return false
  if(text==='취소'){setPending(undefined);setEditing(undefined);setDeleting(undefined);say(text,'일정 변경을 취소했어요.');return true}
  if(deleting){if(text==='삭제 확인'){bridge.remove(deleting.id);say(text,'일정을 삭제했어요.');setDeleting(undefined)}else say(text,'삭제할 일정이 맞으면 ‘삭제 확인’, 아니면 ‘취소’를 눌러 주세요.');return true}
  if(pending){
   if(text==='저장 확인'){
    const next={id:Date.now(),type:'개인 일정',source:'assistant' as const,...pending} as CalendarEvent
    const error=validateEvent(next)
    if(error){say(text,error);return true}
    bridge.save(next);setPending(undefined);say(text,`저장했어요. ${eventLabel(next)}\n내 일정에서도 수정하거나 삭제할 수 있어요.`);return true
   }
   const parsed=parseSchedule(text)
   const next={...pending,...parsed,title:pending.title||parsed.title}
   if(!pending.title&&!parsed.title)next.title=text
   if(pending.date&&!pending.startTime&&!parsed.startTime&&!/시간\s*미정/.test(text)){say(text,'오전·오후와 시간을 알려주세요. 예: 오후 3시부터 4시. 정해지지 않았다면 ‘시간 미정’이라고 해주세요.');return true}
   setPending(next);say(text,!next.title?'어떤 일정인가요?':!next.date?'언제인가요? 예: 내일 또는 2026-12-01':!next.startTime&&!/시간\s*미정/.test(text)?'몇 시인가요? 오전·오후도 알려주세요. 아직 정해지지 않았다면 ‘시간 미정’이라고 해주세요.':`${eventLabel(next as CalendarEvent)}\n이대로 등록할까요? ‘저장 확인’을 누르거나 시간·알림 설정을 열어 주세요.`);return true
  }
  if(program && /신청.*(완료|했어|했어요)/.test(text)){bridge.recordApplication?.(program);setPending({title:program.title,type:'참여 일정',source:'application',itemId:program.id});say(text,'직접 신청했다고 알려주신 내용으로 신청 이력을 남겼어요. 참석 일정은 언제인가요? 신청 마감일을 참석 날짜로 사용하지 않아요.');return true}
  if(/일정.*(보여|알려|확인)|오늘.*(뭐|할 일)/.test(text)){say(text,bridge.events.length?bridge.events.map(eventLabel).join('\n'):'아직 등록한 일정이 없어요. 날짜와 할 일을 말해 주세요.');return true}
  if(/삭제|수정|변경/.test(text)&&/일정/.test(text)){
   const matches=bridge.events.filter(e=>text.includes(e.title));if(matches.length!==1){say(text,'어떤 일정인지 이름을 정확히 알려주세요. 내 일정에서 직접 선택해도 돼요.');bridge.open();return true}
   if(/삭제/.test(text)){setDeleting(matches[0]);say(text,`${eventLabel(matches[0])}\n이 일정을 삭제할까요?`)}else {const patch=parseSchedule(text); if(patch.date||patch.startTime||patch.reminderMinutes!==undefined){setPending({...matches[0],...patch,title:matches[0].title,notifiedAt:undefined});say(text,`${eventLabel({...matches[0],...patch,title:matches[0].title})}\n변경 내용을 확인한 뒤 ‘저장 확인’을 눌러 주세요.`)}else {setEditing(matches[0]);say(text,'수정할 내용을 확인하고 저장해 주세요.');}}return true
  }
  if(/일정|예약|방문|상담.*(내일|요일|시)|(?:내일|모레|요일).*(?:시|등록|추가)/.test(text)){
   const parsed=parseSchedule(text), next:Partial<CalendarEvent>={...parsed,title:parsed.title|| (center?`${center.name} 방문`:program?program.title:undefined),location:center?.address||'',centerId:center?.id,itemId:program?.id}
   if(next.title?.match(/^(일정|센터|방문할래|등록|추가)$/))next.title=center?`${center.name} 방문`:program?.title
   setPending(next);say(text,!next.title?'어떤 일정을 등록할까요?':!next.date?'언제인가요? 날짜를 알려주세요.':!next.startTime?'몇 시인가요? 오전·오후와 시간을 알려주세요. 시간 미정으로도 등록할 수 있어요.':`${eventLabel(next as CalendarEvent)}\n이대로 등록할까요?`);return true
  }
  return false
 }
 const controls=bridge?<div className="schedule-review"><div className="assistant-choices"><button disabled={!!pending||!!deleting} onClick={()=>handle('내 일정 보여줘')}>내 일정 확인</button><button disabled={!!pending||!!deleting} onClick={()=>handle(center?'센터 방문 일정 등록':'일정 등록')}>{center?'센터 방문 일정':'일정 등록'}</button><button onClick={bridge.open}>내 일정으로 이동</button>{program&&!pending&&!deleting&&<button onClick={()=>handle('신청했어')}>직접 신청한 내역 기록</button>}{pending&&<><button onClick={()=>handle('저장 확인')}>저장 확인</button><button onClick={()=>setEditing({id:Date.now(),title:'',date:'',type:'개인 일정',source:'assistant',...pending} as CalendarEvent)}>시간·장소·알림 설정</button><button onClick={()=>handle('취소')}>취소</button></>}{deleting&&<><button onClick={()=>handle('삭제 확인')}>삭제 확인</button><button onClick={()=>handle('취소')}>취소</button></>}</div>{editing&&<ScheduleEditor event={editing} date={editing.date} onClose={()=>setEditing(undefined)} onSave={e=>{bridge.save(e);setEditing(undefined);setPending(undefined);say('일정 저장',`${eventLabel(e)}\n저장했어요.`)}}/>}</div>:null
 return {handle,controls,reset:()=>{setPending(undefined);setEditing(undefined);setDeleting(undefined)}}
}
