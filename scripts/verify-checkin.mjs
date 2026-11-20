import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { transform } from 'esbuild'

const python = process.env.BACKEND_PYTHON || fileURLToPath(new URL('../../backend/.venv/bin/python', import.meta.url))
const bridge = fileURLToPath(new URL('./checkin-asgi-bridge.py', import.meta.url))
const requests = []
// No canned API responses: execute the actual FastAPI routes over an ASGI transport.
// This checks the frontend API module and backend contract, not TCP/proxy/browser behavior.
globalThis.fetch = async (url, options = {}) => {
  const path = new URL(url, 'http://local.test').pathname
  const result = spawnSync(python, [bridge], {
    input: JSON.stringify({ path, method: options.method || 'GET', body: options.body, headers: options.headers }),
    encoding: 'utf8',
  })
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr)
  const reply = JSON.parse(result.stdout)
  requests.push({ path, status: reply.status })
  return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } })
}
const source = await readFile(new URL('../src/checkin-api.ts', import.meta.url), 'utf8')
const { code } = await transform(source, { loader: 'ts', format: 'esm', define: { 'import.meta.env.VITE_API_BASE_URL': '""' } })
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const signal = () => new AbortController().signal
const catalog = await api.loadQuestions(signal())
const questions = [...catalog.domain_questions, ...catalog.extra_questions]
assert.equal(questions.length, 9)
assert.equal(catalog.common_options.length, 3)
console.log('PASS: frontend loads all 9 real backend questions')
const scaleSource = await readFile(new URL('../src/checkin-scale.ts', import.meta.url), 'utf8')
const scaleModule = await transform(scaleSource, { loader: 'ts', format: 'esm' })
const { checkinScales, checkinBinaryOptions } = await import(`data:text/javascript;base64,${Buffer.from(scaleModule.code).toString('base64')}`)
for (const [id, options] of Object.entries(checkinBinaryOptions)) {
  assert.deepEqual(options.map(option => option.label), ['예', '아니오'])
  const question = questions.find(q => q.id === id)
  assert.ok(options.every(option => question.options.some(original => original.code === option.code)))
}
for (const [id, scale] of Object.entries(checkinScales)) {
  const question = questions.find(q => q.id === id)
  assert.ok(question && !question.multiple)
  assert.equal(scale.labels.length, 5)
  assert.equal(scale.codes.length, 5)
  assert.ok(scale.codes.every(code => question.options.some(option => option.code === code)))
}
for (let point = 0; point < 5; point++) {
  const scaledAnswers = Object.fromEntries(Object.entries(checkinScales).map(([id, scale]) => [id, scale.codes[point]]))
  assert.ok(Array.isArray((await api.summarizeAnswers(scaledAnswers, signal())).notes))
}
console.log('PASS: all five scale positions accepted by the real backend; categorical questions remain separate')

const answers = Object.fromEntries(questions.map(q => [q.id, q.multiple ? [q.options[0].code] : q.options[0].code]))
const summary = await api.summarizeAnswers(answers, signal())
assert.ok(Array.isArray(summary.notes) && summary.notes.length > 0)
assert.ok(summary.disclaimer)
console.log('PASS: all 9 answers (including multiple selection) produce a summary')
const resultSource = await readFile(new URL('../src/checkin-result.ts', import.meta.url), 'utf8')
const resultModule = await transform(resultSource, { loader: 'ts', format: 'esm' })
const { buildStateResult } = await import(`data:text/javascript;base64,${Buffer.from(resultModule.code).toString('base64')}`)
const adapted = buildStateResult(answers, summary)
const domainTypes = { E: 'economy', P: 'routine', O: 'routine', C: 'connection', U: 'support' }
assert.equal(adapted.types[0], domainTypes[summary.priority_domains[0]])
const adjusted = await api.summarizeAnswers({ economy: 'high', participation: 'high', change_wishes: ['none'] }, signal())
const adjustedResult = buildStateResult({ economy: 'high', participation: 'high' }, adjusted)
assert.equal(adjusted.levels.E, 'mid')
assert.equal(adjusted.levels.P, 'mid')
assert.ok(adjustedResult.areas.filter(area => ['생활 부담', '정기 활동'].includes(area.name)).every(area => area.status === '함께 살펴볼 도움 영역이에요'))
assert.ok(adjustedResult.areas.some(area => area.status === '아직 확인하지 않은 영역이에요'))
console.log('PASS: result rendering uses backend priority and adjusted levels, not raw frontend classification')


const skipped = await api.summarizeAnswers({}, signal())
assert.deepEqual(skipped.notes, [])
console.log('PASS: skipping every question produces an empty summary')

const optedOut = Object.fromEntries(catalog.domain_questions.map(q => [q.id, 'skip']))
assert.deepEqual((await api.summarizeAnswers(optedOut, signal())).notes, [])
console.log('PASS: explicit opt-out answers are accepted')

await assert.rejects(api.summarizeAnswers({ interests: ['일자리·취업', '창업', '집·주거', '교육·자격증'] }, signal()), /API 422/)
await assert.rejects(api.summarizeAnswers({ change_wishes: ['none', 'E'] }, signal()), /API 422/)
await assert.rejects(api.summarizeAnswers({ economy: 'invalid' }, signal()), /API 422/)
console.log('PASS: selection limit, exclusive none, and invalid option return API errors')
console.log(JSON.stringify({ transport: 'ASGI (no TCP server)', requests }, null, 2))
