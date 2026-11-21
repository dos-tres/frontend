import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result=await build({entryPoints:['src/kakao-maps.ts','src/center-address.ts'],bundle:true,write:false,outdir:'out',format:'esm',platform:'node',define:{'import.meta.env.VITE_KAKAO_MAP_APP_KEY':'"test-only"'}})
const modules={}
for(const file of result.outputFiles)modules[file.path.split('/').pop()]=await import('data:text/javascript;base64,'+Buffer.from(file.text).toString('base64'))
const address=modules['center-address.js'],maps=modules['kakao-maps.js']
assert.deepEqual(address.centerAddressQueries('서울특별시 관악구 남부순환로 1759 2~7층'),['서울특별시 관악구 남부순환로 1759 2~7층','서울특별시 관악구 남부순환로 1759'])
assert.equal(address.centerMapSearchAddress('서울광진구 광진구 동일로 100, 별관 2~4층'),'서울특별시 광진구 동일로 100')
assert.equal(address.centerMapSearchAddress('서울도봉구 서울특별시 도봉구 마들로 656 도봉구청 1층'),'서울특별시 도봉구 마들로 656')
assert.equal(address.centerMapSearchAddress('서울시 노원구 공릉로 51길 20, 지하1층'),'서울시 노원구 공릉로 51길 20')
assert.equal(address.centerMapSearchAddress('서울특별시 성동구 마조로66 라봄성동 2층'),'서울특별시 성동구 마조로66')
assert.deepEqual(address.centerAddressQueries('서울특별시 강서구 염창동'),['서울특별시 강서구 염창동'])
const calls=[]
globalThis.window={setTimeout,clearTimeout,kakao:{maps:{LatLng:class {},services:{Status:{OK:'OK',ZERO_RESULT:'ZERO_RESULT'},Geocoder:class {addressSearch(query,callback){calls.push(query);if(query.endsWith('1759'))callback([{x:'126.9',y:'37.4'}],'OK');else callback([],'ZERO_RESULT')}}}}}}
const original='서울특별시 관악구 남부순환로 1759 2~7층'
assert.deepEqual(await maps.geocodeAddress(original),{lat:37.4,lng:126.9})
assert.deepEqual(calls,[original,'서울특별시 관악구 남부순환로 1759'])
await maps.geocodeAddress(original);assert.equal(calls.length,2)
assert.equal(await maps.geocodeAddress('주소를 찾을 수 없음'),null)
console.log('PASS: floor/building removal, duplicate district cleanup, street numbers preserved, ZERO_RESULT retry, success cache, unknown address remains unknown')
