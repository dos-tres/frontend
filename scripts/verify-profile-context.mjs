import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
async function moduleAt(file) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(file, import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', external: ['./data/policy-catalog.json'], define: { 'import.meta.env.VITE_API_BASE_URL': '""' } })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const api = await moduleAt('../src/policy-api.ts')
const context = await moduleAt('../src/profile-context.ts')
const storage = await moduleAt('../src/local-storage.ts')
const today = new Date(2026, 10, 20)
const base = { name: '합성 검증', phone: '', email: '', birthDate: '2002-11-20', regionCode: '11620', regionLabel: '서울특별시 관악구', employment: '' }
const jobs = { '구직 중': '구직 중', '재직 중': '회사원', '재학 중': '학생', '아르바이트·단기': '아르바이트·단기', '프리랜서': '프리랜서', '창업·자영업': '창업·자영업', '쉬고 있어요': '쉬는 중' }
const requests = []
const python = fileURLToPath(new URL('../../backend/.venv/bin/python', import.meta.url))
const bridge = fileURLToPath(new URL('./checkin-asgi-bridge.py', import.meta.url))
globalThis.fetch = async (url, options) => {
  const body = JSON.parse(options.body)
  assert.deepEqual(Object.keys(body).sort(), ['checkin', 'profile'])
  assert.deepEqual(Object.keys(body.profile).sort(), ['age', 'job', 'school', 'sigungu_cd'])
  assert.ok(!JSON.stringify(body).includes(base.name))
  requests.push(body)
  const reply = spawnSync(python, [bridge], { encoding: 'utf8', input: JSON.stringify({ path: new URL(url, 'http://test.local').pathname, method: options.method, body: options.body, headers: options.headers }) })
  assert.equal(reply.status, 0)
  const result = JSON.parse(reply.stdout)
  assert.equal(result.status, 200)
  return new Response(JSON.stringify(result.body), { status: result.status })
}
for (const [employment, expected] of Object.entries(jobs)) {
  const criteria = api.profilePolicyCriteria(undefined, { ...base, employment }, today)
  assert.equal(criteria.job, expected)
  await api.requestRecommendations({ ...criteria, name: base.name, birthDate: base.birthDate, phone: '', email: '' }, {}, new AbortController().signal)
}
for (const school of ['고등학생', '대학생', '대학원생']) {
  const criteria = api.profilePolicyCriteria(undefined, { ...base, employment: '재학 중', school }, today)
  await api.requestRecommendations(criteria, {}, new AbortController().signal)
  assert.equal(requests.at(-1).profile.school, school)
}
assert.equal(api.ageFromBirthDate('2002-11-21', today), '23')
assert.equal(api.ageFromBirthDate('2002-11-20', today), '24')
assert.equal(api.ageFromBirthDate('', today), '')
const mapped = context.profileInterests(['취업·진로', '주거', '건강·마음'])
assert.deepEqual(mapped, ['일자리·취업', '집·주거', '마음건강·상담'])
assert.deepEqual(context.recommendationAnswers({}, mapped).interests, mapped)
assert.deepEqual(context.recommendationAnswers({ interests: ['문화·여가'] }, mapped).interests, ['문화·여가'])
assert.deepEqual(context.recommendationAnswers({ interests: [] }, mapped).interests, [])
assert.deepEqual(context.recommendationAnswers({ interests: ['문화·여가'] }, mapped, true).interests, mapped)
assert.deepEqual(context.recommendationAnswers({ interests: ['문화·여가'] }, [], true).interests, [])
assert.deepEqual(context.currentRecommendationAnswers({ economy: 'high', interests: ['문화·여가'] }, mapped, true, { economy: 'declined', interests: 'skipped' }), { interests: [] })
const answers = context.recommendationAnswers({}, mapped)
await api.requestRecommendations({ age: '24', region: '11620', job: '' }, answers, new AbortController().signal)
assert.deepEqual(requests.at(-1).checkin.interests, mapped)
globalThis.localStorage = { getItem: () => JSON.stringify({ employment: '구직 중', school: '', interests: ['취업·진로'], participation: '온라인', groupSize: '소규모 모임', experiences: [] }) }
const restored = storage.readLocal('activity', { employment: '', school: '', interests: [], participation: '', groupSize: '', experiences: [] })
assert.equal(restored.participation, '온라인')
assert.equal(restored.groupSize, '소규모 모임')
console.log(`PASS: ${requests.length} real FE request → backend ASGI contracts; 7 job mappings, 3 school choices; profile allowlist; birthday boundary; interest priority; saved preferences restoration`)
console.log('Transport: ASGI. DB/TCP tests are recorded separately; participation/groupSize/experiences are not sent.')
