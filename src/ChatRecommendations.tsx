import {useState,useEffect} from 'react'
import joyImage from './assets/joy.png'
import {ChevronLeft,ChevronRight} from 'lucide-react'
import type {RecommendationItem} from './policy-api'
import {periodLabel,safePolicyUrl} from './policy-api'
export default function ChatRecommendations({items,onActive,onAction,busy}:{items:RecommendationItem[];onActive:(item:RecommendationItem)=>void;onAction:(action:string,item:RecommendationItem)=>void;busy:boolean}) {
 const [index,setIndex]=useState(0)
 const item=items[index]
 useEffect(()=>{if(item)onActive(item)},[item?.id])
 if(!item)return null
 return <section className="chat-recommendations" aria-label="추천 카드">
  <header><h3>이런 기회는 어때요?</h3><span aria-live="polite">{index+1} / {items.length}</span></header>
  <article className="chat-recommendation-card" key={item.id}>
   <div className="chat-recommendation-meta"><span>{item.kind==='program'?'프로그램':'정책'}</span><span>{item.region_label||item.scope}</span></div>
   <h4>{item.title}</h4>{safePolicyUrl(item.apply_url||item.reference_url||item.url)&&<a className="text-button" href={safePolicyUrl(item.apply_url||item.reference_url||item.url)} target="_blank" rel="noopener noreferrer">공식 신청 안내 ↗</a>}
   <dl><div><dt>{item.kind==='program'?'장소':'운영 기관'}</dt><dd>{item.activity_place||item.place||(item.center?`운영: ${item.center}`:item.institution)||'공고에 장소 미기재'}</dd></div><div><dt>신청 기간</dt><dd>{periodLabel(item.apply_period||item.application_period||'공고 확인 필요')}</dd></div></dl>
  </article>
  {items.length>1&&<nav aria-label="추천 카드 이동"><button aria-label="이전 추천" disabled={index===0} onClick={()=>setIndex(i=>i-1)}><ChevronLeft size={18}/>이전</button><span>옆으로 넘겨 살펴보세요</span><button aria-label="다음 추천" disabled={index===items.length-1} onClick={()=>setIndex(i=>i+1)}>다음<ChevronRight size={18}/></button></nav>}
  <div className="assistant-turn assistant chat-card-explanation" aria-live="polite"><img src={joyImage} alt="조이"/><div>
   <p>{item.activity_brief||item.summary}</p>
   <p>{item.fit_reason||item.why?.slice(0,2).join(' ')}</p>
   {(item.activity_place||item.place)&&<p>장소 · {item.activity_place||item.place}</p>}
   {item.activity_schedule&&<p>일정 · {item.activity_schedule}</p>}

   <div className="chat-reply-options" aria-label="이 활동으로 할 일"><button className="chat-reply-option" disabled={busy} onClick={()=>onAction('내가 신청할 수 있어?',item)}>신청 가능 여부 확인</button><button className="chat-reply-option" disabled={busy} onClick={()=>onAction('apply',item)}>신청 같이하기</button><button className="chat-reply-option" disabled={busy} onClick={()=>onAction('question',item)}>추가 질문하기</button></div>
  </div></div>
 </section>
}
