import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
const compiled=await build({entryPoints:['src/policy-api.ts'],bundle:true,write:false,format:'esm',platform:'node',external:['./data/policy-catalog.json'],define:{'import.meta.env.VITE_API_BASE_URL':'""'}})
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const bridge=fileURLToPath(new URL('./checkin-asgi-bridge.py',import.meta.url))
const python=fileURLToPath(new URL('../../backend/.venv/bin/python',import.meta.url))
const paths=[]
globalThis.fetch=async(url,options={})=>{
 const target=new URL(url,'http://test.local'); paths.push(target.pathname)
 const response=spawnSync(python,[bridge],{encoding:'utf8',input:JSON.stringify({method:options.method||'GET',path:target.pathname+target.search,body:options.body,headers:options.headers})})
 assert.equal(response.status,0)
 const result=JSON.parse(response.stdout)
 return new Response(JSON.stringify(result.body),{status:result.status})
}
const view={query:'',type:'정책',category:'금융·복지·문화',onlyOpen:true,onlySaved:false,mode:'all',page:1,sort:'기본순'}
const response=await api.requestCatalog({age:'28',region:'11',job:''},view,new AbortController().signal)
assert.ok(response.items.length)
assert.ok(response.items.every(i=>i.categories.includes(view.category)))
assert.ok(response.categories.includes('금융·복지·문화'))
const detail=await api.requestCatalogItem(response.items[0].id,new AbortController().signal)
assert.equal(detail.id,response.items[0].id)
assert.ok(detail.target)
const period=api.toProgram({...response.items[0],application_status:'always_open',application_status_label:'상시',application_period:'상시'})
assert.equal(api.applicationLabel(period),'상시');assert.equal(period.period,'상시')
const unmapped=api.toProgram({...response.items[0],target:undefined,method:undefined,documents:undefined},{target:'STALE TARGET',method:'STALE METHOD',documents:'STALE DOCS'})
assert.equal(unmapped.target,'');assert.equal(unmapped.method,'');assert.equal(unmapped.documents,undefined)
const income={kind:'annual_income',max_manwon:3000,text:'연소득 3,000만 원 이하'}
assert.deepEqual(api.toProgram({...response.items[0],income_condition:income}).incomeCondition,income)
assert.ok(paths.every(p=>p.startsWith('/api/catalog/items')))
globalThis.fetch=async()=>new Response('{}',{status:503})
await assert.rejects(api.requestCatalog({age:'28',region:'11',job:''},view,new AbortController().signal),/API 503/)
console.log('PASS: real FE → catalog/category/detail API, consistent always-open status, structured income, no snapshot supplementation, API failure propagated')
