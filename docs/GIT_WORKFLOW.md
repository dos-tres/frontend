# Git 협업 규칙 — youth-ai-agent/frontend

프론트엔드 저장소의 브랜치·커밋·Pull Request 운영 기준입니다. 디자인 결정 사항은 [JOY 디자인 가이드](design/JOY_design_guidelines.md)에서 별도로 관리합니다.

## 1. 기준 브랜치와 작업 분리
- `main`은 검토된 통합본입니다. 직접 push·commit하지 않고 PR로만 변경합니다.
- 새 작업은 **최신 `main`에서** 브랜치를 하나 만듭니다. *브랜치 하나 = 검토 가능한 작업 하나*입니다.
- `feat/v1`은 초기 코드 이관을 위한 **일회성 예외**입니다. 최초 PR이 병합되면 새 작업의 기준으로 사용하지 않습니다.
- 기존 `feat/home-design`은 초기 통합 전까지 `feat/v1`을 대상으로 하는 **예외적인 후속 PR**입니다. v1이 main에 병합되면 해당 PR의 base를 main으로 변경합니다.
- 다른 작업을 한 브랜치에 추가하지 않습니다. 상위 작업이 완료되지 않았으면 독립된 다른 파일 작업을 분리하거나 필요 시 Draft stacked PR임을 명시합니다.
- **완료된 브랜치**만 병합 후 삭제합니다. 진행 중인 브랜치·사용자 로컬 변경을 임의로 삭제·초기화·강제 push하지 않습니다.

## 2. 브랜치 네이밍
`<type>/<short-kebab-case>` 형식, 영문 소문자·숫자·하이픈 사용. 짧고 구체적으로 이름 짓습니다.

| type | 용도 | 예시 |
| --- | --- | --- |
| `feat` | 사용자 기능 | `feat/assistant-onboarding` |
| `design` | UI·브랜드·에셋 개선 | `design/home-visual` |
| `fix` | 버그·접근성 오류 | `fix/mobile-navigation` |
| `refactor` | 동작을 바꾸지 않는 구조 변경 | `refactor/shared-buttons` |
| `docs` | 문서만 수정 | `docs/pr-guidelines` |
| `chore` | 설정·도구·빌드 | `chore/ci-build` |
| `test` | 테스트 추가·수정 | `test/home-interactions` |

`feat/v2`, `update`, `new`, `test123`처럼 변경 범위가 불분명한 이름이나 개인 이름만 있는 브랜치는 만들지 않습니다.

## 3. 커밋과 PR 제목
- Conventional Commits: `type(scope): 한 줄 요약` (scope 생략 가능).
- 예: `feat(home): add guided chat entry`, `design(joy): align icon palette`, `docs: document branch workflow`.
- 기능 구현·디자인·잡무를 한 커밋에 섞지 않습니다. 제목은 변경 결과를 설명합니다.
- PR 제목도 같은 규칙을 사용합니다.

## 4. PR 작성 기준
PR 본문에 **목적 / 변경 내용 / 검증 / 화면 캡처(UI 변경 시) / 미완성·주의 사항**을 기록합니다. 저장소의 PR 템플릿을 사용합니다.

- 대상(base): 원칙적으로 `main`; 초기 이관 전 이미 진행 중인 홈 PR만 일시적으로 `feat/v1`.
- 기능이 미완성, 검증 또는 디자인 확인이 남았으면 **Draft PR**입니다. 미완성 기능을 완성으로 표현하지 않습니다.
- 확인한 테스트 결과만 기재합니다. 기본적으로 `npm ci`, `npm run build`를 점검하고, UI 변경 시 실제 데스크톱·모바일 화면을 확인합니다.
- 데모용 AI 응답·정책 데이터는 실제 연동으로 표기하지 않습니다.
- PR 하나는 목적 하나를 유지합니다. 의존성을 줄일 수 있으면 에셋/문서/기능 변경을 구분합니다.
- 새 후속 작업은 이전 PR이 병합된 `main` 기준으로 시작합니다. 예외적인 stacked PR은 의존 관계를 명시합니다.

## 5. 리뷰·병합·정리
1. `main` 최신 상태를 확인하고 변경 파일 범위를 점검합니다.
2. 빌드, 기능 검증, UI·접근성 점검과 필요한 리뷰를 마친 뒤 Draft를 해제합니다.
3. PR 승인·검증 후 **Squash and merge**를 기본으로 사용합니다. 병합 권한자의 명시적 결정 없이 자동 병합하지 않습니다.
4. 병합된 브랜치 삭제는 관련 PR과 로컬 작업에 의존성이 없는지 확인한 후 처리합니다.
5. 초기 통합 PR을 병합한 다음 홈 PR의 base를 `main`으로 바꾸고, 브랜딩 브랜치는 v1에 포함되었으므로 중복 PR로 올리지 않습니다.
