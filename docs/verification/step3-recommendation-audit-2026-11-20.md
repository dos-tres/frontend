# 3-2 추천 응답 → 목록·상세 대조

2026-11-20. 로컬 test/checkin-response-audit에서 기존3-1 기록 보존. 선행 Draft PR #10 head3bd4df5는 변경하지 않았다. backend/FE 기능 코드 무수정. 이번 검증에 사용자 로컬 정보·관심·이력 변경 없음.

## 실행 범위

- 합성 조건: 만28세·서울 관악구·구직 중, 관심 일자리·취업/집·주거. 청년·서울 표본으로 제한.
- Vite5173→backend8000→DB 실제 HTTP 추천 요청: HTTP200/source=db/정책6/프로그램4.
- 실제 FE toProgram과 PolicyDetailPage를 번들해10건을 정적 HTML로 렌더링. 필드 덮어쓰기 여부 검사용으로 원시 요약/기관/장소와 URL은 비민감 대체값으로 바꿔 검사했다. 원본 URL·폼 링크를 증거 파일에 남기지 않음.
-10건 모두 서버 id/title/summary/why/deadline/domains 변환값 보존, 상세 제목·요약·지원·소득·기관·기간·전체 추천 이유가 렌더링에 포함됨. 실제 브라우저 클릭·외부 링크 목적지 재검증은 이번에는 하지 않았다.
- 최초 테스트 실행은 Node에서 React 번들 모듈 로딩 문제로 실패했다. CJS 번들로 실제 컴포넌트 렌더 검사를 다시 실행해10건 통과. 애플리케이션 오류와 검증 도구 오류를 구분함.
- 근거: step3-recommendation-fields-2026-11-20.json. 소스 대조: policy-api.ts/toProgram, use-policy-catalog.ts, PolicyPages.tsx, backend app/recommend/service.py/to_item, export-policy-snapshot.py.

## 필드별 결과

| 서버 값 | 목록·상세 처리 | 판정 |
|---|---|---|
| id/kind/title/summary | 서버 ID·정책/프로그램 구분·제목·요약 유지 | 정상 |
| 정책/프로그램 순서 | 기본순은 서버 배열 순서 유지, 정책6 다음 프로그램4 | 정상. 사용자가 정렬을 고르면 FE에서 재정렬 |
| why | 목록은 첫 이유만, 상세는 전체 | 의도된 요약. 표본1건은 이유2개이며 상세에서 모두 렌더 |
| support | 정책 상세 지원 내용으로 사용 | 정상. BE에서최대300자로 줄인 값이므로 전체 본문 API가 아님 |
| income_condition.text | 상세 소득 조건으로 사용 | 정상 |
| income_condition.kind/max_manwon | 화면용 Program 객체로 변환하면서 빠짐 | 지금 문구 표시에는 문제없지만 후속 챗봇 자격 질문에 필요. 원본 response에는 남아 있음 |
| institution/center/place | 기관/센터·프로그램 장소 표시 | 정상. 빈 장소면 스냅샷 또는 일반 안내 |
| apply_period/deadline/evergreen | 기간·마감·센터 확인 안내 | 정상 매핑. 실제 모집 상태의 정확성은 별도 데이터 정제 이슈 |
| reference_url/url/apply_url/apply_urls | 공고·신청 링크로 변환, http(s) 및 자격증명 없는 URL만 허용 | 소스 매핑 확인. 여러 신청 URL은 첫값만 사용. 외부 목적지 전수 미검증 |
| notice/programs_notice/source | 추천 목록/점검 결과에서 공지·DB/파일 출처 표시 | 사용. 전체 스냅샷 탐색 모드에는 별도 스냅샷 안내 |
| score/situations/access_type | score/situations는 상세 객체에 없음. access_type은 일반 신청방법 생성에만 사용 | 점수를 화면에 노출할 필요는 없음. 후속AI 맥락/자격 조건용 원본을 보존할지는 별도 결정 |
| scope | FE region으로 저장하지만 기존 category가 있으면 카드에서는category를 우선 표시 | 실제 거주 가능 지역의 상세 설명으로 사용하지 않음 |

## 순수 서버 상세가 아닌 부분

