import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * 앱 진입 화면 — 오늘의 한마디.
 *
 * ■ 어디서 왔는가
 *   원래 가상 폰 홈(PhoneHomeScreen)에서 "내인생 지휘자" 아이콘을 눌렀을 때 뜨던 화면이다.
 *   가상 폰 홈이 사라지면서(8/9, 커밋 484afad) 같이 없어졌는데,
 *   이 화면 자체는 가상 홈과 상관이 없다. 앱을 켤 때마다 한 번 지나가는 진입 화면이다.
 *
 * ■ 왜 되살리는가
 *   디톡스 앱을 여는 순간은 "또 폰을 집어들었다"는 순간이기도 하다.
 *   바로 기능 화면을 들이밀지 않고 한 문장을 먼저 보여주는 것이 이 제품의 태도다.
 *
 * ■ 동작
 *   2.5초 뒤 자동으로 넘어가고, 급하면 화면 아무 데나 눌러 즉시 건너뛴다.
 */

/** 앱을 켤 때마다 순서대로 돌아가는 한마디 — 지휘·시간·삶을 아우른다. */
const CONDUCTOR_QUOTES: Array<{ en: string; ko: string; author: string }> = [
  {
    en: 'The art of conducting is the art of knowing when to stop.',
    ko: '지휘의 예술은 언제 멈춰야 하는지를 아는 예술이다.',
    author: '헤르베르트 폰 카라얀',
  },
  {
    en: 'Either you run the day, or the day runs you.',
    ko: '당신이 하루를 이끌든지, 하루가 당신을 끌고 다니든지 둘 중 하나다.',
    author: '짐 론',
  },
  {
    en: 'The future depends on what you do today.',
    ko: '미래는 오늘 무엇을 하는가에 달려 있다.',
    author: '마하트마 간디',
  },
  {
    en: 'It is not that we have a short time to live, but that we waste much of it.',
    ko: '우리에게 주어진 시간이 짧은 것이 아니라, 그 시간을 너무 많이 낭비하고 있을 뿐이다.',
    author: '세네카',
  },
  {
    en: 'Your time is limited, so don’t waste it living someone else’s life.',
    ko: '당신의 시간은 한정되어 있다. 그러니 다른 사람의 삶을 사느라 낭비하지 마라.',
    author: '스티브 잡스',
  },
  {
    en: 'To achieve great things, two things are needed: a plan, and not quite enough time.',
    ko: '위대한 일을 이루기 위해서는 두 가지가 필요하다. 계획과, 넉넉하지 않은 시간이다.',
    author: '레너드 번스타인',
  },
  {
    en: 'Music has the power to transform lives.',
    ko: '음악은 사람의 삶을 변화시키는 힘이 있다.',
    author: '구스타보 두다멜',
  },
];

const QUOTE_INDEX_KEY = 'life_conductor_quote_index';

/** 진입 화면이 저절로 사라지기까지의 시간 */
const AUTO_DISMISS_MS = 2500;

/**
 * 이번에 보여줄 한마디를 고르고, 다음 번을 위해 인덱스를 하나 밀어둔다.
 *
 * 모듈 최상위에서 한 번만 계산한다. 렌더 중에 하면 React 18 의 이중 렌더 때문에
 * 앱을 한 번 켰는데 인덱스가 두 칸씩 뛴다.
 */
function pickQuote() {
  let index = 0;
  try {
    const saved = localStorage.getItem(QUOTE_INDEX_KEY);
    const parsed = saved ? parseInt(saved, 10) : 0;
    if (Number.isFinite(parsed)) index = ((parsed % CONDUCTOR_QUOTES.length) + CONDUCTOR_QUOTES.length) % CONDUCTOR_QUOTES.length;
  } catch {
    // 저장소를 못 읽어도 화면은 떠야 한다. 첫 번째 한마디로 간다.
  }

  try {
    localStorage.setItem(QUOTE_INDEX_KEY, String((index + 1) % CONDUCTOR_QUOTES.length));
  } catch {
    // 저장 실패는 무시한다. 다음에도 같은 한마디가 나올 뿐이다.
  }

  return CONDUCTOR_QUOTES[index];
}

