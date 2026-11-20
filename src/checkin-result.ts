import type { Answers, Summary } from './checkin-api'

export type StateType = 'economy' | 'routine' | 'connection' | 'support' | 'wellbeing' | 'balance' | 'explore'
export type StateResult = { title: string; description: string; types: StateType[]; areas: { name: string; status: string }[] }
export type CheckinRecord = { id: string; savedAt: string; answers: Answers; ratings?: Record<string, number>; completed: boolean; summary?: Summary; result: StateResult }
export const HISTORY_KEY = 'dos-tres.checkin-history.v1'
const areas = [
  { id: 'economy', name: '생활 부담', type: 'economy', high: '생활비·취업 준비의 부담을 덜고 싶어요', mid: '생활 부담을 조금 느끼고 있어요', low: '생활 부담이 크지 않은 편이에요' },
  { id: 'participation', name: '정기 활동', type: 'routine', high: '현재 정기적으로 참여하는 활동은 없어요', mid: '가끔 참여하는 활동이 있어요', low: '정기적으로 참여하는 활동이 있어요' },
  { id: 'outing', name: '외부 활동', type: 'routine', high: '필요한 일 외에는 외부 활동이 적은 편이에요', mid: '가끔 외부 활동을 하고 있어요', low: '외부 활동을 자주 하고 있어요' },
  { id: 'conversation', name: '대화와 교류', type: 'connection', high: '편하게 이야기할 기회가 더 필요해요', mid: '대화와 교류가 보통 수준이라고 느껴요', low: '대화와 교류가 충분한 편이에요' },
  { id: 'support', name: '도움받을 관계', type: 'support', high: '필요할 때 도움을 청할 연결이 필요해요', mid: '도움을 청할 관계를 살펴보는 중이에요', low: '도움을 부탁할 사람이 있어요' },
] as const
export const typeInfo: Record<StateType, { title: string; description: string }> = {
  economy: { title: '생활 부담을 덜고 싶은 시기', description: '일자리·교육과 생활 지원부터 차근차근 살펴보세요.' },
  routine: { title: '일상에 활동을 더하고 싶은 시기', description: '부담이 적은 활동으로 일상의 리듬을 만들어 보세요.' },
  connection: { title: '편안한 교류가 필요한 시기', description: '관심사를 나누거나 함께할 수 있는 활동을 살펴보세요.' },
  support: { title: '도움받을 연결이 필요한 시기', description: '혼자 알아보기 어렵다면 공공 상담 창구부터 이용해 보세요.' },
  wellbeing: { title: '마음과 생활을 돌보고 싶은 시기', description: '생활 속 부담을 정리하고 상담·지원 정보를 살펴보세요.' },
  balance: { title: '지금의 일상을 이어가는 시기', description: '현재의 일상을 유지하면서 관심 있는 배움과 활동을 찾아보세요.' },
  explore: { title: '나에게 필요한 지원을 찾아보는 시기', description: '아직 확인하지 않은 영역이 있어요. 관심 있는 지원부터 살펴보세요.' },
}
export function buildStateResult(answers: Answers): StateResult {
  const types: StateType[] = []
  for (const level of ['high', 'mid']) for (const area of areas) if (answers[area.id] === level && !types.includes(area.type)) types.push(area.type)
  if (answers.satisfaction === 'bad' || answers.face_to_face === 'high') types.push('wellbeing')
  const wishes: Record<string, StateType> = { E: 'economy', P: 'routine', O: 'routine', C: 'connection', U: 'support' }
  if (Array.isArray(answers.change_wishes)) for (const wish of answers.change_wishes) if (wishes[wish] && !types.includes(wishes[wish])) types.push(wishes[wish])
  const interests: Record<string, StateType> = { '일자리·취업': 'economy', '생활비·금융': 'economy', '집·주거': 'economy', '교육·자격증': 'routine', '문화·여가': 'routine', '사람 만나기·모임': 'connection', '마음건강·상담': 'wellbeing' }
  if (Array.isArray(answers.interests)) for (const interest of answers.interests) if (interests[interest] && !types.includes(interests[interest])) types.push(interests[interest])
  if (!types.length) types.push(areas.every(area => answers[area.id] === 'low') ? 'balance' : 'explore')
  return { ...typeInfo[types[0]], types, areas: areas.map(area => ({ name: area.name, status: answers[area.id] === 'high' ? area.high : answers[area.id] === 'mid' ? area.mid : answers[area.id] === 'low' ? area.low : '아직 확인하지 않은 영역이에요' })) }
}
export function readCheckinHistory(): CheckinRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((record): record is CheckinRecord => !!record && typeof record.id === 'string' && typeof record.savedAt === 'string' && Number.isFinite(Date.parse(record.savedAt)) && record.completed === true && record.answers && typeof record.answers === 'object' && !Array.isArray(record.answers) && Object.values(record.answers).every(answer => typeof answer === 'string' || Array.isArray(answer) && answer.every(code => typeof code === 'string')))
      .map(record => ({ ...record, result: record.result && typeof record.result.title === 'string' && typeof record.result.description === 'string' && Array.isArray(record.result.types) && record.result.types.length > 0 && record.result.types.every(type => Object.prototype.hasOwnProperty.call(typeInfo, type)) && Array.isArray(record.result.areas) && record.result.areas.every(area => area && typeof area.name === 'string' && typeof area.status === 'string') ? record.result : buildStateResult(record.answers), ratings: record.ratings && typeof record.ratings === 'object' ? Object.fromEntries(Object.entries(record.ratings).filter(([, rating]) => Number.isInteger(rating) && rating >= 1 && rating <= 5)) : {} }))
  } catch { return [] }
}
export const supportCatalog = [
  { id: 'work', title: '국민취업지원제도', category: '일자리·생활', description: '취업 지원과 구직 과정에 필요한 제도를 살펴보세요.', source: '고용노동부 · 고용24', url: 'https://www.work24.go.kr/cm/main.do', types: ['economy'] },
  { id: 'learn', title: '국민내일배움카드', category: '교육·훈련', description: '관심 있는 직업훈련과 배움의 기회를 찾아보세요.', source: '고용복지플러스센터', url: 'https://www.workplus.go.kr/intro/centerJob.do', types: ['economy', 'routine', 'balance', 'explore'] },
  { id: 'volunteer', title: '1365 자원봉사', category: '활동·교류', description: '관심 분야와 참여 가능한 방식에 맞는 봉사활동을 찾아보세요.', source: '한국중앙자원봉사센터', url: 'https://www.v1365.or.kr/participation/volunteer', types: ['routine', 'connection', 'balance'] },
  { id: 'welfare', title: '복지로 복지상담', category: '생활·지원 연결', description: '필요한 복지서비스와 이용 방법을 상담받을 수 있어요.', source: '복지로', url: 'https://www.bokjiro.go.kr/ssis-tbu/cms/pc/customer/counseling/01/index.html', types: ['economy', 'support'] },
  { id: 'mind', title: '정신건강복지센터 안내', category: '마음·상담', description: '공공 상담과 지역 정신건강 지원기관의 이용 방법을 확인해 보세요.', source: '보건복지부', url: 'https://www.mohw.go.kr/menu.es?mid=a10706040100', types: ['support', 'wellbeing'] },
]
export const supportsForResult = (result: StateResult) => supportCatalog.filter(item => item.types.some(type => result.types.includes(type as StateType)))
