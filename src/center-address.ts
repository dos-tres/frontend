/** Keep the original public address for display; simplify only the map query. */
export function centerAddressQueries(address: string): string[] {
  const original = address.trim()
  if (!original) return []
  let cleaned = original.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  cleaned = cleaned.replace(/^서울[가-힣]+구\s+(?=서울특별시\s)/, '')
    .replace(/^서울([가-힣]+구)\s+\1\s+/, '서울특별시 $1 ')
    .replace(/^서울([가-힣]+구)\s+/, '서울특별시 $1 ')
  // End at the street/building number, never at a floor or a bare district.
  const street = cleaned.match(/^(.*?(?:대로|로|길)\s*\d+(?:-\d+)?)(?=$|[\s,])/)
  const lot = street ? null : cleaned.match(/^(.*?(?:동|읍|면|리)\s+\d+(?:-\d+)?)(?=$|[\s,])/)
  const base = street?.[1] || lot?.[1]
  return [...new Set([original, ...(base ? [base] : [])])]
}
export const centerMapSearchAddress = (address: string) => centerAddressQueries(address).slice(-1)[0] || address
