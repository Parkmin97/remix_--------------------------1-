import React from 'react';
import { SessionData } from '../types';
import { saveActiveSession, addCompletedSessionToReport } from '../lib/storage';
import { ShieldCheck, Unlock, HeartHandshake, ArrowRight } from 'lucide-react';

interface SelfReflectionScreenProps {
  activeSession: SessionData | null;
  setActiveSession: (session: SessionData | null) => void;
  onNavigateToScreen: (screen: string) => void;
}

export const SelfReflectionScreen: React.FC<SelfReflectionScreenProps> = ({
  activeSession,
  setActiveSession,
  onNavigateToScreen
}) => {
  const focusTask = activeSession?.focusTask || '자기소개서 작성 및 자격증 공부';

  // Option 1: Choose NOT to use app despite mission success (Return to life)
  const handleChooseNotToUse = () => {
    if (activeSession) {
      const updated: SessionData = {
        ...activeSession,
        state: 'COMPLETED',
        missionSucceeded: true
      };
      saveActiveSession(updated);
      addCompletedSessionToReport(updated, true);
      setActiveSession(null);
    }
    onNavigateToScreen('report');
  };

  // Option 2: Fully Unlock Lock and use app/shorts freely
  const handleFullyUnlock = () => {
    if (activeSession) {
      const updated: SessionData = {
        ...activeSession,
        state: 'USAGE_ACTIVE',
        missionSucceeded: true
      };
      saveActiveSession(updated);
      setActiveSession(updated);
    }
    onNavigateToScreen('shorts');
  };

  return (
    <div className="min-h-full flex items-start sm:items-center justify-center max-w-lg mx-auto px-4 pt-8 sm:pt-12 pb-6 text-white relative select-none bg-[url('/bg_conductor.png')] bg-cover bg-center bg-fixed">
      {/* Background Dark Scrim */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-neutral-950/75 to-black/90 pointer-events-none -z-10"></div>

      <div className="w-full bg-black/90 backdrop-blur-md border border-neutral-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative overflow-hidden">
        {/* Background Light Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-3">
          <h2 className="text-xl font-extrabold font-serif text-white leading-snug break-keep">
            지휘 미션을 훌륭히 통과했습니다!<br />이제 어떻게 하시겠어요?
          </h2>

          <div className="p-2.5 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-xs text-neutral-300 break-keep">
            원래 목표: <strong className="text-amber-400 font-bold">{focusTask}</strong>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Option 1: Choose NOT to use (Return to life) */}
          <button
            onClick={handleChooseNotToUse}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm rounded-2xl shadow-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0 text-stone-950" />
              <span className="text-sm font-extrabold text-stone-950 break-keep">[추천] 성공했음에도 사용 안하기 (목표로 복귀)</span>
            </div>
            <span className="text-[11px] text-stone-900/90 font-medium break-keep">자율적 의지로 도파민 앱을 닫고 원래의 중요 일로 돌아갑니다</span>
          </button>

          {/* Option 2: Fully Unlock Lock */}
          <button
            onClick={handleFullyUnlock}
            className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-2xl border border-white flex flex-col items-center justify-center gap-0.5 transition-all shadow-md"
          >
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
              <span className="text-sm font-extrabold text-black break-keep">성공했으니 잠금 완전 해제하기</span>
            </div>
            <span className="text-[10px] text-neutral-600 font-medium break-keep">미션을 성공했으므로 제한 없이 앱/숏폼 잠금을 해제합니다</span>
          </button>
        </div>

        <p className="text-[10px] text-neutral-400 break-keep leading-snug">
          * '성공했음에도 사용 안하기'를 선택하시면 자각 성공 성과가 일간 리포트에 저장되며 집중 보상을 받습니다.
        </p>
      </div>
    </div>
  );
};

