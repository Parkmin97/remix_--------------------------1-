import React, { useEffect, useState } from 'react';
import { Hourglass, Lock } from 'lucide-react';
import { SessionData } from '../types';
import { isModeRunning } from '../lib/sessionState';
import { formatRemaining } from '../lib/countdown';

/**
 * 예약 잠금 모드에서 "아직 앱을 쓸 수 있는 시간"을 초 단위로 계속 보여주는 띠.
 *
 * ■ 왜 항상 떠 있어야 하는가
 *   예약 잠금은 "M분 먼저 쓰고 그 다음 잠근다"는 약속이다.
 *   남은 시간이 안 보이면 사용자는 언제 막힐지 모른 채 SNS 를 보다가
 *   갑자기 차단 화면을 만나고, 그것을 고장으로 오해한다.
 *
 *   그래서 앱 안에서는 어느 탭에 있든 이 띠가 보이고(여기),
 *   앱 밖 — 잠글 앱을 실제로 쓰는 동안 — 은 네이티브 오버레이가 같은 값을 띄운다
 *   (UsageOverlay.kt).
 *
 * ■ 표시하지 않는 경우
 *   예약 잠금 세션이 없거나 이미 끝났을 때. 자리만 차지한다.
 */

interface UsageCountdownBarProps {
  activeSession?: SessionData | null;
}

export const UsageCountdownBar: React.FC<UsageCountdownBarProps> = ({ activeSession }) => {
  // 1초마다 다시 그리기 위한 값. 시각 자체는 세션의 타임스탬프에서 계산한다.
  const [now, setNow] = useState<number>(() => Date.now());

  const isModeBActive = isModeRunning(activeSession, 'GUIDED_USE');

  useEffect(() => {
    if (!isModeBActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isModeBActive]);

  if (!isModeBActive || !activeSession) return null;

  const usageEndsMs = activeSession.usageEndsAt ? new Date(activeSession.usageEndsAt).getTime() : 0;
  const focusEndsMs = activeSession.focusEndsAt ? new Date(activeSession.focusEndsAt).getTime() : 0;

  // ① 아직 쓸 수 있는 시간 — 사용자가 가장 궁금해하는 값
  if (usageEndsMs > now) {
    return (
      <div className="shrink-0 z-40 bg-[#FE9A00] text-black px-4 py-2 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <Hourglass className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold break-keep">사용 가능 시간</span>
          <span className="font-mono text-lg font-extrabold tabular-nums leading-none tracking-tight">
            {formatRemaining(usageEndsMs - now)}
          </span>
          <span className="text-[11px] font-semibold opacity-80 break-keep">뒤 잠금 시작</span>
        </div>
      </div>
    );
  }

  // ② 사용 시간이 끝난 뒤 — 띠가 그냥 사라지면 "왜 없어졌지?"가 된다.
  //    잠금이 시작됐다는 사실과 언제 풀리는지를 이어서 보여준다.
  if (focusEndsMs > now) {
    return (
      <div className="shrink-0 z-40 bg-neutral-900 text-white px-4 py-2 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-[#FE9A00]" />
          <span className="text-xs font-bold break-keep">잠금 중 · 해제까지</span>
          <span className="font-mono text-lg font-extrabold tabular-nums leading-none tracking-tight text-[#FE9A00]">
            {formatRemaining(focusEndsMs - now)}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
