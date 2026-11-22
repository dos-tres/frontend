import assert from 'node:assert/strict'
import {build} from 'esbuild'
const compiled=await build({entryPoints:['src/assistant-context.ts'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.VITE_API_BASE_URL':'""'}})
const m=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const personal={name:'외부 전송 제외',birthDate:'2001-11-22',phone:'전송하지 않는 값',email:'do-not-send@example.test',regionCode:'11620'}
const activity={employment:'재직 중',school:'',interests:['주거'],participation:'온라인',groupSize:'작은 모임',experiences:[]}
const at=new Date(2026,10,21)
const context=m.buildAssistantContext(personal,activity,{economy:'high',outing:'low',conversation:'mid',support:'skip',interests:['문화·여가'],satisfaction:'bad',change_wishes:['E'],private_note:'보내지 않기'},{outing:'declined'},true,at)
assert.equal(context.profile.age,24);assert.equal(context.profile.sigungu_cd,'11620');assert.equal(context.profile.job,'회사원');assert.deepEqual(context.checkin.interests,['집·주거']);assert.equal(context.checkin.economy,'high');assert.ok(!('outing'in context.checkin));assert.ok(!('support'in context.checkin));assert.ok(!('private_note'in context.checkin))
const payload=m.buildAssistantChatPayload([{role:'user',content:'내 조건 확인해 줘'}],context);const text=JSON.stringify(payload)
for(const forbidden of ['외부 전송 제외','전송하지 않는 값','do-not-send@example.test','2001-11-22','private_note'])assert.ok(!text.includes(forbidden))
assert.ok(m.assistantContextLines(context).includes('생활 부담: 많이 부담돼요'))
assert.ok(m.assistantContextLines(context).includes('선호 활동 방식: 온라인'))
assert.equal(m.buildAssistantContext({...personal,birthDate:'2001-11-21'},activity,{}, {},false,at).profile.age,25)
assert.equal(m.buildAssistantContext({...personal,regionCode:''},activity,{}, {},false,at).profile,null)
const skipped=m.buildAssistantContext(personal,activity,{interests:['문화·여가']},{interests:'declined'},true,at);assert.deepEqual(skipped.checkin.interests,[])
const changed=m.buildAssistantContext(personal,activity,{economy:'low'},{},false,at);assert.equal(changed.checkin.economy,'low')
console.log('PASS: birthday age boundary, local profile mapping, current survey/profile precedence, declined/skip exclusion, preference context, API payload contact exclusion and missing profile')

// A saved dong code must still produce the five-digit district expected by BE.
const dong=m.buildAssistantContext({...personal,regionCode:'11740109'},activity,{}, {},false,at)
assert.equal(dong.profile.sigungu_cd,'11740')
assert.equal(dong.profile.age,24)
console.log('PASS: saved dong -> district profile, prevents repeated age/location request')
