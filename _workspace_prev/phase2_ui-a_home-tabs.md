# Phase 2 — UI-A: 홈/모드/더보기 탭 No-Scroll 컴팩트화

## 대상 파일
- src/components/NewHomeScreen.tsx
- src/components/ModeAScreen.tsx
- src/components/ModeBScreen.tsx
- src/components/MoreScreen.tsx

## 공통 변경
- 루트 컨테이너를 `max-w-2xl mx-auto px-4 py-8 space-y-6 ... pb-24` → **`h-full flex flex-col ... px-4 py-4 gap-N`** 로 전환. 부모 main(100dvh−헤더−탭바)을 정확히 채움.
- 하드코딩 하단여백 `pb-24` 전부 제거(BottomTabBar가 flex 흐름으로 변경됨).
- 카드 라운드 `rounded-3xl` → `rounded-2xl`, 패딩 `p-6/p-5` → `p-4/p-3.5`, 섹션 간격 `space-y-6` → `gap-3~4`.
- 헤드라인 `text-xl/2xl`, 아이콘 축소, 본문 `leading-relaxed` → `leading-snug`.
- 모든 텍스트 `break-keep` 적용, 라벨 문구 일부 축약.
- 스크롤(`overflow-y-auto` 등) 미사용 — 세로 오버플로 없음.

## 화면별 핵심
- **NewHomeScreen**: `justify-center`로 세로 중앙정렬. 카드 아이콘 12→10, 카드 하단 안내문 축약("...상세 설정으로 이동"). 카드 gap 6→3.5.
- **ModeAScreen**: `justify-start`. 배너/폼 패딩·간격 축소, 대상앱 그리드 gap 3→2·아이콘 8→7·이름 truncate, 시작 버튼 py-4→py-3.
- **ModeBScreen**(최장 화면): 위와 동일 + 하단 "이용 목적 / 목표 할 일" 두 입력을 **2열 그리드로 압축**(sm 이상), 라벨 문구 축약. 정보 유지하며 밀도 최대화.
- **MoreScreen**: `justify-center`. 프로필 배너 14→12, 메뉴 아이템 py-3.5→py-2.5·아이콘 8→7, 섹션 간격 space-y-6→3. 3섹션 7항목 모두 한 화면 수용.

## 검증
- `npx tsc --noEmit` 통과(오류 0).
