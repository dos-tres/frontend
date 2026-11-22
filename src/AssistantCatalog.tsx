import joyImage from './assets/joy.png'
import {useEffect,useState} from 'react'
import {applicationLabel,periodLabel,requestCatalog,requestRecommendations,toProgram,type PolicyCriteria} from './policy-api'
import type {Answers} from './checkin-api'
import type {Program} from './data'
import './apply-flow.css'
export default function AssistantCatalog({mode,query,criteria,answers,onSelect}:{mode:'정책'|'프로그램'|'추천';query:string;criteria:PolicyCriteria;answers:Answers;onSelect:(item:Program)=>void}) {
 const [revision,setRevision]=useState(0)
 const [items,setItems]=useState<Program[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(false)
 const [notice,setNotice]=useState('')
 useEffect(()=>{const controller=new AbortController();setBusy(true);setError(false);setItems([])
  const personalized=mode==='추천'&&!!criteria.age&&!!criteria.region&&!query
  const promise=personalized?requestRecommendations(criteria,answers,controller.signal).then(data=>({items:[...data.policies,...data.programs].slice(0,3).map(item=>toProgram(item)),notice:'저장된 나이·지역·설문으로 추천했어요. 실제 신청 자격은 공고에서 확인해요.'})):requestCatalog(criteria,{query,type:mode==='추천'?'전체':mode,category:'',onlyOpen:true,onlySaved:false,mode:'all',page:1,sort:'기본순'},controller.signal).then(data=>({items:data.items.slice(0,3).map(item=>toProgram(item)),notice:mode==='추천'?'저장된 조건이 부족해요. 우선 모집 중인 공고 세 개를 살펴볼 수 있어요.':'이 공고들을 먼저 살펴볼까요? 궁금한 내용을 이어서 물어봐 주세요.'}))
  promise.then(data=>{if(!controller.signal.aborted){setItems(data.items);setNotice(data.notice)}}).catch(()=>{if(!controller.signal.aborted)setError(true)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})
  return()=>controller.abort()
 },[mode,query,revision,JSON.stringify(criteria),JSON.stringify(answers)])
 return <div className="assistant-turn assistant"><img src={joyImage} alt="조이" /><div className="assistant-result" aria-label="조이의 공고 제안">{busy?<p role="status">잠깐만요. 공고를 확인하고 있어요…</p>:error?<><p role="alert">지금 공고를 불러오지 못했어요.</p><button className="text-button" onClick={()=>setRevision(n=>n+1)}>다시 확인해 줘</button></>:<><p>{notice}</p>{items.length?items.map(item=><button className="assistant-result-item" key={item.id} onClick={()=>onSelect(item)}><small>{item.type} · {applicationLabel(item)}</small><strong>{item.title}</strong><span>{item.summary}</span><small>{item.region} · {periodLabel(item.period)}</small><em>이 내용으로 이야기하기 →</em></button>):<p>맞는 공고를 찾지 못했어요. 다른 관심 분야나 지역을 말해 주세요.</p>}</>}</div></div>
}
