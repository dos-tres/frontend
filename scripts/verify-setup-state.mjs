import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ entryPoints: ['src/setup-state.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { readSetup, initialSetup } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
let raw
 globalThis.localStorage = { getItem: () => raw }
for (raw of [null, '{', 'null']) assert.deepEqual(readSetup(), initialSetup)
raw = JSON.stringify({ step: 2, personal: 'skipped', preferences: 'answered', checkin: 'declined', finished: false, interestSource: 'profile', decisions: { economy: 'declined', support: 'skipped', interests: 'answered', invalid: 'anything' } })
const restored = readSetup()
assert.equal(restored.step, 2)
assert.equal(restored.finished, false)
assert.equal(restored.interestSource, 'profile')
assert.deepEqual(restored.decisions, { economy: 'declined', support: 'skipped', interests: 'answered' })
raw = JSON.stringify({ step: 99, personal: 'bogus', finished: 'yes' })
assert.equal(readSetup().step, 0)
assert.equal(readSetup().personal, 'unanswered')
assert.equal(readSetup().finished, false)
globalThis.localStorage = { getItem: () => { throw Error('blocked') } }
assert.deepEqual(readSetup(), initialSetup)
console.log('PASS: resumable setup, answered/skipped/declined distinction, legacy/default/blocked storage')
