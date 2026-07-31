---
name: conductor-harness
description: 내인생 지휘자(디지털 디톡스 앱)에 대해 여러 영역이 얽힌 작업을 에이전트 팀으로 병렬 수행할 때 사용. 개발(화면·지휘 미션·데이터·QA)과 출시(기획·안드로이드 네이티브·법무·스토어·출시QA)를 모두 조율한다. "기능 추가", "화면 만들어", "미션 개선", "전체 손봐", "병렬로", "팀으로", "하네스 실행", "출시 준비", "부서별로", 그리고 후속 표현 "다시 실행", "재실행", "업데이트", "수정", "보완", "이전 결과 기반", "OO만 다시"에도 트리거. 단일 영역의 사소한 수정은 해당 전문 스킬로 직접 처리 가능.
---

# Conductor Harness — 오케스트레이터

내인생 지휘자의 작업을 **9개 부서**로 조율한다. 작업 성격에 따라 두 모드로 나뉜다.

**실행 모드: 에이전트 팀** (팬아웃/팬인 + 생성-검증). 모든 Agent 호출은 `model: "opus"`.

---

## 부서 구성

### 개발 부서 (기존)
| 부서 | subagent_type | 스킬 | 소유 |
|---|---|---|---|
| ui-designer | ui-designer | conductor-ui-design | 화면 컴포넌트, index.css/html |
| interaction-engineer | interaction-engineer | conducting-interaction | ConductingMissionScreen, audioSynthesizer, TutorialScreen |
| state-data-engineer | state-data-engineer | conductor-state-data | types.ts, storage.ts, data/*, App.tsx |
| qa-verifier | qa-verifier | conductor-qa | (읽기 전용) 타입체크·빌드 |

### 출시 부서 (신규)
| 부서 | subagent_type | 소유 |
|---|---|---|
| product-planner | product-planner | 제품 규칙, 로드맵, 지표, 스토어 문구 |
| android-native-engineer | android-native-engineer | `android/`, 차단 엔진, 브릿지 플러그인 |
| compliance-officer | compliance-officer | 법적 문서, 정책 판정, 심사 대응 |
| store-growth | store-growth | 스토어 등재 자료, ASO, 리뷰 대응 |
| release-qa | release-qa | 실기기·장기실행·베타 검증 |

> `qa-verifier`(코드 레벨)와 `release-qa`(실기기·시나리오)는 역할이 다르다. 혼용하지 않는다.

---

## 모드 선택

- **개발 모드** — 화면·미션·데이터 변경 요청 → 개발 4부서로 기존 흐름 수행.
- **출시 모드** — 출시 준비·정책·스토어·차단 기능 요청 → 출시 5부서 + 필요한 개발 부서.
- **혼합** — 차단 기능처럼 웹·네이티브가 얽히면 양쪽에서 필요한 부서만 소집.

---

## Phase 0: 컨텍스트 확인
1. `_workspace/` 존재 + **부분 수정** 요청 → 해당 부서만 재호출(부분 재실행).
2. `_workspace/` 존재 + **새 입력** → 기존을 `_workspace_prev/`로 이동 후 새 실행.
3. `_workspace/` 미존재 → 초기 실행.
4. `정식출시.md`·`부서구성.md`가 있으면 현재 STEP과 미결 결정사항을 먼저 확인한다.

## Phase 1: 분해 & 계약 우선

**결정 우선순위 — 이 순서를 어기면 반드시 되돌아온다.**

1. **product-planner가 제품 규칙을 먼저 확정한다.** (해제 시간·실패 처리·타깃 범위·비상 탈출구)
2. **compliance-officer가 정책 판정을 낸다.** 구현 후의 거부는 비용이 크므로 **구현 전에** 판정한다.
3. **데이터 계약(types)이 바뀌면 state-data-engineer를 먼저 실행**해 타입을 확정한다.
4. **웹↔네이티브 브릿지 명세를 확정**한 뒤에야 웹·안드로이드가 병렬로 착수할 수 있다.
5. 나머지를 병렬로 띄운다.

파일 소유권이 겹치면 리더가 순서를 정해 충돌을 막는다.

## Phase 2: 병렬 실행 (팬아웃)
- `TeamCreate`로 필요한 부서만 구성(작업에 없는 영역은 제외).
- `TaskCreate`로 작업을 의존관계와 함께 할당. 부서는 `SendMessage`로 직접 조율.
- 독립 작업은 동시에, 계약 의존 작업은 계약 확정 후에 시작.

## Phase 3: 점진 검증 (생성-검증)
- 코드 모듈 완료 → `qa-verifier`가 **즉시 해당 범위 검증**(끝에 몰아서 X).
- 네이티브·통합 기능 완료 → `release-qa`가 실기기 검증.
- FAIL → 담당 부서 반환 → 1회 재시도 → 재실패 시 리더에 에스컬레이션.

## Phase 4: 종합 & 최종 검증
1. `qa-verifier`가 `npx tsc --noEmit` + `npm run build` 최종 그린 확인.
2. `release-qa`가 실기기 시나리오 통과 확인 (**삼성 실기기 필수, 장기 실행 포함**).
3. `compliance-officer`가 제출 전 정책 최종 판정.
4. 리더가 변경 사항·결과·남은 리스크를 사용자에게 요약 보고.

---

## 거부권 · 보류권

일반 부서와 달리 두 부서는 **진행을 막을 수 있다.** 이 권한을 무시하고 진행시키지 않는다.

- **compliance-officer** — 정책 위반이 확실한 구현은 보류시킬 수 있다. 단, 대안을 함께 제시해야 한다.
- **release-qa** — 🔴 항목(장기 실행·삼성 실기기·복구 시나리오) 미통과 시 출시 보류를 요청할 수 있다.

## 데이터 전달
- **태스크 기반**(조율) + **파일 기반**(산출물) + **메시지 기반**(실시간 협의) 조합.
- 파일 규칙: 중간 산출물은 `_workspace/{phase}_{부서}_{artifact}.md`, 최종 코드만 실제 경로에 반영. `_workspace/`는 감사용으로 보존.

## 에러 핸들링
- 부서 1회 실패 → 재시도 → 재실패 시 해당 결과 없이 진행하고 **보고서에 누락 명시**.
- 상충하는 결정은 삭제하지 말고 출처를 병기해 리더가 판단.
- 파일 소유권 충돌 감지 시 즉시 중단하고 순서를 재조정.
- **플랫폼 정책·API 서술은 기억에 의존하지 않는다.** 착수 시점에 공식 문서 확인을 지시한다.

## 팀 크기 가이드
작업 영역 수만큼만 부서를 띄운다(보통 2~4개 + 필요 시 QA). 3개의 집중 팀이 5개의 산만한 팀보다 낫다. 출시 모드라고 9개를 다 띄우지 않는다.

## 테스트 시나리오
- **개발 흐름**: "리포트에 주간 그래프 추가" → state-data(타입) → 확정 통지 → ui-designer(UI) → qa-verifier(검증) → 빌드 그린 → 보고.
- **출시 흐름**: "차단 기능 만들어" → product-planner(해제 규칙 확정) → compliance-officer(정책 판정) → 브릿지 명세 확정 → android-native-engineer + 웹 부서 병렬 → release-qa(실기기·장기실행) → 보고.
- **에러 흐름**: android가 접근성 서비스 기반으로 구현 시도 → compliance-officer가 정책 위반 판정 + 사용통계 기반 대안 제시 → 재설계 → 통과.

## 완료 후
사용자에게 "결과에서 바꾸고 싶은 점이 있는지" 한 번 묻고, 피드백은 CLAUDE.md 변경 이력에 반영한다.
