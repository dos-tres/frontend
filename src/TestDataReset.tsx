import {useState} from 'react'
import './assistant-session.css'
export function clearTestStorage(local:Pick<Storage,'clear'>,session:Pick<Storage,'clear'>){local.clear();session.clear()}
export default function TestDataReset(){
 const [open,setOpen]=useState(false),[error,setError]=useState('')
 if(!import.meta.env.DEV&&import.meta.env.VITE_ENABLE_TEST_RESET!=='true')return null
 return <div className="test-reset-control"><button className="btn btn-secondary test-reset-launcher" onClick={()=>setOpen(true)}>테스트 초기화</button>{open&&<div className="test-reset-layer"><section role="alertdialog" aria-modal="true" aria-labelledby="test-reset-title" className="test-reset-dialog"><h2 id="test-reset-title">테스트 데이터를 초기화할까요?</h2><p>이 사이트의 로컬·세션 저장소를 모두 비워요. 저장된 내 정보, 대화, 관심 목록과 일정이 삭제돼요. Google Forms 응답은 삭제하지 않아요.</p>{error&&<p role="alert">{error}</p>}<div><button className="btn btn-secondary" onClick={()=>setOpen(false)}>취소</button><button className="btn btn-primary" onClick={()=>{try{clearTestStorage(localStorage,sessionStorage);window.location.reload()}catch{setError('저장소를 비우지 못했어요. 브라우저 설정을 확인해 주세요.')}}}>모두 초기화</button></div></section></div>}</div>
}
