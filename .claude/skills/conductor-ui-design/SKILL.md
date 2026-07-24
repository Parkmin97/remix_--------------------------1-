---
name: conductor-ui-design
description: 내인생 지휘자 앱의 화면·랜딩페이지·디자인 시스템을 만들거나 개선할 때 사용. 랜딩, Hero/CTA, 화면 레이아웃, Tailwind 스타일, 카드 UI, 타이포그래피, 컬러, 애니메이션, 반응형/모바일 최적화 작업이면 반드시 이 스킬을 적용. "화면 예쁘게", "랜딩 고쳐", "디자인 다듬어", "반응형", "여백", "폰트" 같은 요청에 트리거.
---

# Conductor UI Design

내인생 지휘자의 시각 언어를 일관되게 유지하며 프리미엄 UI를 만든다.

## 브랜드 토큰 (반드시 준수)
- **배경**: `bg-stone-950`, 카드 `bg-stone-900/40~60`, 경계 `border-stone-800`
- **강조**: `amber-400 / amber-500`(주), `amber-200`(텍스트 강조), 성공 `emerald-400`
- **폰트**: 헤드라인 `font-serif`(Playfair Display, 한글은 Noto Sans KR로 폴백), 본문 `font-sans`(Inter/Noto Sans KR), 라벨 `font-mono`(JetBrains Mono)
- **모티프**: 악보 오선지 라인, 음표(♪ ♫ 𝄞), 지휘봉·오케스트라
- **라운드**: 카드 `rounded-2xl~3xl`, 버튼 `rounded-xl~2xl`

## 작업 순서
1. 대상 파일을 먼저 Read하여 기존 클래스 리듬·구조를 파악한다.
2. 변경은 기존 관용구를 따른다(새 컬러·폰트 임의 도입 금지). 토큰이 부족하면 `index.css`의 `@theme`에 추가.
3. 반응형: 모바일(390px) 우선 → `sm:`/`md:`로 확장. 본문은 절대 가로 스크롤이 생기지 않게 한다.
4. 애니메이션은 `src/index.css`의 `lp-*` 프리미티브(reveal/float/marquee)를 재사용하고, `prefers-reduced-motion`을 존중한다.
5. 데이터가 필요하면 `src/types.ts`를 읽어 형태를 맞추되, 타입을 직접 수정하지 않는다(state-data-engineer에 요청).

## 랜딩페이지 필수 섹션 (요청 시 체크리스트)
Hero → 문제 → 해결 → 핵심기능(3~5) → 사용법 3단계 → 실제 화면 → 추천 대상 → 비교 → 최종 CTA → 푸터. 5초 안에 "무엇/문제/이유"가 읽히도록 위계를 잡는다.

## 검증
작업 후 `npx tsc --noEmit`로 타입, `npm run build`로 빌드 그린을 확인한다. 가능하면 브라우저로 렌더를 눈으로 확인한다.

## 왜 이렇게 하나
브랜드 토큰을 고정하는 이유는, 여러 화면을 여러 사람이 만들어도 하나의 서비스처럼 보이게 하기 위해서다. 관용구를 따르면 diff가 작아지고 리뷰·회귀 위험이 줄어든다.
