import { SessionData, SessionState } from '../types';

/**
 * 세션이 "아직 살아 있는지" 판단하는 단일 기준.
 *
 * ■ 왜 따로 두는가
 *   예전에는 화면마다 제각각 판단했다.
 *     - ModeAScreen: state 가 FOCUS_ACTIVE / MISSION_ACTIVE / INTERVENTION 인지
 *     - ModeBScreen: mode 가 GUIDED_USE 인지 (state 는 안 봄)
 *     - BottomTabBar: mode 만 보고 판단 (state 는 안 봄)
 *
 *   그 결과 잠금 시간이 끝나 세션이 COMPLETED 가 되어도 세션 객체 자체는 남아 있어서,
 *   mode 만 보던 곳들이 계속 "잠금 중"으로 취급했다.
 *   지금 잠금이 끝났는데 예약 잠금 탭이 비활성인 채로 남는 증상이 이것이었다.
 *
 *   기준이 여러 벌이면 언젠가 또 어긋난다. 여기 한 곳만 고치면 되도록 모아둔다.
 */

/** 더는 진행되지 않는 상태들. 이 상태의 세션은 남아 있어도 끝난 것으로 본다. */
const FINISHED_STATES: readonly SessionState[] = [
  'NO_SESSION',
  'COMPLETED',
  'CANCELLED',
  'TECHNICAL_ABORT',
];

/** 세션이 진행 중인지. 세션이 없거나 끝난 상태면 false. */
export function isSessionRunning(session: SessionData | null | undefined): boolean {
  if (!session) return false;
  return !FINISHED_STATES.includes(session.state);
}

/**
 * 잠금이 **지금 이 순간** 걸려 있는지. 시계까지 본다.
 *
 * [isSessionRunning] 은 세션 객체의 state 만 보므로, 잠금 시간이 지났는데도
 * 아직 아무도 상태를 COMPLETED 로 고쳐주지 않은 동안에는 계속 true 다.
 * 보통은 네이티브 동기화가 곧 고쳐주지만, 그 사이의 틈으로 사용자를 가두면 안 되는
 * 판단(로그아웃 차단 등)에는 이쪽을 쓴다.
 *
 * @param now 비교 기준 시각(epoch millis). 화면이 1초마다 갱신하는 값을 넘긴다.
 */
export function isLockActive(
  session: SessionData | null | undefined,
  now: number = Date.now()
): boolean {
  if (!isSessionRunning(session) || !session?.focusEndsAt) return false;

  const endsAt = new Date(session.focusEndsAt).getTime();
  return Number.isFinite(endsAt) && now < endsAt;
}

/** 지정한 모드의 세션이 진행 중인지. 탭 잠금·폼 잠금 판단에 쓴다. */
export function isModeRunning(
  session: SessionData | null | undefined,
  mode: SessionData['mode']
): boolean {
  return isSessionRunning(session) && session?.mode === mode;
}