interface SplashQuoteScreenProps {
  /** 진입 화면이 끝났을 때(자동/탭 모두) 호출된다. */
  onDone: () => void;
}

export const SplashQuoteScreen: React.FC<SplashQuoteScreenProps> = ({ onDone }) => {
  // 컴포넌트가 살아 있는 동안 한마디는 바뀌지 않는다.
  const [quote] = useState(pickQuote);

  /*
   * ⚠️ 타이머는 **한 번만** 건다.
   *    onDone 을 의존성에 넣으면, 부모가 인라인 화살표 함수를 넘기는 한
   *    부모가 다시 그려질 때마다 함수 신원이 바뀌어 타이머가 처음부터 다시 시작한다.
   *    앱을 켠 직후에는 인증·세션·앱 목록이 연달아 도착해 리렌더가 잦아서,
   *    그대로 두면 진입 화면이 2.5초를 넘겨 계속 떠 있을 수 있다.
   *    그래서 최신 콜백은 ref 로 들고, 타이머는 마운트 시 한 번만 건다.
   */
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="진입 화면 건너뛰기"
      onClick={onDone}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onDone(); }}
      className="fixed inset-0 z-[100] bg-black bg-cover bg-center flex flex-col items-center justify-between p-8 text-center animate-fade-in select-none overflow-hidden touch-none cursor-pointer"
      style={{ backgroundImage: "url('/splash_conductor.png')" }}
    >
      {/* 배경 위 어둠막 — 글자 대비 확보 */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      {/* 상단 타이틀 카드 */}
      <div className="pt-8 z-10 w-full max-w-xs">
        <div className="space-y-2 rounded-2xl bg-black/70 backdrop-blur-md border border-neutral-700 px-6 py-4 shadow-2xl text-center">
          <h1 className="text-lg sm:text-xl font-sans font-extrabold tracking-widest text-white text-center">
            MY LIFE MAESTRO
          </h1>
          <p className="text-xs text-neutral-300 font-serif leading-relaxed px-2">
            디지털 도파민 피드에서 벗어나,<br />
            당신의 라이프 스타일을 품격 있게 연주하세요.
          </p>
        </div>
      </div>

      {/* 오늘의 한마디 */}
      <div className="z-10 w-full px-2 text-center">
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#FE9A00]">
          <span className="text-base text-[#FE9A00]">𝄞</span>
          <span>오늘의 한마디</span>
        </div>
        <span className="pointer-events-none block select-none font-serif text-6xl leading-none text-[#FE9A00]/50">“</span>
        <p className="-mt-2 font-serif text-lg sm:text-2xl italic font-semibold leading-snug text-white drop-shadow-md">
          {quote.en}
        </p>
        <p className="mt-4 text-base sm:text-xl font-medium leading-relaxed text-neutral-200 break-keep drop-shadow-md">
          {quote.ko}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <span className="h-px w-8 bg-[#FE9A00]/60"></span>
          <span className="text-sm font-bold text-[#FE9A00] break-keep">{quote.author}</span>
          <span className="h-px w-8 bg-[#FE9A00]/60"></span>
        </div>
      </div>

      {/* 하단 진행 표시 */}
      <div className="pb-8 z-10 w-full max-w-xs">
        <div className="rounded-2xl bg-black/70 backdrop-blur-md border border-neutral-700 px-5 py-3.5 space-y-3 shadow-2xl">
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden border border-neutral-700">
            <div className="bg-[#FE9A00] h-full w-full animate-pulse rounded-full"></div>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-white font-medium">
            <span>내인생 지휘자 어플 진입 중... (화면을 누르면 바로 시작)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FE9A00] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
