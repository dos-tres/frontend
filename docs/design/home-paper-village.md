# 홈 디자인 시안 · 종이 섬에서 연결되는 일상

2026-11-21. 사용자 요청: 기존 홈 기능을 유지하며 둘셋 로고 색, 정보 위계, 아이콘, 종이마을 세계관을 정리한다. `dos-tres/docs`의 `design/assets/paper-village/source-pack/`을 재사용하고 필요한 그림은 추가 생성한다. 기능 개발과 별도 브랜치에서 병행하는 검토용 코드다.

## 범위와 협업

- 최신 main `c918447`에서 `design/home-paper-village` 분기. 과거 홈 PR #1은 closed, 원격 브랜치는 삭제된 상태임을 확인했다.
- HomePage를 독립 파일로 추출하고 기존 onSend/onNavigate/completed 계약을 유지했다. App.tsx는 import, 이전 홈 제거, 홈 범위 class 적용만 변경한다.
- home-page.css와 홈 에셋이 주 변경 지점. 공통 styles.css, API, 저장소, 다른 화면 구현은 수정하지 않는다.
- 다른 기능 브랜치와 동시에 진행할 수 있지만 App.tsx의 import/홈 호출부가 같이 바뀌면 수동 충돌 해결이 필요할 수 있다. main 통합은 디자인 검토 후 별도 진행한다.
- 미완료 상태에는 기존 setup으로 이동하고, 완료 상태에는 state-check로 이동한다. setup 강제 진입 없이 대화부터 사용할 수 있다.

## 시각적 규칙

공식 23 섬 로고와 초록 #426B4A·연두 #91AE72를 재사용한다. 잉크 #393653·아이보리 #F7F1EB·조이 블루 #7799E2는 기존 조이 기준을 유지한다. 초록은 브랜드·안내·여정, 파랑은 AI 대화 입력에 사용한다. 홈 토큰은 home-design-shell 범위이며 다른 화면 팔레트에 영향을 주지 않는다.

가장 큰 영역은 조이와 대화하는 곳이다. 취업·주거·교류는 출발점이며 별도 가상 기능으로 만들지 않는다. 오른쪽에는 나를 알아가는 시작과 주변센터를 배치한다. 하단의 섬→다리→마을은 프로필→정책 탐색→일정이라는 실제 다음 행동에 연결한다. 섬 탐험이나 가상 광장 기능을 추가하지 않는다.

## 원본 에셋

출처: `dos-tres/docs` commit `d5738fb322f5e48b2c17f450bd60349548cdb8b7`의 `design/assets/paper-village/source-pack/assets/png/`.

| 원본 상대 경로 | 이 브랜치의 경로 | 용도 |
|---|---|---|
| characters/joy-original.png | src/assets/paper-village/joy-original.png | 홈의 조이, 외형·색상 변경 없음 |
| icons/briefcase.png | src/assets/paper-village/briefcase.png | 취업·진로 |
| icons/home.png | src/assets/paper-village/home.png | 경제·주거 |
| icons/chat.png | src/assets/paper-village/chat.png | 사람·활동 |
| icons/checklist.png | src/assets/paper-village/checklist.png | 나에게 맞는 시작 |
| buildings/center-isolated.png | src/assets/paper-village/center-isolated.png | 주변센터 장식 |
| props/paperplane-smooth.png | src/assets/paper-village/paperplane-smooth.png | 연결 모티프 |

큰 원본은 비율을 유지하고 최대 800px로 축소했다. 작은 아이콘은 원본 그대로다. 실제 경로와 크기·검토 상태는 asset-manifest.json에 등록했다. 확정 로고는 public/brand 원본을 사용한다.

## 추가 생성 그림

- 도구: 기본 제공 image_gen (CLI/API 대체 사용 없음).
- 파일: `src/assets/illustrations/opportunity-bridge.png`.
- 참고: source-pack의 backgrounds/island-full-scene.png를 스타일 참고로만 제공.
- 새 캐릭터나 로고는 만들지 않았다. 투명한 종이 다리·두 섬·청년 공간 그림을 만들고 최대 1100px로 축소했다.
- 상태: 사용자 디자인 검토 전.

최종 생성 프롬프트:

```text
Use case: stylized-concept. Create one transparent PNG illustration asset for Dos Tres youth support web homepage, NOT a whole website. Reference image is STYLE reference only: preserve warm ivory folded paper, subtle grain, isometric cut-paper craft and gentle soft shadows. Subject: a compact graceful curved pale wooden footbridge joining two small green paper islands, with one tiny blue roof community building and two folded paper trees on the far island, and a tiny ivory paper boat below the bridge. Sophisticated restrained editorial illustration for young adults, not children's toy. Palette: muted forest green #426B4A, sage #91AE72, ivory #F7F1EB, small blue #7799E2 accent. Wide horizontal composition, full asset visible with generous transparent margins, bridge runs left-to-right, no big water/background rectangle. No people, no JOY character, no words, no letters, no logos, no UI, no watermark. Asset is a visual metaphor of connecting to opportunities, must be clean and readable when rendered at 400px width. Output actual transparency.
```

## 로컬 검토

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5187 --strictPort
```

별도 origin/포트이므로 기존 개발 화면의 브라우저 저장 데이터와 분리된다. 기존 API 프록시 설정은 그대로이며 백엔드가 필요하면 기존 실행 환경에 연결한다. 이 디자인 작업에서 서버·데이터베이스·외부 신청을 변경하지 않았다.
