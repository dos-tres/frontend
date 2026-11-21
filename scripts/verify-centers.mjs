import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const compiled=await build({entryPoints:['src/center-api.ts'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.VITE_API_BASE_URL':'""'}})
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const bridge=fileURLToPath(new URL('./checkin-asgi-bridge.py',import.meta.url))
const python=fileURLToPath(new URL('../../backend/.venv/bin/python',import.meta.url))
globalThis.fetch=async(url)=>{
 const target=new URL(url,'http://test.local'); const response=spawnSync(python,[bridge],{encoding:'utf8',input:JSON.stringify({method:'GET',path:target.pathname+target.search})});assert.equal(response.status,0);const result=JSON.parse(response.stdout);return new Response(JSON.stringify(result.body),{status:result.status})
}
const signal=new AbortController().signal
const all=await api.requestCenters('','',signal);assert.ok(all.items.length);assert.equal(all.source,'file');assert.ok(all.items.every(c=>c.region_code.startsWith('11')))
const match=all.items[0];const filtered=await api.requestCenters(match.name,match.district,signal);assert.ok(filtered.items.some(c=>c.id===match.id))
const detail=await api.requestCenter(match.id,signal);assert.equal(detail.item.name,match.name);assert.ok(detail.item.guide.summary);assert.ok(detail.item.guide.source.url.startsWith('https://'));assert.equal(detail.programs.length,match.program_count);assert.ok(match.open_program_count<=match.program_count);assert.equal(detail.source,'file');assert.ok(['db','file'].includes(detail.programs_source));assert.equal(api.centerPrograms(detail).length,detail.programs.length)
assert.equal((await api.requestCenters('no_matching_center_qa','',signal)).items.length,0)
globalThis.fetch=async()=>new Response('{}',{status:503});await assert.rejects(()=>api.requestCenters('','',signal))
globalThis.fetch=async()=>{throw new DOMException('Timed out','TimeoutError')};await assert.rejects(()=>api.requestCenters('','',signal))
console.log('PASS: actual FE→ASGI center list/detail, collected file source, district/search/empty result, 503 and timeout propagation')
