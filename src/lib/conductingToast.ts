import { toast } from 'sonner';

/**
 * 지휘 미션 판정 토스트.
 *
 * 판정은 1분 동안 100회 이상 발생하는 고빈도 이벤트다. 일반 알림처럼 쌓으면
 * 화면이 판정문으로 덮이므로, 고정 id 하나를 재사용해 항상 한 장만 갱신한다.
 * (sonner는 같은 id로 create를 호출하면 새 토스트를 쌓지 않고 내용을 갱신한다.)
 */
const JUDGEMENT_TOAST_ID = 'conducting-judgement';

export type JudgementKind = 'PERFECT' | 'MISS' | 'DUPLICATE';

interface JudgementPayload {
  kind: JudgementKind;
  /** 1~4 등 마디 안 박자 위치 라벨. 예: '3/4박' */
  beatLabel: string;
  /** 실제 오차(초) */
  diffSec: string;
  /** 허용 오차(초) */
  toleranceSec: string;
}

const KIND_TITLE: Record<JudgementKind, string> = {
  PERFECT: '정확한 박자',
  MISS: '박자 이탈',
  DUPLICATE: '같은 박자 중복',
};

/** 판정 1건을 단일 토스트로 갱신 표시한다. */
export function showJudgementToast({ kind, beatLabel, diffSec, toleranceSec }: JudgementPayload) {
  const detail =
    kind === 'DUPLICATE'
      ? '이미 맞춘 박자입니다. 다음 박을 기다리세요'
      : `${beatLabel} · 오차 ${diffSec}초 / 허용 ${toleranceSec}초`;

  const options = {
    id: JUDGEMENT_TOAST_ID,
    description: detail,
    duration: 900,
  };

  if (kind === 'PERFECT') {
    toast.success(KIND_TITLE.PERFECT, options);
    return;
  }

  if (kind === 'DUPLICATE') {
    toast.warning(KIND_TITLE.DUPLICATE, options);
    return;
  }

  toast.error(KIND_TITLE.MISS, options);
}

/** 미션 종료/이탈 시 남아 있는 판정 토스트를 정리한다. */
export function dismissJudgementToast() {
  toast.dismiss(JUDGEMENT_TOAST_ID);
}
