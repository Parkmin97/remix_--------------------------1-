import React from 'react';
import { X, ShieldCheck, Music, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { setOnboardingCompleted } from '../lib/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    setOnboardingCompleted(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-lg w-full p-6 text-stone-100 shadow-2xl shadow-amber-950/60 relative overflow-hidden">
        {/* Background Musical Staff lines accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-amber-300 rounded-lg hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <span className="text-2xl font-serif">𝄞</span>
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-amber-300">내인생 지휘자 PWA 안내</h2>
            <p className="text-xs text-stone-400">자기약속형 디지털 디톡스 & 지휘 미션</p>
          </div>
        </div>

        {/* PRD Product Promise Notice */}
        <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl mb-5 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">핵심 제품 약속 (PRD v3.0):</strong>
            <p className="mt-0.5">
              이 앱은 스마트폰 OS의 다른 앱을 강제로 삭제/차단하지 않습니다. 사용자가 스스로 시작한 시간 약속, 5초 정리 유예, 1분 지휘 미션과 자각 질문으로 행동 전환을 돕는 자기 주도 디톡스 서비스입니다.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 mb-6 text-xs text-stone-300">
          <div className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-200">1. 두 가지 서비스 모드</h4>
              <p className="text-stone-400 mt-0.5">
                • <strong>집중 약속 모드</strong>: 즉시 30분~480분 동안 SNS를 피하는 집중 모드<br/>
                • <strong>의도적 SNS 이용 모드</strong>: SNS 이용 시간(5~120분)을 먼저 약속 후 시작
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
            <Music className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-200">2. 1분 클래식 지휘 미션</h4>
              <p className="text-stone-400 mt-0.5">
                4/4, 3/4, 2/4 박자의 오케스트라 클래식 곡에 맞춰 스마트폰 움직임(DeviceMotion), 손가락/마우스 지휘, 또는 웹캠 모션으로 박자를 맞추는 지휘 미션을 수행합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-200">3. 성찰 질문과 10분 연장 정책</h4>
              <p className="text-stone-400 mt-0.5">
                지휘 미션 성공 시 질문에 따라 1회 최대 10분만 연장 가능하며, 연장 후에는 스스로 내 삶의 원래 목표로 돌아가는 성취 리포트가 남습니다.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>내 삶의 지휘 시작하기</span>
        </button>
      </div>
    </div>
  );
};
