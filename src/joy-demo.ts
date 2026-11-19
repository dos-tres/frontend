import type { Program } from './data'

export type JoyProfile = { region: string; age: string; employment: string }
export const initialJoyProfile: JoyProfile = { region: '서울 강서구 염창동', age: '', employment: '' }
export type TaskKind = '신청' | '문의' | '예약'
export type TaskStatus = '준비 중' | '사용자 확인 필요' | '진행 중' | '완료' | '실패'
export type JoyTask = { kind: TaskKind; status: TaskStatus; profile: JoyProfile; note: string; result?: string }
export const demoNotice = '시연용 예시 · 실제 AI 응답이나 기관 접수가 아니에요.'

// Replace this adapter with the agent/profile/institution API when contracts exist.
// Every result stays explicitly simulated; no external submission takes place.
export async function demoReply(text: string, fail: boolean): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 550))
  if (fail) throw new Error('시연 응답 연결에 실패했어요. 같은 메시지를 다시 보낼 수 있어요.')
  if (/신청|예약|문의/.test(text)) return '대상을 선택하고 조건을 확인한 뒤, 사용할 정보와 요청 내용을 함께 검토해요. 아래에서 작업을 선택해 주세요.'
  return '필요한 지원을 함께 살펴볼게요. 예시 항목을 선택하면 부족한 정보를 입력하고 조건 확인부터 신청·문의 준비까지 경험할 수 있어요.'
}
export async function demoExecute(task: JoyTask, fail: boolean) {
  await new Promise(resolve => setTimeout(resolve, 900))
  if (fail) throw new Error('시연 기관에서 응답을 받지 못했어요. 실제 전송은 없으며 다시 시도할 수 있어요.')
  return `시연 기관의 ${task.kind} 처리 결과를 확인했어요. 예시 확인번호 DEMO-23. 실제 접수·예약 효력은 없어요.`
}
export function conditions(program: Program, profile: JoyProfile) {
  return [
    { name: '거주 지역', value: profile.region || '미입력', rule: '서울 거주 (시연 조건)', status: !profile.region ? '추가 확인 필요' : profile.region.startsWith('서울') ? '충족' : '미충족' },
    { name: '연령', value: profile.age ? `만 ${profile.age}세` : '미입력', rule: '만 19~34세 (시연 조건)', status: !profile.age ? '추가 확인 필요' : +profile.age >= 19 && +profile.age <= 34 ? '충족' : '미충족' },
    { name: '활동 상태', value: profile.employment || '미입력', rule: program.type === '정책' ? '미취업 (시연 조건)' : '활동 상태 제한 없음 (시연 조건)', status: !profile.employment ? '추가 확인 필요' : program.type !== '정책' || profile.employment === '미취업' ? '충족' : '미충족' },
    { name: '모집·소득 등 공식 조건', value: '공식 정보 미연결', rule: program.target, status: '추가 확인 필요' },
  ]
}
