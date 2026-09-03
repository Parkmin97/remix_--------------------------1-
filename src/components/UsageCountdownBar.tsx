import React, { useEffect, useState } from 'react';
import { Hourglass, Lock } from 'lucide-react';
import { SessionData } from '../types';
import { isSessionRunning } from '../lib/sessionState';
import { formatRemaining } from '../lib/countdown';

/**
 * 잠금 모드(바로 잠금 및 예약 잠금)에서 "잠금 잔여 시간 / 사용 가능 시간"을 초 단위로 보여주는 상단 띠.
 *
 * ■ 동작
 *   1. 예약 잠금(GUIDED_USE) 사용 가능 시간 중: 주황색 띠에 "사용 가능 시간 {시간} 뒤 잠금 시작" 표시
 *   2. 잠금 진행 중(바로 잠금 FOCUS_NOW 및 예약 잠금의 잠금 구간): 검은색 띠에 "잠금 중 · 해제까지 {시간}" 표시
 *
 * ■ 표시하지 않는 경우
 *   진행 중인 세션이 없거나 이미 종료되었을 때 (null 반환).
 */

interface UsageCountdownBarProps {
  activeSession?: SessionData | null;
}

export const UsageCountdownBar: React.FC<UsageCountdownBarProps> = ({ activeSession }) => {
  // 1초마다 다시 그리기 위한 값. 시각 자체는 세션의 타임스탬프에서 계산한다.
  const [now, setNow] = useState<number>(() => Date.now());

  const isRunning = isSessionRunning(activeSession);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  if (!isRunning || !activeSession) return null;

  const usageEndsMs = activeSession.usageEndsAt ? new Date(activeSession.usageEndsAt).getTime() : 0;
  const focusEndsMs = activeSession.focusEndsAt ? new Date(activeSession.focusEndsAt).getTime() : 0;

  // ① 예약 잠금 모드에서 아직 쓸 수 있는 시간 (사용 가능 시간)
  if (activeSession.mode === 'GUIDED_USE' && usageEndsMs > now) {
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

  // ② 잠금 진행 중 (바로 잠금 모드 및 예약 잠금의 잠금 단계)
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
