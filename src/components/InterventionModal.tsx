import React from 'react';
import { X, Lock, Music, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-black shadow-2xl relative overflow-hidden text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Emblem */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FE9A00]/15 border-2 border-[#FE9A00]/40 flex items-center justify-center shadow-lg">
          <Lock className="w-10 h-10 animate-pulse text-[#FE9A00] stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold font-serif text-black leading-snug">
            잠금 모드 실행 중이에요.<br />남이 아닌 내 인생을 지휘해보세요.
          </h3>
          <p className="text-xs text-black/80 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            목표: <strong className="text-[#FE9A00] font-bold">{focusTask}</strong>
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Primary Action: Exit App & Conduct My Life */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-[#FE9A00]" />
            <span>내 인생 지휘하기 (앱 종료)</span>
          </button>

          {/* Secondary Action: Start 1-Minute Conducting Mission */}
          <button
            onClick={onStartMission}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-black font-extrabold rounded-2xl text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Music className="w-4 h-4 text-black" />
            <span>잠금 해제하기 (미션 도전)</span>
          </button>
        </div>

        <p className="text-[11px] text-black/60 break-keep">
          * 미션 기회는 1번입니다. 1분 지휘 미션(박자 70% 이상 일치) 성공 시 '성공했음에도 사용 안하기' 또는 '잠금 완전 해제'를 선택할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
