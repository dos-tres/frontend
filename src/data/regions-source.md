# 지역 코드 원본

- 제공처: [행정표준코드관리시스템 · 법정동코드목록조회](https://www.code.go.kr/stdcode/regCodeL.do)
- 다운로드: 페이지의 **법정동 코드 전체자료**, 2026-11-20 직접 다운로드.
- 원본: `assets/administrative/legal-dong-codes-2026-11-20.zip` (내부 CP949 TSV)
- 원본 SHA-256: `44a3fe4cacf88ce98e35fb883807d2725b589f427ff4d73ee40b914d1286bacd`
- 전체 53,403행 중 `폐지여부=존재`인 20,560행만 사용.
- 시·도 16개, 시군구/시 전체 코드 269개, 읍면동 5,067개. 자료 내려받은 시점의 현존 코드이며 과거 지역명을 임의로 섞지 않음.

재생성: `python3 scripts/import-administrative-regions.py`.
검증: `python3 scripts/verify-administrative-regions.py`.

`administrative-regions.json`은 시·도/시군구 전체와 원본 메타데이터를 담습니다.
`regions.json`은 마이페이지 검색용 시군구 5자리 및 법정 읍면동 8자리 코드/이름입니다.
정책 API가 사용하는 시군구 코드가 법정동코드의 앞 5자리이므로 이 사전을 사용합니다. 통계용 행정구역코드나 행정동코드를 같은 숫자라고 가정하여 혼용하지 않습니다.

시 전체(수원시 등)와 하위 일반구(수원시 영통구 등)를 원본 그대로 보존하며 시 전체 선택 시 하위 구의 정책도 탐색합니다.
지역 선택지는 수집된 정책 건수나 기관명에서 유추하지 않습니다. 폐지된 지역은 포함하지 않습니다.
