import assert from 'node:assert/strict'
import {build} from 'esbuild'
const result=await build({entryPoints:['src/schedule.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
const application={itemId:'program:test',title:'취업 상담',at:'2026-11-22T23:30:00Z',simulation:true}
const record=api.applicationCalendarEvent(application,'chat-1',123)
assert.equal(record.date,'2026-11-23')
assert.equal(record.chatId,'chat-1')
assert.equal(record.itemId,'program:test')
assert.equal(record.applicationAt,application.at)
assert.equal(record.simulation,true)
assert.equal(api.scheduleKindLabel(record),'신청 기록')
assert.equal(api.validateEvent(record),'')
assert.equal(record.startTime,undefined)
const activity={...record,id:124,date:'2026-11-30',kind:'activity',type:'참여 일정'}
const inquiry={...record,id:125,date:'2026-11-24',kind:'inquiry',type:'문의 일정'}
assert.equal(api.scheduleKindLabel(activity),'참여 일정')
assert.equal(api.scheduleKindLabel(inquiry),'문의 일정')
assert.notEqual(record.date,activity.date)
console.log('PASS: KST application date, preserved source/chat linkage, no invented attendance time and distinct activity/inquiry types')
