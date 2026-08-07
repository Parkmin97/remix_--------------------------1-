# Phase 2 — Interaction (Mission / Tutorial) No-Scroll 컴팩트화

## 수정 파일
- `src/components/ConductingMissionScreen.tsx`
- `src/components/TutorialScreen.tsx`

## ConductingMissionScreen
- 루트: `max-w-2xl mx-auto ... space-y-*` → `h-full w-full max-w-2xl mx-auto flex flex-col gap-2 sm:gap-3 overflow-hidden` (부모 main 채움).
- Header 배너: `shrink-0` + 패딩/간격 축소(p-3→p-2.5, space-y-2→1.5).
- Game Stage: 고정 `min-h-[380px] sm:min-h-[440px]` 제거 → `flex-1 min-h-0`(남은 높이 전부 사용, 내부 overflow-hidden 유지).
- CONDUCTING 인터랙션 스테이지: 고정 `h-60` → `flex-1 min-h-0`(뷰포트에 맞춰 신축). 캔버스는 절대배치라 그대로 채움.
- READY 상태: space-y·폰 그래픽·설명 박스 폰트/패딩 축소, `break-keep`/`leading-snug` 적용.

## TutorialScreen
- 루트: `min-h-screen ... pb-24` → `h-full flex flex-col overflow-hidden`(하드코딩 `pb-24` 제거).
- 내부 래퍼: `space-y-6` → `flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-hidden`.
- Header 배너 `shrink-0`, 모바일에서 설명문 `hidden sm:block`, 제목/배지 축소, 버튼 컴팩트.
- Beat 셀렉터: `shrink-0`(가로 스크롤은 기존 유지 — 세로 아님), 탭 패딩/최소폭 축소.
- 메인 그리드: `flex-1 min-h-0 grid ... lg:overflow-hidden`, 좌측 컬럼 `lg:flex lg:flex-col lg:flex-1`, 연습 캔버스 컨테이너 `lg:aspect-auto lg:flex-1 lg:min-h-0`로 남은 높이에 맞춤.
- 우측 컬럼/카드: 패딩·space·폰트 밀도 상향, `break-keep`/`leading-snug`. (overflow-y-auto는 계약상 금지라 미사용 — 컴팩트화로 대응.)

## 로직 미변경 확인
오디오(playOrchestralAudio/폴백), 타이밍/판정(processUserSwingGesture, beatIntervalMs, 동적 허용오차, 80% 통과), DeviceMotion 피크 감지, 포인터 폴백, 타이머 cleanup, 메트로놈 useEffect — **전부 그대로**. 오직 className(레이아웃/스타일)만 조정. 타이밍 상수 변경 없음.

## 검증
- `npx tsc --noEmit` 통과(에러 0).
