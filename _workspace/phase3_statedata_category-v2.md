# Phase 3 · state-data — 카테고리 매핑표 v2

수정 파일: `src/data/appCategories.ts`, `src/types.ts` (그 외 무수정)

## 1. 안드로이드 폴백 제거 — 3단계 → 2단계

```
자체 매핑표(내장 + 원격 병합본) → 기타
```

`getCategoryForPackage(packageName: string): AppCategory` — `systemCategory` 파라미터를 **시그니처에서 제거**했다.
`InstalledApp.systemCategory` 필드는 남겼지만 주석에 "분류에 쓰지 않음 / 진단용"을 명시했다.

실측 근거(미분류 57%, "소셜" 12개에 인스타·카카오톡·Chrome·당근 혼재, 안드로이드 카테고리 8종의 구조적 한계)를 파일 상단 주석에 수치와 함께 남겼다.

**브라우저 카테고리 신설.** Chrome이 안드로이드 기준 "소셜"로 잡히던 문제를 근본적으로 분리했다. `defaultLocked: false` — 잠그면 검색까지 막히므로 기본 해제, 대신 설명에 "앱을 잠가도 웹으로 우회 가능한 경로"를 명시해 사용자가 의식적으로 선택하게 했다.

## 2. 매핑표 확대 — 93개 → **198개**

| 카테고리 | 개수 | 비고 |
|---|---:|---|
| 게임 | 59 | NC 3종·오딘·검은사막·쿠키런 등 국내 + 글로벌 캐주얼 대량 |
| 소셜/메신저 | 30 | 카카오톡·밴드·비트윈 + 텔레그램 3변종, 왓츠앱 2변종 |
| 쇼핑/배달 | 23 | 쿠팡·배민·당근·11번가·무신사·지그재그·오늘의집 등 |
| 브라우저 | 19 | 🆕 크롬 4변종, 삼성인터넷 2변종, 웨일, 파폭 3변종 등 |
| 숏폼/영상 | 15 | 틱톡 **5변종**, 인스타 2변종, SOOP, 트위치 |
| 음악/오디오 | 14 | 멜론·지니·벅스 + 글로벌 |
| 뉴스/커뮤니티 | 13 | 네이버 3종·다음 2종·디시·에타·블라인드 |
| 금융/페이 | 10 | 토스·카뱅·페이코·업비트·빗썸 (전부 defaultLocked false) |
| OTT/스트리밍 | 9 | 넷플릭스·티빙·웨이브·왓챠·디즈니+ |
| 웹툰/웹소설 | 6 | 네이버웹툰·시리즈·카카오페이지·리디·레진 |
| **합계** | **198** | 중복 키 0건 |

**300개에 못 미친 이유를 그대로 보고한다.** 목표치를 채우려면 국내 앱 100여 개를 추측으로 넣어야 했다. 틀린 패키지명은 조용히 차단 실패로 이어져 "안 막힌다"는 신뢰 붕괴를 만들고, 매핑표가 유일한 분류 근거가 된 지금은 그 비용이 더 커졌다. 그래서 **확실한 198개만 넣고, 나머지 후보 약 70건을 파일 하단 "검증 필요" 주석에 카테고리별로 정리**했다. 실기기 1회 덤프(`adb shell pm list packages` 또는 `AppListHelper` 로그)로 대부분 확정 가능하며, 확정분을 옮기면 270개 내외가 된다.

우선순위가 높은 검증 대상: 케이툰(실측 목록에 있었음), 치지직, 쿠팡플레이, 카카오웹툰, 컬리, 에이블리, 올리브영, 블루 아카이브, 메이플M, 에펨코리아, 뽐뿌, FLO, 네이버페이.

## 3. 원격 갱신 구조 (fetch 미구현, 인터페이스 + 병합만)

타입(`src/types.ts`):
- `AppCategoryMapping { version, updatedAt, packages }` — 내장본·원격본이 같은 모양
- `RemoteMappingSource { fetchMapping(currentVersion): Promise<AppCategoryMapping | null> }` — 서버가 생기면 이것만 구현
- `MappingApplyResult { applied, version, packageCount, reason? }`

동작(`src/data/appCategories.ts`):
- `BUILTIN_MAPPING` (version 2) — 앱 내장 기본값
- `mergeMapping(base, remote)` — 같은 키는 **원격이 우선**(오분류 긴급 수정 경로), 새 키는 추가
- `applyRemoteMapping(raw: unknown)` — 검증 후 반영. 병합 기준은 **항상 내장본**이라 여러 번 받아도 결과가 같다(멱등)
  - 거부 사유: `invalid-format` / `stale-version`(version ≤ 현재) / `empty-packages` / `exception`
  - 모르는 카테고리 id·비문자열 값은 조용히 걸러낸다
- `syncMappingFrom(source)` — 네트워크 실패를 흡수(`fetch-failed`), 갱신 없음은 `no-update`
- `resetMappingToBuiltin()` — 원격본 폐기
- 실패 경로 전부에서 **내장 기본값으로 계속 동작**한다. 오프라인에서도 조회가 정상 작동함을 확인했다.
- `applyRemoteMapping`이 raw `unknown`을 받으므로 localStorage 캐시본을 그대로 넣어도 된다(캐시 저장 자체는 storage.ts 담당, 이번 범위 밖).

## 4. 검증

`npx tsc --noEmit` — **에러 0건** (지난 단계에서 보고했던 `NewHomeScreen.tsx` TS2304는 그 사이 해소됨).

`tsx`로 런타임 동작 확인 (스크래치패드, 저장소 미포함):
- 인스타→숏폼, 카카오톡→소셜, 크롬→브라우저, 미등록 앱→기타, 빈 문자열→기타
- 소문자 변형 `com.mihoyo.genshinimpact`→게임, `com.slack`→소셜 (대소문자 흡수 인덱스 정상)
- `groupPackagesByCategory` priority 순 정렬 + 빈 카테고리 제외
- 원격 병합: version 3 적용 시 크롬 override 반영(브라우저→기타), 신규 키 추가, 잘못된 카테고리 값 `bad.pkg` 폐기 → 198 + 1 = 199
- 낮은 버전 거부, 깨진 값 거부, fetch 예외 시 내장본 유지 후 조회 정상
