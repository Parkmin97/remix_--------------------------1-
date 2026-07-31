# 내인생 지휘자 (My Life Maestro)

React 19 + Vite + Tailwind v4 기반 디지털 디톡스 앱. 무의식적 숏폼 스크롤을 1분 클래식 오케스트라 지휘 미션으로 멈추게 하는 자기주도형 서비스.

**제품 방향 (2026-07-31 확정):** 시뮬레이션이 아닌 **실제 OS 레벨 앱 차단**. **안드로이드 단독 선출시**, iOS는 후속 검토.
→ 출시 로드맵 `정식출시.md` · 부서별 업무 `부서구성.md`

## 하네스: 내인생 지휘자 개발·출시팀

**목표:** 개발(화면/랜딩 · 지휘 미션 · 데이터/상태 · 빌드QA)과 출시(기획 · 안드로이드 네이티브 · 법무 · 스토어 · 출시QA)를 전문 에이전트 팀으로 병렬 수행한다.

**트리거:** 여러 영역이 얽힌 기능 개발·리팩터링·출시 준비 요청 시 `conductor-harness` 스킬을 사용하라. 단일 영역의 사소한 수정은 해당 전문 스킬(`conductor-ui-design` / `conducting-interaction` / `conductor-state-data` / `conductor-qa`)로 직접 처리 가능. 단순 질문은 직접 응답.

**실행 모드:** 에이전트 팀 (팬아웃/팬인 + 생성-검증), 모든 Agent 호출 `model: "opus"`.

**부서 (9):**
| 구분 | 에이전트 | 소유 |
|------|---------|------|
| 개발 | ui-designer | 화면 컴포넌트, index.css/html |
| 개발 | interaction-engineer | ConductingMissionScreen, audioSynthesizer, TutorialScreen |
| 개발 | state-data-engineer | types.ts, storage.ts, data/*, App.tsx |
| 개발 | qa-verifier | (읽기 전용) 타입체크·빌드 |
| 출시 | product-planner | 제품 규칙, 로드맵, 지표, 스토어 문구 |
| 출시 | android-native-engineer | `android/`, 차단 엔진, 브릿지 플러그인 |
| 출시 | compliance-officer | 법적 문서, 정책 판정, 심사 대응 |
| 출시 | store-growth | 스토어 등재 자료, ASO, 리뷰 대응 |
| 출시 | release-qa | 실기기·장기실행·베타 검증 |

**의사결정 순서 (필수):** 제품 규칙 확정(product-planner) → 정책 판정(compliance-officer) → 타입/브릿지 계약 확정 → 병렬 구현 → 검증(qa-verifier·release-qa).

**거부권:** `compliance-officer`는 정책 위반 구현을, `release-qa`는 🔴 항목 미통과 시 출시를 보류시킬 수 있다.

**작업 원칙:** 플랫폼 정책·API 서술은 기억에 의존하지 말고 착수 시점에 공식 문서를 확인한다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-24 | 초기 구성 (에이전트 4 + 스킬 5) | 전체 | 병렬 작업 하네스 구축 요청 |
| 2026-07-31 | 출시 부서 5 추가 (총 9), 하네스 스킬에 출시 모드·의사결정 순서·거부권 추가 | product-planner, android-native-engineer, compliance-officer, store-growth, release-qa, conductor-harness | 안드로이드 정식 출시(실제 차단) 목표로 기획·법무·스토어·실기기QA 부서 필요 |
