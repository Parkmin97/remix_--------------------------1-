---
name: conductor-harness
description: 내인생 지휘자(디지털 디톡스 PWA)에 대해 여러 영역이 얽힌 작업을 에이전트 팀으로 병렬 수행할 때 사용. 화면/랜딩 + 지휘 미션 + 데이터/상태 + 빌드/QA가 함께 필요한 기능 개발·리팩터링·개선 요청에 트리거. "기능 추가", "화면 만들어", "미션 개선", "전체 손봐", "병렬로", "팀으로", "하네스 실행", 그리고 후속 표현 "다시 실행", "재실행", "업데이트", "수정", "보완", "이전 결과 기반", "OO만 다시"에도 트리거. 단일 영역의 사소한 수정은 해당 전문 스킬로 직접 처리 가능.
---

# Conductor Harness — 오케스트레이터

내인생 지휘자의 작업을 4개 전문 에이전트로 병렬 조율한다.

**실행 모드: 에이전트 팀** (팬아웃/팬인 + 생성-검증). 모든 Agent 호출은 `model: "opus"`.

## 팀 구성
| 에이전트 | subagent_type | 스킬 | 소유 파일 |
|---|---|---|---|
| ui-designer | ui-designer | conductor-ui-design | 화면 컴포넌트, index.css/html |
| interaction-engineer | interaction-engineer | conducting-interaction | ConductingMissionScreen, audioSynthesizer, TutorialScreen |
| state-data-engineer | state-data-engineer | conductor-state-data | types.ts, storage.ts, data/*, App.tsx |
| qa-verifier | qa-verifier | conductor-qa | (읽기 전용) |

## Phase 0: 컨텍스트 확인
1. `_workspace/` 존재 + **부분 수정** 요청 → 해당 에이전트만 재호출(부분 재실행).
2. `_workspace/` 존재 + **새 입력** → 기존을 `_workspace_prev/`로 이동 후 새 실행.
3. `_workspace/` 미존재 → 초기 실행.
`.claude/agents/`·`.claude/skills/`가 있는지 확인하고, 없으면 harness 스킬로 먼저 구성.

## Phase 1: 분해 & 계약 우선
1. 요청을 4영역으로 분해하고, 영역 간 의존을 파악한다.
2. **데이터 계약이 바뀌면 state-data-engineer를 먼저 실행**해 타입을 확정한 뒤, 나머지를 병렬로 띄운다(계약 갈라짐 방지).
3. 파일 소유권이 겹치면 리더가 순서를 정해 충돌을 막는다.

## Phase 2: 병렬 실행 (팬아웃)
- `TeamCreate`로 필요한 팀원만 구성(작업에 없는 영역은 제외).
- `TaskCreate`로 작업을 의존관계와 함께 할당. 팀원은 `SendMessage`로 직접 조율(타입 통지, 시각 협의 등).
- 독립 작업은 동시에, 계약 의존 작업은 계약 확정 후에 시작.

## Phase 3: 점진 검증 (생성-검증)
- 각 에이전트가 모듈을 완료할 때마다 qa-verifier가 **즉시 해당 범위 검증**(끝에 몰아서 X).
- FAIL → 담당 에이전트에 반환 → 1회 재시도 → 재실패 시 리더에 에스컬레이션.

## Phase 4: 종합 & 최종 검증
1. qa-verifier가 `npx tsc --noEmit` + `npm run build` 최종 그린 확인.
2. 화면 전환 회귀 스모크. 가능하면 브라우저 렌더 확인.
3. 리더가 변경 파일·결과·남은 리스크를 사용자에게 요약 보고.

## 데이터 전달
- **태스크 기반**(조율) + **파일 기반**(산출물) + **메시지 기반**(실시간 협의) 조합.
- 파일 규칙: 중간 산출물은 `_workspace/{phase}_{agent}_{artifact}.md`, 최종 코드만 실제 경로에 반영. `_workspace/`는 감사용으로 보존.

## 에러 핸들링
- 에이전트 1회 실패 → 재시도 → 재실패 시 해당 결과 없이 진행하고 **보고서에 누락 명시**.
- 상충하는 결정은 삭제하지 말고 출처를 병기해 리더가 판단.
- 파일 소유권 충돌 감지 시 즉시 중단하고 순서를 재조정.

## 팀 크기 가이드
작업 영역 수만큼만 팀원을 띄운다(보통 2~4명 + 필요 시 QA). 3명의 집중 팀이 5명의 산만한 팀보다 낫다.

## 테스트 시나리오
- **정상 흐름**: "리포트 화면에 주간 집중 그래프 추가" → state-data(리포트 타입/집계 필드) → 확정 통지 → ui-designer(그래프 UI) 병렬 → qa-verifier(타입↔props↔저장소 검증) → 빌드 그린 → 보고.
- **에러 흐름**: interaction-engineer가 타이밍 변경 후 빌드 실패 → qa가 로그 원문 반환 → 1회 재시도 → 성공. 재실패였다면 미션 변경 제외하고 나머지 반영 + 누락 보고.

## 완료 후
사용자에게 "결과에서 바꾸고 싶은 점이 있는지" 한 번 묻고, 피드백은 CLAUDE.md 변경 이력에 반영한다.
