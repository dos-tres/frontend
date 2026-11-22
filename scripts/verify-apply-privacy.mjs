import assert from 'node:assert/strict'
import {build} from 'esbuild'
const built=await build({entryPoints:['src/apply-privacy.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const m=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'))
const personal={name:'',birthDate:'2003-06-20',phone:'',email:'',regionCode:'11740109'}
const masked=m.maskApplicationText('가상수아 2003-06-20 010-0000-0000 fake@example.test 빵을 배우고 싶어요',personal,{이름:'가상수아'})
for(const secret of ['가상수아','2003-06-20','010-0000-0000','fake@example.test'])assert.ok(!masked.includes(secret))
assert.ok(masked.includes('빵을 배우고 싶어요'))
console.log('PASS: form-local name/birthday/phone/email masking preserves motivation facts')
