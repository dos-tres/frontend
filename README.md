# Youth AI Agent · Frontend v1

Figma의 `02 와이어프레임` 12개 화면을 기준으로 만든 React + TypeScript + Vite 프론트엔드 스타터입니다.

## 개발 환경

- Node.js 22 LTS, npm
- React 18 · TypeScript · Vite
- 저장소: `youth-ai-agent/frontend`
- v1 작업 브랜치: `feat/v1`

## 처음 실행

```bash
git clone https://github.com/youth-ai-agent/frontend.git
cd frontend
git switch feat/v1
```


```bash
npm install
npm run dev
```

브라우저에서 터미널에 표시된 주소(기본 `http://localhost:5173`)를 엽니다. 종료는 `Ctrl+C`입니다.

캐릭터·배경 PNG 6개는 `assets/images.json`에 원본 바이트를 보관합니다. `npm install`, `npm run dev`, `npm run build`에서 `scripts/restore-assets.mjs`가 `src/assets/`로 자동 복원합니다. 별도 이미지 다운로드는 필요하지 않습니다.

## 빌드 및 미리보기

```bash
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. 미리보기 주소는 터미널에서 확인합니다.

## 파일 구성

| 경로 | 역할 |
|---|---|
| `src/App.tsx` | 화면 구성·사용자 상호작용 |
| `src/data.ts` | 시연용 정책·센터·일정 데이터 |
| `src/styles.css` | 스타일·반응형 레이아웃 |
| `src/main.tsx` | React 진입점 |
| `assets/images.json` | PNG 원본 데이터 |
| `scripts/restore-assets.mjs` | 이미지 자동 복원 |

## 협업

`feat/v1`은 첫 화면 구현을 담은 브랜치입니다. 이후 기능은 `feat/기능명` 브랜치에서 작업하고 PR로 검토합니다. API 키와 `.env`, `node_modules`, `dist`는 커밋하지 않습니다.

## 주요 화면

1. AI 비서 홈
2. 조이 AI 대화
3. 실제 신청 도우미
4. 정책·활동 탐색
5. 정책·활동 상세
6. 주변 청년센터 탐색
7. 청년센터 상세
8. 내 일정 캘린더
9. 신청 이력 관리
10. 마이페이지 · 나의 연결
11. 마이페이지 · 내 기록
12. 서비스 안내

## 현재 구현 범위

- 상단 메뉴로 12개 화면 전환
- 홈의 빠른 질문 및 AI 대화 화면 전환
- 대화 입력과 예시 응답(실제 AI API 미연결)
- 정책 검색·분류 필터·관심 저장
- 정책 상세에서 신청 도우미로 이동
- 주변센터 목록·상세 이동
- 캘린더 월 이동 및 일정 등록
- 신청 이력 상태 변경
- 프로필 지역/관심 분야 수정
- 모바일 반응형 레이아웃

## 아직 연결해야 하는 것

- 실제 AI 에이전트 API
- 정책·프로그램 공식 데이터/API 및 출처 링크
- 청년센터 데이터와 실제 지도/위치 권한
- 로그인·사용자별 저장소·신청 이력 DB
- 실제 신청 페이지 연결 및 캘린더 동기화

화면의 정책·센터·일정 정보는 동작 확인용 가상 예시입니다. 실제 모집 중인 정보가 아닙니다.

## 브랜드 메모

서비스명은 미정이므로 화면에 최종 서비스명을 넣지 않았습니다. `조이`는 캐릭터 이름으로 유지했습니다.
