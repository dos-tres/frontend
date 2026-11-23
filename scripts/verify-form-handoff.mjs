import assert from 'node:assert/strict'
import {build} from 'esbuild'
const {outputFiles}=await build({entryPoints:['src/application-intent.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const {wantsApplicationForm}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`)
for(const text of ['폼 신청안돼?','니가 신청해다랄고','나 대신 신청해줘','신청서 열어줘','구글폼 불러와줘','신청 같이하기','신청할래'])assert.equal(wantsApplicationForm(text),true,text)
for(const text of ['응','신청 취소','신청하지 마','신청 안 할래','신청 가능한지 알려줘','내가 신청할 수 있어?','신청 기간이 언제야?','신청 방법 알려줘'])assert.equal(wantsApplicationForm(text),false,text)
assert.equal(wantsApplicationForm('응','신청서 질문을 같이 확인해 볼까요?'),true)
assert.equal(wantsApplicationForm('응','프로그램에 대해 궁금한가요?'),false)
const reset=await build({entryPoints:['src/TestDataReset.tsx'],bundle:true,write:false,format:'esm',platform:'node',loader:{'.css':'empty'},external:['react'],define:{'import.meta.env.DEV':'true','import.meta.env.VITE_ENABLE_TEST_RESET':'""'}})
// Resolve React through the project instead of inside a data URL.
const {mkdtemp,writeFile,rm}=await import('node:fs/promises');const {join}=await import('node:path')
const dir=await mkdtemp(join(process.cwd(),'.verify-form-'))
try{const file=join(dir,'reset.mjs');await writeFile(file,reset.outputFiles[0].text);const {clearTestStorage}=await import(file);let calls=[];clearTestStorage({clear:()=>calls.push('local')},{clear:()=>calls.push('session')});assert.deepEqual(calls,['local','session'])}finally{await rm(dir,{recursive:true,force:true})}
console.log('PASS: form requests, agreement context, eligibility/cancel separation and full local/session reset')
