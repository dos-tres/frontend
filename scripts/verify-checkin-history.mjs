import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transform } from 'esbuild'
const source = await readFile(new URL('../src/checkin-result.ts', import.meta.url), 'utf8')
const { code } = await transform(source, { loader: 'ts', format: 'esm' })
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const sample = { economy: 'high', participation: 'low', outing: 'mid', conversation: 'low', support: 'high' }
const result = api.buildStateResult(sample)
assert.equal(result.types[0], 'economy')
assert.ok(result.types.includes('support'))
assert.equal(result.areas.find(area => area.name === '정기 활동').status, '정기적으로 참여하는 활동이 있어요')
assert.ok(api.buildStateResult({}).areas.every(area => area.status === '아직 확인하지 않은 영역이에요'))
assert.equal(api.buildStateResult({}).types[0], 'explore')
assert.equal(api.buildStateResult(Object.fromEntries(['economy', 'participation', 'outing', 'conversation', 'support'].map(id => [id, 'low']))).types[0], 'balance')
assert.ok(api.buildStateResult({ change_wishes: ['C'] }).types.includes('connection'))
assert.ok(api.buildStateResult({ interests: ['마음건강·상담'] }).types.includes('wellbeing'))
const supports = api.supportsForResult(result)
assert.ok(supports.some(item => item.id === 'work'))
assert.equal(new Set(supports.map(item => item.id)).size, supports.length)
assert.ok(supports.every(item => /^https:\/\//.test(item.url)))
let persisted
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => persisted } })
const first = { id: 'first', savedAt: '2026-11-20T05:00:00Z', answers: sample, ratings: { economy: 5 }, completed: true, result }
const second = { ...first, id: 'second', savedAt: '2026-11-20T06:00:00Z', answers: { support: 'low' }, result: api.buildStateResult({ support: 'low' }) }
persisted = JSON.stringify([second, first])
const restored = api.readCheckinHistory()
assert.deepEqual(restored.map(record => record.id), ['second', 'first'])
assert.deepEqual(restored[1].answers, sample)
assert.equal(restored[1].ratings.economy, 5)
assert.deepEqual(restored[1].result, result)
assert.notDeepEqual(restored[0].result, restored[1].result)
persisted = '{corrupt'
assert.deepEqual(api.readCheckinHistory(), [])
persisted = JSON.stringify([null, { id: 'invalid', completed: true }])
assert.deepEqual(api.readCheckinHistory(), [])
Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('storage blocked') } })
assert.deepEqual(api.readCheckinHistory(), [])
console.log('PASS: state categories, partial answers, fixed supports, independent history snapshots, reload restoration, malformed/blocked storage')
