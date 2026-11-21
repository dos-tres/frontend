import assert from 'node:assert/strict'
import {build} from 'esbuild'
const compile=async file=>{const r=await build({entryPoints:[file],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.VITE_KAKAO_MAP_APP_KEY':'"test-key-placeholder"'}});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))}
const match=await compile('src/center-place.ts'),api=await compile('src/kakao-maps.ts')
const center={name:'서울청년센터 관악',province:'서울',district:'관악구',address:''}
const place={id:'123',place_name:'서울청년센터 관악',road_address_name:'서울 관악구 공개로 1',address_name:'서울 관악구 공개동 1',x:'126.95',y:'37.48',place_url:''}
assert.equal(match.selectCenterPlace(center,[place]).id,'123')
assert.equal(match.selectCenterPlace(center,[{...place,place_name:'청년센터 관악'}]).id,'123')
for(const p of [{...place,road_address_name:'서울 강서구 공개로 1'},{...place,place_name:'다른 청년센터'},{...place,x:''},{...place,y:'NaN'}])assert.equal(match.selectCenterPlace(center,[p]),null)
assert.equal(match.selectCenterPlace(center,[place,{...place,id:'456'}]),null)
assert.equal(match.selectCenterPlace({...center,district:'',address:''},[place]),null)
let addressCalls=0,placeCalls=0,addressStatus='OK',placeStatus='OK',results=[place],more=false
const maps = {
 LatLng: function(){},
 services: {
  Status: {OK:'OK',ZERO_RESULT:'ZERO_RESULT'},
  Geocoder: class { addressSearch(q,cb){addressCalls++;cb(addressStatus==='OK'?[{x:'126.9',y:'37.4'}]:[],addressStatus)} },
  Places: class { keywordSearch(q,cb){placeCalls++;cb(results,placeStatus,{hasNextPage:more})} }
 }
}
globalThis.window={kakao:{maps},setTimeout,clearTimeout}
const official={...center,address:'서울 관악구 공식로 1'}
assert.equal((await api.resolveCenterLocation(official)).source,'address');assert.equal(placeCalls,0)
assert.equal((await api.resolveCenterLocation(center)).source,'kakao-place');assert.equal(placeCalls,1)
await api.resolveCenterLocation(center);assert.equal(placeCalls,1)
addressStatus='ZERO_RESULT'
assert.equal((await api.resolveCenterLocation({...center,address:'서울 관악구 없는로 2'})).source,'kakao-place')
results=[place,{...place,id:'456'}];assert.equal(await api.resolveCenterLocation({...center,address:'서울 관악구 없는로 3'}),null)
results=[place];more=true;assert.equal(await api.resolveCenterLocation({...center,address:'서울 관악구 없는로 4'}),null)
more=false;placeStatus='ERROR';await assert.rejects(api.resolveCenterLocation({...center,address:'서울 관악구 없는로 5'}))
placeStatus='OK';assert.ok(await api.resolveCenterLocation({...center,address:'서울 관악구 없는로 5'}))
addressStatus='ERROR';const before=placeCalls;await assert.rejects(api.resolveCenterLocation({...center,address:'서울 관악구 없는로 6'}));assert.equal(placeCalls,before)
console.log('PASS: official address priority, missing/zero-result place fallback, exact name/region, ambiguous/truncated result rejection, coordinates, cache, API error/retry')
