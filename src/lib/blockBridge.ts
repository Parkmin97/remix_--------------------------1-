/**
 * 차단 화면(네이티브)에서 실행될 때 결과를 안드로이드로 돌려주는 통로.
 *
 * 우리 앱은 두 가지 방식으로 실행된다.
 *  1. 일반 실행 — 사용자가 아이콘을 눌러 앱을 켠 경우
 *  2. 차단 화면 — 사용자가 인스타를 켰다가 막혀서 뜬 경우 (BlockOverlayActivity 안의 웹뷰)
 *
 * 2번일 때는 미션 결과를 네이티브가 알아야 차단을 풀거나 유지할 수 있다.
 * 안드로이드가 웹뷰에 심어둔 객체(`window.BlockBridge`)를 통해 알린다.
 */

/** 안드로이드가 주입하는 객체. 일반 실행일 때는 존재하지 않는다. */
interface NativeBlockBridge {
  onMissionResult: (result: string) => void;
  getBlockInfo: () => string;
}

/** 차단 화면이 판단에 쓰는 정보. */
export interface BlockInfo {
  blockedPackage: string;
  /** 이번 세션에서 미션을 이미 시도했는지. true 면 "잠금 풀기"를 제공하면 안 된다. */
  missionAttempted: boolean;
  /** 잠금이 끝나는 시각 (epoch millis) */
  lockEndsAt: number;
  /** 잠근 앱을 열려고 시도한 횟수 */
  launchAttempts: number;
}

declare global {
  interface Window {
    BlockBridge?: NativeBlockBridge;
  }
}

/**
 * 차단 화면에서 네이티브로 돌려주는 결과.
 * - success: 미션 성공 → 잠금 완전 해제, 원래 앱으로 복귀
 * - fail:    미션 실패 → 설정 시간까지 잠금 유지, **재도전 불가**
 * - cancel:  미션 중도 포기 → 잠금 유지, 재도전 가능
 * - keep:    미션을 시작하지 않고 "잠금 유지" 선택 → 재도전 가능
 */
export type MissionResult = 'success' | 'fail' | 'cancel' | 'keep';

/** 지금 차단 화면 안에서 실행 중인지. */
export function isBlockMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('mode') === 'block';
}

/** 차단을 유발한 앱의 패키지명. 차단 화면일 때만 값이 있다. */
export function getBlockedPackage(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('pkg');
}

/** URL 로 지정된 시작 화면. 없으면 null (기존 흐름대로 랜딩부터). */
export function getInitialScreen(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('screen');
}

/**
 * 차단 정보를 네이티브에서 읽어온다.
 * 차단 화면이 아니거나 다리가 없으면 null.
 */
export function getBlockInfo(): BlockInfo | null {
  if (!isBlockMode()) return null;

  const bridge = window.BlockBridge;
  if (!bridge?.getBlockInfo) return null;

  try {
    return JSON.parse(bridge.getBlockInfo()) as BlockInfo;
  } catch (e) {
    console.error('[blockBridge] 차단 정보를 읽지 못했다', e);
    return null;
  }
}

/**
 * 미션 결과를 네이티브에 알린다.
 *
 * 차단 화면이 아니거나 다리가 없으면 아무 일도 하지 않는다(일반 실행일 때 안전).
 * @returns 네이티브에 실제로 전달됐는지
 */
export function reportMissionResult(result: MissionResult): boolean {
  if (!isBlockMode()) return false;

  const bridge = window.BlockBridge;
  if (!bridge?.onMissionResult) {
    console.warn('[blockBridge] 차단 모드인데 네이티브 다리가 없다');
    return false;
  }

  bridge.onMissionResult(result);
  return true;
}
