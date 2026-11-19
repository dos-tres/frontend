# 자가진단 연동 확인 (2026-11-19)

## 실행 결과와 범위

- 실제 백엔드: `../backend/app/main.py`의 FastAPI 앱과 `app/recommend/router.py`의 상태 체크 API.
- 서버 기동 명령 `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`은 앱 시작까지 성공했으나 TCP bind에서 `Operation not permitted`로 종료됨. 서버 기동 성공이나 브라우저 검증 완료로 취급하지 않음.
- 프론트 개발 서버는 Vite가 준비됐다고 보고했으나 현재 명령 실행 환경에서 curl 접속도 실패. 포트 충돌로 5174를 선택한 실행도 있었음.
- 대체 검증은 프론트의 **실제 `src/checkin-api.ts`**를 실행하고 요청을 형제 저장소의 **실제 FastAPI 앱**에 ASGI TestClient로 전달함. 응답을 하드코딩하지 않음. TCP·Vite 프록시·브라우저 UI를 통과하는 검증은 아님.

## 확인한 정상 흐름

| 입력 | 결과 | 판단 |
| --- | --- | --- |
| 문항 조회 | 200, 영역 문항 5개 + 추가 문항 4개 | 실제 문항으로 프론트 구성 가능 |
| 9개 문항 모두 답변 | 200, notes/disclaimer 반환 | 프론트 결과 화면 계약과 일치 |
| 전체 건너뛰기 | 200, notes 빈 배열 | 빈 결과 안내 표시 필요; 현재 구현됨 |
| 영역 문항에 skip 선택 | 200, notes 빈 배열 | 건너뛰기 정상 |
| 관심 분야 4개 선택 | 422 | 프론트 최대 3개 제한 유지 |
| change_wishes에 none과 E 동시 선택 | 422 | 프론트 none 배타 선택 유지 |
| 알 수 없는 선택지 코드 | 422 | 프론트 오류 안내 유지 |

현재 자가진단 정상 흐름을 위해 필수적인 백엔드 계약 변경은 발견하지 못함.
프론트는 영역·추가 문항과 공통 선택지를 받아 표시하고, 답변 ID/코드를 그대로 전송함.
개인정보/활동 입력 저장은 별도 기능이며 현재 서버 저장 API가 없음. 점검 요약 API 역시 계산만 수행하고 저장하지 않음.

## 발견한 백엔드 수정 대상 (재현 및 수정 예시만)

`answers`가 `dict[str, Any]`여서 내부 자료형이 제한되지 않음.
`app/checkin/summary.py`의 `validate()`에서 집합 포함 여부나 `set()`을 먼저 계산하여 TypeError가 발생함.
현재 프론트의 정상 선택 UI에서는 이 입력을 만들지 않지만 잘못된 요청은 500 대신 422로 거절해야 함.

```json
{"answers":{"economy":[]}}
{"answers":{"satisfaction":{}}}
{"answers":{"interests":[{}]}}
```

실제 FastAPI 앱에서 세 요청 모두 500 `INTERNAL_SERVER_ERROR` 재현.
사용자 지시에 따라 백엔드 코드는 변경하지 않았으며 수정 예시는 다음과 같음:

```python
# scalar 문항: economy/participation/outing/conversation/support,
# satisfaction/face_to_face에 적용. 집합 검사 전에 자료형을 확인.
if value is not None and (
    not isinstance(value, str)
    or value not in _valid_codes(question_id) | set(NOT_ANSWERED)
):
    errors[question_id] = "invalid_option"

# multiple 문항: change_wishes/interests에 적용.
# list 원소가 str인지 먼저 확인한 뒤 set() 및 최대 개수/배타 선택 검증.
if values is not None and (
    not isinstance(values, list)
    or not all(isinstance(item, str) for item in values)
    or not set(values) <= _valid_codes(question_id)
):
    errors[question_id] = "invalid_option"
```

## 재실행

프로젝트 가상환경에 backend/requirements-dev.txt의 의존성이 준비돼 있어야 함:

```bash
cd frontend
BACKEND_PYTHON=../backend/.venv/bin/python node scripts/verify-checkin.mjs
```

실제 브라우저 확인은 정상 터미널에서 백엔드와 프론트를 각각 시작하고 진행:

```bash
# backend 폴더
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
# frontend 폴더
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

마이페이지 → 자가진단 → 9문항 응답 → 결과 보기 → 답변 보관 → 마이페이지 재진입.
네트워크 탭에서 GET /api/checkin/questions 및 POST /api/checkin/summary의 200 확인.
개발 프록시는 8000으로 요청을 전달함. API를 별도 origin으로 직접 호출하는 경우 실제 프론트 origin이 백엔드 ALLOWED_ORIGINS에 있어야 함.
