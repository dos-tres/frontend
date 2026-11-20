// Five-point UI answers retain their exact position; the existing API accepts three levels.
export const checkinScales: Record<string, { labels: string[]; codes: string[] }> = {
  economy: { labels: ['전혀 부담되지 않아요', '별로 부담되지 않아요', '보통이에요', '부담되는 편이에요', '매우 부담돼요'], codes: ['low', 'low', 'mid', 'high', 'high'] },
  outing: { labels: ['거의 나가지 않아요', '드물게 나가요', '가끔 나가요', '자주 나가요', '매우 자주 나가요'], codes: ['high', 'high', 'mid', 'low', 'low'] },
  conversation: { labels: ['매우 부족해요', '부족한 편이에요', '보통이에요', '충분한 편이에요', '매우 충분해요'], codes: ['high', 'high', 'mid', 'low', 'low'] },
  satisfaction: { labels: ['매우 불만족해요', '불만족하는 편이에요', '보통이에요', '만족하는 편이에요', '매우 만족해요'], codes: ['bad', 'bad', 'normal', 'good', 'good'] },
  face_to_face: { labels: ['전혀 부담되지 않아요', '별로 부담되지 않아요', '보통이에요', '부담되는 편이에요', '매우 부담돼요'], codes: ['low', 'low', 'mid', 'high', 'high'] },
}

export const checkinBinaryOptions: Record<string, { code: string; label: string }[]> = {
  participation: [{ code: 'low', label: '예' }, { code: 'high', label: '아니오' }],
  support: [{ code: 'low', label: '예' }, { code: 'high', label: '아니오' }],
}
