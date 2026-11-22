import regions from './data/regions.json'
import type { PersonalInformation } from './ProfileSettings'
import type { ActivityInformationValue } from './ActivityInformation'

export const profileChatSteps = ['name', 'birthDate', 'regionCode', 'employment', 'school', 'interests'] as const
export type ProfileChatField = typeof profileChatSteps[number]
export const chatEmploymentOptions = ['구직 중', '재직 중', '재학 중', '아르바이트·단기', '프리랜서', '창업·자영업', '쉬고 있어요']
export const chatSchoolOptions = ['고등학생', '대학생', '대학원생', '학생이 아니에요']
export const chatInterestOptions = ['취업·진로', '주거', '생활·금융', '교육·자격증', '창업', '건강·마음', '문화·여가', '지역 활동']
export function profileChatCurrent(field: ProfileChatField, personal: PersonalInformation, activity: ActivityInformationValue) {
  if (field === 'name') return personal.name
  if (field === 'birthDate') return personal.birthDate
  if (field === 'regionCode') return regions.find(r => r.code === personal.regionCode)?.label || ''
  if (field === 'interests') return activity.interests.join(', ')
  return activity[field]
}
export function profileChatQuestion(field: ProfileChatField, personal: PersonalInformation, activity: ActivityInformationValue) {
  const questions = { name: '뭐라고 부를까요? 편하게 부를 이름이나 별명을 알려주세요.', birthDate: '생년월일을 알려주세요. 예: 2000-01-15', regionCode: '어느 지역에 살고 있나요? 동까지 알려주세요. 예: 서울 강동구 천호동. 상세 주소는 필요 없어요.', employment: '지금 어떤 상태인가요? 아래에서 골라 주세요.', school: '현재 재학 중인가요? 해당하는 항목을 골라 주세요.', interests: '어떤 지원에 관심 있나요? 최대 3개를 고르고 ‘선택 완료’를 눌러 주세요.' }
  const current = profileChatCurrent(field, personal, activity)
  return `${current ? `저장된 정보는 ‘${current}’예요. 그대로 쓰거나 바꿀 수 있어요.\n\n` : ''}${questions[field]}`
}
export function parseProfileChat(field: ProfileChatField, text: string, today = new Date()): { value: string | string[]; label: string } | { error: string; suggestions?: string[] } {
  const value = text.trim()
  if (field === 'name') {
    if (!value || value.length > 30) return {error:'이름이나 별명을 30자 이내로 알려주세요.'}
    return {value,label:value}
  }
  if (field === 'birthDate') {
    const match = /^(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})일?$/.exec(value)
    if (!match) return { error: '생년월일을 2000-01-15처럼 연·월·일로 알려주세요.' }
    const [, y, m, d] = match; const date = new Date(Number(y), Number(m)-1, Number(d))
    if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m)-1 || date.getDate() !== Number(d) || date > today || Number(y) < 1900) return { error: '실제 있는 날짜인지 확인해 주세요. 미래 날짜는 입력할 수 없어요.' }
    const normalized = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    return { value: normalized, label: normalized }
  }
  if (field === 'regionCode') {
    const normalize=(v:string)=>v.replace(/\s+/g,'').replace(/^서울(?:특별시|시)?/,'서울특별시')
    const query=normalize(value)
    const matches=regions.filter(r=>normalize(r.label)===query||normalize(r.label).endsWith(query))
    if(matches.length===1)return {value:matches[0].code,label:matches[0].label}
    const leaf=regions.map(r=>r.label.split(' ').slice(-1)[0]!).filter(part=>query.endsWith(part)).sort((a,b)=>b.length-a.length)[0]
    const candidates=(matches.length?matches:leaf?regions.filter(r=>r.label.split(' ').slice(-1)[0]===leaf&&(!query.startsWith('서울특별시')||r.label.startsWith('서울특별시'))):[]).slice(0,5)
    return {error:candidates.length?'입력한 지역을 확인해 주세요. 아래 지역이 맞나요?':'지역을 찾지 못했어요. 예: 서울 강동구 천호동',suggestions:candidates.map(r=>r.label)}
  }
  if (field === 'interests') {
    const values = [...new Set(value.split(/[,，]/).map(v => v.trim()).filter(Boolean))]
    if (!values.length || values.length > 3 || values.some(v => !chatInterestOptions.includes(v))) return { error: '아래 관심 분야에서 최대 3개를 선택해 주세요.' }
    return { value: values, label: values.join(', ') }
  }
  if (!(field === 'employment' ? chatEmploymentOptions : chatSchoolOptions).includes(value)) return { error: '아래 선택지 중 해당하는 항목을 골라 주세요.' }
  return { value: value === '학생이 아니에요' ? '' : value, label: value }
}
