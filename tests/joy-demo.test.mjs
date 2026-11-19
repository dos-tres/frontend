import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../src/joy-demo.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { conditions, initialJoyProfile, demoReply, demoExecute } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const program = { title: '지원 예시', type: '정책', target: '공식 공고 확인 필요' }
test('initial profile contains only residence; missing fields stay unknown', () => {
  assert.deepEqual(initialJoyProfile, { region: '서울 강서구 염창동', age: '', employment: '' })
  assert.deepEqual(conditions(program, initialJoyProfile).map(c => c.status), ['충족', '추가 확인 필요', '추가 확인 필요', '추가 확인 필요'])
})
test('profile changes update results, including bounds and unmet conditions', () => {
  for (const age of ['19', '34']) assert.equal(conditions(program, { ...initialJoyProfile, age })[1].status, '충족')
  for (const age of ['18', '35']) assert.equal(conditions(program, { ...initialJoyProfile, age })[1].status, '미충족')
  assert.deepEqual(conditions(program, { region: '부산', age: '25', employment: '재직' }).map(c => c.status), ['미충족', '충족', '미충족', '추가 확인 필요'])
  assert.equal(conditions({ ...program, type: '프로그램' }, { ...initialJoyProfile, employment: '학생' })[2].status, '충족')
})
test('reply failure can retry successfully', async () => {
  await assert.rejects(demoReply('도와줘', true))
  assert.match(await demoReply('도와줘', false), /예시/)
})
test('task failure can retry and result remains explicitly simulated', async () => {
  const task = { kind: '신청', profile: initialJoyProfile, status: '진행 중', note: '예시' }
  await assert.rejects(demoExecute(task, true))
  assert.match(await demoExecute(task, false), /실제 접수·예약 효력은 없어요/)
})
