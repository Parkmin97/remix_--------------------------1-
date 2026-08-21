/**
 * 남은 시간 표기 — 앱 안과 네이티브 오버레이가 같은 모양을 쓰도록 한 곳에 모은다.
 *
 * ⚠️ 초 단위까지 보여준다.
 *    "3분 남음"은 3분 내내 3분으로 보여서 시간이 흐른다는 느낌을 주지 못한다.
 *    남은 시간이 눈앞에서 줄어드는 것이 이 화면의 목적이다.
 */

/** 밀리초 → `MM:SS` (한 시간이 넘으면 `H:MM:SS`) */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
