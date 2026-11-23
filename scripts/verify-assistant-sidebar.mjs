import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
const dir=await mkdtemp(join(process.cwd(),'.verify-sidebar-'))
try{
 const file=join(dir,'panel.mjs')
 await build({entryPoints:['src/PolicyJoyPanel.tsx'],bundle:true,outfile:file,format:'esm',platform:'node',loader:{'.css':'empty','.png':'dataurl','.svg':'dataurl'},external:['react','react-dom/server','lucide-react'],define:{'import.meta.env.VITE_API_BASE_URL':'""'},jsx:'automatic'})
 const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');const {default:Panel}=await import(pathToFileURL(file).href)
 const html=renderToStaticMarkup(React.createElement(Panel,{personal:{name:'',birthDate:'',phone:'',email:'',regionCode:''},activity:{interests:[],employment:'',school:'',participation:'',groupSize:'',experiences:[]},initialMessages:[],onBack(){},onSavePersonal(){},onSaveActivity(){},onNew(){},onSave(){},saved:false}))
 const sidebar=html.match(/<aside[\s\S]*?<\/aside>/)[0]
 assert.match(sidebar,/새 대화/);assert.match(sidebar,/대화 이력/)
 for(const label of ['시연 예시','참고하는 내 정보','저장한 정보 수정','별명 설정','함께 살펴보는 정보'])assert.equal(sidebar.includes(label),false,label)
 console.log('PASS: assistant sidebar restores chat history; unrelated source/demo/profile widgets absent')
}finally{await rm(dir,{recursive:true,force:true})}
