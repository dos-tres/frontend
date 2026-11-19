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

const answers = Object.fromEntries(questions.map(q => [q.id, q.multiple ? [q.options[0].code] : q.options[0].code]))
const summary = await api.summarizeAnswers(answers, signal())
assert.ok(Array.isArray(summary.notes) && summary.notes.length > 0)
assert.ok(summary.disclaimer)
console.log('PASS: all 9 answers (including multiple selection) produce a summary')

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
