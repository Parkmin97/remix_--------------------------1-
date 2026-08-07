# 레이아웃 계약 — No-Scroll 모바일 프레임

## 목표
모든 화면이 페이지 스크롤 없이 100dvh 뷰포트 안에 컴팩트하게 맞춰진다.
**예외(내부 스크롤 유지):** `ShortsFeedScreen`(숏폼 피드), `LandingScreen`(마케팅 롱페이지).

## 셸 프레임 (리더가 확정 — 절대 변경 금지)
- `index.css`: `html, body, #root { height: 100% }`, `body { overflow: hidden; overscroll-behavior-y: none }`
- `App.tsx` 루트: `h-[100dvh] overflow-hidden flex flex-col` (기존 min-h-screen/pb-12 제거)
- `App.tsx <main>`: `flex-1 min-h-0 overflow-hidden` (스크롤 금지)
- `MainLayout.tsx`: 루트 `h-full flex flex-col`, 내부 main `flex-1 min-h-0 overflow-hidden`
- `BottomTabBar`: `fixed` 제거 → `shrink-0 w-full` (flex 흐름에 참여)

## 각 스크린 컴포넌트 규칙 (에이전트 준수)
1. 루트를 `min-h-screen`/고정 큰 높이 → **`h-full flex flex-col`** 로 변경(부모 main을 채움).
2. 콘텐츠가 세로로 넘치면 **컴팩트화**: 패딩·마진·폰트·아이콘·간격 축소, 큰 히어로/여백 절제, 필요 시 2열 그리드로 압축. 정보는 유지하되 밀도를 높인다.
3. 스크롤을 만들지 말 것(`overflow-y-auto`/`overflow-scroll` 금지). 단 위 예외 2개는 유지.
4. 세로 중앙정렬이 자연스러운 화면은 `justify-center`, 상단정렬이 필요하면 `justify-start`.
5. 하단 고정바(BottomTabBar)는 이제 flex 흐름이므로 화면에 `pb-16` 등 여백 하드코딩 제거.
6. 텍스트 줄바꿈 억제(`break-keep`), `leading` 축소로 높이 절약.

## 검증
- `npx tsc --noEmit` + `npm run build` 그린.
- 각 화면 세로 오버플로 없음(숏폼/랜딩 제외).
