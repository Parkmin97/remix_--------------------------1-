import React, { useEffect, useState } from 'react';
import { X, Lock, Music, Sparkles } from 'lucide-react';
import { BlockInfo } from '../lib/blockBridge';

interface BlockChoiceScreenProps {
  /** 네이티브가 넘겨준 차단 정보. 없으면 최소 정보만 표시한다. */
  blockInfo: BlockInfo | null;
  /** 지휘 미션으로 잠금 풀기를 선택 */
  onStartMission: () => void;
  /** 잠금을 유지하고 홈으로 나가기 */
  onKeepLocked: () => void;
}

/** 남은 밀리초를 `시:분:초`(각 2자리)로. 24시간을 넘어도 시 자리에 그대로 누적한다. */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 잠금 종료까지 남은 시간을 1초마다 갱신한다.
 * `lockEndsAt`(epoch millis)이 없으면 계속 `00:00:00`.
 */
function useCountdown(lockEndsAt: number | undefined): string {
  const [remainMs, setRemainMs] = useState(() =>
    lockEndsAt ? lockEndsAt - Date.now() : 0,
  );

  useEffect(() => {
    if (!lockEndsAt) {
      setRemainMs(0);
      return;
    }
    // 마운트 직후 한 번 맞춰두고, 이후 1초 간격으로 따라간다.
    setRemainMs(lockEndsAt - Date.now());
    const id = window.setInterval(() => {
      setRemainMs(lockEndsAt - Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockEndsAt]);

  return formatRemaining(remainMs);
}

/**
 * 잠근 앱을 실행했을 때 뜨는 선택 화면.
 *
 * 소프트 잠금의 `InterventionModal` 과 같은 디자인을 쓴다.
 * 차이는 남은 시간 카운트다운과, 아래 두 가지 안전장치다.
 *
 * ⚠️ 이번 세션에서 미션을 이미 시도했다면 "잠금 해제하기"를 제공하지 않는다.
 *    한 세션에 기회는 한 번뿐이고, 실패하면 설정 시간까지 잠긴다.
 * ⚠️ 우측 상단 X는 **잠금 유지**(`onKeepLocked`)다. 해제 통로가 되면 제품이 무너진다.
 */
export const BlockChoiceScreen: React.FC<BlockChoiceScreenProps> = ({
  blockInfo,
  onStartMission,
  onKeepLocked,
}) => {
  const missionAvailable = !blockInfo?.missionAttempted;
  const remainingText = useCountdown(blockInfo?.lockEndsAt);

  // 목표를 적지 않았거나 기존 세션이면 값이 없다. 그때는 목표 줄을 통째로 숨긴다.
  const focusTask = blockInfo?.focusTask?.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* 카드가 화면보다 길어지면 중앙 정렬이 풀리고 세로 스크롤로 넘어간다. */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-choice-title"
          className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-black shadow-2xl relative overflow-hidden text-center space-y-5"
        >
          {/* 닫기 = 잠금 유지. 절대 해제로 연결하지 않는다. */}
          <button
            onClick={onKeepLocked}
            aria-label="잠금을 유지하고 닫기"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lock Icon Emblem */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FE9A00]/15 border-2 border-[#FE9A00]/40 flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 animate-pulse text-[#FE9A00] stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            {/* 남은 시간 — 1초마다 갱신 */}
            <p className="font-mono text-4xl font-extrabold tabular-nums tracking-tight text-black">
              {remainingText}
            </p>
            <h3
              id="block-choice-title"
              className="text-xl font-bold font-serif text-black leading-snug"
            >
              잠금 모드 실행 중이에요.
            </h3>
            {focusTask && (
              <p className="text-xs text-black/80 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                목표: <strong className="text-[#FE9A00] font-bold">{focusTask}</strong>
              </p>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {/* Primary Action: Exit App & Conduct My Life */}
            <button
              onClick={onKeepLocked}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-[#FE9A00]" />
              <span>내 인생 지휘하기 (앱 종료)</span>
            </button>

            {/* Secondary Action: Start 1-Minute Conducting Mission */}
            {missionAvailable ? (
              <button
                onClick={onStartMission}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-black font-extrabold rounded-2xl text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Music className="w-4 h-4 text-black" />
                <span>잠금 해제하기 (미션 도전)</span>
              </button>
            ) : (
              <div className="w-full py-3.5 bg-slate-50 text-black/40 font-bold rounded-2xl text-xs border border-slate-200">
                이번 잠금에서는 미션을 이미 사용했습니다
              </div>
            )}
          </div>

          {missionAvailable ? (
            <div className="space-y-1 text-[11px] text-black/60 break-keep">
              <p>* 미션 기회는 1번입니다.</p>
              <p>
                * 지휘 미션(박자 70% 이상 일치) 성공시 '성공했음에도 사용 안하기' 또는 '잠금
                완전 해제'를 선택할 수 있습니다.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-black/60 break-keep">
              * 남은 시간 동안 잠금이 유지됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
