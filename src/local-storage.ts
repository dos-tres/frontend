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
    if (key === 'events' && !(value as unknown[]).every(v => matches(v, { id: 0, title: '', date: '', type: '' }))) return fallback
    if (key === 'applications' && !(value as unknown[]).every(v => matches(v, { id: '', title: '', status: '', date: '', note: '' }))) return fallback
    if (key === 'activity') {
      const activity = value as { interests: unknown[]; experiences: unknown[] }
      if (!activity.interests.every(v => typeof v === 'string') || !activity.experiences.every(v => matches(v, { id: '', title: '', category: '', status: '' }))) return fallback
    }
    return value as T
  } catch { return fallback }
}
