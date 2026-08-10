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

/** 지정한 모드의 세션이 진행 중인지. 탭 잠금·폼 잠금 판단에 쓴다. */
export function isModeRunning(
  session: SessionData | null | undefined,
  mode: SessionData['mode']
): boolean {
  return isSessionRunning(session) && session?.mode === mode;
}
