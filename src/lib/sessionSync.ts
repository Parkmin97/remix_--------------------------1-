import { SessionData } from '../types';
import { getStoredActiveSession, saveActiveSession } from './storage';
import { Blocker } from './blocker';

/**
 * 잠금 세션 상태를 네이티브에 맞춘다.
 *
 * ■ 왜 필요한가
 *   잠금 세션의 **진실은 네이티브**가 갖고 있다(BlockSessionStore).
 *   그런데 웹은 별도로 localStorage 에 세션을 들고 있어서 둘이 어긋날 수 있다.
 *
 *   특히 이런 경우가 문제다.
 *     1. 사용자가 잠근 앱을 열어 차단 화면이 뜬다
 *     2. 미션에 성공해 네이티브가 세션을 끝낸다
 *     3. 그런데 차단 화면 웹뷰는 메인 앱과 origin 이 달라
 *        메인 앱의 localStorage 를 고칠 수 없다
 *     4. 앱을 열면 여전히 "잠금 중"으로 보인다
 *
 *   잠금 시간이 끝나 네이티브가 자동 정리한 경우도 마찬가지다.
 *
 * ■ 규칙
 *   네이티브에 세션이 없으면 웹 세션도 끝난 것으로 본다.
 *   반대로 웹에만 없는 경우는 건드리지 않는다(웹에서 막 만든 직후일 수 있다).
 */

export interface SyncResult {
  /** 동기화 후의 세션. 잠금이 끝났으면 완료 상태로 표시된 세션이 온다. */
  session: SessionData | null;
  /** 네이티브와 어긋나서 실제로 고쳤는지. true 면 화면을 다시 그려야 한다. */
  corrected: boolean;
}

/**
 * @param current 지금 화면이 들고 있는 세션
 */
export async function syncSessionFromNative(current: SessionData | null): Promise<SyncResult> {
  let status;
  try {
    status = await Blocker.getStatus();
  } catch {
    // 웹 브라우저에서 실행 중이면 네이티브가 없다. 그대로 둔다.
    return { session: current, corrected: false };
  }

  const stored = current ?? getStoredActiveSession();

  // 네이티브에 세션이 살아 있으면 웹 상태를 믿어도 된다.
  if (status.hasSession) {
    return { session: stored, corrected: false };
  }

  // 여기부터는 네이티브에 세션이 없는 경우다.
  // 웹도 이미 없거나 끝난 상태면 할 일이 없다.
  if (!stored) return { session: null, corrected: false };
  if (stored.state === 'COMPLETED' || stored.state === 'CANCELLED') {
    return { session: stored, corrected: false };
  }

  // 웹만 "잠금 중"으로 남아 있다 → 네이티브 기준으로 끝난 것으로 정리한다.
  const finished: SessionData = { ...stored, state: 'COMPLETED' };
  saveActiveSession(finished);

  console.info('[sessionSync] 네이티브에 세션이 없어 웹 잠금 상태를 정리했다');
  return { session: finished, corrected: true };
}
