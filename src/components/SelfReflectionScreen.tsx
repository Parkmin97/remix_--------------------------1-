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
    <div className="min-h-full flex items-center justify-center max-w-lg mx-auto px-4 py-4 text-stone-100">
      <div className="w-full bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Emblem */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-serif text-3xl shadow-xl">
          𝄢
        </div>

        <div className="space-y-2.5">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 break-keep">
            지휘 미션 성공! 자각 선택 화면
          </span>

          <h2 className="text-xl font-bold font-serif text-amber-100 leading-snug break-keep">
            지휘 미션을 훌륭히 통과했습니다!<br />이제 어떻게 하시겠어요?
          </h2>

          <div className="p-2.5 bg-amber-950/40 rounded-2xl border border-amber-800/40 text-xs text-amber-200 break-keep">
            원래 목표: <strong className="text-amber-300">{focusTask}</strong>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Option 1: Choose NOT to use (Return to life) */}
          <button
            onClick={handleChooseNotToUse}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-stone-950 font-bold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="text-sm font-extrabold break-keep">[추천] 성공했음에도 사용 안하기 (목표로 복귀)</span>
            </div>
            <span className="text-[11px] text-emerald-950/80 font-normal break-keep">자율적 의지로 도파민 앱을 닫고 원래의 중요 일로 돌아갑니다</span>
          </button>

          {/* Option 2: Fully Unlock Lock */}
          <button
            onClick={handleFullyUnlock}
            className="w-full py-3 bg-stone-800 hover:bg-stone-750 text-amber-200 font-semibold text-xs rounded-2xl border border-amber-600/40 flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-bold break-keep">성공했으니 잠금 완전 해제하기</span>
            </div>
            <span className="text-[10px] text-stone-400 font-normal break-keep">미션을 성공했으므로 제한 없이 앱/숏폼 잠금을 해제합니다</span>
          </button>
        </div>

        <p className="text-[10px] text-stone-400 break-keep leading-snug">
          * '성공했음에도 사용 안하기'를 선택하시면 자각 성공 성과가 일간 리포트에 저장되며 집중 보상을 받습니다.
        </p>
      </div>
    </div>
  );
};

