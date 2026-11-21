# 3-1 생활 점검: 서버 문항·계산과 프론트 표현 대조

2026-11-20. 선행 Draft PR #10 head3bd4df5 위의 로컬 후속 브랜치 test/checkin-response-audit에서 읽기/검증만 수행했다. backend·FE 기능 코드 변경 없음. 사용자 로컬 입력/이력을 변경하지 않았다. 이 문서는 PR #10에 추가로 push하지 않았다.

## 실제 API 검증

- Vite5173→backend8000→DB 실제 HTTP. 서울 관악구 만28세의 합성 조건만 사용.
- GET /api/checkin/questions: HTTP200,9문항.
- 서로 다른 두 응답을 POST /api/checkin/summary 및 /api/recommendations에 전달: 모두200, 추천source=db,6정책4프로그램. 추천summary와 별도 summary가 동일.
- high 응답이어도 change_wishes=['none']이면 서버는5영역을mid로 조정한다. 실제 FE buildStateResult에 그 응답을 넣었을 때 모든 영역이 ‘함께 살펴볼 도움 영역’으로 출력됨. 원래 high 입력으로 덮어쓰지 않음.
- low 응답의5영역은low, 우선순위[]이며 실제 FE 변환도 모든 영역을 낮은 우선순위로 출력.
- 근거: step3-checkin-response-2026-11-20.json. 해당 합성 시나리오의 브라우저 클릭 재현은 이번에 하지 않았고, 실제 HTTP와 FE 변환 함수 대조로 검증했다.

## 소유권/사용 대조

| 항목 | 서버 응답 | 프론트 사용 | 판정 |
|---|---|---|---|
| 질문·안내 | questions/notice | 질문 본문과 안내 표시 | 사용 |
| 질문 선택지 | options 코드와 라벨 | 일부5점/예아니오 라벨은 FE 재구성 | 표현 변환. 변경 계약 필요 |
| 영역 수준 | levels | 결과5영역 상태로 변환 | 계산값 유지 |
| 우선순위 | priority_domains | 유형 순서·주 제목 유형 선택 | 우선순위 유지. P/O는 같은 유형태그로 묶지만5영역은 별도 표시 |
| 미응답 | unanswered_domains | 미확인 영역과 전체 탐색 유형에 반영 | 사용 |
| 조정·선호 설명 | lowered_domains/face_to_face 및 notes | notes 전체 출력, 조정된levels 사용 | 사용 |
| 만족도/관심 | satisfaction/interests | 한글 만족도·관심 표시 | 사용 |
| 진단 아님 안내 | disclaimer | 서버 문구 출력 | 사용 |
| 결과 제목·본문·영역 한글 라벨 | 서버 제공 없음 | typeInfo 등FE 고정문구 | 서버 문장 그대로가 아님 |
| 정책·프로그램 | recommendations | 실제 목록·이유·소득조건·기관·기간/안내 | 기존 구현 사용. 상세 대조는 다음3-2 |
| 조건 부족/실패 | FE 상태 및 오류 | 고정 공식 안내/로컬 요약 | 맞춤 추천·서버 계산과 구분 필요 |

## 첫 피드백

현재 계산은 BE가 하고 프론트가 제목·설명을 붙이는 구조다. 사용자가 원하는 ‘백엔드 응답을 최대한 살리기’에 맞춰 다음 두 항목을 결정하면 된다.

1. 결과 제목·설명·영역 라벨을 BE에서 제공할지, FE의 친근한 표현 사전으로 유지할지. BE가 책임지려면 title/description/domain_summaries(영역code,label,status_text) 같은 선택 필드를 summary에 추가하는 방식을 협의할 수 있다. 제안 필드이며 현재 구현돼 있지 않다. 중복 계산은 필요 없다.
2. 현재5점UI는 low/low/mid/high/high(만족도bad/bad/normal/good/good)로 변환한다. 예를 들어4점과5점은 서버 계산이 같을 수 있다. 정확한5점 분석이 필요하면 ratings 계약을 BE에 추가해야 하며, UI에 숫자만 더 받아놓고 서버가 세밀히 계산한다고 표시하면 안 된다.

확인되지 않은 장애로 BE 수정을 요구하지 않는다. 위는 제공 책임/제품 규칙 협의 초안이며 외부로 전송하지 않았다. 다음은3-2 추천 응답→목록·상세·공식 링크에서 생략/덮어쓰기/스냅샷 보충 필드를 대조한다.