backend 추천 응답에는 지원 대상/세부 신청 방법/제출 서류/참여 제한/최종 갱신일이 없다. 프론트는2026-11-19에 생성한 카탈로그와ID를 맞춰 다음 값을 보충한다.

- target: 연령·취업·학력·추가조건을 원본seed에서 묶은 문자열.
- method: 원본 신청 방법 또는 일반 신청 안내.
- documents/exclusions: 수집본에 비어 있지 않을 때만 표시.
- category/ageMin/ageMax/updatedAt: 수집본 메타데이터.

이번10건에는 target/method/category/age범위/updatedAt의 비어 있지 않은 스냅샷 값이 있었고 documents/exclusions는 비어 있었다. 모든 필드가 실제 화면에 채워졌다고 해석하면 안 된다.

이 수집본도 backend seed를 내보낸 자료이며 임의의 가짜 문구는 아니다. 다만 **현재DB 추천과 과거 수집본이 한 상세에 섞이는 구조**다. 표본에서 실제 값 충돌을 확인한 것은 아니지만, DB 갱신만으로 상세 보충 정보가 최신이 되지는 않는다.

## 전체 탐색의 실제 동작

- 기본 ‘조건별 추천’: 서버의6정책/4프로그램.
- 검색어 입력·정책/프로그램 분류·관심 목록: 전체2504건의 프론트 수집본을 검색.
- 이 로컬 목록은 나이·지역·마감 위주 필터이며 서버의job/school/situations/추천 점수를 재현하지 않는다. 따라서 분류를 바꾸면 단순히 추천10건을 필터한 결과가 아니라 다른 목록이 된다.
- 현재 서버에는 전체 목록 검색·개별 상세 API가 없어 위 구조를 사용한다. 화면에서 스냅샷임은 안내하지만, 사용자의 ‘백엔드 응답 최대 활용’ 목표에는 목록/상세 계약 확장이 필요하다.

## 우선순위별 피드백

1. **BE 협의 우선:** 전체 목록과 개별 상세 API 또는 기존 추천의 상세 필드 확장. 추천은 지금처럼 요약으로 두고 상세 선택 시 최신DB에서 전체 내용을 읽는 방식이 적합하다.
2. **FE 후속:** API 연결 전까지 추천정보와 수집본 보충정보의 출처를 상세에서도 구분. 소득kind/max와 필요한 자격 메타데이터는 공고별 원본을 보존해 후속 챗봇이 텍스트를 다시 추측하지 않게 한다.
3. **제품 결정:** ‘맞춤 추천’과 ‘전체 탐색’을 별도 보기로 구분할지 결정. 분류 필터만 바꿨는데 데이터 출처/자격 검사 범위까지 바뀌는 점을 명확히 한다.
4. **BE 데이터 정제 별건:** 기간 불명과상시, 지난 행사/모집 종료를 구분. FE가 본문 날짜로 임의 판정하지 않는다.

## 백엔드 전달용 초안 (미전송)

> 추천 API의 제목·요약·추천 이유·기관·기간·소득 문구는 FE에서 정상 활용하고 있습니다. 다만 지원 대상·세부 신청방법·제출서류·참여제한·최종갱신일과 전체 지원내용은 추천 응답에 없어 과거seed 스냅샷을 섞고 있습니다. 최신DB를 기준으로 개별 상세를 받을 API가 필요합니다. 전체 목록 검색도현재 FE스냅샷이라 job/school 등 서버 자격필터와 다릅니다. 목록/상세 제공 방식과 아래 필드의 계약을 확인 부탁드립니다.

제안 API(미구현): GET /api/catalog/items, GET /api/catalog/items/{id}.

필수 상세: id/kind/title, 전체summary/support, target/자격조건, method, documents, exclusions, age범위/지역조건, institution/center/place, 기간/deadline/상시·기간불명 구분, 공고URL/신청URL목록, income_condition 원본, updated_at/수집시각/source.

목록은 q/kind/지역/나이/현재상태/학교/모집상태 및 페이지정보를 받을지, 추천과 다른 탐색규칙을 쓸지 합의 필요. 필드명은 현재payload/FE와 조정할 수 있으며 위는 구현됐다는 뜻이 아니다.

이번 단계는 검증·협의 초안만 작성했다. 실제 API추가·화면 재설계·원본 추천 변경·추가커밋/푸시/PR갱신은 하지 않았다.
