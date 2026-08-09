# phase7 · '지켜낸 시간'을 실제 잠금 이력으로 교체 + 가짜 시드 제거

수정 파일: `src/components/ReportScreen.tsx`, `src/lib/storage.ts`(시드 제거만)
읽기만 함: `src/lib/blocker.ts`, `src/types.ts`, `src/data/appCategories.ts`

## 1. 잠금 이력 조회

- 기존 `loadScreenTime` 을 `loadNativeData(days, force)` 로 넓혀 스크린타임과
  `Blocker.getLockHistory({ days })` 를 **같은 `requiredDays`** 로 함께 가져온다.
- 둘은 실패 이유가 다르므로(권한 vs 기록 없음) `try/catch` 를 따로 두고 상태도 따로 잡는다.
  `screenTimeState` / `lockHistoryState` (`loading | ready | unsupported | failed`).
- 웹 브라우저는 예전처럼 호출 자체를 건너뛰고 `unsupported`.
- `visibilitychange` 재조회(30초 스로틀)도 둘 다에 그대로 적용된다.

## 2. '지켜낸 시간' = heldMinutes 합

```
getFocusMinutes(date) = 실제 이력 있으면 Σ heldMinutes, 없으면 DailyReport.completedFocusMinutes
getPlannedMinutes(date) = Σ plannedMinutes (비교용)
```

- 요약 카드의 큰 숫자, 주간 그래프 모두 이 값을 쓴다.
- 60분 걸고 10분 만에 미션으로 풀면 **10분**으로 잡힌다.
- 눈금 상한도 SNS 쪽과 같은 규칙(`max(240, 그 주 최댓값)`)으로 통일했다.
  기존 고정 240분에서는 긴 잠금이 전부 100%로 붙었다.

## 3. '주간별 잠금' 표시 — 세 군데

기존 마크업만 재사용했다. 새 색·새 컴포넌트 없음.

1. **'지켜낸 시간' 카드 하단** (SNS 카드의 비율 줄과 같은 자리·같은 클래스)
   → `잠금 6회 · 계획의 82%`
2. **주간 그래프 막대** — SNS 탭에서 쓰던 2색 막대를 그대로 적용.
   옅은 회색 = 그날 **설정한 시간**, 검정 = **지켜낸 시간**. 오른쪽 숫자는 `47분 / 60분`.
   범례 문구만 탭에 따라 바뀐다(지켜낸 시간 / 설정한 시간).
3. **'주간 잠금 기록' 카드** (지켜낸 시간 탭에서 그래프 아래, '가장 오래 쓴 앱' 카드와 같은 구조)
   - 요약 한 줄: `잠금 6회 · 설정한 300분 중 82% 달성 · 끝까지 채움 4회 · 잠근 앱 열기 시도 12회`
   - 세션별 행 최대 5개: 날짜 칩 · 시작 시각 · 종료 사유 칩(`끝까지` / `미션 해제`) ·
     `heldMinutes / plannedMinutes` · 달성률 막대. 6건 이상이면 `외 N건` 한 줄.

또한 **'주간 잠금 달성 현황' 그리드의 판정을 실제 이력 기준으로** 바꿨다.
이력이 있으면 그날 잠금 entries 유무로 칠하고, tooltip 에 `잠금 2회 · 85분 지켜냄` 을 넣는다.
이력이 없으면 예전 `DailyReport` 판정으로 되돌아간다.

## 4. 가짜 시드 데이터 제거 (`storage.ts`)

- 하드코딩 시드 배열(2026-06-29 ~ 07-26) **전체 삭제**
- 날짜 해시 기반 `generateSyntheticReport` 와 ±180일 채우기 루프 **전체 삭제**
- `getDailyReports()` 는 이제 localStorage 를 읽어 그대로 돌려줄 뿐이다. 없으면 `[]`.
- 다른 함수는 건드리지 않았다. 호출부는 `ReportScreen` 하나뿐이라 파급 없음(grep 확인).

빈 상태: '주간 잠금 달성 현황' 카드의 범례 자리에
`아직 기록이 없습니다. 첫 잠금을 시작해보세요.` 한 줄로 대체된다(그 주에 아무 값도 없을 때).
지켜낸 시간 그래프 위 캡션도 상태에 따라 로딩/실패/빈 상태 문구를 보여준다.

## 5. SNS 카테고리 기준 중복 정의 제거

- `ReportScreen.tsx` 상단의 로컬 `SNS_CATEGORY_IDS` 상수를 삭제하고
  `appCategories.ts` 의 `isSnsCategory(id)` 를 import 해서 쓴다. 기준은 매핑표 파일 한 곳뿐이다.
- 안내 문구에 박혀 있던 `'숏폼/소셜/OTT/커뮤니티'` 도 하드코딩이라 같은 문제였다.
  `SNS_CATEGORY_IDS.map(getCategoryById).label` 로 뽑아 쓰도록 바꿔, 기준이 바뀌면
  화면 문구도 따라간다. (`appCategories.ts` 는 읽기만 했다.)

## 검증

- `npx tsc --noEmit` 통과 (에러 없음)
- `npx vite build` 성공

## 리더 판단 필요 — 손대지 않은 것

1. **🔴 `addCompletedSessionToReport` 의 "설정한 시간" 버그가 그대로 남아 있다.**
   `todayReport.completedFocusMinutes += session.focusDurationMinutes` — 지시대로 시드 제거만
   해서 이 줄은 건드리지 않았다. 실기기에서는 네이티브 이력이 이겨서 화면에 안 보이지만,
   **웹/실패 폴백 경로에서는 여전히 부풀려진 값이 나온다.**
   `session` 에 실제 유지 시간이 없다면 이 함수는 `wasConfirmed` 때 시간을 더하지 말고
   횟수만 세는 편이 정직하다. 결정 필요.

2. **`DailyReport.totalSnsMinutes` 도 같은 성격의 값이다.**
   `usageLimitMinutes`(설정값)를 더하고 있어 실제 SNS 사용 시간이 아니다. 폴백 전용이지만
   같은 종류의 거짓말이다.

3. **잠금 이력의 `blockedAppCount` 는 아직 화면에 쓰지 않았다.**
   "몇 개 앱을 잠갔는지"를 보여줄 자리가 마땅치 않아 뒀다. 필요하면 세션 행에 칩 하나 추가 가능.

4. **잠금이 자정을 넘기는 경우.** `LockHistoryEntry.date` 는 **시작한 날** 기준이라
   23:30에 걸어 다음 날 01:00에 끝난 90분은 전부 시작일에 잡힌다. 네이티브 계약이 그렇고
   화면에서 쪼개는 건 임의 해석이라 그대로 뒀다.

5. **주간 요약의 '달성률'은 그 주 전체 합 기준**(Σheld / Σplanned)이다.
   세션별 달성률의 평균과는 다른 값이니, 세션 단위 평균을 원하면 알려달라.

6. **기존 사용자의 localStorage 에 남은 가짜 리포트.**
   시드를 만들 때 `addCompletedSessionToReport` 가 합성값까지 저장한 적이 있어,
   이미 설치된 기기에는 가짜 값이 남아 있을 수 있다. 리포트 화면의 '기록 초기화'로
   지울 수 있지만 자동 마이그레이션은 넣지 않았다.
