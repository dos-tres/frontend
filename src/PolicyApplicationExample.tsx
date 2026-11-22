import {useState} from 'react'
import type {PersonalInformation} from './ProfileSettings'
import {profileRegionLabel} from './ProfileSettings'
import {ageFromBirthDate} from './policy-api'
import './apply-flow.css'

export default function PolicyApplicationExample({personal,onClose,onSchedule}:{personal:PersonalInformation;onClose:()=>void;onSchedule:()=>void}) {
  const [step,setStep]=useState(0)
  const age=ageFromBirthDate(personal.birthDate)
  const steps=['신청 조건','신청 방법','서류 준비','일정 등록']
  return <section className="apply-flow" aria-label="월세 지원 정책 신청 도움 예시">
    <header><h3>월세 지원 신청 도움</h3><button className="text-button" onClick={onClose}>닫기</button></header>
    <p><strong>신청 안내 예시</strong> · 실제 접수나 자격 심사를 진행하지 않아요. 특정 월세 지원사업의 확정 조건·필수 서류가 아닌 흐름 예시예요.</p>
    <ol className="apply-steps" aria-label="정책 신청 안내 단계">{steps.map((label,i)=><li key={label} aria-current={i===step?'step':undefined}><button className="text-button" onClick={()=>setStep(i)}>{i+1}. {label}</button></li>)}</ol>
    {step===0&&<><h4>먼저 어떤 조건을 확인할까요?</h4><p>저장한 나이와 지역을 확인하고, 선택한 공고의 조건과 비교해요.</p><dl><div><dt>저장한 나이</dt><dd>{age?`만 ${age}세`:'미입력'}</dd></div><div><dt>저장한 거주 지역</dt><dd>{personal.regionCode?profileRegionLabel(personal.regionCode):'미입력'}</dd></div><div><dt>추가로 확인할 내용</dt><dd>공고의 연령·거주 조건, 임대차 조건, 소득·재산 및 중복 수혜 제한</dd></div></dl><p>추가 조건은 아직 확인하지 않았어요. 지금 정보만으로 신청 가능하다고 판정하지 않아요.</p></>}
    {step===1&&<><h4>공식 신청 화면에서 진행해요</h4><p>실제 신청할 정책을 선택하면 해당 공고의 공식 신청 경로와 접수 기간을 확인해요.</p><ol><li>공식 공고에서 모집 상태·신청 경로 확인</li><li>공식 사이트에서 사용자가 직접 로그인·본인인증</li><li>신청 항목과 제출할 서류 확인</li></ol><p>이 예시는 외부 신청 화면이나 로그인 상태와 연동되지 않아요. 비밀번호·인증번호는 조이에게 입력하지 마세요.</p></>}
    {step===2&&<><h4>소득 관련 서류가 필요하다면?</h4><p><strong>사용자</strong> “소득 증명을 내라는데 어떻게 준비해?”</p><p><strong>조이</strong> “공고에 적힌 정확한 서류명을 먼저 확인해 주세요. 그 서류의 공식 발급처와 발급 방법을 안내해 드릴게요.”</p><dl><div><dt>확인할 내용</dt><dd>정확한 서류명, 대상 연도, 발급일 기준, 허용 파일 형식</dd></div><div><dt>아직 모르는 내용</dt><dd>이 예시에는 실제 요구 서류가 연결돼 있지 않아요. 소득금액증명 등 특정 서류가 필수라고 단정하지 않아요.</dd></div></dl><p>지금 준비하기 어렵다면 서류 확인할 일정을 남길 수 있어요.</p></>}
    {step===3&&<><h4>서류 확인할 시간을 정할까요?</h4><p>‘월세 지원 조건·서류 확인’을 준비 일정으로 남겨요. 날짜와 시간을 정하고 달력에서 확인한 뒤 저장해요.</p><p>정책에 신청된 상태가 아니며, 신청일·접수번호·마감일을 임의로 만들지 않아요.</p><button className="btn btn-primary" onClick={onSchedule}>조이와 준비 일정 정하기</button></>}
    {step>0&&<button className="btn btn-ghost" onClick={()=>setStep(s=>s-1)}>이전 단계</button>}{step<3&&<button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}>{steps[step+1]} 보기</button>}
  </section>
}
