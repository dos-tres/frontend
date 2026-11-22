# 실서비스 스타일 패치

기존 둘셋의 콘텐츠와 기능을 유지하면서 글자 위계, 메뉴, 입력창, 버튼, 카드와 여백을 정돈하는 선택 스타일입니다. 원본 CSS와 앱 진입점은 변경하지 않았습니다.

## 미리보기

개발 서버 실행 후 `/design-previews/service.html`을 엽니다. 이 페이지는 실제 앱을 iframe으로 열고 해당 창에만 `src/service-style.css`를 적용합니다. 상단 버튼으로 기존 스타일과 비교할 수 있습니다. 배포 빌드에서는 `/src/` 경로를 제공하지 않으므로 이 미리보기는 Vite 개발 서버 전용입니다.

미리보기 안의 앱 기능은 실제로 동작합니다. 디자인만 확인할 때는 신청 제출이나 개인 데이터 변경을 실행하지 마세요.

## 적용

프론트 저장소 루트에서:

```sh
git apply --check design-previews/apply-service.patch
git apply design-previews/apply-service.patch
npm run build
```

패치는 `src/main.tsx`에 `import './service-style.css'` 한 줄을 추가합니다. `src/service-style.css`는 이미 포함돼 있습니다. 다른 선택 스타일을 사용 중이면 먼저 해당 import를 제거합니다.

## 적용 해제

```sh
git apply -R design-previews/apply-service.patch
```

또는 `src/main.tsx`에서 추가한 import 한 줄만 제거합니다. 현재 PR은 스타일을 기본 적용하지 않습니다.
