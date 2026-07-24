---
name: conductor-state-data
description: 내인생 지휘자의 타입·상태·데이터·로컬 저장소를 정의·수정할 때 사용. types.ts 인터페이스, SessionState 상태 머신, localStorage 저장/로드, 클래식 곡·타깃 서비스 데이터, App.tsx 상태 배선 작업이면 반드시 이 스킬을 적용. "타입 추가", "새 필드", "세션 상태", "저장/불러오기", "데이터 추가", "리포트 데이터" 요청에 트리거. 타입 계약의 단일 소유.
---

# Conductor State & Data

데이터 계약과 상태 흐름을 안전하게 관리한다. **타입은 팀 전체의 단일 진실 공급원이다.**

## 소유 & 계약
- `src/types.ts` — 이 스킬을 통해서만 수정. 변경 시 소비처(ui/interaction)에 통지.
- `src/lib/storage.ts`, `src/data/*.ts`, `src/App.tsx`.

## 상태 머신 (SessionState)
`NO_SESSION → GUIDED_READY/USAGE_ACTIVE → GRACE_* → FOCUS_ACTIVE → INTERVENTION → MISSION_ACTIVE → DECISION_PENDING → EXTENSION_ACTIVE → COMPLETED/CANCELLED`.
- 불가능한 전이를 만들지 않는다. 새 상태 추가 시 진입/이탈 조건을 명시.

## 안전 규칙
- 필드 추가는 **optional 우선** + 안전한 기본값. 기존 저장 데이터를 깨지 않는다.
- `localStorage` 접근은 항상 try/catch, 파싱 실패 시 기본값 반환(앱이 죽지 않게).
- 스키마가 바뀌면 로드 시 마이그레이션(누락 필드 채우기). 실패 시 안전 초기화 후 로그.
- 곡 데이터의 `bpm`/`beatType`/`notesSequence` 일관성 보장(interaction 판정이 의존).

## 작업 순서
1. `types.ts`와 소비처를 먼저 Read하여 영향 범위를 파악.
2. 타입 → 저장소 → 데이터 → App 배선 순으로 일관되게 반영.
3. 변경된 인터페이스(추가/변경/삭제 필드)를 **팀에 통지**하고 소비 에이전트가 맞추게 한다.
4. `npx tsc --noEmit` + `npm run build`로 전체 소비처 컴파일 확인.

## 왜 이렇게 하나
타입을 한 곳에서만 바꾸는 이유는, 여러 에이전트가 동시에 같은 인터페이스를 건드리면 계약이 갈라져 경계면 버그가 생기기 때문이다. optional·기본값·마이그레이션을 강제하는 이유는, 실제 사용자의 기존 localStorage 데이터를 보존해야 하기 때문이다.
