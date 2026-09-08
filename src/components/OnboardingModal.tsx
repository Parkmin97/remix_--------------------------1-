import React from 'react';
import { X, ShieldCheck, Music, Clock, Award, Sparkles } from 'lucide-react';
import { setOnboardingCompleted } from '../lib/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 서비스 안내 모달.
 *
 * 설정 화면의 '서비스 안내 → 가이드 열기'와 최초 진입 시 노출된다.
 *
 * ⚠️ 여기 적는 내용은 **실제로 되는 것만** 적는다.
 *    예전에는 "웹캠 모션"이 적혀 있었으나 그런 기능은 코드에 없다.
 *    스토어 설명·개인정보처리방침과 어긋나면 심사에서 문제가 된다.
 */
export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    setOnboardingCompleted(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl max-w-lg w-full p-6 text-stone-100 shadow-2xl shadow-amber-950/60 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 배경 광원 */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-amber-300 rounded-lg hover:bg-stone-800 transition-colors z-10"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl border border-amber-500/40 overflow-hidden shrink-0">
            <img src="/app_icon.png" alt="내인생 지휘자" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold font-serif text-amber-300 leading-tight">내인생 지휘자</h2>
            <p className="text-xs text-stone-400 mt-0.5">디지털 디톡스 &amp; 라이프 오케스트레이팅 앱</p>
          </div>
        </div>

        <div className="space-y-3 mb-6 text-xs">
          {/* 서비스 소개 */}
          <div className="flex items-start gap-3 p-3.5 bg-amber-950/30 rounded-xl border border-amber-600/30">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-200 mb-1">서비스 소개</h4>
              <p className="text-stone-300 leading-relaxed break-keep">
                오늘의 할일이 있지만 집중하기 어려운 당신. 흩어진 시간을 모아 목표에 온전히 닿도록,
                깊은 몰입을 만드는 데 도움이 되겠습니다. 알고리즘을 이기는 방법은 시선과 흐름을 직접
                지휘할 수 있는 환경을 만드는 것입니다. 빼앗긴 주도권을 당신의 손으로 가져오세요.
              </p>
            </div>
          </div>

          {/* 두 가지 서비스 모드 */}
          <div className="flex items-start gap-3 p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-200 mb-1">두 가지 서비스 모드</h4>
              <p className="text-stone-300 leading-relaxed break-keep">
                • <strong className="text-stone-100">지금 잠금 모드</strong>: 잠금할 앱을 선택한 시점부터 즉시 SNS를 피하는 집중모드<br />
                • <strong className="text-stone-100">예약 잠금 모드</strong>: 사용자가 설정한 시간(최대 720분)이 지난 이후부터 잠기는 모드
              </p>
            </div>
          </div>

          {/* 클래식 1분 지휘 미션 */}
          <div className="flex items-start gap-3 p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50">
            <Music className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-200 mb-1">클래식 1분 지휘 미션</h4>
              <p className="text-stone-300 leading-relaxed break-keep">
                4/4, 3/4, 2/4 박자의 오케스트라 클래식 곡에 맞춰 스마트폰을 지휘봉처럼 흔들어 주세요.<br />
                지휘 미션은 ‘더보기 &gt; 지휘 동작 튜토리얼’ 탭에서 연습하실 수 있습니다.
              </p>
            </div>
          </div>

          {/* 미션 기회 및 선택 */}
          <div className="flex items-start gap-3 p-3.5 bg-stone-800/60 rounded-xl border border-stone-700/50">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-200 mb-1">미션 기회 및 선택</h4>
              <p className="text-stone-300 leading-relaxed break-keep">
                미션 기회는 단 1번입니다.<br />
                지휘 미션 성공 시 ‘성공했음에도 사용 안하기’ 또는 ‘잠금 완전 해제’를 선택하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>내 삶의 지휘 시작하기</span>
        </button>
      </div>
    </div>
  );
};
