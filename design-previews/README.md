# 파랑 실서비스 스타일

파랑 실서비스 스타일은 `src/main.tsx`에서 `src/service-style.css`를 불러와 **기본 앱에 적용**됩니다. 별도 미리보기 주소 없이 `/`에서 확인할 수 있습니다.

정책 목록에는 카드 안쪽 여백, 본문과 버튼 열 분리, 태그 간격 및 모바일 하단 버튼 정렬을 적용했습니다. 기존 로고·조이 이미지·기능은 유지합니다.

## 파일

- 기본 스타일: `src/service-style.css`
- 연결 위치: `src/main.tsx`
- 기존 비교 페이지: `/design-previews/service.html` (Vite 개발 서버 전용)

`apply-service.patch`는 과거 선택 적용을 위한 import 패치입니다. 현재는 이미 적용된 상태이므로 다시 실행할 필요가 없습니다. 초록·섬 등 다른 스타일 대안은 기본 적용에 포함하지 않습니다.

파랑 스타일을 해제하려면 `src/main.tsx`에서 해당 import 한 줄을 제거합니다. 원본 `styles.css`는 그대로 남아 있습니다.
