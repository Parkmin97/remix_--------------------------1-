---
name: conducting-interaction
description: 내인생 지휘자의 1분 지휘 미션 인터랙션을 구현·수정할 때 사용. 오디오 합성/재생, BPM·박자 타이밍, PERFECT/MISS 판정, DeviceMotion·포인터·웹캠 모션 입력, 60초 타이머·메트로놈, 미션 성공/실패 전이 작업이면 반드시 이 스킬을 적용. "지휘 미션", "박자 판정", "오디오/소리", "센서/모션", "메트로놈", "타이밍" 요청에 트리거.
---

# Conducting Interaction

지휘 미션의 타이밍·오디오·모션 입력을 정확하게 구현한다.

## 핵심 계약 (신뢰의 원천)
- 곡 데이터: `src/data/classicalPieces.ts` — `bpm`, `beatType`('4/4'|'3/4'|'2/4'|'1/4'), `notesSequence`, `durationSeconds`(60).
- 타입: `src/types.ts`의 `ClassicalPiece`, `SessionData`, `SessionState`, `BeatType`.
- 세션 전이: `App.tsx` 콜백(`onMissionSuccess`/`onMissionFail`/`onCancel`)을 지킨다.

## 타이밍 규칙
- 박 간격(ms) = `60000 / bpm`. 60초 총 박수 = `floor(60000 / 박간격)`.
- 통과 기준 = 총 기대 박의 80% 이상 PERFECT (기존 로직 유지, 변경 시 근거 기록).
- 판정: 입력 시점과 최근접 박의 오차(±허용치) 비교 → PERFECT / MISS / 중복연사.
- 타이머·메트로놈·오디오는 `useEffect` cleanup에서 반드시 해제(중복 타이머·누수 방지).

## 오디오 폴백 3단계
1. 로컬 MP3(`public/audio/…`) → 2. `fallbackAudioUrl` → 3. Web Audio 합성음(`audioSynthesizer`).
모두 실패해도 시각 메트로놈으로 미션은 계속 진행한다. 음소거 상태(`getSoundMuted`)를 존중.

## 모션 입력 & 권한
- DeviceMotion: iOS는 사용자 제스처 후 `requestPermission()` 필요. 거부/미지원이면 **에러가 아니라** 포인터/버튼 지휘로 폴백.
- 웹캠 모션도 선택적 경로 — 미허용 시 조용히 폴백.

## 작업 순서
1. `ConductingMissionScreen.tsx`와 `audioSynthesizer.ts`를 먼저 Read.
2. 타이밍 상수·판정 로직을 바꾸면 근거를 주석/보고에 남긴다.
3. 상태 전이가 바뀌면 state-data-engineer에 계약 확인 후 진행.
4. `npx tsc --noEmit` + `npm run build`로 검증. 가능하면 미션 화면을 60초 스모크.

## 왜 이렇게 하나
타이밍은 사용자 신뢰의 핵심이다. 박 간격 계산과 cleanup을 정확히 하지 않으면 "판정이 이상하다"는 체감 버그가 바로 발생한다. 폴백을 겹겹이 두는 이유는 오프라인 PWA에서 어떤 환경에서도 미션이 멈추지 않게 하기 위해서다.
