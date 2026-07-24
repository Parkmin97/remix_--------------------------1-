import React from 'react';
import { X, Lock, Music, ShieldCheck, ArrowRight, Play } from 'lucide-react';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMission: () => void;
  focusTask?: string;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  onStartMission,
  focusTask = '자기소개서 작성 및 자격증 공부'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border-2 border-amber-600/50 rounded-3xl max-w-md w-full p-6 text-stone-100 shadow-2xl shadow-amber-950/80 relative overflow-hidden text-center space-y-6">
        {/* Background Musical Staff glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-amber-300 rounded-lg hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Emblem */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-amber-900/30 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
          <Lock className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            소프트 앱 잠금 개입
          </span>
          <h3 className="text-xl font-bold font-serif text-amber-100 leading-snug">
            지금은 집중 약속 중이에요.<br />다시 열기 전에 한 번만 멈춰볼까요?
          </h3>
          <p className="text-xs text-amber-200/80 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/30">
            목표: <strong>{focusTask}</strong>
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Primary Action: Keep Focusing */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>계속 집중하기 (추천)</span>
          </button>

          {/* Secondary Action: Start 1-Minute Conducting Mission */}
          <button
            onClick={onStartMission}
            className="w-full py-3.5 bg-stone-800 hover:bg-stone-750 text-amber-200 font-semibold rounded-2xl text-xs border border-amber-600/40 flex items-center justify-center gap-2 transition-all"
          >
            <Music className="w-4 h-4 text-amber-400" />
            <span>1분 클래식 지휘 미션 도전하기</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
        </div>

        <p className="text-[11px] text-stone-400">
          * 1분 지휘 미션(박자 80% 이상 일치) 성공 시 '성공했음에도 사용 안하기' 또는 '잠금 완전 해제'를 선택할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
