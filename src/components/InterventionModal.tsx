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
      <div className="bg-black/90 backdrop-blur-md border border-neutral-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative overflow-hidden text-center space-y-5">
        {/* Background Light Ray */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Emblem */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-white text-black border-2 border-white flex items-center justify-center shadow-xl">
          <Lock className="w-10 h-10 animate-pulse text-black stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-extrabold shadow-sm">
            소프트 앱 잠금 개입
          </span>
          <h3 className="text-xl font-bold font-serif text-white leading-snug">
            지금은 집중 약속 중이에요.<br />다시 열기 전에 한 번만 멈춰볼까요?
          </h3>
          <p className="text-xs text-neutral-300 bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
            목표: <strong className="text-amber-400">{focusTask}</strong>
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Primary Action: Keep Focusing */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4 text-stone-950" />
            <span>계속 집중하기 (추천)</span>
          </button>

          {/* Secondary Action: Start 1-Minute Conducting Mission */}
          <button
            onClick={onStartMission}
            className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold rounded-2xl text-xs border border-white flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Music className="w-4 h-4 text-black" />
            <span>1분 클래식 지휘 미션 도전하기</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>

        <p className="text-[11px] text-neutral-400">
          * 1분 지휘 미션(박자 80% 이상 일치) 성공 시 '성공했음에도 사용 안하기' 또는 '잠금 완전 해제'를 선택할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
