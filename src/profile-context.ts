import type { Answers } from './checkin-api'

// Translate saved UI choices to backend question codes without inferring new answers.
export function profileInterests(interests: string[]): string[] {
  const names: Record<string, string> = { '취업·진로': '일자리·취업', '주거': '집·주거', '생활·금융': '생활비·금융', '교육·자격증': '교육·자격증', '창업': '창업', '건강·마음': '마음건강·상담', '문화·여가': '문화·여가', '지역 활동': '사람 만나기·모임' }
  return [...new Set(interests.map(i => names[i]).filter(Boolean))].slice(0, 3)
}

// Prefer the most recently saved source. Legacy data without metadata keeps survey precedence.
export function recommendationAnswers(answers: Answers, defaultInterests: string[], preferProfile = false): Answers {
  return { ...answers, ...(preferProfile || answers.interests === undefined && defaultInterests.length ? { interests: [...defaultInterests] } : {}) }
}

// A skipped/refused current answer must not be resurrected from a historical result.
export function currentRecommendationAnswers(answers: Answers, defaultInterests: string[], preferProfile: boolean, decisions: Record<string, string>): Answers {
  const current = Object.fromEntries(Object.entries(answers).filter(([id]) => !['skipped', 'declined'].includes(decisions[id])))
  const interestsWithheld = ['skipped', 'declined'].includes(decisions.interests)
  return recommendationAnswers(interestsWithheld ? { ...current, interests: [] } : current, defaultInterests, preferProfile && !interestsWithheld)
}
