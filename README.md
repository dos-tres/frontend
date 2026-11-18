# 둘셋 (Dos Tres) · Frontend

둘셋은 청년정책과 지역 활동을 찾고 신청 준비까지 돕는 AI 비서 서비스입니다. 서비스 안의 AI 비서·캐릭터 이름은 조이(JOY)입니다. Figma의 `02 와이어프레임` 12개 화면을 기준으로 만든 React + TypeScript + Vite 프론트엔드입니다.

## 개발 환경

- Node.js 22 LTS, npm
- React 18 · TypeScript · Vite
- 저장소: `dos-tres/frontend`
- 기준 브랜치: `main`

## 처음 실행

```bash
git clone https://github.com/dos-tres/frontend.git
cd frontend
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
| `public/brand/` | 확정 둘셋 로고 3종의 SVG·PNG 원본 |
| `docs/design/BRAND.md` | 서비스명·영문명·공식 로고 기준 |
| `assets/images.json` | PNG 원본 데이터 |
| `scripts/restore-assets.mjs` | 이미지 자동 복원 |

## 협업

모든 신규 작업은 최신 `main`에서 독립 브랜치를 생성하고 `main` 대상 PR로 검토합니다. `main`에 직접 commit·push하지 않습니다. 진행 중인 홈 디자인은 기존 `feat/home-design`과 Draft PR #1에서 이어갑니다. [브랜치·커밋·PR 규칙](docs/GIT_WORKFLOW.md)을 따릅니다. API 키와 `.env`, `node_modules`, `dist`는 커밋하지 않습니다.

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

## 확정 브랜드

서비스명은 **둘셋**, 영문명은 **Dos Tres**입니다. **조이(JOY)**는 둘셋 안의 AI 비서·캐릭터 이름입니다.

공식 로고는 초록색 **23 섬 심볼**입니다. `public/brand/`에 섬 심볼·둥근 사각형·원형의 SVG와 PNG 원본 6개를 보관합니다. 상단과 브라우저 탭 파비콘에는 동일한 투명 배경 섬 심볼을 사용합니다. Apple 홈 화면 바로가기 아이콘은 둥근 사각형 원본을 유지합니다. [브랜드 기준](docs/design/BRAND.md)에서 사용처와 정확한 색상을 확인합니다.

## 디자인·이미지 작업

- [둘셋 이름·공식 로고 기준](docs/design/BRAND.md)
- [캐릭터·아이콘 제작 및 적용 기준](docs/design/README.md)
- [필요 이미지와 제작 상태](docs/design/asset-manifest.json)
- [기준 이미지·참고 자료 폴더](docs/design/references/README.md)
- [로컬 Codex 작업 지침](AGENTS.md)

[확정 캐릭터 참고 시트](docs/design/references/joy-character-sheet.png)를 기준으로 형태·얼굴·종이 질감·파란 스카프를 유지합니다. 팔레트는 현재 공통 기준으로 고정하며, 명시적인 변경 요청이 있을 때만 함께 갱신합니다. 인사·생각 포즈 SVG는 사용 가능하지만 기본 시트에서 분리한 개별 투명 PNG와 전용 아이콘 파일은 준비 예정입니다.

