# phase5 · 전체 사용 시간 / SNS·숏폼 시간 분리 표시

수정 파일: `src/components/ReportScreen.tsx` (단일 파일)
읽기만 함: `src/lib/blocker.ts`, `src/types.ts`, `src/data/appCategories.ts`

## 한 일

### 1. 두 지표 분리

- `SNS_CATEGORY_IDS = { SHORTFORM, SOCIAL, STREAMING, COMMUNITY }` (모듈 상단 상수)
- `snsMinutesByDateMap` — 날짜별로 `ScreenTimeDay.apps` 를 돌며
  `getCategoryForPackage(packageName).id` 가 위 집합에 들면 합산. `useMemo` 로 캐시.
- 접근자 두 개로 정리:
  - `getTotalUsageMinutes(date)` → `ScreenTimeDay.totalMinutes` (실제값 없으면 0)
  - `getSnsMinutes(date)` → SNS 계열 합산, 실제값 없으면 기존 `DailyReport.totalSnsMinutes`

### 2. 요약 카드

- 'SNS 이용 시간' 카드의 큰 숫자 = **SNS 계열 합산** → 라벨과 숫자가 일치.
- 그 아래 한 줄 추가: `전체 182분 중 26%` (실제 스크린타임이 있을 때만).
  카드는 선택 여부에 따라 흑/백이 뒤집히므로 색을 새로 쓰지 않고 `opacity-60` 만 썼다.
  → 검정 카드에서는 흰 글자, 흰 카드에서는 검은 글자로 자동으로 맞는다.

### 3. 주간 그래프 — 한 막대에 겹쳐 표시 (단순한 쪽)

막대를 둘로 늘리지 않고 **기존 트랙 하나 안에서** 처리했다.

- 옅은 회색(`bg-slate-300`) = 그날 전체 사용 시간
- 검정(`bg-black`) = 그날 SNS·숏폼 시간 (기존 막대 색 그대로)
- 오른쪽 숫자: `47분 / 182분` (뒤쪽은 `text-slate-400`)
- 눈금 상한은 둘 중 큰 쪽 기준 `max(240, 그 주 최댓값)`
- 범례는 '주간 잠금 달성 현황' 카드에 이미 있는 형식(`w-3 h-3 rounded` 칩)을 그대로 복사

'지켜낸 시간' 탭과 실제 스크린타임이 없을 때는 예전처럼 검정 막대 하나만 나온다.

### 4. 화면 복귀 시 자동 재조회

- 조회 로직을 `loadScreenTime(days, force)` 로 뽑았다.
  `force=false` 면 예전처럼 "더 긴 범위가 필요할 때만" 부른다.
- `document.addEventListener('visibilitychange', ...)` → `visible` 이 되면 `force=true` 로 재조회.
  권한 설정 화면에 다녀오면 그대로 갱신된다. 새 UI 요소 없음.
- 리스너가 최초 `requiredDays` 에 묶이지 않도록 `requiredDaysRef` 로 최신값을 읽는다.

## 검증

- `npx tsc --noEmit` 통과 (에러 없음)
- `npx vite build` 성공

## 리더 판단 필요 — 손대지 않은 것

1. **SNS 합산은 매핑표 커버리지에 그대로 묶인다.**
   `appCategories.ts` 에 없는 앱은 전부 `ETC` 로 떨어져 SNS 합계에서 빠진다.
   즉 '전체 182분 중 SNS 47분'의 47분은 **과소 집계 쪽으로 틀릴 수 있다**.
   (전체 사용 시간은 매핑과 무관하므로 정확하다.)
   대응이 필요하면 매핑표 확충(state-data 영역)이 유일한 길이다.

2. **`WEBTOON` 을 SNS 계열에 넣을지.**
   지시대로 SHORTFORM/SOCIAL/STREAMING/COMMUNITY 4종만 넣었다.
   웹툰은 '다음 화'로 이어지는 소비 패턴이라 디톡스 관점에서는 후보가 될 수 있다.

3. **'가장 오래 쓴 앱' 카드는 여전히 전체 앱 기준**(SNS 계열로 거르지 않음).
   카테고리 칩이 붙어 있어 구분은 되지만, SNS 계열만 보여주는 선택지도 있다.

4. **`visibilitychange` 재조회는 매번 실제 호출을 한다.**
   포그라운드로 돌아올 때마다 네이티브를 부르므로, 잦은 전환에서는 낭비가 있을 수 있다.
   (조회 자체는 가벼운 편이라 스로틀은 넣지 않았다. 필요하면 "마지막 조회 후 N초" 조건 추가.)

5. **`DailyReport.totalSnsMinutes` 의 존재 의의.**
   실기기에서는 이제 거의 쓰이지 않는 폴백 전용 값이 되었다. 앱 내 측정을 계속 유지할지는
   별도 판단이 필요하다(측정 코드는 이번 범위 밖이라 건드리지 않았다).
