import React from 'react';
import { BlockInfo } from '../lib/blockBridge';

interface BlockChoiceScreenProps {
  /** 네이티브가 넘겨준 차단 정보. 없으면 최소 정보만 표시한다. */
  blockInfo: BlockInfo | null;
  /** 지휘 미션으로 잠금 풀기를 선택 */
  onStartMission: () => void;
  /** 잠금을 유지하고 홈으로 나가기 */
  onKeepLocked: () => void;
}

/**
 * 잠근 앱을 실행했을 때 뜨는 선택 화면.
 *
 * 사용자 플로우:
 *   잠금 중 앱 실행 → **이 화면** → 미션으로 풀기 / 잠금 유지
 *
 * ⚠️ 이번 세션에서 미션을 이미 시도했다면 "잠금 풀기"를 제공하지 않는다.
 *    한 세션에 기회는 한 번뿐이고, 실패하면 설정 시간까지 잠긴다.
 *
 * 디자인은 최소 수준이다. 팀 디자인이 나오면 이 파일만 교체하면 된다.
 */
export const BlockChoiceScreen: React.FC<BlockChoiceScreenProps> = ({
  blockInfo,
  onStartMission,
  onKeepLocked,
}) => {
  const missionAvailable = !blockInfo?.missionAttempted;

  const remainingText = (() => {
    if (!blockInfo?.lockEndsAt) return null;
    const remainMs = blockInfo.lockEndsAt - Date.now();
    if (remainMs <= 0) return null;
    const min = Math.ceil(remainMs / 60000);
    return min >= 60
      ? `${Math.floor(min / 60)}시간 ${min % 60}분 남음`
      : `${min}분 남음`;
  })();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-bold mb-3">잠시 멈춰볼까요</h1>

      <p className="text-white/60 text-center mb-2">
        지금은 스스로 정한 잠금 시간입니다.
      </p>
      {remainingText && (
        <p className="text-white/40 text-sm mb-10">{remainingText}</p>
      )}

      <div className="w-full max-w-sm space-y-3">
        {missionAvailable ? (
          <button
            type="button"
            onClick={onStartMission}
            className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg active:scale-95 transition-transform"
          >
            지휘 미션으로 잠금 풀기
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl border border-white/20 text-white/40 text-center text-sm">
            이번 잠금에서는 미션을 이미 사용했습니다
          </div>
        )}

        <button
          type="button"
          onClick={onKeepLocked}
          className="w-full py-4 rounded-xl border border-white/30 text-white/80 font-medium active:scale-95 transition-transform"
        >
          잠금 유지하기
        </button>
      </div>

      {missionAvailable && (
        <p className="text-white/30 text-xs text-center mt-8 max-w-xs">
          미션은 이번 잠금에서 한 번만 시도할 수 있습니다.
          실패하면 남은 시간 동안 잠금이 유지됩니다.
        </p>
      )}
    </div>
  );
};
