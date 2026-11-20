export type AnswerDecision = 'answered' | 'skipped' | 'declined'
export type SetupState = { step: number; finished: boolean; personal: string; preferences: string; checkin: string; interestSource: string; decisions: Record<string, AnswerDecision> }
export const initialSetup: SetupState = { step: 0, finished: false, personal: 'unanswered', preferences: 'unanswered', checkin: 'unanswered', interestSource: 'checkin', decisions: {} }
export function readSetup(): SetupState {
  try {
    const value = JSON.parse(localStorage.getItem('dos-tres.setup.v1') || 'null')
    if (!value || typeof value !== 'object') return initialSetup
    const status = (v: unknown) => ['answered', 'skipped', 'declined'].includes(String(v)) ? String(v) : 'unanswered'
    return { ...initialSetup, step: Number.isInteger(value.step) && value.step >= 0 && value.step <= 3 ? value.step : 0, finished: value.finished === true, personal: status(value.personal), preferences: status(value.preferences), checkin: status(value.checkin), interestSource: value.interestSource === 'profile' ? 'profile' : 'checkin', decisions: Object.fromEntries(Object.entries(value.decisions && typeof value.decisions === 'object' ? value.decisions : {}).filter(([,v]) => ['answered','skipped','declined'].includes(String(v)))) as SetupState['decisions'] }
  } catch { return initialSetup }
}
