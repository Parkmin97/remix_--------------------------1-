import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, MessageCircleQuestion } from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

/**
 * 자주 묻는 질문(FAQ) 데이터 목록
 * (이 배열에 질문과 답변을 추가/수정하시면 화면에 자동으로 반영됩니다.)
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    category: '이용 안내',
    question: '자주 묻는 질문 항목이 여기에 표시됩니다.',
    answer: '질문과 답변 내용은 추후 자유롭게 추가 및 수정하실 수 있습니다.',
  },
  {
    id: 2,
    category: '잠금 모드',
    question: '지금 잠금 모드와 예약 잠금 모드는 어떻게 다른가요?',
    answer: '지금 잠금 모드는 즉시 원하는 시간 동안 차단하는 모드이며, 예약 잠금 모드는 정해진 시간표에 따라 자동으로 디톡스를 실천하는 모드입니다.',
  },
  {
    id: 3,
    category: '지휘 미션',
    question: '지휘 미션은 어떻게 진행되나요?',
    answer: '스마트폰을 손에 쥐고 지휘봉처럼 음악 템포에 맞춰 화면의 가이드대로 흔들면 센서가 박자를 인식합니다.',
  },
];

interface FaqScreenProps {
  onBack: () => void;
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ onBack }) => {
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleItem = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 py-3 sm:py-4 gap-3.5 text-black relative select-none">
      {/* 1. 상단 뒤로가기 & 서브 타이틀 */}
      <div className="flex items-center gap-3 shrink-0 pt-0.5 pb-1">
        <button
          onClick={onBack}
          className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-black transition-colors active:scale-95 shadow-sm cursor-pointer"
          title="뒤로가기"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-4 h-4 text-black" />
        </button>
        <h2 className="text-base sm:text-lg font-sans font-extrabold text-black tracking-wide flex items-center gap-2">
          <span>자주 묻는 질문 (FAQ)</span>
        </h2>
      </div>

      {/* 2. 상단 안내 헤더 카드 */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center text-[#FE9A00] shrink-0">
          <HelpCircle className="w-5 h-5 text-[#FE9A00]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-black">도움이 필요하신가요?</h3>
          <p className="text-xs text-slate-500 mt-0.5 break-keep">
            내인생 지휘자 서비스 이용과 관련된 궁금한 점을 확인해 보세요.
          </p>
        </div>
      </div>

      {/* 3. FAQ 질문 아코디언 목록 */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-2.5">
        <div className="text-xs font-bold text-black/60 uppercase tracking-wider flex items-center gap-1.5 px-1 pb-1">
          <MessageCircleQuestion className="w-3.5 h-3.5 text-[#FE9A00]" />
          <span>질문 목록</span>
        </div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/70"
              >
                {/* 질문 헤더 버튼 */}
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-black break-keep">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#FE9A00]' : ''
                    }`}
                  />
                </button>

                {/* 답변 콘텐츠 */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/80 break-keep animate-fade-in">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 text-slate-700">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
