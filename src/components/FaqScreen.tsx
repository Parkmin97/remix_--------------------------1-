import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, MessageCircleQuestion } from 'lucide-react';

interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

/**
 * 자주 묻는 질문(FAQ) 데이터 목록
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    category: '잠금 설정 및 기능 안내',
    question: '‘지금 잠금’과 ‘예약 잠금’의 차이점이 뭔가요?',
    answer: '‘지금 잠금’은 잠금할 앱을 선택한 시점부터 바로 잠기는 모드이고, ‘예약 잠금’은 사용자가 설정한 시간이 지난 이후부터 잠기는 모드입니다.',
  },
  {
    id: 2,
    category: '잠금 설정 및 기능 안내',
    question: '앱은 최대 몇 개까지 잠금 가능한가요?',
    answer: '최소 1개부터 전체 잠금까지 가능합니다. 잠금 실행 도중 앱 추가는 가능하지만, 빼기는 안 된다는 점 참고 부탁드립니다.',
  },
  {
    id: 3,
    category: '잠금 설정 및 기능 안내',
    question: '그동안 얼마나 잠금에 성공했는지 알고 싶어요.',
    answer: '지켜낸 시간 및 주간 잠금 달성 현황은 ‘더보기 > 디톡스 주간 리포트’ 탭에서 확인 가능합니다.',
  },
  {
    id: 4,
    category: '지휘 미션 및 잠금 해제 규칙',
    question: '지휘 미션 통과 기준이 어떻게 되나요?',
    answer: '60초 동안 정확한 박자로 70% 이상 지휘 시 미션 통과입니다. ±0.25초 안에 들어야 정확한 박자로 인정됩니다.',
  },
  {
    id: 5,
    category: '지휘 미션 및 잠금 해제 규칙',
    question: '지휘 미션에 실패했어요. 다시 도전할 수 없나요?',
    answer: '네, 미션 기회는 단 1번입니다. 잠금 모드가 완전히 해제될 때까지 앱을 종료하고 내 인생을 지휘해 보세요.',
  },
  {
    id: 6,
    category: '지휘 미션 및 잠금 해제 규칙',
    question: '지휘를 도중에 멈추면 어떻게 되나요?',
    answer: '음악이 끝까지 완곡되고 박자 콤보 게이지를 채워야 잠금이 해제됩니다. 중도 포기 시 타깃 앱으로 돌아가지 못하고 차단 화면이 유지됩니다.',
  },
  {
    id: 7,
    category: '문제 해결',
    question: '차단 설정 시간이 되었는데도 차단 창(지휘 화면)이 뜨지 않아요.',
    answer: '스마트폰 제조사(특히 삼성 One UI)의 배터리 절전 정책으로 인해 백그라운드 감시가 일시 정지되었을 수 있습니다. 설정 > 배터리 > 배터리 사용량 최적화 중지(예외)에 \'내 인생 지휘자\'를 등록해 주세요.',
  },
  {
    id: 8,
    category: '문제 해결',
    question: '폰을 열심히 흔들었는데도 지휘 인식이 잘 안 돼요.',
    answer: '손목 스냅을 활용해 음악의 박자(비트)에 맞춰 튜토리얼 가이드처럼 일정한 리듬을 타며 흔들어 주세요.',
  },
];

const CATEGORIES = ['전체', '잠금 설정 및 기능 안내', '지휘 미션 및 잠금 해제 규칙', '문제 해결'];

interface FaqScreenProps {
  onBack: () => void;
}

export const FaqScreen: React.FC<FaqScreenProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleItem = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filteredItems = selectedCategory === '전체'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

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

      {/* 3. 카테고리 필터 탭 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FE9A00] text-black shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. FAQ 질문 아코디언 목록 */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-2.5">
        <div className="text-xs font-bold text-black/60 uppercase tracking-wider flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-1.5">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-[#FE9A00]" />
            <span>질문 목록 ({filteredItems.length})</span>
          </div>
        </div>

        <div className="space-y-2">
          {filteredItems.map((item) => {
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
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold font-mono flex items-center justify-center shrink-0">
                        Q
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#FE9A00]/15 text-[#b36c00] font-extrabold text-[10px] shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-black break-keep pl-0.5 mt-0.5">
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
                    <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 text-slate-700 leading-relaxed font-medium">
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
