import React from 'react';
import { SessionData } from '../types';
import { saveActiveSession, addCompletedSessionToReport } from '../lib/storage';
import { syncSessionDecisionToSupabase } from '../lib/supabase';
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

  // Option 1: Choose NOT to use app despite mission success (Keep lock active & return to phone home)
  const handleChooseNotToUse = () => {
    if (activeSession) {
      const updated: SessionData = {
        ...activeSession,
        state: 'FOCUS_ACTIVE',
        missionSucceeded: true,
        missionAttempted: true
      };
      saveActiveSession(updated);
      addCompletedSessionToReport(updated, true);
      setActiveSession(updated);

      // Supabase DB 백업 (로그인 유저가 있는 경우)
      syncSessionDecisionToSupabase({
        sessionId: activeSession.id,
        focusTask,
        choseNotToUse: true,
      });
    }
    onNavigateToScreen('home');
  };

  // Option 2: Fully Unlock Lock and return to phone home with session cleared
  const handleFullyUnlock = () => {
    if (activeSession) {
      // Supabase DB 백업 (로그인 유저가 있는 경우)
      syncSessionDecisionToSupabase({
        sessionId: activeSession.id,
        focusTask,
        choseNotToUse: false,
      });
    }
    saveActiveSession(null);
    setActiveSession(null);
    onNavigateToScreen('home');
  };

  return (
    <div className="min-h-full flex items-start sm:items-center justify-center max-w-lg mx-auto px-4 pt-8 sm:pt-12 pb-6 text-black relative select-none">
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold font-serif text-black leading-snug break-keep">
            지휘 미션을 훌륭히 통과했습니다!<br />이제 어떻게 하시겠어요?
          </h2>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-black/80 break-keep">
            원래 목표: <strong className="text-[#FE9A00] font-bold">{focusTask}</strong>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Option 1: Choose NOT to use (Return to phone home) */}
          <button
            onClick={handleChooseNotToUse}
            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#FE9A00]" />
            <span className="text-sm font-extrabold text-white break-keep">성공했음에도 사용 안하기 (추천)</span>
          </button>

          {/* Option 2: Fully Unlock Lock */}
          <button
            onClick={handleFullyUnlock}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-black font-extrabold text-xs rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Unlock className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
            <span className="text-sm font-extrabold text-black break-keep">성공했으니 잠금 완전 해제하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

