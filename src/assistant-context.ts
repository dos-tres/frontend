import type {PersonalInformation} from './ProfileSettings'
import type {ActivityInformationValue} from './ActivityInformation'
import type {Answers} from './checkin-api'
import {profilePolicyCriteria} from './policy-api'
import {currentRecommendationAnswers,profileInterests} from './profile-context'
import regions from './data/regions.json'
export type AssistantContext = ReturnType<typeof buildAssistantContext>
export function buildAssistantContext(personal:PersonalInformation,activity:ActivityInformationValue,answers:Answers={},decisions:Record<string,string>={},preferProfile=false,today=new Date()) {
 const region=regions.find(r=>r.code===personal.regionCode)?.label || ''
 const criteria=profilePolicyCriteria(undefined,{birthDate:personal.birthDate,regionLabel:region,regionCode:personal.regionCode,employment:activity.employment,school:activity.school},today)
 const current=currentRecommendationAnswers(answers,profileInterests(activity.interests||[]),preferProfile,decisions)
 const ids=['economy','participation','outing','conversation','support','satisfaction','face_to_face','change_wishes','interests']
 const checkin:Answers=Object.fromEntries(Object.entries(current).filter(([id,value])=>ids.includes(id)&&!['skip','later','unknown'].includes(String(value))).map(([id,value])=>[id,Array.isArray(value)?[...value]:value]))
 const district=criteria.region.slice(0,5)
 const profile=criteria.age&&/^\d{5}$/.test(district)?{age:Number(criteria.age),sigungu_cd:district,job:criteria.job||null,school:criteria.school==='학생이 아니에요'?null:criteria.school||null}:null
 return {profile,checkin,local:{birthDate:personal.birthDate,age:criteria.age,region,employment:activity.employment,school:activity.school,participation:activity.participation||'',groupSize:activity.groupSize||''}}
}
/** Exact existing /api/chat contract. No name, contact, raw birth date or old check-in history. */
export function buildAssistantChatPayload(messages:{role:'user'|'assistant';content:string}[],context:AssistantContext) {
 return {messages:messages.map(m=>({...m})),profile:context.profile?{...context.profile}:null,checkin:Object.fromEntries(Object.entries(context.checkin).map(([k,v])=>[k,Array.isArray(v)?[...v]:v]))}
}
const labels:Record<string,string>={economy:'생활 부담',participation:'정기 활동',outing:'외부 활동',conversation:'대화와 교류',support:'도움받을 관계',satisfaction:'생활 만족',face_to_face:'대면 활동 부담',change_wishes:'바꾸고 싶은 부분',interests:'관심 분야'}
export function assistantContextLines(context:AssistantContext) {
 const c=context.local
 const lines=[c.age&&`만 ${c.age}세`,c.region,c.employment,c.school].filter(Boolean) as string[]
 const level:Record<string,Record<string,string>>={economy:{high:'많이 부담돼요',mid:'조금 부담돼요',low:'괜찮아요'},participation:{high:'없어요',mid:'가끔 있어요',low:'있어요'},outing:{high:'거의 안 나가요',mid:'가끔 나가요',low:'자주 나가요'},conversation:{high:'부족해요',mid:'보통이에요',low:'충분해요'},support:{high:'없어요',mid:'잘 모르겠어요',low:'있어요'},satisfaction:{good:'만족해요',normal:'보통이에요',bad:'아쉬워요'},face_to_face:{high:'많이 부담돼요',mid:'조금 부담돼요',low:'괜찮아요'}}
 const wishes:Record<string,string>={E:'돈·일 걱정',P:'정기 활동',O:'외부 활동',C:'대화·교류',U:'도움받을 관계',none:'없어요'}
 for(const [id,value] of Object.entries(context.checkin)){const text=Array.isArray(value)?value.map(v=>id==='change_wishes'?wishes[v]||v:v).join(' · '):level[id]?.[value]||value;if(text)lines.push(`${labels[id]}: ${text}`)}
 if(c.participation)lines.push(`선호 활동 방식: ${c.participation}`)
 if(c.groupSize)lines.push(`선호 모임 규모: ${c.groupSize}`)
 return lines
}
