// Only restore data matching the expected shape; malformed browser data must not crash rendering.
function matches(value: unknown, example: unknown): boolean {
  if (Array.isArray(example)) return Array.isArray(value)
  if (example && typeof example === 'object') return !!value && typeof value === 'object' && Object.entries(example).every(([key, item]) => matches((value as Record<string, unknown>)[key], item))
  return typeof value === typeof example
}
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`dos-tres.${key}.v1`) || 'null')
    if (!matches(value, fallback)) return fallback
    if (key === 'saved' && !(value as unknown[]).every(v => typeof v === 'string')) return fallback
    if (key === 'events' && !(value as unknown[]).every(v => {
      if (!matches(v, { id: 0, title: '', date: '', type: '' })) return false
      const e = v as Record<string, unknown>
      return ['startTime','endTime','location','notifiedAt','itemId','centerId'].every(k=>e[k]===undefined||typeof e[k]==='string') && (e.reminderMinutes===undefined || (typeof e.reminderMinutes==='number' && Number.isFinite(e.reminderMinutes) && e.reminderMinutes>=0))
    })) return fallback
    if (key === 'applications' && !(value as unknown[]).every(v => matches(v, { id: '', title: '', status: '', date: '', note: '' }))) return fallback
    if (key === 'activity') {
      const activity = value as { interests: unknown[]; experiences: unknown[] }
      if (!activity.interests.every(v => typeof v === 'string') || !activity.experiences.every(v => matches(v, { id: '', title: '', category: '', status: '' }))) return fallback
    }
    return value as T
  } catch { return fallback }
}
