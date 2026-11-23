# 초록 메인 실서비스 스타일

현재 서비스 스타일의 구조·타이포그래피는 유지하고, 주요 버튼·활성 메뉴·선택 상태·포커스를 로고 계열 초록으로 바꾼 대안입니다. 흰색/연회색 배경과 짙은 회색 글자, 오류·모집 상태, 조이 원본의 파란 스카프는 유지합니다.

## 먼저 비교

Vite 개발 서버에서 `/design-previews/service-green.html`을 엽니다. 초록 메인·파랑 메인·원래 화면을 선택할 수 있습니다. 미리보기 안의 앱은 실제 기능이므로 신청 제출이나 개인 정보 변경 없이 비교하세요. 개발 서버 전용 미리보기이며 `/src/` 경로가 없는 빌드 배포에서는 동작하지 않습니다.

## 선택 적용

기본 앱은 미적용 상태입니다. 저장소 루트에서:

```sh
git apply --check design-previews/apply-service-green.patch
git apply design-previews/apply-service-green.patch
npm run build
```

`src/main.tsx`에 `import './service-green-style.css'` 한 줄을 추가합니다. 초록 CSS가 내부에서 `service-style.css`를 불러오므로 두 파일을 따로 import할 필요가 없습니다. 다른 스타일 패치를 적용했다면 먼저 해당 import를 제거하세요.

## 원복

```sh
git apply -R design-previews/apply-service-green.patch
```

또는 `src/main.tsx`의 초록 스타일 import 한 줄만 제거합니다. 기존 앱 파일·데이터·문구는 이 패치에 포함하지 않습니다.

로고 원본 SVG의 진초록 `#426B4A`와 연두 `#91AE72`를 브랜드 변수로 직접 참조합니다. 기존 시안의 기본색도 같은 진초록이었으며, 이번 조정은 선택 배경·아이콘·강조 글자와 hover의 색 일관성을 맞춘 것입니다. 비활성 제출 버튼은 회색을 유지합니다.
