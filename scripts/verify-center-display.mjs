import { build } from 'esbuild'
import { createRequire } from 'node:module'
const code = `import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {CenterListRow, CenterGuideSection, CenterListPage, CenterDetailContent} from './src/CenterPages';
const guide={kind:'공유공간',summary:'청년카페와 공유주방을 이용할 수 있어요.',facilities:['청년카페','공유주방'],usage_note:'공식 안내에서 예약을 확인해 주세요.',source:{name:'공식 기관',url:'https://example.org/center',checked_at:'2026-11-21'}};
const center={id:'public-center',name:'공유센터',address:'공개 센터 주소',district:'강서구',province:'서울',homepage:'',region_code:'11500',updated_at:'',guide};
const empty=render(React.createElement(CenterListRow,{center:{...center,program_count:0,open_program_count:0},onSelect:()=>{}}));
assert.ok(empty.includes('청년카페'));assert.ok(!empty.includes('수집 정보 없음'));assert.ok(!empty.includes('현재 모집 중'));assert.ok(!empty.includes('0개'));
const active=render(React.createElement(CenterListRow,{center:{...center,program_count:5,open_program_count:3},onSelect:()=>{}}));
assert.ok(active.includes('현재 모집 중 3개'));assert.ok(!active.includes('프로그램 5개'));
const description=render(React.createElement(CenterGuideSection,{guide}));assert.ok(description.includes('어떤 곳인가요?'));assert.ok(description.includes('공식 공간 안내 확인'));
const controls=render(React.createElement(CenterListPage,{savedRegion:'',onSelect:()=>{}}));assert.equal((controls.match(/<option value="(?:nearby|basic)"/g)||[]).length,2);assert.ok(controls.includes('프로그램 안내 있는 센터만'));
const detail={item:center,programs:[],source:'file',dataset:'seed',programs_source:'db',notice:''};
const noPrograms=render(React.createElement(CenterDetailContent,{data:detail,onProgram:()=>{}}));assert.ok(noPrograms.indexOf(guide.summary)<noPrograms.indexOf('공간 이용 안내'));assert.ok(!noPrograms.includes('현재 모집 중인 프로그램'));assert.ok(!noPrograms.includes('0개'));assert.ok(!noPrograms.includes('프로그램 정보'));
const item={id:'program:open',kind:'program',title:'모집 공고',summary:'공개 안내',scope:'서울',deadline:null,why:[],domains:[],access_type:'apply',apply_period:'상시',application_status:'always_open'};
const withPrograms=render(React.createElement(CenterDetailContent,{data:{...detail,programs:[item,{...item,id:'program:closed',title:'마감 공고',application_status:'closed'}]},onProgram:()=>{}}));assert.ok(withPrograms.includes('현재 모집 중인 프로그램'));assert.ok(withPrograms.includes('모집 공고'));assert.ok(!withPrograms.includes('마감 공고'));assert.ok(withPrograms.indexOf(guide.summary)<withPrograms.indexOf('현재 모집 중인 프로그램'));
console.log('PASS: actual React markup hides absent/zero count, shows current recruitment only, renders official space guide and two sort choices/filter');`;
const result=await build({stdin:{contents:code,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',packages:'bundle',external:['node:*'],define:{'import.meta.env.VITE_KAKAO_MAP_APP_KEY':'""','import.meta.env.VITE_API_BASE_URL':'""'}});
const compiledModule={exports:{}};
try { new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),compiledModule,compiledModule.exports) } catch(error) { console.error(error.message);process.exitCode=1 }
