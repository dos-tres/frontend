import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result=await build({entryPoints:['src/center-distance.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
assert.equal(api.distanceKm({lat:37,lng:127},{lat:37,lng:127}),0)
assert.ok(Math.abs(api.distanceKm({lat:0,lng:0},{lat:1,lng:0})-111.195)<0.01)
assert.ok(Number.isFinite(api.distanceKm({lat:90,lng:0},{lat:-90,lng:180})))
const centers=[{id:'far'},{id:'missing'},{id:'near'},{id:'tie'}]
assert.deepEqual(api.sortCentersByDistance(centers,{far:10,near:1,tie:1}).map(c=>c.id),['near','tie','far','missing'])
assert.equal(centers[0].id,'far')
assert.equal(api.distanceLabel(undefined),'거리 확인 불가')
assert.equal(api.distanceLabel(0),'약 100m 이내')
assert.equal(api.centerDistanceOrigin('서울특별시 강서구 염창동',''),'서울특별시 강서구 염창동')
assert.equal(api.centerDistanceOrigin('서울특별시 강서구 염창동','노원구'),'서울특별시 노원구')
assert.equal(api.centerDistanceOrigin('',''),'')
console.log('PASS: geographic distance, stable nearest-first sorting, missing coordinates last, saved/selected/no-region origin, approximate labels')

const mixed=[{id:'space-near',program_count:0},{id:'program-far',program_count:2},{id:'program-near',program_count:1},{id:'space-far'}]
const distances={'space-near':0.1,'program-far':10,'program-near':1,'space-far':20}
assert.deepEqual(api.orderCenters(mixed,'basic',distances).map(c=>c.id),['program-far','program-near','space-near','space-far'])
assert.deepEqual(api.orderCenters(mixed,'nearby',distances).map(c=>c.id),['program-near','program-far','space-near','space-far'])
assert.deepEqual(api.orderCenters(mixed,'nearby',distances,true).map(c=>c.id),['program-near','program-far'])
assert.equal(mixed.length,4)
console.log('PASS: program-first grouping in both modes, nearest order within groups, program-only filter, original array preserved')
