# 실제 HTTP 백엔드 실행 검증 · 2026-11-20

호스트 Python의 8000 포트 bind가 거부되어 Docker Desktop에서 실제 backend 코드를 실행했습니다. 프론트 ASGI 대체 전송이 아닌 실제 TCP/HTTP 요청입니다.

- 컨테이너: `dos-tres-backend-live`
- 이미지: `dos-tres-backend:local-verification`
- 호스트 공개: `127.0.0.1:8000` → 컨테이너 uvicorn8000
- 기본 데이터: backend 저장소 `data/seed` (프론트 예시 응답 아님)
- DB: 미연결. 백엔드 추천 응답의 `source`는 `file`. 실제 .env·인증키는 이미지에 포함하지 않았음.
- 프론트 기존5173과 검증용5175의 `/api` 프록시를 통해 실제 요청 확인.

## 확인 결과

- `/healthz`: 200
- Vite 프록시 → `/api/checkin/questions`: 200, 9문항
- Vite 프록시 → `/api/checkin/summary`: 200, 선택 변화 영역에 따라 P가 mid로 조정됨
- Vite 프록시 → `/api/recommendations`: 200, 서울 관악구24세 정책6/프로그램4. 응답 summary가 별도 summary 요청과 동일함. why·summary 필드 존재 확인.
- 대전 서구: 200, 빈 프로그램과 no_program_data 안내 확인.

컨테이너에서 호스트 Vite로 접속할 때 `host.docker.internal`을 사용하고 Host 헤더는 `127.0.0.1:5175`로 지정했습니다. 브라우저의 일반 localhost 요청과 동일한 Vite 허용 호스트이며 설정을 완화하지 않았습니다.

브라우저 클릭 검증은 사용자 Chrome 조작과 충돌해 중단했습니다. HTTP 경로 검증과 UI 클릭 검증을 구분합니다. 서버는 사용자가 확인할 수 있도록 실행 상태로 유지했습니다.

중지: `docker stop dos-tres-backend-live`
재시작: `docker start dos-tres-backend-live`
