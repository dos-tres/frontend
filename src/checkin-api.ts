export type Answers = Record<string, string | string[]>
export type Question = { id: string; text: string; multiple?: boolean; max?: number; options: { code: string; label: string }[] }
export type Questions = { notice: string; common_options: Question['options']; domain_questions: Question[]; extra_questions: Question[] }
export type Summary = { notes: string[]; disclaimer: string; example?: boolean }
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
async function request<T>(path: string, signal: AbortSignal, answers?: Answers): Promise<T> {
  const response = await fetch(`${base}/api/checkin/${path}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(path === 'questions' ? 2000 : 3000)]),
    ...(answers ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) } : {}),
  })
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json() as Promise<T>
}
export const loadQuestions = (signal: AbortSignal) => request<Questions>('questions', signal)
export const summarizeAnswers = (answers: Answers, signal: AbortSignal) => request<Summary>('summary', signal, answers)
