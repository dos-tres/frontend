# 섬 디테일 스타일 — 선택 패치

흰 화면을 기본으로 두고, 조이 아래 작은 육지·모래 해안·바다색 물결 한 장면만 추가합니다. 아래 바로가기 영역에는 옅은 모래색과 가는 구분선을 사용하고, 기존 반복 카드 테두리를 줄입니다. 추가 이미지나 로고 변경은 없습니다. 초록은 주요 행동과 활성 상태에 유지합니다.

- 개발 서버 미리보기: `/design-previews/service-island.html`
- 비교: 섬 디테일 / 초록 메인 / 파랑 메인 / 원래 화면
- 파일: `src/service-island-style.css`
- 의존: 해당 CSS가 `service-green-style.css`와 `service-style.css`를 차례로 불러옵니다. 세 파일을 함께 보관합니다.

## 적용

다른 대안의 import가 없는 상태에서:

```sh
git apply --check design-previews/apply-service-island.patch
git apply design-previews/apply-service-island.patch
npm run build
```

앱 진입점에 `import './service-island-style.css'` 한 줄을 추가합니다. 현재는 미적용입니다.

## 원복

```sh
git apply -R design-previews/apply-service-island.patch
```

미리보기는 Vite 개발 서버 전용이며 실제 앱 기능이 동작합니다. 확인 중에는 신청 제출이나 개인정보 변경을 하지 마세요.
