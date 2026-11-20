import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transform } from 'esbuild'
const { code } = await transform(await readFile(new URL('../src/local-storage.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'esm' })
const { readLocal } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
let raw
// Exercise restoration with persisted JSON, corrupt records, and unavailable storage.
globalThis.localStorage = { getItem: () => raw }
const profile = { name: '기능검증', birthDate: '2002-01-15', phone: '', email: '', regionCode: '11620' }
raw = JSON.stringify(profile)
assert.deepEqual(readLocal('personal', { name: '', birthDate: '', phone: '', email: '', regionCode: '' }), profile)
for (raw of ['null', '{', '[{}]', '[1]']) assert.deepEqual(readLocal('saved', []), [])
raw = JSON.stringify([{ id: 1, title: '검증 일정', date: '2026-11-20', type: '개인 일정' }])
assert.equal(readLocal('events', []).length, 1)
raw = '[{"id":1}]'
assert.deepEqual(readLocal('events', []), [])
globalThis.localStorage = { getItem: () => { throw Error('blocked') } }
assert.deepEqual(readLocal('saved', []), [])
console.log('PASS: persisted profile/event restoration; malformed and blocked local storage')
