import snapshot from './data/checkin-example.json'
import type { Answers, Questions, Summary } from './checkin-api'

// Backend question snapshot, used only when the API is unavailable.
export const exampleQuestions: Questions = snapshot
export function exampleSummary(answers: Answers): Summary {
  const topics: Record<string, string> = {
    economy: '생활비·취업 준비에 도움이 되는 지원 정보',
    participation: '부담 없이 시작할 수 있는 정기 활동',
    outing: '가까운 곳에서 참여할 수 있는 외부 활동',
    conversation: '편하게 이야기 나눌 수 있는 교류 프로그램',
    support: '필요할 때 도움을 요청할 수 있는 상담·지원 기관',
  }
  const notes = Object.entries(topics)
    .filter(([id]) => answers[id] === 'high' || answers[id] === 'mid')
    .map(([, topic]) => `${topic}를 살펴볼 수 있어요.`)
  const interests = answers.interests
  if (Array.isArray(interests) && interests.length) notes.push(`관심 분야: ${interests.join(', ')}`)
  if (answers.face_to_face === 'high') notes.push('온라인이나 소규모 활동부터 살펴볼 수 있어요.')
  return { notes, disclaimer: '선택한 답변을 바탕으로 살펴볼 도움을 정리했어요. 의학적 진단이나 위험 등급은 아니에요.', example: true }
}
