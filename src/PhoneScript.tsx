import {useState} from 'react'
import './phone-script.css'
export default function PhoneScript({text}:{text:string}) {
 const [status,setStatus]=useState('')
 return <section className="phone-script" aria-label="전화 문의 대본"><header><strong>전화 문의 대본</strong><button className="chat-reply-option" onClick={async()=>{try{await navigator.clipboard.writeText(text);setStatus('복사했어요')}catch{setStatus('복사하지 못했어요. 대본을 선택해서 복사해 주세요.')}}}>복사하기</button></header><p>{text}</p><small role="status">{status}</small></section>
}
