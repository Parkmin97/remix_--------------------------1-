# Phase 2 · UI-B · 앱 화면 컴팩트화 (No-Scroll 프레임 적용)

레이아웃 계약(`phase1_leader_layout-contract.md`) 준수. 셸 프레임(App/MainLayout/BottomTabBar/index.css)은 미수정.
각 화면 루트를 `h-full flex flex-col`(또는 중앙정렬)로 바꿔 부모 main(100dvh − Header)을 정확히 채우고, 세로 오버플로 없이 컴팩트화.

## 수정 파일 및 핵심

### PhoneHomeScreen.tsx
- 루트 `px-2 py-4` → `h-full flex flex-col ... px-2 py-2`.
- 폰 목업 컨테이너 `min-h-[680px]` → `flex-1 min-h-0` (프레임 채움).
- 배경 콘텐츠 영역 `flex-1 min-h-0`, 상하 패딩 축소(pt-3/pb-4 → pt-2/pb-3).
- 앱 그리드 `gap-y-5 py-4` → `gap-y-3 py-2`, 상단 위젯 `space-y-3` → `space-y-2`.
- 힌트 토스트/독 여백 축소(mt-4→mt-2, py 축소), 힌트 `break-keep leading-snug`.

### ReportScreen.tsx (밀도 상향)
- 루트 `py-8 space-y-8` → `h-full flex flex-col ... py-3 gap-3`.
- 헤더 폰트 2xl→lg, 초기화 버튼 라벨 모바일 숨김(`hidden sm:inline`).
- 요약 카드 항상 3열(`grid-cols-3`), 패딩 p-5→p-3, 숫자 3xl→2xl, 라벨 축약.
- 주간 차트 카드가 남은 공간을 채우도록 `flex-1 min-h-0 overflow-hidden`, 바 높이 h-3→h-2.5.
- 등급표 항상 4열, 카드 패딩·폰트 축소·기간 표기 축약(0~60분 등).
- 복귀 버튼/여백 축소, 전 구간 `break-keep`.

### SettingsScreen.tsx
- 루트 `py-8 space-y-6` → `h-full flex flex-col ... py-4 gap-4`.
- 헤더 2xl→lg, 카드 패딩 p-6→p-4, 항목 패딩 p-4→p-3, 설명 xs→[11px]+`leading-snug`.
- 각 행 `gap-3` + 텍스트 `min-w-0`/버튼 `shrink-0`으로 2열 안전 배치, `break-keep`.

### SelfReflectionScreen.tsx
- 루트 → `h-full flex items-center justify-center`(세로 중앙), 카드 `w-full`.
- 엠블럼 20→16, 제목 2xl→xl, 패딩 p-6→p-5, 버튼 py-4/3.5→py-3, 간격·각주 폰트 축소, `break-keep`.

### LoginScreen.tsx
- 로그인 폼 / 로그인완료 두 상태 모두 루트 → `h-full flex items-center justify-center`, 카드 `w-full`.
- 카드 패딩 p-8/p-7 → p-6, 아이콘·상단 여백 소폭 축소. 폼 내부 구조는 유지.

### ShortsFeedScreen.tsx (예외 — 내부 스크롤 유지)
- 루트 → `h-full flex flex-col ... p-2`.
- 피드 컨테이너 고정 `h-[640px]` → `flex-1 min-h-0`로 프레임을 채우고 `overflow-y-auto overflow-x-hidden` 유지(스와이프/휠 내비 그대로). 컴팩트화 대상 아님.

## 검증
- `npx tsc --noEmit` 통과(오류 없음).
- 하드코딩 `pb-16/pb-24` 없음 확인. 스크롤 생성은 ShortsFeed 예외만.
